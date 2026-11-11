/**
 * What `ConfigDetails` does to a configuration before showing it, and after editing it.
 *
 * The component is 1 476 lines, 587 of them statements: its layout on one side, and on the other
 * a handful of transformations that touch neither the DOM nor Vue — normalising a configuration
 * for the form, reading it back as YAML to detect a change, deciding what goes to the save,
 * offering the menu's categories and subcategories, naming a controller. They had 0 % coverage,
 * for lack of a way to reach them without mounting the screen.
 */

import YAML from "js-yaml";

/**
 * The Kibana refresh value, as the form displays it.
 *
 * The field is stored as `refreshInterval:(pause:!f,value:30000)` and the form expects only
 * `30000`: the wrapper is stripped off, otherwise the person sees JSON in a number field.
 */
export function unmangleRefreshInterval(value) {
  if (value == null) return value;
  return String(value)
    .replace("refreshInterval:(pause:!f,value:", "")
    .replace(")", "");
}

/**
 * The copy of the configuration the form edits.
 *
 * A deep copy: the form writes into `curConfig`, and the original (`currentConfig`) serves as the
 * reference for knowing whether anything changed. Nor must the two lists the form fills
 * (`queryfilters`, `headercolumns`) be left half-created.
 */
export function normaliseConfigForForm(currentConfig) {
  const curConfig = JSON.parse(JSON.stringify(currentConfig));

  if (curConfig.config == undefined) curConfig.config = {};
  if (curConfig.config.queryfilters == undefined) curConfig.config.queryfilters = [];

  if (currentConfig.timeRefreshValue != null) {
    curConfig.timeRefreshValue = unmangleRefreshInterval(curConfig.timeRefreshValue);
  }

  return curConfig;
}

/** The configuration as YAML: it is the text `resolveSavedSource` compares, and the preview. */
export function configYaml(config) {
  return YAML.safeDump(config, 10);
}

/**
 * What goes to the save.
 *
 * If the edited YAML differs from the original one — the person touched the preview — the YAML is
 * saved (that is the path that writes what the form does not show), otherwise the form's object.
 * A creation (`isAdd`) always takes the form: there is nothing to compare.
 */
export function resolveSavedSource({ newText, orgText, curConfig, isAdd = false }) {
  if (newText != orgText && !isAdd) return YAML.safeLoad(newText);
  return curConfig;
}

/**
 * The categories offered by the autocomplete, filtered by what is typed.
 *
 * `menus` is `store.getters.filteredmenus`: `[{category, submenus: [{loc_title}]}]`.
 */
export function suggestCategories(menus = [], queryString = "") {
  const categories = [];
  for (const menu of menus) {
    categories.push({ value: menu.category });
  }

  if (!queryString) return categories;
  return categories.filter((entry) => String(entry.value).indexOf(queryString) >= 0);
}

/**
 * The subcategories of the chosen category, filtered by what is typed.
 *
 * Without a category (empty field) there is nothing to offer: the screen returns an empty list
 * rather than the submenus of every category.
 */
export function suggestSubcategories(menus = [], category, queryString = "") {
  if (category == "") return [];

  const subcategories = [];
  for (const menu of menus) {
    if (category == menu.category) {
      for (const submenu of menu.submenus || []) {
        subcategories.push({ value: submenu.loc_title });
      }
      break;
    }
  }

  if (!queryString) return subcategories;
  return subcategories.filter((entry) => String(entry.value).indexOf(queryString) >= 0);
}

/**
 * The help text of the chosen controller.
 *
 * The translation wins when it exists; otherwise the catalogue description, in English. A
 * controller missing from the catalogue is necessarily a home-made component: the help says so
 * instead of leaving an empty frame.
 */
export function controllerLabel(page, hasTranslation, translate) {
  if (!page) return null;
  const key = "configdetails.ctrl." + page.name;
  if (typeof hasTranslation === "function" && hasTranslation(key)) return translate(key);
  return page.description;
}
