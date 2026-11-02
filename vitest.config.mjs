import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Vitest ne sert ici qu'à la logique : aucun montage de composant, pas de DOM.
 *
 * Les tests couvrent les modules purs et le store (getters/mutations), c'est-à-dire l'endroit où
 * les bugs d'écran naissent vraiment — une clé de traduction mal découpée, un catalogue de pages
 * qui perd une entrée, un filtre de lignes mal calculé. Monter des composants Vue 2 demanderait
 * jsdom, @vue/test-utils@1 et le plugin vue2 ; ce n'est pas le sujet du premier passage.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.js'],
    reporters: 'default',
  },
})
