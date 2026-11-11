/**
 * The Vue 2 plugins (`vue-browser-geolocation`, `vue-browser-detect-plugin`...) set global
 * properties (`$getLocation`, `$browserDetect`...). In Vue 3 they must be declared one by one in
 * `main.js`; the ones we forget raise `TypeError: this.$x is not a function` **on click**, not at
 * load — the button then stays stuck on its spinner (the case of "Submit" in the Test app).
 *
 * This test compares the `this.$xxx` of the code with the registered properties.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = process.cwd()
const SRC = resolve(ROOT, 'src')

const BUILTINS = new Set([
  'store', 'router', 'route', 'refs', 'emit', 'nextTick', 'forceUpdate', 'watch', 'set', 'delete',
  't', 'te', 'tc', 'd', 'n', 'i18n', 'locale', 'options', 'slots', 'props', 'parent', 'root', 'el',
  'data', 'attrs', 'listeners', 'children', 'vnode', 'isServer', 'ssrContext', 'createElement',
  // Element Plus
  'notify', 'message', 'msgbox', 'alert', 'confirm', 'prompt', 'loading', 'ELEMENT', 'messageBox',
])

function files(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) out.push(...files(p))
    else if (/\.(vue|js)$/.test(e)) out.push(p)
  }
  return out
}

function registered() {
  const main = readFileSync(resolve(SRC, 'main.js'), 'utf8')
  const names = new Set()
  for (const m of main.matchAll(/globalProperties\.\$([A-Za-z_][\w]*)\s*=/g)) names.add(m[1])
  return names
}

describe('proprietes globales', () => {
  it('tout this.$xxx utilise est enregistre dans main.js', () => {
    const connus = registered()
    const manquants = new Map()
    for (const f of files(SRC)) {
      const text = readFileSync(f, 'utf8')
      for (const m of text.matchAll(/this\.\$([A-Za-z_][\w]*)/g)) {
        const nom = m[1]
        if (BUILTINS.has(nom) || connus.has(nom)) continue
        if (!manquants.has(nom)) manquants.set(nom, new Set())
        manquants.get(nom).add(f.replace(SRC, ''))
      }
    }
    const rapport = [...manquants].map(([nom, fs]) => `$${nom} (${[...fs].join(', ')})`)
    expect(rapport).toEqual([])
  })
})
