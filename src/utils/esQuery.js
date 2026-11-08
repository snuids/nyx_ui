/**
 * La requete Elasticsearch d'un ecran generique, hors du composant.
 *
 * `GenericTable.loadData` construisait tout cela dans le composant : l'URL, le choix de la plage
 * de temps selon le selecteur, les jetons `{{id}}`/`{{login}}` de la requete cachee, la
 * combinaison du filtre d'ecran et de la recherche libre, le tri, la pagination et l'export. Trois
 * cent lignes qui ne touchent ni au DOM ni a Vue, donc intestables autrement qu'en montant l'ecran
 * entier et en interceptant `axios`.
 *
 * Ici, ce sont des fonctions pures : on leur donne la configuration et l'etat, elles rendent la
 * requete. Elles se testent en millisecondes (environnement `node`, aucun composant monte) et
 * chaque branche — plage absente, agregation, tri par defaut, export — est couverte pour le meme
 * prix qu'une assertion.
 */

/** Selecteur de periode -> cles des getters du store (plage et pas d'agregation). */
const TIME_RANGE_KEYS = {
  week: ["week", "autoWeek"],
  month: ["month", "autoMonth"],
  year: ["year", "autoYear"],
  day: ["day", "autoDay"],
};

/**
 * La plage et le pas d'agregation que ce selecteur doit utiliser.
 *
 * `ranges` porte les getters du store (`classic`, `day`, `week`, `month`, `year` et leurs
 * `auto*`). Un selecteur inconnu retombe sur `classic`, comme le `default` du `switch` d'origine.
 */
export function resolveTimeRange(timeSelectorType, ranges = {}) {
  const [rangeKey, intervalKey] = TIME_RANGE_KEYS[timeSelectorType] || [
    "classic",
    "autoClassic",
  ];
  return { range: ranges[rangeKey], interval: ranges[intervalKey] };
}

/** URL de `generic_search`, avec `doc_type` seulement quand il est configure. */
export function genericSearchUrl({
  apiurl,
  index,
  token,
  download = false,
  exportformat,
  docType,
}) {
  let url =
    apiurl +
    "generic_search/" +
    index +
    "?token=" +
    token +
    "&download=" +
    (download ? 1 : 0) +
    "&output=" +
    exportformat;

  if (docType != undefined && docType !== "") {
    url += "&doc_type=" + docType;
  }

  return url;
}

/** Jetons de la requete cachee. Un compte sans `id`/`login` ne doit pas ecrire « undefined ». */
function substituteTokens(hiddenQuery, user) {
  return String(hiddenQuery)
    .replace(/{{id}}/g, user && user.id != null ? String(user.id) : "")
    .replace(/{{login}}/g, user && user.login != null ? String(user.login) : "");
}

/**
 * La requete envoyee a `generic_search`.
 *
 * Rend `{ query, queryText }` : `query` est le corps, `queryText` la chaine de recherche retenue
 * (le composant l'affiche et la reinjecte dans la barre).
 */
export function buildSearchQuery({
  config = {},
  pagesize = 100,
  download = false,
  currentPage = 1,
  timeRange = null,
  interval = null,
  queryField = "",
  queryfilter = "",
  sort = {},
  user = {},
} = {}) {
  const payload = config.config || {};

  const query = {
    size: download ? 10000 : pagesize,
    query: { bool: { must: [{ match_all: {} }] } },
  };

  // La plage de temps ne s'applique que si l'ecran declare un champ de date ; sans plage dans le
  // store, on retombe sur les dernieres 24 h plutot que de tout ramener.
  if (payload.timefield != null && payload.timefield !== "") {
    if (timeRange != null) {
      query.query.bool.must.push({
        range: {
          [payload.timefield]: {
            gte: timeRange[0].getTime(),
            lte: timeRange[1].getTime(),
            format: "epoch_millis",
          },
        },
      });

      if (config.graphicChecked) {
        query.aggs = {
          2: {
            date_histogram: {
              field: payload.timefield,
              interval: interval,
              time_zone: "Europe/Berlin",
              min_doc_count: 1,
            },
          },
        };
      }
    } else {
      query.query.bool.must.push({
        range: {
          "@timestamp": { gte: "now-1d", lte: "now", format: "epoch_millis" },
        },
      });
    }
  }

  // Recherche libre, puis requete cachee de la configuration, puis filtre d'ecran : chaque couche
  // est groupee avant d'etre combinee en `AND`.
  let queryText = "";
  if (config.queryBarChecked && queryField !== "") {
    queryText = queryField;
  }

  const hidden = payload.hiddenQuery != undefined && payload.hiddenQuery !== ""
    ? substituteTokens(payload.hiddenQuery, user)
    : "";

  if (hidden !== "") {
    queryText = queryText === "" ? hidden : "(" + hidden + ") AND (" + queryText + ")";
  }

  if (queryfilter !== "" && config.queryFilterChecked) {
    queryText = queryText === "" ? queryfilter : "(" + queryText + ") AND (" + queryfilter + ")";
  }

  if (queryText !== "") {
    query.query.bool.must.push({
      query_string: {
        query: queryText,
        analyze_wildcard: true,
        default_field: "*",
      },
    });
  }

  // Tri : celui de l'utilisateur l'emporte, sinon celui de la configuration.
  if (
    payload.orderField != undefined &&
    payload.orderField !== "" &&
    Object.keys(sort).length === 0
  ) {
    query.sort = [
      { [payload.orderField]: { order: payload.orderDirection ? "desc" : "asc" } },
    ];
  }

  if (Object.keys(sort).length !== 0) {
    query.sort = [sort];
  }

  if (payload.exportColumns != undefined && payload.exportColumns !== "") {
    query.extra = { exportColumns: payload.exportColumns };
  }

  if (query.extra === undefined) {
    query.extra = { currentpage: currentPage, pagesize };
  } else {
    query.extra.currentpage = currentPage;
    query.extra.pagesize = pagesize;
  }

  return { query, queryText };
}
