/**
 * The little things done to a URL before handing it to an iframe.
 *
 * An external application receives its context through the URL (token, API, language, theme).
 * Forgetting a parameter in an application's configuration produces no error: the application
 * opens, simply without the context — that is how a dark theme stays light with nothing
 * signalling it.
 */

/**
 * Appends a parameter to a URL, respecting what it already carries.
 *
 * The parameter goes before the fragment: `./cerebro/#!/overview?host=x` + `theme=dark` gives
 * `./cerebro/?theme=dark#!/overview?host=x`, and not `…?host=x&theme=dark` which would land in the
 * fragment and be read by nobody.
 */
export function appendQueryParam(url, name, value) {
  if (url == undefined || url === "") return url;

  const text = String(url);
  const hashAt = text.indexOf("#");
  const beforeHash = hashAt >= 0 ? text.slice(0, hashAt) : text;
  const fragment = hashAt >= 0 ? text.slice(hashAt) : "";

  // Already there? Nothing is touched: the configuration has the last word.
  const already = new RegExp("[?&]" + name + "=").test(beforeHash);
  if (already) return text;

  const separator = beforeHash.indexOf("?") >= 0 ? "&" : "?";
  return beforeHash + separator + name + "=" + value + fragment;
}
