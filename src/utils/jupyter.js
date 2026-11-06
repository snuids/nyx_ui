/**
 * The JupyterLab token, and how notebook links carry it.
 *
 * "Edit Code" opens a notebook in JupyterLab, which answers with its own login page when the
 * token is missing. The token is not a console setting: it is part of the URL of the `jupylab`
 * external application declared in `nyx_app`, and the menus the store already holds carry it.
 * The lambda editor has always read it from there; the report editor did not, so its button
 * asked for a login every time.
 *
 * Pure functions: the walk over the menus and the URL handling are what regressions touch.
 */

const JUPYTER_PATH = /\/jupylab(?:\/|$)/i

function defaultBase() {
  return typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost'
}

/**
 * The token carried by a JupyterLab URL, or "" when the URL is not one.
 * @param {string} rawUrl absolute or relative, as written in the application configuration
 * @param {string} [base] origin used to resolve a relative URL
 */
export function tokenFromUrl(rawUrl, base = defaultBase()) {
  if (typeof rawUrl !== 'string' || !rawUrl) return ''
  let url
  try {
    url = new URL(rawUrl, base)
  } catch (error) {
    return ''
  }
  if (!JUPYTER_PATH.test(url.pathname)) return ''
  return url.searchParams.get('token') || ''
}

/**
 * The JupyterLab token found in the menus, "" when no `jupylab` application is declared.
 * @param {Array} menus the `menus` getter of the store
 */
export function jupyterLabToken(menus, base = defaultBase()) {
  for (const menu of menus || []) {
    for (const submenu of (menu && menu.submenus) || []) {
      for (const app of (submenu && submenu.apps) || []) {
        if (!app || app.type !== 'external' || !app.config || typeof app.config.url !== 'string') continue
        const token = tokenFromUrl(app.config.url, base)
        if (token) return token
      }
    }
  }
  return ''
}

/**
 * `<url>` with the token appended, or unchanged when there is none.
 * @param {string} url the notebook link
 * @param {string} token what `jupyterLabToken` returned
 */
export function withJupyterLabToken(url, token) {
  if (!token) return url
  const separator = url.includes('?') ? '&' : '?'
  return url + separator + 'token=' + encodeURIComponent(token)
}
