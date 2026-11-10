/**
 * FontAwesome, loaded on demand.
 *
 * The application used to register `fas`, `far` and `fab` whole at import time: ~2 000 icons in the
 * initial bundle, for the twenty the first screen shows. The set cannot be narrowed — the icon is
 * chosen by the user in the picker and stored in the configuration — so it is deferred instead: no
 * icon set is in the startup bundle, and the first icon of a style loads that style once
 * (`fas` ≈ 300 KB gzipped, cached for the session). Everything after it is synchronous.
 *
 * Why one chunk per style rather than one per icon: webpack *can* split
 * `import(\`pkg/${name}.js\`)` per file, but it produced 2 700 chunks (23 MB in `dist`), and Vite —
 * which runs the tests — eagerly pulls every matched module into the graph, which made the coverage
 * report attribute 2 700 statements that are not ours. A fixed specifier per style is predictable on
 * both sides, and one request per style is what an icon-dense console wants anyway.
 *
 * (Not to be confused with `icons.js`, which maps the Element UI 2 icon names stored in old
 * configuration records.)
 */

import { library } from '@fortawesome/fontawesome-svg-core'

import { resolveIcon } from './iconMap'

/** `ellipsis-h` -> `faEllipsisH`, the export name FontAwesome 6 gives each icon. */
export function moduleName(iconName) {
  const parts = String(iconName || '').split('-')
  return (
    'fa' + parts.map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : '')).join('')
  )
}

/** Is the `[prefix, name]` pair already in the library? */
export function hasIcon(definitions, pair) {
  const [prefix, name] = pair || []
  return Boolean(prefix && name && definitions && definitions[prefix] && definitions[prefix][name])
}

// One fixed specifier per style: see the note above. The aliases live in `vue.config.js` and
// `vitest.config.mjs`, because the packages' `exports` map rejects a `.js` suffix on a wildcard.
const STYLE_MODULES = {
  fas: () => import('@fa-solid/index.js'),
  far: () => import('@fa-regular/index.js'),
  fab: () => import('@fa-brands/index.js'),
}

/** The sets already loaded (or being loaded), by prefix. */
const sets = new Map()

/**
 * Load one style, once. Resolves to the icon set object (`{ faXxx: definition, … }`), or `null` if
 * the chunk could not be fetched — offline, or a blocked request.
 */
export function loadStyle(prefix) {
  const key = STYLE_MODULES[prefix] ? prefix : 'fas'
  if (sets.has(key)) return sets.get(key)

  const promise = STYLE_MODULES[key]()
    .then(module => {
      // The package's CJS build exposes the set as `fas` / `far` / `fab`; its ESM build exposes the
      // icons flat. Take the named set first: `library.add()` on the whole module object throws,
      // because it also carries non-icon keys (`prefix`, the deprecated aliases).
      const set = module[key] || module.default || module
      library.add(set)
      return set
    })
    .catch(() => null)

  sets.set(key, promise)
  return promise
}

/**
 * The definition of one icon, loading its style if needed. `null` when the name does not exist in
 * that set — a name stored in an old configuration may have disappeared from FontAwesome.
 */
export async function loadIcon(prefix, name) {
  const set = await loadStyle(prefix)
  const definition = set ? set[moduleName(name)] : null
  return definition && definition.iconName ? definition : null
}

/**
 * Resolve a configuration name (`code`, `regular/file-word`, `brands/docker`) into a pair
 * `<font-awesome-icon>` can render, searching the three sets as before — but loading them on the
 * way.
 */
export async function resolveIconAsync(name, definitions = library.definitions, load = loadIcon) {
  const direct = resolveIcon(name, definitions)
  if (hasIcon(definitions, direct)) return direct

  const [wanted, iconName] = direct
  if (!iconName) return direct

  // `wanted` may already be one of the three (and `fas` is both the default and the first fallback):
  // dedupe so a name that exists nowhere costs three attempts, not four
  for (const prefix of [...new Set([wanted, 'fas', 'far', 'fab'])]) {
    const definition = await load(prefix, iconName)
    if (definition) return [prefix, iconName]
  }
  return direct
}

/** Register the three complete sets — for the icon picker, when it opens. */
export async function loadAllIconSets() {
  await Promise.all(['fas', 'far', 'fab'].map(prefix => loadStyle(prefix)))
}
