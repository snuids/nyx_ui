/**
 * webpack's `require.context`, for the tests.
 *
 * Four files in `src/` list the screens available at runtime:
 * `GenericComponent.vue` (renders `<component :is="config.controller">`), `FileSystem.vue`,
 * `GenericTable.vue`, `PGGenericTable.vue` and `controllerCatalog.js`. webpack alone provides
 * `require.context`; under Vite (hence under Vitest) the call does not exist and the module
 * holding it does not even load — GenericComponent, the screen that displays every page, was
 * therefore impossible to mount in a test.
 *
 * This module provides an equivalent, backed by Vite's glob: `keys()` stays synchronous (all the
 * catalogue needs) and `ctx(key)` returns an async component, so as not to load the 63 SFCs at
 * import. The call is swapped out by the `nyx-require-context` plugin in `vitest.config.mjs`,
 * which only applies to tests.
 */

import { defineAsyncComponent } from 'vue'

// Paths relative to THIS file: `tests/helpers/` -> `src/components/`.
const loaders = import.meta.glob('../../src/components/**/*.vue')

/** `api` = `./components/fileEditor/`, `../components/` or `components/`, depending on the caller. */
function normalizeDir(dir) {
  return String(dir)
    .replace(/^\.\//, '')
    .replace(/^\.\.\/components\/?/, '')
    .replace(/^components\/?/, '')
    .replace(/\/$/, '')
}

export function createRequireContext(dir = '.', recursive = true, regexp = /\.vue$/) {
  const base = normalizeDir(dir)
  const entries = Object.keys(loaders)
    .map((file) => file.replace(/^.*\/src\/components\//, ''))
    .filter((rel) => (base ? rel.startsWith(base + '/') : true))
    .filter((rel) => recursive || !rel.slice(base ? base.length + 1 : 0).includes('/'))
    .filter((rel) => regexp.test('./' + rel))
    .sort()

  const ctx = (key) => {
    const rel = String(key).replace(/^\.\//, '')
    const file = Object.keys(loaders).find((candidate) =>
      candidate.endsWith('/src/components/' + rel)
    )
    if (!file) throw new Error(`require.context: ${key} is not in ${dir}`)
    // webpack returns the module namespace: callers read `.default`
    // (`GenericComponent.vue` registers its pages that way).
    return { default: defineAsyncComponent(loaders[file]) }
  }

  ctx.keys = () => entries.map((rel) => './' + rel)
  ctx.resolve = (key) => key
  ctx.id = dir

  return ctx
}
