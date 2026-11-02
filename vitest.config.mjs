import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Vitest is only used for the logic here: no component mounting, no DOM.
 *
 * The tests cover the pure modules and the store (getters/mutations), that is, the place where
 * screen bugs really come from — a translation key split the wrong way, a page catalogue that
 * loses an entry, a row filter computed incorrectly. Mounting Vue 2 components would require
 * jsdom, @vue/test-utils@1 and the vue2 plugin; that is not what this first pass is about.
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
