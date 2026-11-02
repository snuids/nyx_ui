import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Vitest is only used for the logic here: no component mounting, no DOM.
 *
 * The tests cover the pure modules and the store (getters/mutations), that is, the place where
 * screen bugs really come from — a translation key split the wrong way, a page catalogue that
 * loses an entry, a row filter computed incorrectly. Mounting Vue 2 components would require
 * jsdom, @vue/test-utils@1 and the vue2 plugin; that is not what this first pass is about.
 *
 * The coverage assiette is therefore `src` javascript only, minus what a node environment cannot
 * load or what carries no logic. Reporting a percentage over those files would otherwise be
 * flattering: the 62 single-file components (`src/components`, `src/views`) hold about three
 * quarters of the code and none of them is measured yet. Add `src/ ** / *.vue` to
 * `coverage.include` on the day components are mounted, not before.
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
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: [
        // translation and notice text: content, gated by scripts/check-lang-keys.mjs
        'src/lang/**',
        'src/content/**',
        // entry point: imports the stylesheets and mounts the application, nothing to assert
        'src/main.js',
        // imports three .vue files, which a node environment cannot parse
        'src/router/**',
      ],
      reporter: ['text', 'json-summary'],
      // The suite has to stay above what it reached (statements 99.1 %, branches 98.0 %,
      // functions 96.7 %, lines 99.1 %); the slack absorbs a small refactor, not a deleted test.
      thresholds: {
        statements: 97,
        branches: 96,
        functions: 94,
        lines: 97,
      },
    },
  },
})
