/**
 * The JupyterLab token that notebook links must carry.
 *
 * "Edit Code" opens JupyterLab, which answers with its own login page when the token is missing.
 * The token is not a console setting: it is part of the URL of the `jupylab` external application
 * declared in `nyx_app`, which the menus already carry. The lambda editor read it; the report
 * editor did not — these tests pin the rule for both, and for the URL it is appended to.
 */

import { describe, it, expect } from 'vitest'
import { jupyterLabToken, tokenFromUrl, withJupyterLabToken } from '@/utils/jupyter.js'

function menusWithUrl(url, type = 'external') {
  return [{ name: 'm', submenus: [{ name: 's', apps: [{ name: 'JupyterLab', type, config: { url } }] }] }]
}

describe('tokenFromUrl', () => {
  it('reads the token of a JupyterLab URL', () => {
    expect(tokenFromUrl('https://console.example/jupylab/lab?token=abc123')).toBe('abc123')
    expect(tokenFromUrl('/jupylab/lab/workspaces/auto-f/tree/x.ipynb?token=abc123')).toBe('abc123')
  })

  it('ignores a URL that is not JupyterLab, even with a token', () => {
    expect(tokenFromUrl('https://grafana.example/d/abc?token=abc123')).toBe('')
    expect(tokenFromUrl('https://console.example/jupylabish?token=abc123')).toBe('')
  })

  it('ignores a JupyterLab URL without a token', () => {
    expect(tokenFromUrl('https://console.example/jupylab/lab')).toBe('')
  })

  it('survives what it cannot parse', () => {
    expect(tokenFromUrl(null)).toBe('')
    expect(tokenFromUrl('')).toBe('')
    expect(tokenFromUrl(undefined)).toBe('')
    expect(tokenFromUrl(42)).toBe('')
    expect(tokenFromUrl('http://[::1/jupylab?token=x')).toBe('')
  })

  it('resolves a relative URL against the page origin', () => {
    // The configuration stores "/jupylab/lab?token=…": without the origin there is no pathname.
    global.window = { location: { origin: 'https://console.example' } }
    try {
      expect(tokenFromUrl('/jupylab/lab?token=from-origin')).toBe('from-origin')
    } finally {
      delete global.window
    }
  })
})

describe('jupyterLabToken', () => {
  it('finds the token in the external application', () => {
    expect(jupyterLabToken(menusWithUrl('http://jupyter:8888/jupylab/lab?token=tok-42'))).toBe('tok-42')
  })

  it('ignores applications of another type', () => {
    expect(jupyterLabToken(menusWithUrl('http://jupyter:8888/jupylab/lab?token=tok-42', 'external-iframe')))
      .toBe('')
  })

  it('skips entries without a usable configuration', () => {
    const menus = [
      { submenus: [{ apps: [{ type: 'external', config: {} }] }] },
      { submenus: [{ apps: [{ type: 'external' }] }] },
      { submenus: [{ apps: [{ type: 'external', config: { url: 42 } }] }] },
      { submenus: [{ apps: [null] }] },
      null,
    ]
    expect(jupyterLabToken(menus)).toBe('')
    expect(jupyterLabToken([])).toBe('')
    expect(jupyterLabToken(undefined)).toBe('')
  })

  it('keeps looking through the menus until it finds one', () => {
    const menus = [
      { submenus: [{ apps: [{ type: 'external', config: { url: 'https://grafana.example/' } }] }] },
      ...menusWithUrl('https://console.example/jupylab/lab?token=second'),
    ]
    expect(jupyterLabToken(menus)).toBe('second')
  })
})

describe('withJupyterLabToken', () => {
  const NOTEBOOK = './jupylab/lab/workspaces/auto-f/tree/notebooks/reports/notebooks/demo.ipynb'

  it('appends the token to a bare URL', () => {
    expect(withJupyterLabToken(NOTEBOOK, 'tok-42')).toBe(NOTEBOOK + '?token=tok-42')
  })

  it('uses & when a query string is already there', () => {
    expect(withJupyterLabToken(NOTEBOOK + '?foo=1', 'tok-42')).toBe(NOTEBOOK + '?foo=1&token=tok-42')
  })

  it('leaves the URL alone when there is no token', () => {
    expect(withJupyterLabToken(NOTEBOOK, '')).toBe(NOTEBOOK)
    expect(withJupyterLabToken(NOTEBOOK, undefined)).toBe(NOTEBOOK)
  })

  it('encodes a token that needs it', () => {
    expect(withJupyterLabToken(NOTEBOOK, 'a b&c')).toBe(NOTEBOOK + '?token=a%20b%26c')
  })
})
