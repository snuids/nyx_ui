import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

const requireContextHelper = fileURLToPath(new URL('./tests/helpers/require-context.js', import.meta.url))

/**
 * Remplace `require.context(...)` par son equivalent de test.
 *
 * Cinq fichiers de `src/` listent les ecrans a l'execution de cette facon : sous Vite l'appel
 * n'existe pas, et le module qui le contient ne se charge pas du tout (`controllerCatalog`,
 * `GenericComponent`, `FileSystem`, `GenericTable`, `PGGenericTable`). Deux lignes de
 * transformation, uniquement pendant les tests, evitent d'ecrire dans le code applicatif une
 * abstraction qui ne servirait qu'aux tests.
 */
function webpackRequireContext() {
  return {
    name: 'nyx-require-context',
    // `post` : le SFC doit d'abord etre compile en modules JS par plugin-vue, sinon l'import
    // injecte atterrit avant le <template> et casse le fichier.
    enforce: 'post',
    transform(code) {
      if (!code.includes('require.context(')) return null
      return {
        code:
          `import { createRequireContext as __nyxRequireContext } from ${JSON.stringify(requireContextHelper)}\n` +
          code.replace(/require\.context\(/g, '__nyxRequireContext('),
        map: null,
      }
    },
  }
}

/**
 * Two families of tests run here:
 *
 * - logic tests (`environment: 'node'`, no DOM): pure modules and the store, where screen bugs
 *   really come from — a translation key split the wrong way, a page catalogue that loses an
 *   entry, a row filter computed incorrectly;
 * - screen tests, which mount single-file components. They carry `// @vitest-environment jsdom`
 *   in their own header (like `tests/icons.render.spec.js`), so the logic suite stays on `node`
 *   and keeps running in a few seconds.
 *
 * The coverage assiette is now all of `src` — javascript and `.vue` — minus what carries no logic
 * to measure (see the exclusions). `@vitejs/plugin-vue` lets Vitest parse an SFC and lets the v8
 * provider map coverage back onto the `<script>` block through the sourcemap the plugin emits.
 *
 * Thresholds are per glob. The logic javascript is held high (97/96/94/97) because it is tested
 * closely; the `.vue` files have their own, lower threshold, set to what the screen suite actually
 * reaches. A threshold the suite cannot hold protects nothing. Both move up when tests are added,
 * never down.
 */
export default defineConfig({
  plugins: [webpackRequireContext(), vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // `vue-cli-service` resolved components without an extension (`@/components/Apps`); Vite does
    // not, and neither would a test import.
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.js'],
    // jsdom has no ResizeObserver / IntersectionObserver; Element Plus mounts fail without them.
    setupFiles: ['tests/setup/dom.js'],
    reporters: 'default',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js', 'src/**/*.vue'],
      exclude: [
        // translation and notice text: content, gated by scripts/check-lang-keys.mjs
        'src/lang/**',
        'src/content/**',
        // entry point: imports the stylesheets and mounts the application, nothing to assert
        'src/main.js',
        // Imports `vue-axios` and `vue-authenticate`, two Vue 2 plugins the project does not have:
        // the module cannot even load and no route uses it. Dead code, to delete or rewrite (see
        // MIGRATION.md). Measured at 0 % it would say nothing about the quality of the suite.
        'src/views/LoginOAuth.vue',
      ],
      reporter: ['text', 'json-summary'],
      thresholds: {
        // Whole `src`: statements 33.9 %, branches 83.9 %, functions 44.3 %, lines 33.9 %.
        // Low by construction — most of the 63 single-file components are still untested. The point
        // of the number is to fall if the suite loses a file, not to flatter.
        //
        // It moves in *both* directions as screens enter the assiette: mounting `Map`, `Activity`
        // and `LambdaEditor` took statements from 23.3 % to 33.9 % (components 17.2 % -> 29.0 %)
        // while pulling branches and functions down (85.8 -> 83.9 and 49.0 -> 44.3), because the
        // parts of those screens the tests do not exercise are now measured. Read the per-glob
        // numbers below for the quality of the suite; this one is the tripwire.
        statements: 33,
        branches: 83,
        functions: 44,
        lines: 33,
        // Logic and store: held closely, as before.
        'src/**/*.js': {
          statements: 97,
          branches: 96,
          functions: 94,
          lines: 97,
        },
        // The three screens that now have tests (Login 95.9 %, Main 80.7 %, Privacy 100 %).
        'src/views/**/*.vue': {
          statements: 85,
          branches: 80,
          functions: 50,
          lines: 85,
        },
        // The generic screens: GenericComponent 97.7 %, GenericTable 74.9 %, QueryBar 98.4 %,
        // QueryFilter 88.9 %, LandingPage 100 %. The aggregate is low because the other
        // components come in only through them; it is there to notice a lost spec file.
        'src/components/**/*.vue': {
          statements: 13,
          branches: 68,
          functions: 23,
          lines: 13,
        },
      },
    },
  },
})
