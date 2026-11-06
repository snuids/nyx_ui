import { detect } from 'detect-browser'

/**
 * `vue-browser-detect-plugin` has no Vue 3 release. Only four flags were read from it (Kibana.vue
 * decides how long a URL may be depending on the browser), so they are computed here.
 */
const info = detect() || { name: 'unknown', os: 'unknown', version: null }

export const browserDetect = {
  meta: info,
  name: info.name,
  isIE: info.name === 'ie' || info.name === 'ie-mobile',
  isEdge: info.name === 'edge',
  isChrome: info.name === 'chrome',
  isChromeIOS: info.name === 'chrome' && info.os === 'iOS',
}
