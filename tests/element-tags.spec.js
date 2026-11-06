// @vitest-environment jsdom
/**
 * Element UI 2 -> Element Plus a renomme des composants, et un nom qui n'existe plus ne casse rien :
 * Vue le prend pour un composant inconnu, n'affiche rien, et la fonction disparait sans message.
 * C'est ainsi que la barre de gauche a cesse de s'ouvrir (`el-submenu` s'appelle `el-sub-menu`).
 *
 * Ce test lit les 62 composants du projet et verifie que chaque balise `el-*` utilisee existe
 * vraiment dans Element Plus. Il attrape les renommages restants et les fautes de frappe.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as ElementPlus from 'element-plus'

// vitest lance depuis la racine du projet
const SRC = resolve(process.cwd(), 'src')

function vueFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...vueFiles(path))
    else if (entry.endsWith('.vue')) out.push(path)
  }
  return out
}

// el-sub-menu -> ElSubMenu, ainsi de suite
const exported = new Set(
  Object.keys(ElementPlus)
    .filter((name) => /^El[A-Z]/.test(name))
    .map((name) => 'el-' + name.replace(/^El/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase())
)

describe('balises Element Plus utilisees dans les composants', () => {
  const used = new Map()
  for (const file of vueFiles(SRC)) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(/<(el-[a-z0-9-]+)/g)) {
      if (!used.has(match[1])) used.set(match[1], new Set())
      used.get(match[1]).add(file.replace(SRC, ''))
    }
  }

  it('trouve des balises (garde-fou du test lui-meme)', () => {
    expect(used.size).toBeGreaterThan(30)
  })

  it('n utilise aucun composant absent d Element Plus', () => {
    const unknown = [...used.keys()].filter((tag) => !exported.has(tag))
    const detail = unknown.map((tag) => `${tag} (${[...used.get(tag)].slice(0, 2).join(', ')})`)
    expect(detail).toEqual([])
  })
})
