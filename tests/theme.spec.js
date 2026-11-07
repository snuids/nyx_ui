import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTO_DARK_FROM_HOUR,
  AUTO_DARK_UNTIL_HOUR,
  THEMES,
  THEME_STORAGE_KEY,
  applyTheme,
  currentTheme,
  readStoredTheme,
  rememberInSession,
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

describe('session snapshot', () => {
  function snapshot(theme) {
    return JSON.stringify({ data: { cred: { token: 't', user: { login: 'a@b.c', theme } }, menus: [] } })
  }

  it('writes the preference into the restored-session copy', () => {
    const storage = memoryStorage({ authResponse: snapshot('light') })
    expect(rememberInSession('dark', storage)).toBe(true)
    const stored = JSON.parse(storage.values.authResponse)
    expect(stored.data.cred.user.theme).toBe('dark')
    expect(stored.data.cred.token).toBe('t', 'le reste du snapshot ne bouge pas')
  })

  it('answers false when there is nothing to update', () => {
    expect(rememberInSession('dark', memoryStorage({}))).toBe(false)
    expect(rememberInSession('dark', memoryStorage({ authResponse: '{not json' }))).toBe(false)
    expect(rememberInSession('dark', memoryStorage({ authResponse: '{"data":{}}' }))).toBe(false)
    expect(rememberInSession('dark', memoryStorage({ authResponse: '{"data":{"cred":{}}}' }))).toBe(false)
  })

  it('survives a storage that refuses the write', () => {
    const hostile = {
      getItem: () => snapshot('light'),
      setItem: () => { throw new Error('denied') },
    }
    expect(rememberInSession('dark', hostile)).toBe(false)
  })
})

describe('theme in force and its event', () => {
  afterEach(() => { delete globalThis.document; delete globalThis.CustomEvent })

  function fakeDocument(attributes) {
    const seen = []
    const doc = {
      documentElement: {
        classList: { toggle: () => {} },
        style: {},
        setAttribute: (name, value) => { attributes[name] = value },
        getAttribute: (name) => (name in attributes ? attributes[name] : null),
      },
      dispatchEvent: (event) => { seen.push(event); return true },
    }
    return { doc, seen }
  }

  it('answers light without a document', () => {
    expect(currentTheme()).toBe('light')
  })

  it('reads the theme from the document', () => {
    const { doc } = fakeDocument({ 'data-theme': 'dark' })
    globalThis.document = doc
    expect(currentTheme()).toBe('dark')
    globalThis.document = fakeDocument({ 'data-theme': 'light' }).doc
    expect(currentTheme()).toBe('light')
    globalThis.document = fakeDocument({}).doc
    expect(currentTheme()).toBe('light')
  })

  it('announces the change so the charts can repaint', () => {
    const attributes = {}
    const { doc, seen } = fakeDocument(attributes)
    globalThis.document = doc
    // node has CustomEvent since 19; provide it for the runners that do not
    if (typeof globalThis.CustomEvent === 'undefined') {
      globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init && init.detail } }
    }
    applyTheme('auto', at(22))
    expect(seen.length).toBe(1)
    expect(seen[0].type).toBe('nyx:theme')
    expect(seen[0].detail).toEqual({ theme: 'dark', preference: 'auto' })
  })

  it('survives a document without event support', () => {
    const attributes = {}
    globalThis.document = {
      documentElement: {
        classList: { toggle: () => {} },
        style: {},
        setAttribute: (name, value) => { attributes[name] = value },
      },
    }
    expect(() => applyTheme('dark')).not.toThrow()
    expect(attributes['data-theme']).toBe('dark')
  })
})
