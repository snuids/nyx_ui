/**
 * `vue-awesome` acceptait une prop `color` ; FontAwesome colore via `currentColor`. Sans cette prop,
 * les icones des colonnes « format: icon » (colonne Result des Lambdas) perdaient leur vert et
 * sortaient en noir.
 *
 * Ce projet teste des modules JavaScript : le montage de composants `.vue` demanderait
 * `@vitejs/plugin-vue` (absent de la configuration Vitest). On verifie donc la declaration, et le
 * rendu est controle dans le navigateur (`color: green` sur le SVG).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(process.cwd(), 'src/components/VIcon.vue'), 'utf8')

describe('VIcon', () => {
  it('declare la prop color venue de vue-awesome', () => {
    expect(source).toMatch(/color:\s*\{\s*type:\s*String/)
  })

  it('reporte la couleur dans le style du conteneur', () => {
    expect(source).toContain('style.color = this.color')
  })
})
