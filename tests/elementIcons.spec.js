/**
 * The Element Plus icon list (`src/utils/elementIcons.js`).
 *
 * `main.js` registered the whole Element Plus set to provide the thirty-odd icons the templates
 * name. The list is now explicit, which only holds if something notices when a template starts
 * naming an icon that is not in it: that is this test. It reads the sources, collects every
 * `$icons.<Name>` and compares.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { elementIcons } from '@/utils/elementIcons'

const SRC = new URL('../src/', import.meta.url).pathname

function walk(dir) {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

/** Every `$icons.Name` in the sources, and every `$icons[x]` (which the pinned list cannot serve). */
function iconsNamedInSources() {
  const named = new Set()
  const dynamic = []

  for (const file of walk(SRC).filter(f => /\.(vue|js)$/.test(f))) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(/\$icons\.([A-Za-z0-9_]+)/g)) named.add(match[1])
    if (/\$icons\[/.test(text)) dynamic.push(file.replace(SRC, 'src/'))
  }

  return { named, dynamic }
}

describe('elementIcons', () => {
  it('lists every icon the sources name', () => {
    const { named } = iconsNamedInSources()
    const missing = [...named].filter(name => !(name in elementIcons)).sort()

    expect(missing, 'add these to src/utils/elementIcons.js').toEqual([])
  })

  it('carries no icon the sources no longer name', () => {
    const { named } = iconsNamedInSources()
    const unused = Object.keys(elementIcons).filter(name => !named.has(name)).sort()

    // a dead entry is not a bug, but it means the list drifted: prune it rather than carry it
    expect(unused, 'no longer referenced: remove them').toEqual([])
  })

  it('is accessed by literal name only, never through a variable', () => {
    const { dynamic } = iconsNamedInSources()

    // a computed access would need the whole set registered, and the pinning would be a lie
    expect(dynamic).toEqual([])
  })

  it('exports component definitions', () => {
    for (const [name, component] of Object.entries(elementIcons)) {
      expect(component, name + ' is not a component').toBeTruthy()
      expect(typeof component.render === 'function' || typeof component.setup === 'function',
        name + ' is not a Vue component').toBe(true)
    }
  })
})
