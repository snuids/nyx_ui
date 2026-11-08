/**
 * La lecture d'un mapping Elasticsearch dans l'editeur de table (`ESTableEditor`).
 *
 * L'editeur dechiffre le mapping renvoye par `esmapping/` : il aplatit les proprietes imbriquees en
 * chemins pointes (`client.address.city`), classe les champs `date` et `geo_point`, ajoute les deux
 * champs systeme, propose des candidats latitude/longitude quand l'index n'a pas de `geo_point`, et
 * convertit la liste des colonnes d'export dans les deux sens (`client->Client`).
 *
 * Tout cela vivait dans le composant, en recursion sur `this` : aucun test ne l'atteignait sans
 * monter l'editeur et simuler un mapping complet. Ce sont des fonctions ici : elles prennent un
 * mapping, elles rendent des champs.
 */

/** Les deux champs que tout index expose, et que l'editeur propose comme les autres. */
export const SYSTEM_FIELDS = {
  _id: { field: "_id", type: "_id", title: "_id" },
  _index: { field: "_index", type: "_index", title: "_index" },
};

/**
 * Les deux entrees ajoutees au selecteur de temps quand l'index a au moins un champ `date` : une
 * pour revenir en arriere, une pour renoncer au filtre de temps.
 */
export const TIME_SELECTOR_PLACEHOLDERS = {
  _____________________: { field: "_____________________" },
  none: { field: "I don't want to use the Time Filter" },
};

/** Ce que le formulaire envoie quand la personne renonce au filtre de temps. */
export const NO_TIME_FILTER = "I don't want to use the Time Filter";

/**
 * Les types qui peuvent porter une latitude ou une longitude.
 *
 * `keyword` y figure : une coordonnee stockee en texte reste exploitable pour la carte.
 */
export const LAT_LON_TYPES = [
  "long",
  "integer",
  "short",
  "byte",
  "double",
  "float",
  "half_float",
  "scaled_float",
  "unsigned_long",
  "keyword",
];

/** Aplatit les proprietes d'un mapping en champs pointes, en notant les dates et les geo_points. */
function walkProperties(path, struct, out) {
  for (const name in struct.properties || {}) {
    const child = struct.properties[name];

    if (child.properties != null) {
      walkProperties(path + name + ".", child, out);
      continue;
    }

    const field = path + name;
    out.allFields[field] = { field, type: child.type, title: field };

    if (child.type === "date") out.timeFields[field] = out.allFields[field];
    if (child.type === "geo_point") out.geoFields[field] = out.allFields[field];
  }
}

/**
 * Les champs d'un mapping `esmapping/`.
 *
 * La reponse a la forme `{ index: { obj: { mappings: {...} } } }`. Les mappings ES 6 portent un type
 * intermediaire (`mappings: { doc: { properties } }`), les recents non (`mappings: { properties }`) :
 * les deux sont acceptes, sinon un index ancien n'afficherait aucun champ.
 *
 * Rend `{ allFields, timeFields, geoFields, noTimeField }`.
 */
export function flattenMapping(esMapping) {
  const out = {
    allFields: JSON.parse(JSON.stringify(SYSTEM_FIELDS)),
    timeFields: {},
    geoFields: {},
  };

  for (const index in esMapping || {}) {
    const entry = esMapping[index] && esMapping[index].obj;
    if (entry == null || entry.mappings == null) continue;

    if (entry.mappings.properties != null) {
      walkProperties("", entry.mappings, out);
    } else {
      for (const type in entry.mappings) {
        walkProperties("", entry.mappings[type], out);
      }
    }
  }

  out.noTimeField = Object.keys(out.timeFields).length === 0;
  return out;
}

/**
 * Le selecteur de temps, avec ses deux entrees de sortie.
 *
 * Elles ne sont ajoutees que si l'index a un champ de date : sinon le selecteur ne contient que
 * « je ne veux pas de filtre de temps », ce qui est deja le cas par defaut.
 */
export function withTimeSelectors(timeFields) {
  const out = { ...(timeFields || {}) };
  if (Object.keys(out).length > 0) Object.assign(out, TIME_SELECTOR_PLACEHOLDERS);
  return out;
}

/** Les champs sous la forme `{ nom: { field: nom } }` attendue par les selects. */
export function allFieldsAsList(allFields) {
  return Object.assign({}, ...Object.keys(allFields || {}).map((name) => ({ [name]: { field: name } })));
}

/**
 * Les candidats latitude / longitude, quand l'index n'a pas de `geo_point`.
 *
 * On propose les champs de type numerique ou `keyword`, par ordre alphabetique. Si le mapping n'en
 * declare aucun du bon type, on rend tous les champs : une liste vide serait pire qu'une liste
 * imparfaite, la personne peut encore choisir.
 */
export function latLonCandidates(allFields) {
  const fields = allFields || {};
  let names = Object.keys(fields).filter((name) => LAT_LON_TYPES.indexOf(fields[name].type) >= 0);
  if (names.length === 0) names = Object.keys(fields);
  return names.sort().map((field) => ({ field }));
}

/** La liste des colonnes d'export (`[{field, title}]`) telle que la configuration la stocke. */
export function exportColumnsFromTableFields(tableFields) {
  return (tableFields || []).map((entry) => entry.field + "->" + entry.title).join();
}

/**
 * L'inverse : `client->Client,date->Date` devient la liste des colonnes.
 *
 * Un segment sans fleche garde son nom comme titre (`client` -> `{field: 'client', title: client}`,
 * le titre valant `undefined` dans la configuration d'origine, ce que le formulaire affiche vide).
 */
export function tableFieldsFromExportColumns(exportColumns) {
  return String(exportColumns || "")
    .split(",")
    .filter((segment) => segment !== "")
    .map((segment) => {
      const parts = segment.split("->");
      return { field: parts[0], title: parts[1] };
    });
}

/**
 * Ce que vaut le champ de temps choisi, et ce qu'il faut effacer avec.
 *
 * Le selecteur melange les vrais champs et deux entrees de service : le retour en arriere
 * (`_____...`) qui ne doit rien changer, et « pas de filtre de temps » qui doit aussi decocher le
 * graphique et le selecteur de periode.
 */
export function timefieldSelection(value) {
  if (value === "_____________________") {
    return { timefield: null, clearGraphic: false, backToNone: true };
  }

  if (!value || value === NO_TIME_FILTER) {
    return { timefield: null, clearGraphic: true, backToNone: false };
  }

  return { timefield: value, clearGraphic: false, backToNone: false };
}

/** Les noms de champs d'une liste `[{field, ...}]` : ce que les listes de glisser-deposer suivent. */
export function fieldsOf(list) {
  return (list || []).map((entry) => entry.field);
}

/**
 * La liste des colonnes reconstruite a partir d'une selection de champs.
 *
 * Les deux selects de l'editeur (affichage et export) font la meme chose : garder l'entree deja
 * configuree quand le champ etait deja la — elle porte le titre et le lien que la personne a
 * saisis — et prendre la definition du mapping pour un champ nouvellement coche.
 */
export function selectionToColumns(selected, previous, allFields) {
  const known = {};
  for (const entry of previous || []) {
    known[entry.field] = entry;
  }

  const columns = [];
  for (const name of selected || []) {
    columns.push(
      known[name] ? JSON.parse(JSON.stringify(known[name])) : (allFields || {})[name]
    );
  }

  return columns;
}
