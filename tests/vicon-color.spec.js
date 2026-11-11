/**
 * `vue-awesome` accepted a `color` prop; FontAwesome colours through `currentColor`. Without that
 * prop, the icons of the "format: icon" columns (the Result column of the Lambdas) lost their green
 * and came out black.
 *
 * This project tests JavaScript modules: mounting `.vue` components would require
 * `@vitejs/plugin-vue` (absent from the Vitest configuration). We therefore check the declaration,
 * and the render is checked in the browser (`color: green` on the SVG).
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
