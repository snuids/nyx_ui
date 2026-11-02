/**
 * The query string and the language the console starts in.
 *
 * `resolveLanguage` used to sit in the middle of `main.js`, where no test could reach it: importing
 * the entry point mounts the whole application. It runs on every page load and decides the
 * interface language, so a mistake here is only visible to the user whose language is wrong.
 */

import { describe, it, expect } from 'vitest'
import { getUrlVars, resolveLanguage } from '@/utils/language.js'

const session = language => ({
  authResponse: JSON.stringify({
    data: { cred: { user: { language } } },
  }),
})

describe('getUrlVars', () => {
  it('reads the parameters of a URL', () => {
    expect(getUrlVars('https://nyx.example/main?user=bob&password=secret')).toEqual({
      user: 'bob',
      password: 'secret',
    })
  })

  it('keeps the fragment on the last value, because the console runs in hash mode', () => {
    // `?user=bob#/main` — every caller strips `#...` itself with `.split('#')[0]`
    expect(getUrlVars('https://nyx.example/main?user=bob#/main')).toEqual({
      user: 'bob#/main',
    })
  })

  it('reads the first parameter of a URL that has no `?` prefix left', () => {
    expect(getUrlVars('https://nyx.example/main?language=fr#/privacy')).toEqual({
      language: 'fr#/privacy',
    })
  })

  it('returns an empty object for a URL without parameters', () => {
    expect(getUrlVars('https://nyx.example/main')).toEqual({})
  })

  it('returns an empty object for a missing href', () => {
    expect(getUrlVars(undefined)).toEqual({})
    expect(getUrlVars(null)).toEqual({})
  })

  it('tolerates an `&` before the first parameter', () => {
    expect(getUrlVars('https://nyx.example/main&&lang=nl')).toEqual({ lang: 'nl' })
  })
})

describe('resolveLanguage', () => {
  it('lets the URL parameter win over everything stored', () => {
    expect(resolveLanguage({ language: 'fr' }, { nyx_language: 'nl' })).toBe('fr')
  })

  it('accepts lang and locale as aliases of language', () => {
    expect(resolveLanguage({ lang: 'el' })).toBe('el')
    expect(resolveLanguage({ locale: 'nl' })).toBe('nl')
  })

  it('prefers the full name when several aliases are present', () => {
    expect(resolveLanguage({ language: 'fr', lang: 'nl' })).toBe('fr')
  })

  it('strips the fragment from a URL value', () => {
    expect(resolveLanguage({ language: 'fr#/privacy' })).toBe('fr')
  })

  it('ignores an empty URL parameter instead of starting without a language', () => {
    expect(resolveLanguage({ language: '' }, {})).toBe('en')
  })

  it('uses the language chosen in the selector before sign-in', () => {
    // this is what makes the switcher survive a reload on the login view
    expect(resolveLanguage({}, { nyx_language: 'nl' })).toBe('nl')
  })

  it('falls back on the language of the remembered session', () => {
    expect(resolveLanguage({}, session('el'))).toBe('el')
  })

  it('lets the selector choice win over the account language', () => {
    expect(resolveLanguage({}, { ...session('el'), nyx_language: 'fr' })).toBe('fr')
  })

  it('returns English when nothing is known', () => {
    expect(resolveLanguage({}, {})).toBe('en')
    expect(resolveLanguage()).toBe('en')
    expect(resolveLanguage(undefined, null)).toBe('en')
  })

  it('returns English when the remembered session is not valid JSON', () => {
    expect(resolveLanguage({}, { authResponse: 'not json at all' })).toBe('en')
  })

  it('returns English when the stored session has no user language', () => {
    expect(resolveLanguage({}, { authResponse: JSON.stringify({ data: {} }) })).toBe('en')
    expect(resolveLanguage({}, session(''))).toBe('en')
  })

  it('keeps starting when storage itself throws', () => {
    // Safari private mode and a disabled storage make the property access throw, not return
    const hostile = {}
    Object.defineProperty(hostile, 'nyx_language', {
      get() {
        throw new Error('SecurityError')
      },
    })
    expect(resolveLanguage({}, hostile)).toBe('en')
  })
})
