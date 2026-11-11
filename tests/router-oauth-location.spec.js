// @vitest-environment jsdom
/**
 * The GitHub return arrives on a path (`/oauth?code=…`), while the console is served in hash mode.
 * Without this forwarding, the application would start on `/`, mount the login screen, and the
 * session would never be completed — the symptom would be "the GitHub button does nothing".
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { normalizeOAuthLocation } from '@/router/router'

describe('report du retour GitHub dans le fragment', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('deplace la requete de /oauth dans le fragment', () => {
    window.history.replaceState(null, '', '/oauth?code=abc&state=def')

    normalizeOAuthLocation()

    expect(window.location.pathname).toBe('/')
    expect(window.location.hash).toBe('#/oauth?code=abc&state=def')
    expect(window.location.search).toBe('')
  })

  it('accepte la barre oblique finale', () => {
    window.history.replaceState(null, '', '/oauth/?code=abc')

    normalizeOAuthLocation()

    expect(window.location.hash).toBe('#/oauth?code=abc')
  })

  it('ne touche pas une URL qui a deja son fragment', () => {
    window.history.replaceState(null, '', '/?code=abc#/oauth?code=abc')

    normalizeOAuthLocation()

    expect(window.location.pathname).toBe('/')
    expect(window.location.hash).toBe('#/oauth?code=abc')
  })

  it('ne touche pas les autres chemins', () => {
    window.history.replaceState(null, '', '/privacy?x=1')

    normalizeOAuthLocation()

    expect(window.location.pathname).toBe('/privacy')
    expect(window.location.search).toBe('?x=1')
  })

  it('ne casse rien hors navigateur', () => {
    expect(() => normalizeOAuthLocation({})).not.toThrow()
  })
})
