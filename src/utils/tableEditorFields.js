/**
 * Reading an Elasticsearch mapping in the table editor (`ESTableEditor`).
 *
 * The editor decodes the mapping returned by `esmapping/`: it flattens the nested properties into
 * dotted paths (`client.address.city`), classifies `date` and `geo_point` fields, adds the two
 * system fields, offers latitude/longitude candidates when the index has no `geo_point`, and
 * converts the export column list both ways (`client->Client`).
 *
 * All of that lived in the component, recursing on `this`: no test reached it without mounting
 * the editor and simulating a complete mapping. They are functions here: they take a mapping,
 * they return fields.
 */

/** The two fields every index exposes, and which the editor offers like the others. */
export const SYSTEM_FIELDS = {
  _id: { field: "_id", type: "_id", title: "_id" },
  _index: { field: "_index", type: "_index", title: "_index" },
};

/**
 * The two entries added to the time selector when the index has at least one `date` field: one to
 * go back, one to give up the time filter.
 */
export const TIME_SELECTOR_PLACEHOLDERS = {
  _____________________: { field: "_____________________" },
  none: { field: "I don't want to use the Time Filter" },
};

/** What the form sends when the person gives up the time filter. */
export const NO_TIME_FILTER = "I don't want to use the Time Filter";

/**
 * The types that can carry a latitude or a longitude.
 *
 * `keyword` is in there: a coordinate stored as text is still usable for the map.
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

/** Flattens a mapping's properties into dotted fields, noting dates and geo_points. */
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
 * The fields of an `esmapping/` mapping.
 *
 * The response has the shape `{ index: { obj: { mappings: {...} } } }`. ES 6 mappings carry an
 * intermediate type (`mappings: { doc: { properties } }`), recent ones do not
 * (`mappings: { properties }`): both are accepted, otherwise an old index would show no field.
 *
 * Returns `{ allFields, timeFields, geoFields, noTimeField }`.
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
 * The time selector, with its two exit entries.
 *
 * They are added only when the index has a date field: otherwise the selector contains only
 * "I don't want to use the Time Filter", which is already the default.
 */
export function withTimeSelectors(timeFields) {
  const out = { ...(timeFields || {}) };
  if (Object.keys(out).length > 0) Object.assign(out, TIME_SELECTOR_PLACEHOLDERS);
  return out;
}

/** The fields in the `{ name: { field: name } }` shape the selects expect. */
export function allFieldsAsList(allFields) {
  return Object.assign({}, ...Object.keys(allFields || {}).map((name) => ({ [name]: { field: name } })));
}

/**
 * The latitude / longitude candidates, when the index has no `geo_point`.
 *
 * The fields of numeric or `keyword` type are offered, in alphabetical order. If the mapping
 * declares none of the right type, every field is returned: an empty list would be worse than an
 * imperfect one, the person can still choose.
 */
export function latLonCandidates(allFields) {
  const fields = allFields || {};
  let names = Object.keys(fields).filter((name) => LAT_LON_TYPES.indexOf(fields[name].type) >= 0);
  if (names.length === 0) names = Object.keys(fields);
  return names.sort().map((field) => ({ field }));
}

/** The export column list (`[{field, title}]`) as the configuration stores it. */
export function exportColumnsFromTableFields(tableFields) {
  return (tableFields || []).map((entry) => entry.field + "->" + entry.title).join();
}

/**
 * The reverse: `client->Client,date->Date` becomes the column list.
 *
 * A segment without an arrow keeps its name as title (`client` -> `{field: 'client', title: client}`,
 * the title being `undefined` in the original configuration, which the form displays empty).
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
 * What the chosen time field resolves to, and what must be cleared with it.
 *
 * The selector mixes real fields and two service entries: the back one (`_____...`) which must
 * change nothing, and "no time filter" which must also untick the chart and the period selector.
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

/** Field names of a `[{field, ...}]` list: what the drag-and-drop lists follow. */
export function fieldsOf(list) {
  return (list || []).map((entry) => entry.field);
}

/**
 * The column list rebuilt from a field selection.
 *
 * The editor's two selects (display and export) do the same thing: keep the entry already
 * configured when the field was already there — it carries the title and the link the person
 * entered — and take the mapping's definition for a newly ticked field.
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
