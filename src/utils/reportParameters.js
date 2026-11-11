/**
 * The values offered for a report's parameters.
 *
 * The two report screens (`ReportGenerator` and `ReportPeriodicEditor`) carried the same
 * `getESValues` method, copied identically: it builds the aggregation query that lists a field's
 * distinct values, runs it, and fills the parameter's dropdown. A hundred and ten lines each, in
 * components at 0 % coverage, for code that touches neither the DOM nor Vue — except the `axios`
 * call, which stays in the components.
 */

/**
 * The aggregation query for a field's distinct values.
 *
 * `par` is the parameter definition: `escomboindex` / `escombokey`, and depending on the case a
 * time field (`usetimestamp`, `timestampfield`) and a boolean field (`useboolean`,
 * `booleanfield`). `interval` (a chosen period) and `fixdate` (a fixed date) bound the search; the
 * fixed date wins when both are requested.
 *
 * The end of day is pushed to 23:59:59.999: without that, a report of the same day would miss
 * everything that happened after midnight.
 */
export function buildParameterValuesQuery({
  par,
  interval = false,
  fixdate = false,
  intervalValue = null,
  fixdateValue = null,
} = {}) {
  const query = {
    size: 0,
    aggs: {
      values_uniques: {
        terms: {
          field: par.escombokey,
          size: 10000,
        },
      },
    },
  };

  if (par.usetimestamp && interval && intervalValue) {
    query.query = {
      bool: {
        must: [
          {
            range: {
              [par.timestampfield]: {
                gte: intervalValue.start.toISOString(),
                lte: new Date(intervalValue.end.setHours(23, 59, 59, 999)).toISOString(),
              },
            },
          },
        ],
      },
    };
  }

  if (par.usetimestamp && fixdate && fixdateValue) {
    query.query = {
      bool: {
        must: [
          {
            range: {
              [par.timestampfield]: {
                gte: fixdateValue.toISOString(),
                lte: new Date(fixdateValue.setHours(23, 59, 59, 999)).toISOString(),
              },
            },
          },
        ],
      },
    };
  }

  if (par.useboolean) {
    if (par.usetimestamp) {
      // The time clause already occupies `must[0]`: the boolean completes it.
      if (query.query && query.query.bool) {
        query.query.bool.must[1] = { term: { [par.booleanfield]: true } };
      }
    } else {
      query.query = {
        bool: {
          must: [{ term: { [par.booleanfield]: true } }],
        },
      };
    }
  }

  return query;
}

/** The generic search URL for an index, the same as the tables'. */
export function parameterValuesUrl({ apiurl = "", token, index }) {
  return apiurl + "generic_search/" + index + "?token=" + token;
}

/**
 * The distinct values returned by Elasticsearch, sorted.
 *
 * A response without an aggregation returns an empty list rather than an exception: an empty
 * index or a missing field must not keep the form from opening.
 */
export function valuesFromBuckets(responseData) {
  const buckets =
    responseData &&
    responseData.aggs &&
    responseData.aggs.values_uniques &&
    responseData.aggs.values_uniques.buckets;

  if (!buckets) return [];

  return buckets.map((bucket) => bucket.key).sort();
}

/** The parameters the screen displays: a `hidden` parameter is not a question to ask. */
export function visibleParameters(parameters) {
  return (parameters || []).filter((parameter) => !parameter.hidden);
}

/**
 * The bounds of a period shortcut (`Aujourd'hui`, `7 derniers jours`, ...).
 *
 * `today` starts at midnight and runs to the next midnight; the others go back N days from now.
 * `now` is a parameter so that the tests have no clock to simulate.
 */
export function rangeShortcut(shortcut, now = new Date()) {
  if (shortcut === "today") {
    const start = new Date(now.getTime());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 1);

    return [start, end];
  }

  const days = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 }[shortcut] || 0;
  return [new Date(now.getTime() - 3600 * 1000 * 24 * days), new Date(now.getTime())];
}
