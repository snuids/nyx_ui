/**
 * The Vue filters registered by `main.js`.
 *
 * They used to be five `Vue.filter()` calls inlined at the bottom of the entry point, which made
 * them unreachable from a test: the entry point mounts the application, so any spec importing it
 * pays for the whole router, store and Element UI. They are plain functions over a value, so they
 * live here and `main.js` only registers them.
 */

import moment from 'moment'

/**
 * Any value above this is already a date in milliseconds; below it, an epoch in seconds.
 * The limit is 1970-04-26 in milliseconds, which is deliberately early: a "reasonable" limit
 * (mid-2001, 1e12) would read a 1971 timestamp as seconds and display 1970.
 */
export const EPOCH_MS_THRESHOLD = 10000000000

const BYTE_UNITS = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

/** `2026-11-02T09:05:00Z` (or anything moment understands) as `02/11/2026 10:05`. */
export function formatDate(value) {
  if (value) {
    return moment(String(value)).format('DD/MM/YYYY HH:mm')
  }
  return undefined
}

/**
 * A timestamp in seconds **or** milliseconds, as `DD/MM/YYYY HH:mm`.
 *
 * Elasticsearch serves epoch milliseconds while several legacy documents carry seconds; the
 * threshold is what makes both readable, and it is the reason a wrong figure here is invisible
 * on screen (the date is plausible, one unit off).
 */
export function formatTS(value) {
  if (value) {
    if (value < EPOCH_MS_THRESHOLD) value *= 1000
    return moment(value).format('DD/MM/YYYY HH:mm')
  }
  return undefined
}

/** Same as `formatTS`, in local time and without the year: `02/11 09:05:00`. */
export function formatTS2(value) {
  if (value) {
    if (value < EPOCH_MS_THRESHOLD) value *= 1000
    return moment.utc(value).local().format('DD/MM HH:mm:ss')
  }
  return undefined
}

export function capitalize(value) {
  if (!value) return ''
  value = value.toString()
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Human-readable size, copied from `pretty-bytes`: `900 bytes`, `2 KB`, `1 GB`.
 * It throws on a non-number on purpose — a `NaN` rendered as "NaN GB" in a table is worse.
 */
export function prettyBytes(num) {
  if (typeof num !== 'number' || isNaN(num)) {
    throw new TypeError('Expected a number')
  }

  var exponent
  var unit
  var neg = num < 0
  var units = BYTE_UNITS

  if (neg) {
    num = -num
  }

  if (num < 1) {
    return (neg ? '-' : '') + num + ' bytes'
  }

  exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1)
  num = (num / Math.pow(1000, exponent)).toFixed(0) * 1
  unit = units[exponent]

  return (neg ? '-' : '') + num + ' ' + unit
}

/** The name => function map `main.js` hands to `Vue.filter()`. */
export const filters = {
  formatDate,
  formatTS,
  formatTS2,
  capitalize,
  prettyBytes,
}
