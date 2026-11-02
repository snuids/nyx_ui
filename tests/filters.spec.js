/**
 * The five Vue filters of the console: dates, capitalisation, byte sizes.
 *
 * They were five `Vue.filter()` calls inside `main.js` until now, which is why none of them was
 * covered — importing the entry point mounts the application. Two of them carry a heuristic that
 * fails silently on screen: `formatTS` decides whether a timestamp is in seconds or milliseconds,
 * and `prettyBytes` rounds through `toFixed(0)`, so a table can show a plausible but wrong size.
 */

import { describe, it, expect } from 'vitest'
import {
  EPOCH_MS_THRESHOLD,
  filters,
  formatDate,
  formatTS,
  formatTS2,
  capitalize,
  prettyBytes,
} from '@/utils/filters.js'

describe('formatTS', () => {
  it('reads a timestamp in seconds as well as in milliseconds', () => {
    // 2026-01-14T22:13:20Z: the two inputs must give the same instant
    const seconds = 1768428800
    const millis = seconds * 1000
    expect(formatTS(seconds)).toBe(formatTS(millis))
  })

  it('switches unit exactly at the threshold', () => {
    // just below the limit: seconds, multiplied by 1000
    // just above: already milliseconds, used as is
    const below = formatTS(EPOCH_MS_THRESHOLD - 1)
    const above = formatTS(EPOCH_MS_THRESHOLD)
    expect(below).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
    expect(above).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
    // a millisecond value read as seconds lands decades later: the two must not agree
    expect(below).not.toBe(above)
  })

  it('returns nothing for a falsy value, so the cell stays empty', () => {
    expect(formatTS(0)).toBeUndefined()
    expect(formatTS(null)).toBeUndefined()
    expect(formatTS(undefined)).toBeUndefined()
    expect(formatTS('')).toBeUndefined()
  })
})

describe('formatTS2', () => {
  it('drops the year and keeps seconds, in the local timezone', () => {
    expect(formatTS2(1768428800)).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('agrees with formatTS on the day of a millisecond timestamp', () => {
    const millis = 1768428800000
    expect(formatTS2(millis).slice(0, 5)).toBe(formatTS(millis).slice(0, 5))
  })

  it('accepts milliseconds and seconds alike', () => {
    expect(formatTS2(1768428800)).toBe(formatTS2(1768428800000))
  })

  it('returns nothing for a falsy value', () => {
    expect(formatTS2(0)).toBeUndefined()
  })
})

describe('formatDate', () => {
  it('formats anything moment understands', () => {
    expect(formatDate('2026-01-14T22:13:20Z')).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
  })

  it('returns nothing for a falsy value', () => {
    expect(formatDate('')).toBeUndefined()
    expect(formatDate(null)).toBeUndefined()
  })
})

describe('capitalize', () => {
  it('uppercases the first letter only', () => {
    expect(capitalize('report')).toBe('Report')
    expect(capitalize('REPORT')).toBe('REPORT')
  })

  it('turns a non-string into a string first', () => {
    expect(capitalize(42)).toBe('42')
  })

  it('returns an empty string for a falsy value', () => {
    expect(capitalize('')).toBe('')
    expect(capitalize(null)).toBe('')
    expect(capitalize(undefined)).toBe('')
  })
})

describe('prettyBytes', () => {
  it('keeps bytes below the first unit', () => {
    expect(prettyBytes(0)).toBe('0 bytes')
    expect(prettyBytes(999)).toBe('999 bytes')
    expect(prettyBytes(0.5)).toBe('0.5 bytes')
  })

  it('steps through the units by thousands', () => {
    expect(prettyBytes(1000)).toBe('1 KB')
    expect(prettyBytes(1500)).toBe('2 KB')
    expect(prettyBytes(1000000)).toBe('1 MB')
    expect(prettyBytes(1000000000)).toBe('1 GB')
  })

  it('caps the unit list at the largest one instead of inventing a unit', () => {
    expect(prettyBytes(1e30)).toBe('1000000 YB')
  })

  it('prefixes negatives with a minus sign', () => {
    expect(prettyBytes(-1500)).toBe('-2 KB')
  })

  it('refuses anything that is not a number', () => {
    // a NaN rendered as "NaN GB" in a table is worse than an error
    expect(() => prettyBytes('1500')).toThrow(TypeError)
    expect(() => prettyBytes(NaN)).toThrow(TypeError)
    expect(() => prettyBytes(undefined)).toThrow(TypeError)
  })
})

describe('filters registry', () => {
  it('exposes exactly the names main.js registers, so none is silently dropped', () => {
    expect(Object.keys(filters).sort()).toEqual(
      ['capitalize', 'formatDate', 'formatTS', 'formatTS2', 'prettyBytes']
    )
  })
})
