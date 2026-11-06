/**
 * The URL overrides that only exist in development.
 *
 * `?api=` points the console at another API and `?user=`/`?password=` prefill the login form; the
 * README documents both for local work. On a production domain the same URL is a credential
 * capture — the page is ours, the form looks the same, and it posts to the host named in the link.
 *
 * The gate is a module constant read from `process.env.NODE_ENV`, so each test loads the module
 * again under the environment it wants to check. That is the mechanism webpack uses in a real
 * build, which makes the production case here a real assertion rather than a simulation.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'

const ATTACK = 'https://console.example/?api=https://evil.example/api/v1/'
const CREDENTIALS = 'https://console.example/?user=admin&password=secret'

async function loadWith(nodeEnv) {
  vi.resetModules()
  vi.stubEnv('NODE_ENV', nodeEnv)
  return import('@/utils/devOverrides.js')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('in a production build', () => {
  it('ignores ?api=', async () => {
    const { apiOverride } = await loadWith('production')
    expect(apiOverride(ATTACK)).toBe(null)
  })

  it('ignores ?user= and ?password=', async () => {
    const { credentialsOverride } = await loadWith('production')
    expect(credentialsOverride(CREDENTIALS)).toEqual({})
  })
})

describe('in development', () => {
  it('applies the api override, without the hash-router suffix', async () => {
    const { apiOverride } = await loadWith('development')
    expect(apiOverride('http://localhost:8080/?api=http://localhost:5000/api/v1/#/'))
      .toBe('http://localhost:5000/api/v1/')
  })

  it('prefills the login form', async () => {
    const { credentialsOverride } = await loadWith('development')
    expect(credentialsOverride('http://localhost:8080/?user=admin&password=secret'))
      .toEqual({ login: 'admin', password: 'secret' })
  })

  it('keeps a hash-router suffix out of the value', async () => {
    const { credentialsOverride } = await loadWith('development')
    expect(credentialsOverride('http://localhost:8080/?user=admin#/app')).toEqual({ login: 'admin' })
  })

  it('returns nothing when neither parameter is there', async () => {
    const { apiOverride, credentialsOverride } = await loadWith('development')
    expect(apiOverride('http://localhost:8080/')).toBe(null)
    expect(apiOverride('http://localhost:8080/?language=fr')).toBe(null)
    expect(apiOverride('http://localhost:8080/?api=')).toBe(null)
    expect(credentialsOverride('http://localhost:8080/')).toEqual({})
  })
})
