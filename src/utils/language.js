/**
 * Reading the query string and choosing the UI language at startup.
 *
 * Two screens need the query string (`main.js` for `api` / `language` / `lang` / `locale`,
 * `Login.vue` to pre-fill `user` and `password`), and they each carried their own copy of the same
 * regular expression. The language resolution then lived in the middle of the entry point, where no
 * test could reach it — although it decides, on every single page load, which language the console
 * is in.
 */

/**
 * The query-string parameters of a URL, as a plain object.
 * Values keep their `#fragment` part: the console runs in hash mode, so `?user=bob#/main` yields
 * `bob#/main` and every caller strips the fragment itself.
 */
export function getUrlVars(href) {
  var vars = {}
  String(href == undefined ? '' : href).replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key] = value
  })
  return vars
}

/**
 * The language to start in.
 *
 * Priority: the URL parameter (`language`, `lang` or `locale`) > the language chosen in the
 * selector, which is what applies before anyone is signed in (`localStorage.nyx_language`) > the
 * language saved on the account of the remembered session > English.
 *
 * Storage access is wrapped twice on purpose: reading the property itself can throw (storage
 * disabled, Safari private mode) and `authResponse` can hold anything, including invalid JSON.
 * Neither must prevent the console from starting, so both fall through to the next source.
 */
export function resolveLanguage(vars, storage) {
  vars = vars || {}
  var fromUrl = vars['language'] || vars['lang'] || vars['locale']
  if (fromUrl != undefined && fromUrl != '') {
    return fromUrl.split('#')[0]
  }
  try {
    var remembered = storage && storage.nyx_language
    if (remembered) return remembered
  } catch (e) { /* storage refused */ }
  try {
    var stored = JSON.parse(storage.authResponse)
    var lang = stored && stored.data && stored.data.cred &&
      stored.data.cred.user && stored.data.cred.user.language
    if (lang != undefined && lang != '') {
      return lang
    }
  } catch (e) { /* no stored session */ }
  return 'en'
}
