import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTO_DARK_FROM_HOUR,
  AUTO_DARK_UNTIL_HOUR,
  THEMES,
  THEME_STORAGE_KEY,
  applyTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  watchAutoTheme,
} from '../src/utils/theme'

/** An hour on a given day, so `getHours()` is unambiguous. */
function at(hour, minutes = 0) {
  return new Date(2026, 10, 7, hour, minutes, 0)
}

function memoryStorage(initial) {
  const values = Object.assign({}, initial)
  return {
    getItem: (key) => (key in values ? values[key] : null),
    setItem: (key, value) => { values[key] = String(value) },
    values,
  }
}

describe('theme resolution', () => {
  it('exposes the three choices', () => {
    expect(THEMES).toEqual(['light', 'dark', 'auto'])
  })

  it('returns an explicit choice as it is', () => {
    expect(resolveTheme('light', at(23))).toBe('light')
    expect(resolveTheme('dark', at(12))).toBe('dark')
  })

  it('darkens at the evening boundary and lightens in the morning', () => {
    expect(resolveTheme('auto', at(AUTO_DARK_FROM_HOUR - 1, 59))).toBe('light')
    expect(resolveTheme('auto', at(AUTO_DARK_FROM_HOUR))).toBe('dark')
    expect(resolveTheme('auto', at(AUTO_DARK_UNTIL_HOUR - 1))).toBe('dark')
    expect(resolveTheme('auto', at(AUTO_DARK_UNTIL_HOUR))).toBe('light')
  })

  it('treats an unknown value as auto', () => {
    expect(resolveTheme('purple', at(13))).toBe('light')
    expect(resolveTheme(undefined, at(22))).toBe('dark')
  })

  it('reads the clock when no date is given', () => {
    vi.useFakeTimers()
    vi.setSystemTime(at(22))
    expect(resolveTheme('auto')).toBe('dark')
    vi.setSystemTime(at(9))
    expect(resolveTheme('auto')).toBe('light')
    vi.useRealTimers()
  })
})

describe('stored preference', () => {
  it('reads a known value and ignores anything else', () => {
    expect(readStoredTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'dark' }))).toBe('dark')
    expect(readStoredTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'purple' }))).toBe(null)
    expect(readStoredTheme(memoryStorage({}))).toBe(null)
  })

  it('writes the value', () => {
    const storage = memoryStorage({})
    storeTheme('auto', storage)
    expect(storage.values[THEME_STORAGE_KEY]).toBe('auto')
    expect(readStoredTheme(storage)).toBe('auto')
  })

  it('survives a storage that refuses everything', () => {
    const hostile = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
    }
    expect(readStoredTheme(hostile)).toBe(null)
    expect(() => storeTheme('dark', hostile)).not.toThrow()
  })

  it('falls back to the browser storage, absent in a node environment', () => {
    // no `window` here: the module must answer null rather than throw
    expect(readStoredTheme()).toBe(null)
    expect(() => storeTheme('dark')).not.toThrow()
  })
})

describe('applying the theme', () => {
  afterEach(() => { delete globalThis.document })

  it('does nothing without a document', () => {
    expect(applyTheme('dark')).toBe('dark')
    expect(applyTheme('light', at(22))).toBe('light')
  })

  it('sets the class, the attributes and the color scheme', () => {
    const attributes = {}
    const classes = new Set()
    globalThis.document = {
      documentElement: {
        classList: {
          toggle: (name, on) => { if (on) classes.add(name); else classes.delete(name) },
        },
        style: {},
        setAttribute: (name, value) => { attributes[name] = value },
      },
    }

    expect(applyTheme('dark')).toBe('dark')
    expect(classes.has('dark')).toBe(true)
    expect(attributes['data-theme']).toBe('dark')
    expect(attributes['data-theme-preference']).toBe('dark')
    expect(globalThis.document.documentElement.style.colorScheme).toBe('dark')

    expect(applyTheme('light')).toBe('light')
    expect(classes.has('dark')).toBe(false)
    expect(attributes['data-theme']).toBe('light')

    // `auto` records the preference, not the resolved value, and follows the clock
    expect(applyTheme('auto', at(22))).toBe('dark')
    expect(attributes['data-theme-preference']).toBe('auto')
    expect(attributes['data-theme']).toBe('dark')
  })

  it('records `auto` when no preference is given', () => {
    const attributes = {}
    globalThis.document = {
      documentElement: {
        classList: { toggle: () => {} },
        style: {},
        setAttribute: (name, value) => { attributes[name] = value },
      },
    }
    applyTheme(null, at(12))
    expect(attributes['data-theme-preference']).toBe('auto')
  })
})

describe('auto theme watch', () => {
  afterEach(() => {
    delete globalThis.window
    vi.useRealTimers()
  })

  it('does nothing without a window', () => {
    expect(() => watchAutoTheme(() => 'auto')()).not.toThrow()
  })

  it('re-applies on the ten-minute tick and when the tab comes back', () => {
    vi.useFakeTimers()
    const attributes = {}
    globalThis.document = {
      documentElement: {
        classList: { toggle: () => {} },
        style: {},
        setAttribute: (name, value) => { attributes[name] = value },
      },
    }
    const listeners = {}
    globalThis.window = {
      setInterval: (fn, ms) => setInterval(fn, ms),
      clearInterval: (id) => clearInterval(id),
      addEventListener: (name, fn) => { listeners[name] = fn },
      removeEventListener: (name) => { delete listeners[name] },
    }
    // the clock is 22:00 in the test environment's timezone-independent path: pass it explicitly
    vi.setSystemTime(at(22))

    const changes = []
    const stop = watchAutoTheme(() => 'auto', (resolved) => changes.push(resolved))
    expect(listeners.focus).toBeTypeOf('function')

    listeners.focus()
    expect(changes).toEqual(['dark'])
    expect(attributes['data-theme']).toBe('dark')

    vi.advanceTimersByTime(10 * 60 * 1000)
    expect(changes.length).toBe(2)

    stop()
    expect(listeners.focus).toBeUndefined()
    vi.advanceTimersByTime(10 * 60 * 1000)
    expect(changes.length).toBe(2)
  })

  it('leaves an explicit choice alone', () => {
    vi.useFakeTimers()
    const listeners = {}
    globalThis.window = {
      setInterval: (fn, ms) => setInterval(fn, ms),
      clearInterval: (id) => clearInterval(id),
      addEventListener: (name, fn) => { listeners[name] = fn },
      removeEventListener: (name) => { delete listeners[name] },
    }
    const changes = []
    const stop = watchAutoTheme(() => 'dark', (resolved) => changes.push(resolved))
    listeners.focus()
    expect(changes).toEqual([])
    stop()
  })

  it('works without a callback and without a preference', () => {
    vi.useFakeTimers()
    const listeners = {}
    globalThis.window = {
      setInterval: (fn, ms) => setInterval(fn, ms),
      clearInterval: (id) => clearInterval(id),
      addEventListener: (name, fn) => { listeners[name] = fn },
      removeEventListener: (name) => { delete listeners[name] },
    }
    const stop = watchAutoTheme(() => undefined)
    expect(() => listeners.focus()).not.toThrow()
    stop()
  })
})
