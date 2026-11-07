// Where a document sits on the map.
//
// Two shapes exist in the platform, and both are configured from the application editor:
//
//  * `maplatfield` / `maplonfield` — two numeric (or text) fields, for an index that keeps latitude and
//    longitude apart. When both are set they win over `mapfield`;
//  * `mapfield` — a `geo_point`, whose value is either an object `{ lat, lon }` or a string `"lat,lon"`.
//
// A document missing a coordinate produces no marker: a point at 0,0 in the Gulf of Guinea is worse than
// no point at all, and it is what `L.latLng(undefined, …)` used to draw.
export function resolveLatLng(record, config) {
  const settings = config || {};
  const latField = settings.maplatfield;
  const lonField = settings.maplonfield;

  if (latField && lonField) {
    const lat = get(record, latField);
    const lon = get(record, lonField);
    if (!filled(lat) || !filled(lon)) return null;
    return [lat, lon];
  }

  if (!settings.mapfield) return null;
  const value = get(record, settings.mapfield);
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    if (value.indexOf(',') < 0) return null;
    const parts = value.split(',');
    return filled(parts[0]) && filled(parts[1]) ? [parts[0], parts[1]] : null;
  }
  if (typeof value === 'object') {
    return filled(value.lat) && filled(value.lon) ? [value.lat, value.lon] : null;
  }
  return null;
}

function filled(value) {
  return value !== undefined && value !== null && value !== '';
}

// `a.b.c` — the field names come from the index mapping, so they can contain dots.
function get(record, path) {
  if (!record || !path) return undefined;
  if (Object.prototype.hasOwnProperty.call(record, path)) return record[path];
  return path.split('.').reduce((node, key) => {
    if (node === null || node === undefined) return undefined;
    return node[key];
  }, record);
}
