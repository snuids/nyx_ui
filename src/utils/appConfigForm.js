/**
 * Ce que `ConfigDetails` fait a une configuration avant de la montrer, et apres l'avoir editee.
 *
 * Le composant fait 1 476 lignes, dont 587 instructions : sa mise en page d'un cote, et de l'autre
 * une poignee de transformations qui ne touchent ni au DOM ni a Vue — normaliser une configuration
 * pour le formulaire, la relire en YAML pour detecter une modification, decider ce qui part a
 * l'enregistrement, proposer les categories et sous-categories du menu, nommer un controleur. Elles
 * etaient a 0 % de couverture, faute de pouvoir les atteindre sans monter l'ecran.
 */

import YAML from "js-yaml";

/**
 * La valeur de rafraichissement Kibana, telle que le formulaire l'affiche.
 *
 * Le champ est stocke sous la forme `refreshInterval:(pause:!f,value:30000)` et le formulaire
 * n'attend que `30000` : on lui retire l'enveloppe, sinon la personne voit du JSON dans un champ
 * de nombre.
 */
export function unmangleRefreshInterval(value) {
  if (value == null) return value;
  return String(value)
    .replace("refreshInterval:(pause:!f,value:", "")
    .replace(")", "");
}

/**
 * La copie de la configuration que le formulaire edite.
 *
 * Une copie profonde : le formulaire ecrit dans `curConfig`, et l'original (`currentConfig`) sert de
 * reference pour savoir si quelque chose a change. Les deux listes que le formulaire remplit
 * (`queryfilters`, `headercolumns`) ne doivent pas exister a moitie non plus.
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

/** La configuration en YAML : c'est le texte que compare `resolveSavedSource`, et l'apercu. */
export function configYaml(config) {
  return YAML.safeDump(config, 10);
}

/**
 * Ce qui part a l'enregistrement.
 *
 * Si le YAML edite differe de celui d'origine — la personne a touche l'apercu — on enregistre le
 * YAML (c'est le chemin qui permet d'ecrire ce que le formulaire ne montre pas), sinon l'objet du
 * formulaire. Une creation (`isAdd`) prend toujours le formulaire : il n'y a rien a comparer.
 */
export function resolveSavedSource({ newText, orgText, curConfig, isAdd = false }) {
  if (newText != orgText && !isAdd) return YAML.safeLoad(newText);
  return curConfig;
}

/**
 * Les categories proposees par l'autocompletion, filtrees par ce qui est tape.
 *
 * `menus` est `store.getters.filteredmenus` : `[{category, submenus: [{loc_title}]}]`.
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
 * Les sous-categories de la categorie choisie, filtrees par ce qui est tape.
 *
 * Sans categorie (champ vide), il n'y a rien a proposer : l'ecran renvoie une liste vide plutot que
 * les sous-menus de toutes les categories.
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
 * Le texte d'aide du controleur choisi.
 *
 * La traduction l'emporte quand elle existe ; sinon la description du catalogue, en anglais. Un
 * controleur absent du catalogue est forcement un composant maison : l'aide le dit au lieu de
 * laisser un cadre vide.
 */
export function controllerLabel(page, hasTranslation, translate) {
  if (!page) return null;
  const key = "configdetails.ctrl." + page.name;
  if (typeof hasTranslation === "function" && hasTranslation(key)) return translate(key);
  return page.description;
}
