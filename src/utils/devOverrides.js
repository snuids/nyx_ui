/**
 * Development conveniences that must not reach a production bundle.
 *
 * The console accepts `?api=<url>` to point at another API, and `?user=` / `?password=` to prefill
 * the login form; the README documents both for local work. On a real domain the same URL is a
 * ready-made credential capture: the page is served by us, the login form looks the same, and it
 * posts to whatever host the link names — while the password lands in the browser history, the
 * proxy logs and the Referer header.
 *
 * `IS_DEV` is a module constant on purpose. Webpack replaces `process.env.NODE_ENV` at build time,
 * so in a production bundle it folds to `false`, both functions fold to their constant result, and
 * the parsing below is dropped from the bundle. A default *parameter* would not fold: Babel turns
 * it into an `arguments[1]` test that the minifier cannot evaluate (that is how the first version
 * of this file kept the whole `?api=` path in the production bundle).
 */
import { getUrlVars } from '@/utils/language'

const IS_DEV = process.env.NODE_ENV !== 'production'

/**
 * The API URL named in the query string, in development only.
 * @returns {string|null} the override, or null when the page runs in production.
 */
export function apiOverride(href) {
  if (!IS_DEV) return null
  const value = getUrlVars(href)['api']
  if (!value) return null
  return value.split('#')[0]
}

/**
 * The credentials named in the query string, in development only.
 * @returns {{login?: string, password?: string}} an empty object when the page runs in production.
 */
export function credentialsOverride(href) {
  if (!IS_DEV) return {}
  const vars = getUrlVars(href)
  const prefill = {}
  if (vars['user'] != undefined) {
    prefill.login = vars['user'].split('#')[0]
  }
  if (vars['password'] != undefined) {
    prefill.password = vars['password'].split('#')[0]
  }
  return prefill
}
