/**
 * Catalogue of the components that can be used as an `internal` application.
 *
 * An internal app is rendered by `GenericComponent` as `<component :is="config.controller">`, so
 * any single-file component under `src/components/` technically works — but only the ones that
 * take (at most) a `config` prop can be a page of their own. The list below is the curated set of
 * those pages, with a description; the rest of the folder is listed separately so a component
 * added tomorrow is still selectable without touching this file.
 *
 * Descriptions are translated through `configdetails.ctrl.<Name>`; the English text here is the
 * fallback when a translation is missing.
 */

// Curated pages: they render from `config` alone (or from nothing).
export const CONTROLLER_PAGES = [
  {
    name: "Activity",
    description: "API audit trail: calls, errors, latency and the last requests of the instance.",
  },
  {
    name: "Config",
    description: "Applications, menus and privileges: where the screens of the platform are built.",
  },
  {
    name: "User",
    description: "User administration: accounts, privileges, data filters, passwords.",
  },
  {
    name: "ProcessList",
    description: "Running modules and containers with their reported version and life signs.",
  },
  {
    name: "ReportList",
    description: "Report definitions available to the user, with the actions to generate them.",
  },
  {
    name: "ReportTask",
    description: "History of the generated reports, with the downloads.",
  },
  {
    name: "ReportPeriodic",
    description: "Scheduled reports: cron definition, parameters and mailing list.",
  },
  {
    name: "SendMessage",
    description: "Free-form message published on a broker queue or topic (integration testing).",
  },
  {
    name: "QueryFilter",
    description: "Dropdown filters driven by the values found in an index.",
  },
  {
    name: "NYXInfo",
    description: "Instance information: version, Elasticsearch and module status.",
  },
  {
    name: "LandingPage",
    description: "Empty home page used as the first screen after login.",
  },
];

// Components that exist in the folder but can never be a page: they expect props that
// GenericComponent does not pass, or they are editor dialogs / pure widgets.
export const NOT_A_PAGE = new Set([
  "Activity",
  "Apps",
  "BarChart",
  "ChangePassword",
  "Config",
  "ConfigDetails",
  "External",
  "FileSystem",
  "Form",
  "FreeText",
  "FreeTextDetails",
  "GenericComponent",
  "GenericTable",
  "GenericTableDetails",
  "Grafana",
  "IconPicker",
  "Kibana",
  "LandingPage",
  "Loading",
  "LogViewer",
  "Logout",
  "Map",
  "NYXInfo",
  "PGGenericTable",
  "PGGenericTableDetails",
  "PasswordRulesEditor",
  "ProcessList",
  "QueryBar",
  "QueryFilter",
  "ReportEditor",
  "ReportGenerator",
  "ReportList",
  "ReportPeriodic",
  "ReportPeriodicEditor",
  "ReportTask",
  "SendMessage",
  "Upload",
  "User",
  "UserDetails",
  "UserResetPassword",
  "Vega",
]);

/**
 * Names of the single-file components of `src/components/` (top level only — the editors live in
 * sub-folders and are never pages).
 *
 * `require.context` only exists inside webpack, so the two functions that decide *which* of those
 * names can be a page take the list as an argument and are testable; this one is the thin adapter.
 */
export function listComponents() {
  const context = require.context("./components/", false, /\.vue$/);
  return componentNames(context.keys());
}

/** The `./X.vue` keys of `require.context` as bare, sorted component names. */
export function componentNames(keys) {
  return keys
    .map(key => key.replace(/^\.\//, "").replace(/\.vue$/, ""))
    .sort((a, b) => a.localeCompare(b));
}

/** Components that are not part of the curated page list and cannot be a page. */
export function componentsNotInPages(names) {
  const pages = new Set(CONTROLLER_PAGES.map(page => page.name));
  return names.filter(name => !pages.has(name) && !NOT_A_PAGE.has(name));
}

export function otherComponents() {
  return componentsNotInPages(listComponents());
}

/** Curated page entry for a component name, if it is one. */
export function describeController(name) {
  if (!name) return null;
  return CONTROLLER_PAGES.find(page => page.name === name) || null;
}
