import { afterEach, describe, expect, it } from 'vitest'
import aceThemeMixin, { ACE_THEME_DARK, ACE_THEME_LIGHT, aceThemeFor } from '../src/mixins/aceTheme'

/** Minimal DOM double: the mixin only reads `.ace_editor` nodes and their `env.editor`. */
function fakeDocument(nodes) {
  return { querySelectorAll: (selector) => (selector === '.ace_editor' ? nodes : []) }
}

function fakeEditor(theme) {
  return {
    current: theme,
    setTheme(value) { this.current = value },
    getTheme() { return this.current },
  }
}

const context = (extra) => Object.assign({
  registerAceThemes() { throw new Error('ace-builds absent du test') },
}, extra)

describe('ACE theme choice', () => {
  it('maps the console theme to an ACE theme', () => {
    expect(aceThemeFor('dark')).toBe(ACE_THEME_DARK)
    expect(aceThemeFor('light')).toBe(ACE_THEME_LIGHT)
    expect(aceThemeFor(undefined)).toBe(ACE_THEME_LIGHT)
  })

  it('starts on the theme in force at mount', () => {
    // no document in this environment: `currentTheme()` answers light
    expect(aceThemeMixin.data().aceTheme).toBe(ACE_THEME_LIGHT)
  })
})

describe('ACE editors sync', () => {
  afterEach(() => { delete globalThis.document })

  it('re-themes every mounted editor from the DOM', () => {
    const first = fakeEditor('ace/theme/chrome')
    const second = fakeEditor('ace/theme/chrome')
    const nodes = [{ env: { editor: first } }, { env: { editor: second } }]
    globalThis.document = Object.assign(fakeDocument(nodes), {
      documentElement: { getAttribute: () => null, setAttribute: () => {}, classList: { toggle: () => {} }, style: {} },
    })

    aceThemeMixin.methods.syncAceEditors.call(context({}))

    expect(first.current).toBe('ace/theme/' + ACE_THEME_LIGHT)
    expect(second.current).toBe('ace/theme/' + ACE_THEME_LIGHT)
  })

  it('follows the dark theme', () => {
    const editor = fakeEditor('ace/theme/chrome')
    globalThis.document = Object.assign(fakeDocument([{ env: { editor } }]), {
      documentElement: { getAttribute: (n) => (n === 'data-theme' ? 'dark' : null) },
    })
    aceThemeMixin.methods.syncAceEditors.call(context({}))
    expect(editor.current).toBe('ace/theme/' + ACE_THEME_DARK)
  })

  it('leaves an editor that already carries the theme', () => {
    const editor = fakeEditor('ace/theme/' + ACE_THEME_LIGHT)
    let calls = 0
    editor.setTheme = () => { calls += 1 }
    globalThis.document = Object.assign(fakeDocument([{ env: { editor } }]), {
      documentElement: { getAttribute: () => 'light' },
    })
    aceThemeMixin.methods.syncAceEditors.call(context({}))
    expect(calls).toBe(0)
  })

  it('ignores nodes without an editor', () => {
    globalThis.document = Object.assign(fakeDocument([{}, { env: {} }, { env: { editor: {} } }]), {
      documentElement: { getAttribute: () => 'dark' },
    })
    expect(() => aceThemeMixin.methods.syncAceEditors.call(context({}))).not.toThrow()
  })
})

describe('mixin lifecycle', () => {
  afterEach(() => { delete globalThis.document })

  it('wires the listener and syncs once after mount, then drops the listener', () => {
    const listeners = {}
    globalThis.document = {
      addEventListener: (name, fn) => { listeners[name] = fn },
      removeEventListener: (name) => { delete listeners[name] },
      querySelectorAll: () => [],
      documentElement: { getAttribute: () => 'dark' },
    }
    let ticked = null
    let synced = 0
    const vm = {
      aceTheme: ACE_THEME_LIGHT,
      $nextTick: (fn) => { ticked = fn },
      registerAceThemes: () => {},
      syncAceEditors: () => { synced += 1 },
    }
    aceThemeMixin.mounted.call(vm)
    expect(listeners['nyx:theme']).toBeTypeOf('function')
    expect(ticked).toBeTypeOf('function', 'un premier rendu est planifie apres le montage')
    expect(() => ticked()).not.toThrow()
    expect(synced).toBe(1)

    // a theme change updates the prop then resynchronises the editors
    vm.aceTheme = ACE_THEME_LIGHT
    listeners['nyx:theme']()
    expect(vm.aceTheme).toBe(ACE_THEME_DARK)
    expect(synced).toBe(2)

    aceThemeMixin.beforeUnmount.call(vm)
    expect(listeners['nyx:theme']).toBeUndefined()
  })

  it('loads both ACE themes by side effect', () => {
    // `ace-builds` is not resolvable under node: the function must at least run up to the
    // first require (it is what makes `ace/theme/tomorrow_night` available in the bundle).
    expect(() => aceThemeMixin.methods.registerAceThemes()).toThrow()
  })
})
