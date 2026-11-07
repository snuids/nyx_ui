/**
 * Element Plus change la forme de l'argument de `@tab-click` : un TabsPaneContext, dont le nom est
 * `paneName`. Lire `tab.name` donnait "/main/undefined", le routeur ouvrait `/main/undefined` et la
 * vue cherchait une application inexistante — l'interface plantait au premier clic d'onglet.
 */
import { describe, it, expect } from 'vitest'
import { paneNameOf } from '@/utils/tabs'

describe('paneNameOf', () => {
  it('reads the Element Plus pane context', () => {
    expect(paneNameOf({ paneName: 'abc123', props: { name: 'abc123' } })).toBe('abc123')
  })

  it('falls back to props.name', () => {
    expect(paneNameOf({ props: { name: 'r-42' } })).toBe('r-42')
  })

  it('still accepts the Element UI 2 shape', () => {
    expect(paneNameOf({ name: 'legacy' })).toBe('legacy')
  })

  it('returns undefined instead of "undefined" when there is no name', () => {
    expect(paneNameOf({})).toBeUndefined()
    expect(paneNameOf(null)).toBeUndefined()
  })

  it('does not turn a missing name into a route', () => {
    // c'est le bug d'origine : "/main/" + undefined
    expect('/main/' + String(paneNameOf({}))).toBe('/main/undefined')
    expect(paneNameOf({})).toBeFalsy()
  })
})
