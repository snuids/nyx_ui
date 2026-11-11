/**
 * The Elasticsearch query of a generic screen, outside the component.
 *
 * `GenericTable.loadData` built all of this inside the component: the URL, the choice of time
 * range according to the selector, the `{{id}}`/`{{login}}` tokens of the hidden query, the
 * combination of the screen filter and the free-text search, the sort, the pagination and the
 * export. Three hundred lines that touch neither the DOM nor Vue, hence untestable other than by
 * mounting the whole screen and intercepting `axios`.
 *
 * Here they are pure functions: they are given the configuration and the state, they return the
 * query. They test in milliseconds (`node` environment, no component mounted) and every branch —
 * missing range, aggregation, default sort, export — is covered for the price of an assertion.
 */

/** Period selector -> keys of the store getters (range, and aggregation step). */
const TIME_RANGE_KEYS = {
  week: ["week", "autoWeek"],
  month: ["month", "autoMonth"],
  year: ["year", "autoYear"],
  day: ["day", "autoDay"],
};

/**
 * The range and aggregation step this selector must use.
 *
 * `ranges` carries the store getters (`classic`, `day`, `week`, `month`, `year` and their
 * `auto*`). An unknown selector falls back to `classic`, like the original `switch`'s `default`.
 */
export function resolveTimeRange(timeSelectorType, ranges = {}) {
  const [rangeKey, intervalKey] = TIME_RANGE_KEYS[timeSelectorType] || [
    "classic",
    "autoClassic",
  ];
  return { range: ranges[rangeKey], interval: ranges[intervalKey] };
}

/** URL of `generic_search`, with `doc_type` only when it is configured. */
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

/** Tokens of the hidden query. An account without `id`/`login` must not write "undefined". */
function substituteTokens(hiddenQuery, user) {
  return String(hiddenQuery)
    .replace(/{{id}}/g, user && user.id != null ? String(user.id) : "")
    .replace(/{{login}}/g, user && user.login != null ? String(user.login) : "");
}

/**
 * The query sent to `generic_search`.
 *
 * Returns `{ query, queryText }`: `query` is the body, `queryText` the search string kept (the
 * component displays it and feeds it back into the bar).
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

  // The time range only applies if the screen declares a date field; without a range in the
  // store, the last 24 h are used rather than pulling everything back.
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

  // Free-text search, then the configuration's hidden query, then the screen filter: each layer
  // is grouped before being combined with `AND`.
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

  // Sort: the user's wins, otherwise the configuration's.
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
