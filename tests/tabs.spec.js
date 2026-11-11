/**
 * Element Plus changes the shape of the `@tab-click` argument: a TabsPaneContext, whose name is
 * `paneName`. Reading `tab.name` produced "/main/undefined", the router opened `/main/undefined` and
 * the view looked for an application that does not exist — the interface crashed on the first tab
 * click.
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
    // this is the original bug: "/main/" + undefined
    expect('/main/' + String(paneNameOf({}))).toBe('/main/undefined')
    expect(paneNameOf({})).toBeFalsy()
  })
})
