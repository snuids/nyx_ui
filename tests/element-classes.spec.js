/**
 * Same family of failure as `el-submenu` -> `el-sub-menu`, but on the CSS side: a selector that no
 * longer matches produces no error, it simply does not apply. That is how the entries of the left
 * bar fell back to the default 56 px instead of the 40 px defined here.
 *
 * The test reads the <style> blocks of the 62 components and checks that every `el-*` class cited
 * exists in the Element Plus stylesheet.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SRC = resolve(process.cwd(), 'src')
const EP_CSS = readFileSync(resolve(process.cwd(), 'node_modules/element-plus/dist/index.css'), 'utf8')

// Classes deliberately absent from Element Plus:
//  - `el-menu-vertical` is the project's own class name (prefixed `el-` by inheritance);
//  - the Element UI 2 selectors are kept next to the new ones, with no effect;
//  - `el-icon-info` is left over from an old ConfigDetails rule.
const ALLOWED = new Set(['el-menu-vertical', 'el-submenu', 'el-submenu__title', 'el-icon-info'])

function styleBlocks(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...styleBlocks(path))
    else if (entry.endsWith('.vue')) {
      const text = readFileSync(path, 'utf8')
      out.push(...(text.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).map((block) => [path, block]))
    }
  }
  return out
}

describe('classes Element Plus utilisees dans nos styles', () => {
  const used = new Map()
  for (const [file, block] of styleBlocks(SRC)) {
    for (const match of block.matchAll(/\.(el-[a-z0-9_-]+)/g)) {
      if (!used.has(match[1])) used.set(match[1], file.replace(SRC, ''))
    }
  }

  it('trouve des classes (garde-fou du test lui-meme)', () => {
    expect(used.size).toBeGreaterThan(20)
  })

  it('n applique aucun style a une classe qu Element Plus ne rend pas', () => {
    const unknown = [...used.keys()]
      .filter((name) => !ALLOWED.has(name))
      .filter((name) => !EP_CSS.includes('.' + name))
      .map((name) => `${name} (${used.get(name)})`)
    expect(unknown).toEqual([])
  })
})
