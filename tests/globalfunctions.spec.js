/**
 * The two functions of `globalfunctions.js`.
 *
 * `computeTranslatedText` decodes the `@en=Hello;fr=Bonjour@` format used by application
 * configurations (titles, column labels): it is the one deciding what a user reads on screen, in
 * their language, for every translated field of the model. It is called from the generic tables
 * and the editors, but had no test.
 */

import { describe, it, expect } from 'vitest'
import { computeTranslatedText, extractURLParts } from '@/globalfunctions.js'

describe('computeTranslatedText', () => {
  it('returns an empty string for a missing value', () => {
    expect(computeTranslatedText(undefined, 'fr')).toBe('')
  })

  it('passes through text that is not in the translated format', () => {
    expect(computeTranslatedText('Energy', 'fr')).toBe('Energy')
    expect(computeTranslatedText('', 'fr')).toBe('')
  })

  it('picks the requested language', () => {
    const text = '@en=Energy;fr=Energie;nl=Energie;el=Ενέργεια@'
    expect(computeTranslatedText(text, 'fr')).toBe('Energie')
    expect(computeTranslatedText(text, 'en')).toBe('Energy')
    expect(computeTranslatedText(text, 'el')).toBe('Ενέργεια')
  })

  it('requires the closing at-sign', () => {
    expect(computeTranslatedText('@en=Energy', 'en')).toBe('@en=Energy')
    expect(computeTranslatedText('Energy@', 'en')).toBe('Energy@')
  })

  it('keeps only the first value when the translation contains an equals sign', () => {
    // "@en=a=b@" gives "a": the split happens on every "=". Worth knowing before writing a
    // label such as "Minimum = 40" in the translated format.
    expect(computeTranslatedText('@en=a=b@', 'en')).toBe('a')
  })

  it('returns the raw segments when the language is not translated', () => {
    // current contract: the function returns an array, not a string — a caller inserting it
    // into a template displays the segments separated by commas
    const result = computeTranslatedText('@en=Energy;fr=Energie@', 'nl')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual(['en=Energy', 'fr=Energie'])
  })

  it('handles an empty string of translations without throwing', () => {
    expect(computeTranslatedText('@@', 'fr')).toEqual([''])
  })
})

describe('extractURLParts', () => {
  it('splits a complete URL', () => {
    const parts = extractURLParts('https://energy.marmar.ovh/api/v1/config?x=1#top')
    expect(parts.protocol).toBe('https:')
    expect(parts.host).toBe('energy.marmar.ovh')
    expect(parts.hostname).toBe('energy.marmar.ovh')
    expect(parts.pathname).toBe('/api/v1/config')
    expect(parts.search).toBe('?x=1')
    expect(parts.hash).toBe('#top')
  })

  it('separates the port from the host', () => {
    const parts = extractURLParts('http://localhost:8280/api/v1/')
    expect(parts.host).toBe('localhost:8280')
    expect(parts.hostname).toBe('localhost')
    expect(parts.port).toBe('8280')
  })

  it('returns null without a protocol', () => {
    // used by the websocket: a URL without a scheme must be detected, not guessed
    expect(extractURLParts('energy.marmar.ovh/api')).toBeFalsy()
    expect(extractURLParts('ws://energy.marmar.ovh/nyx_ui_websocket/')).toBeFalsy()
  })
})
