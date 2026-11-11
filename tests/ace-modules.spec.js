/**
 * ACE must never be allowed to fetch a mode or a theme over HTTP.
 *
 * When a module is missing from its registry, ACE does not fail: it builds a `<script src>` from
 * `basePath` and loads it. With the bundle served under `/js/`, that asked for
 * `/js/mode-yaml.js` and `/js/theme-tomorrow_night.js`, which nothing serves — two 404s per screen
 * with an editor, and a white editor because the theme silently fell back.
 *
 * `src/utils/aceModules.js` registers them all at import time; this test holds the three things
 * that made it fail: a scattered registration, a mode used by a template but never registered, and
 * a theme named by `mixins/aceTheme.js` but never imported.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname
const REGISTRY = 'src/utils/aceModules.js'

// modes ACE ships inside its core: they need no module of their own
const BUILT_IN = ['text']

function walk(dir) {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const sources = walk(SRC).filter(f => /\.(vue|js)$/.test(f))
const registry = readFileSync(join(SRC, 'utils/aceModules.js'), 'utf8')

describe('ace modules', () => {
  it('registers the modes the templates ask for', () => {
    const langs = new Set()
    for (const file of sources) {
      for (const match of readFileSync(file, 'utf8').matchAll(/\blang="([a-z]+)"/g)) {
        langs.add(match[1])
      }
    }
    const missing = [...langs]
      .filter(lang => !BUILT_IN.includes(lang))
      .filter(lang => !registry.includes(`mode-${lang}"`))

    expect([...langs].length).toBeGreaterThan(2) // the scan itself must see the editors
    expect(missing, `add mode-<lang> to ${REGISTRY}`).toEqual([])
  })

  it('registers the themes the theme mixin can name', () => {
    const mixin = readFileSync(join(SRC, 'mixins/aceTheme.js'), 'utf8')
    const themes = [...mixin.matchAll(/ACE_THEME_\w+ = "([a-z_]+)"/g)].map(m => m[1])

    expect(themes.length).toBe(2)
    for (const theme of themes) {
      expect(registry, `add theme-${theme} to ${REGISTRY}`).toContain(`theme-${theme}"`)
    }
  })

  it('has no registration left outside the registry', () => {
    const scattered = sources
      .filter(file => !file.endsWith('utils/aceModules.js'))
      .filter(file => /require\("ace-builds/.test(readFileSync(file, 'utf8')))
      .map(file => file.replace(SRC, 'src/'))

    expect(scattered, 'import @/utils/aceModules instead: registration has to happen at import time').toEqual([])
  })
})
