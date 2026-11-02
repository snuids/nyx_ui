/**
 * The catalogue of "internal" pages: consistency and existence.
 *
 * `CONTROLLER_PAGES` feeds the drop-down list of the screen builder; every name must designate
 * a component that really exists in `src/components/`, otherwise the screen created points at an
 * unknown controller and the page stays blank. A duplicate name breaks the selection. None of
 * this was checked.
 */

import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { CONTROLLER_PAGES, describeController } from '@/controllerCatalog.js'

const componentsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components')
const components = readdirSync(componentsDir)
  .filter(file => file.endsWith('.vue'))
  .map(file => file.replace(/\.vue$/, ''))

describe('CONTROLLER_PAGES', () => {
  it('contains no duplicate', () => {
    const names = CONTROLLER_PAGES.map(page => page.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('gives a name and a description to every entry', () => {
    for (const page of CONTROLLER_PAGES) {
      expect(typeof page.name).toBe('string')
      expect(page.name.length).toBeGreaterThan(0)
      expect(typeof page.description).toBe('string')
      expect(page.description.trim().length).toBeGreaterThan(10)
    }
  })

  it('only points at components present in src/components', () => {
    // an orphan entry = a blank page in the builder
    const missing = CONTROLLER_PAGES.map(page => page.name).filter(name => !components.includes(name))
    expect(missing).toEqual([])
  })

  it('names pages like components (PascalCase, no space)', () => {
    for (const page of CONTROLLER_PAGES) {
      expect(page.name).toMatch(/^[A-Z][A-Za-z0-9]*$/)
    }
  })
})

describe('describeController', () => {
  it('finds a known page', () => {
    const first = CONTROLLER_PAGES[0].name
    expect(describeController(first).name).toBe(first)
  })

  it('returns null for an unknown page', () => {
    expect(describeController('PageQuiNExistePas')).toBeNull()
  })

  it('returns null for an empty value', () => {
    // `name` comes from a drop-down list: the first option can be empty
    expect(describeController('')).toBeNull()
    expect(describeController(null)).toBeNull()
    expect(describeController(undefined)).toBeNull()
  })
})
