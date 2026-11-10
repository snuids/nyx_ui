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
      // Same aliases as `vue.config.js`: the FontAwesome packages' `exports` map rejects a `.js`
      // wildcard, and tests must resolve the icon chunk imports the application makes.
      '@fa-solid': fileURLToPath(new URL('./node_modules/@fortawesome/free-solid-svg-icons', import.meta.url)),
      '@fa-regular': fileURLToPath(new URL('./node_modules/@fortawesome/free-regular-svg-icons', import.meta.url)),
      '@fa-brands': fileURLToPath(new URL('./node_modules/@fortawesome/free-brands-svg-icons', import.meta.url)),
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
        // Re-baselined for Vitest 5, not lowered because tests were lost.
        //
        // Vitest 5 remaps v8 coverage through the AST unconditionally (the old
        // `experimentalAstAwareRemapping` switch is gone): the template render functions and the
        // branches of every measured `.vue` are now counted file-wide. The same 46 spec files and
        // 394 tests therefore report 22.8 % statements / 32.7 % branches / 18.9 % functions,
        // where Vitest 2 reported 33.9 / 83.9 / 44.3. Nothing regressed — the ruler changed.
        //
        // Re-baselined again on 9 November 2026, this time upward: the suite measures 34.75 %
        // statements / 40.37 % branches / 30.8 % functions / 35.94 % lines (610 tests). The values
        // below sit about a point under, so that a screen test lost by accident shows up as a
        // failure rather than a silent drift — a tripwire 12 points under the measure protected
        // nothing. Read the per-glob numbers below for the quality of the suite.
        statements: 34,
        branches: 39,
        functions: 30,
        lines: 35,
        // Logic and store: held closely (98.5 / 95.5 / 97.1 / 98.9 under the new measure).
        'src/**/*.js': {
          statements: 97,
          branches: 94,
          functions: 96,
          lines: 97,
        },
        // Login 95.9 %, Main 80.8 %, Privacy 100 %, App.vue : 74.2 % aggregate.
        'src/views/**/*.vue': {
          statements: 73,
          branches: 72,
          functions: 72,
          lines: 73,
        },
        // GenericComponent, GenericTable, QueryBar, QueryFilter, User, LandingPage and the
        // screens v3.6.6 added; the rest of `src/components` is still at zero.
        //
        // These numbers go *down* when logic is extracted out of a component: the statements and
        // branches that were covered leave this glob for `src/**/*.js` (the query builder of
        // `GenericTable` moved to `utils/esQuery.js`, covered at 100 %). That is a gain, not a
        // loss — read the two globs together, and `src/**/*.js` is the one that must stay high.
        'src/components/**/*.vue': {
          statements: 13,
          // 19 and not 20 since `ConfigDetails` is mounted: its own branches are 15 %, so adding
          // it to the measured set pulls the zone average down — that is coverage gained, not lost.
          branches: 19,
          functions: 13,
          lines: 13,
        },
      },
    },
  },
})
