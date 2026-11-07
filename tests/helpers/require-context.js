/**
 * `require.context` de webpack, pour les tests.
 *
 * Quatre fichiers de `src/` listent les ecrans disponibles a l'execution :
 * `GenericComponent.vue` (rend `<component :is="config.controller">`), `FileSystem.vue`,
 * `GenericTable.vue`, `PGGenericTable.vue` et `controllerCatalog.js`. Webpack seul fournit
 * `require.context` ; sous Vite (donc sous Vitest) l'appel n'existe pas et le module qui le
 * contient ne se charge meme pas — GenericComponent, l'ecran qui affiche toutes les pages, etait
 * donc impossible a monter en test.
 *
 * Ce module en donne un equivalent, adosse au glob de Vite : `keys()` reste synchrone (c'est tout
 * ce dont le catalogue a besoin) et `ctx(key)` renvoie un composant asynchrone, pour ne pas charger
 * les 63 SFC a l'import. Le remplacement de l'appel est fait par le plugin `nyx-require-context`
 * de `vitest.config.mjs`, qui ne s'applique qu'aux tests.
 */

import { defineAsyncComponent } from 'vue'

// Chemins relatifs a CE fichier : `tests/helpers/` -> `src/components/`.
const loaders = import.meta.glob('../../src/components/**/*.vue')

/** `api` = `./components/fileEditor/`, `../components/` ou `components/` selon l'appelant. */
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
    // webpack renvoie l'espace de noms du module : les appelants lisent `.default`
    // (`GenericComponent.vue` enregistre ses pages ainsi).
    return { default: defineAsyncComponent(loaders[file]) }
  }

  ctx.keys = () => entries.map((rel) => './' + rel)
  ctx.resolve = (key) => key
  ctx.id = dir

  return ctx
}
