/**
 * Theme preference: `light`, `dark`, or `auto` (dark in the evening and at night).
 *
 * Element Plus ships its dark variables under `html.dark`, and the console's own chrome (header,
 * aside, cards, tables) is repainted by `styles/dark.css` keyed on the same class — so a single
 * class on `<html>` switches both halves. The preference is stored per account on the user
 * document (`/cred/preferences`) and mirrored in `localStorage` so a reload paints the right theme
 * before the session is restored, without a white flash.
 */

export const THEMES = ["light", "dark", "auto"];
export const THEME_STORAGE_KEY = "nyx_theme";

/** An `auto` theme is dark from this hour (inclusive) … */
export const AUTO_DARK_FROM_HOUR = 20;
/** … until this hour (exclusive). */
export const AUTO_DARK_UNTIL_HOUR = 7;

/**
 * The theme actually applied: `auto` resolves against the local clock.
 * An unknown value falls back to `auto`, which is what a fresh account gets.
 */
export function resolveTheme(preference, now) {
  if (preference === "dark" || preference === "light") return preference;
  const hour = (now || new Date()).getHours();
  return hour >= AUTO_DARK_FROM_HOUR || hour < AUTO_DARK_UNTIL_HOUR ? "dark" : "light";
}

function storageOf(storage) {
  if (storage) return storage;
  try {
    return window.localStorage;
  } catch (e) {
    return null; // storage refused (private mode, policy): the session keeps its default
  }
}

/** The preference kept from a previous visit, or null. */
export function readStoredTheme(storage) {
  const store = storageOf(storage);
  if (!store) return null;
  let value = null;
  try {
    value = store.getItem(THEME_STORAGE_KEY);
  } catch (e) {
    return null; // a storage that refuses the read must not break the boot
  }
  return THEMES.indexOf(value) >= 0 ? value : null;
}

export function storeTheme(preference, storage) {
  const store = storageOf(storage);
  if (!store) return;
  try {
    store.setItem(THEME_STORAGE_KEY, preference);
  } catch (e) {
    /* storage refused: the server copy remains */
  }
}

/**
 * Paint the theme. Returns the resolved theme (`light`/`dark`).
 * Sets `data-theme` for our own rules, the `dark` class for Element Plus, and `color-scheme` for
 * the native widgets (scrollbars, form controls, the map's popups).
 */
export function applyTheme(preference, now) {
  const resolved = resolveTheme(preference, now);
  if (typeof document === "undefined") return resolved;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-preference", preference || "auto");
  root.style.colorScheme = resolved;
  return resolved;
}

/**
 * Re-arm the `auto` schedules: called once at boot. A page left open for hours has to darken when
 * the evening comes, so the clock is re-read every ten minutes and when the tab comes back.
 */
export function watchAutoTheme(getPreference, onChange) {
  if (typeof window === "undefined") return () => {};
  const refresh = () => {
    const preference = getPreference() || "auto";
    if (preference !== "auto") return;
    const resolved = applyTheme(preference);
    if (onChange) onChange(resolved);
  };
  const timer = window.setInterval(refresh, 10 * 60 * 1000);
  window.addEventListener("focus", refresh);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", refresh);
  };
}
