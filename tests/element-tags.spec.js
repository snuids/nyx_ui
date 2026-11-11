// @vitest-environment jsdom
/**
 * Element UI 2 -> Element Plus renamed components, and a name that no longer exists breaks nothing:
 * Vue takes it for an unknown component, renders nothing, and the feature disappears without a
 * message. That is how the left bar stopped opening (`el-submenu` is now called `el-sub-menu`).
 *
 * This test reads the 62 components of the project and checks that every `el-*` tag used really
 * exists in Element Plus. It catches the remaining renames and the typos.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as ElementPlus from 'element-plus'

// vitest runs from the project root
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

// el-sub-menu -> ElSubMenu, and so on
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
