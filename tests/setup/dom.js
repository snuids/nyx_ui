/**
 * Polyfills that jsdom lacks and that Element Plus components use when mounting
 * (`el-select`, `el-popover`, `el-table` measure their container).
 *
 * Without them, mounting a screen raises "ResizeObserver is not defined" and the test fails for a
 * reason that has nothing to do with the code under test.
 */

/**
 * In-memory `Storage`, used only when the environment does not provide one.
 *
 * Node 26 defines a global `localStorage` (behind `--localstorage-file`) which is `undefined`
 * without that flag; the key already exists on `globalThis`, so Vitest cannot install jsdom's on it,
 * and the screens that write to storage (`Login.vue` keeps `authResponse`, `LanguageSelect`
 * remembers the language) would raise a TypeError in test while they work in a browser.
 *
 * The Proxy is not a detail: the application code writes `localStorage.authResponse = ...`
 * (property access, as the Storage API wants), not only `setItem`. Without the traps
 * below, those writes would stay ordinary properties of the object and `clear()` would leave the
 * values of one test for the next.
 */
class MemoryStorage {
  constructor() {
    this.map = new Map()
  }

  get length() {
    return this.map.size
  }

  key(index) {
    return [...this.map.keys()][index] ?? null
  }

  getItem(key) {
    return this.map.has(String(key)) ? this.map.get(String(key)) : null
  }

  setItem(key, value) {
    this.map.set(String(key), String(value))
  }

  removeItem(key) {
    this.map.delete(String(key))
  }

  clear() {
    this.map.clear()
  }

  keys() {
    return [...this.map.keys()]
  }
}

function createStorage() {
  const storage = new MemoryStorage()

  return new Proxy(storage, {
    get(target, prop) {
      if (typeof prop !== 'string') {
        const value = Reflect.get(target, prop, target)
        return typeof value === 'function' ? value.bind(target) : value
      }
      if (prop in target) {
        const value = Reflect.get(target, prop, target)
        return typeof value === 'function' ? value.bind(target) : value
      }
      return target.map.get(prop)
    },
    set(target, prop, value) {
      if (typeof prop === 'string' && !(prop in target)) {
        target.setItem(prop, value)
        return true
      }
      return Reflect.set(target, prop, value, target)
    },
    deleteProperty(target, prop) {
      if (target.map.has(prop)) target.removeItem(prop)
      return true
    },
    has(target, prop) {
      return (typeof prop === 'string' && target.map.has(prop)) || prop in target
    },
    ownKeys(target) {
      return [...target.map.keys(), ...Reflect.ownKeys(target)]
    },
    getOwnPropertyDescriptor(target, prop) {
      if (target.map.has(prop)) {
        return { value: target.map.get(prop), writable: true, enumerable: true, configurable: true }
      }
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  })
}

if (typeof window !== 'undefined') {
  if (typeof window.localStorage === 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: createStorage(),
    })
  }

  if (typeof window.ResizeObserver === 'undefined') {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }

  if (typeof window.IntersectionObserver === 'undefined') {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    }
  }

  if (typeof window.matchMedia === 'undefined') {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false
      },
    })
  }

  if (typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = function () {}
  }
}
