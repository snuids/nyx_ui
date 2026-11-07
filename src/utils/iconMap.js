/**
 * FontAwesome resolution for the icon names this application stores.
 *
 * Three forms appear, in the templates and in the configuration records: `code`, `regular/file-word`
 * and `brands/docker`. Brands matter — `docker` and `canadian-maple-leaf` exist only in `fab`, and
 * without that set they render nothing at all, which is how the Docker icon disappeared.
 */
export const PREFIXES = { solid: 'fas', regular: 'far', brands: 'fab' }

/** `['brands','docker']` -> `['fab','docker']`, with a fallback across the three sets. */
export function resolveIcon(name, definitions) {
  const parts = String(name || '').split('/')
  const wanted = PREFIXES[parts.length > 1 ? parts[0] : 'solid'] || 'fas'
  const iconName = parts.length > 1 ? parts[1] : parts[0]

  if (!iconName) return [wanted, iconName]
  for (const prefix of [wanted, 'fas', 'far', 'fab']) {
    if (definitions && definitions[prefix] && definitions[prefix][iconName]) {
      return [prefix, iconName]
    }
  }
  return [wanted, iconName]
}
