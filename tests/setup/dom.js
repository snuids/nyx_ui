/**
 * Polyfills dont jsdom manque et que les composants Element Plus utilisent au montage
 * (`el-select`, `el-popover`, `el-table` mesurent leur conteneur).
 *
 * Sans eux, monter un ecran leve « ResizeObserver is not defined » et le test echoue pour une
 * raison qui n'a rien a voir avec le code teste.
 */

/**
 * `Storage` en memoire, utilise seulement si l'environnement n'en fournit pas.
 *
 * Node 26 definit un `localStorage` global (derriere `--localstorage-file`) qui vaut `undefined`
 * sans ce drapeau ; la cle existant deja sur `globalThis`, Vitest ne peut pas y installer celui de
 * jsdom, et les ecrans qui ecrivent dans le stockage (`Login.vue` garde `authResponse`,
 * `LanguageSelect` retient la langue) leveraient un TypeError en test alors qu'ils marchent en
 * navigateur.
 *
 * Le Proxy n'est pas un detail : le code applicatif ecrit `localStorage.authResponse = ...`
 * (acces par propriete, comme le veut l'API Storage), pas seulement `setItem`. Sans les pieges
 * ci-dessous, ces ecritures resteraient des proprietes quelconques de l'objet et `clear()`
 * laisserait les valeurs d'un test dans le suivant.
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
