/**
 * Grafana follows the console's theme through its URL.
 *
 * Grafana reads `theme=light|dark` from the dashboard URL (works in `kiosk` embeds) — verified on the
 * 13.2.4 instance the platform runs: the same dashboard iframe goes from `rgb(251,251,251)` to
 * `rgb(17,18,23)`. The console embeds Grafana in an iframe, so without this the panel keeps its own
 * light theme inside a dark console.
 *
 * An application that sets its own `theme=` in its *Extra parameters* keeps it: the per-app choice is
 * an explicit decision, the console-wide one is a default.
 */

/** The Grafana theme name for a console theme. */
export function grafanaTheme(theme) {
  return theme === "dark" ? "dark" : "light";
}

/** True when the URL (or the app's extra parameters) already pins a theme. */
export function hasThemeParameter(url, extraParameters) {
  const haystack = (url || "") + "&" + (extraParameters || "");
  return /[?&]theme=/.test(haystack);
}

/**
 * Append `theme=` to a dashboard URL unless one is already set.
 * Returns the URL unchanged in that case, so the app's choice wins.
 */
export function withGrafanaTheme(url, theme, extraParameters) {
  if (!url) return url;
  if (hasThemeParameter(url, extraParameters)) return url;
  const separator = url.indexOf("?") >= 0 ? "&" : "?";
  return url + separator + "theme=" + grafanaTheme(theme);
}
