/**
 * Le catalogue des pages « internal » : cohérence et existence.
 *
 * `CONTROLLER_PAGES` alimente la liste déroulante du constructeur d'écrans ; chaque nom doit
 * désigner un composant qui existe vraiment dans `src/components/`, sinon l'écran créé pointe sur
 * un contrôleur introuvable et la page reste blanche. Un nom en double casse la sélection. Rien
 * de tout cela n'était vérifié.
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
  it('ne contient aucun doublon', () => {
    const names = CONTROLLER_PAGES.map(page => page.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('donne un nom et une description a chaque entree', () => {
    for (const page of CONTROLLER_PAGES) {
      expect(typeof page.name).toBe('string')
      expect(page.name.length).toBeGreaterThan(0)
      expect(typeof page.description).toBe('string')
      expect(page.description.trim().length).toBeGreaterThan(10)
    }
  })

  it('ne designe que des composants presents dans src/components', () => {
    // une entree orpheline = une page blanche dans le constructeur
    const missing = CONTROLLER_PAGES.map(page => page.name).filter(name => !components.includes(name))
    expect(missing).toEqual([])
  })

  it('nomme les pages comme des composants (PascalCase, sans espace)', () => {
    for (const page of CONTROLLER_PAGES) {
      expect(page.name).toMatch(/^[A-Z][A-Za-z0-9]*$/)
    }
  })
})

describe('describeController', () => {
  it('retrouve une page connue', () => {
    const first = CONTROLLER_PAGES[0].name
    expect(describeController(first).name).toBe(first)
  })

  it('rend null pour une page inconnue', () => {
    expect(describeController('PageQuiNExistePas')).toBeNull()
  })

  it('rend null pour une valeur vide', () => {
    // `name` vient d une liste deroulante : la premiere option peut etre vide
    expect(describeController('')).toBeNull()
    expect(describeController(null)).toBeNull()
    expect(describeController(undefined)).toBeNull()
  })
})
