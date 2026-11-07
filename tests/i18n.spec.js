/**
 * The i18n wiring: four catalogs, one fallback, and Element UI's own strings.
 *
 * `fallbackLocale: 'en'` makes a missing key *silent* — the screen renders English in the middle of
 * a translated page and nobody notices. Each language is therefore built as Element UI's pack
 * spread first, then ours: without that, date pickers, pagination and the transfer lists stay
 * English whatever the console language.
 */

import { describe, it, expect } from 'vitest'
import { i18n, localized_messages } from '@/i18n-setup.js'

const LANGUAGES = ['en', 'fr', 'el', 'nl']

describe('i18n setup', () => {
  it('bundles the four languages the console offers', () => {
    expect(Object.keys(localized_messages).sort()).toEqual([...LANGUAGES].sort())
  })

  it('starts in English and falls back on English', () => {
    // Vue 3 / vue-i18n 9: the instance is reachable through `.global`.
    expect(i18n.global.locale).toBe('en')
    expect(i18n.global.fallbackLocale).toBe('en')
  })

  it('merges the Element UI pack into every language', () => {
    // these keys come from the Element Plus locale files; a locale that lost them shows English
    // widgets inside a translated page.
    for (const lang of LANGUAGES) {
      expect(localized_messages[lang].el, `${lang} has no Element UI pack`).toBeTypeOf('object')
      expect(localized_messages[lang].el.pagination, `${lang} has no pagination strings`).toBeTruthy()
    }
  })

  it('keeps the console keys next to the Element UI ones', () => {
    for (const lang of LANGUAGES) {
      expect(localized_messages[lang].ui, `${lang} has no ui group`).toBeTypeOf('object')
    }
  })

  it('translates a known key through the instance', () => {
    expect(i18n.global.t('generic.cancel')).toBe('Cancel')
  })
})
