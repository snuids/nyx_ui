# Nyx User Interface

![badge](https://img.shields.io/badge/made%20with-vuejs-blue.svg?style=flat-square)
![badge](https://img.shields.io/github/languages/code-size/snuids/nyx_ui)
![badge](https://img.shields.io/github/last-commit/snuids/nyx_ui)
![coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/snuids/nyx_ui/badges/coverage.json&style=flat-square)
![CI](https://img.shields.io/github/actions/workflow/status/snuids/nyx_ui/ci-tests.yml?style=flat-square&label=tests)


## Introduction


The NYX platform is an easy to use application builder that integrates various technologies such as:

* Elastic Search / Kibana
* PostGreSQL
* Jupyter Notebooks
* Node Red
* Apache ActiveMQ
* Apache Camel


The NYX UI includes an online configuration tools that can create the following pages:

* A Kibana page
* A generic table page (PostGreSQL or ElasticSearch)
* An in house controller
* An Upload page
* A Form
* A Free Text page
* A Vega graph
* External URLs

### Main Config Table
![Config1](https://raw.githubusercontent.com/snuids/nyx_ui/master/medias/app_config1.png)

### An Application configuration panel

![Config2](https://raw.githubusercontent.com/snuids/nyx_ui/master/medias/app_config2.png)

### Kibana Panel:

A kibana panel is directly linked to a kibana dashboard. It is possible to change the time selector and query the Kibana panel editor.

![Kibana1](https://raw.githubusercontent.com/snuids/nyx_ui/master/medias/app_kibana1.png)


### Generic Table:

A generic table is a view on:

* An Elastic Search Collection
* A PostgreSQL table or Query

It can include:

* a discover graph
* a map
* a query
* download options

![Table1](https://raw.githubusercontent.com/snuids/nyx_ui/master/medias/app_table1.png)
![Table2](https://raw.githubusercontent.com/snuids/nyx_ui/master/medias/app_table2.png)

### Vega Panel:

A Vega panel uses the Vega framework in order to build interactive dashboard.

![Vega](https://raw.githubusercontent.com/snuids/nyx_ui/master/medias/app_vega1.png)



## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```
Lauching application

==> http://localhost:8080/?api=https://YOUR_REST_API_SERVER/api/v1/&user=admin&password=*******#/

Rest API swagger

=> Rest API swagger https://YOUR_REST_API_SERVER/api/doc/



### Compiles and minifies for production
```
npm run build
```

### Tests

```
npm test              # full suite (logic + screens)
npm run test:coverage # same, with the coverage report
```

Two environments coexist in the same suite: `node` for the logic modules and the store, `jsdom`
for the mounted screens (the test file declares it at the top:
`// @vitest-environment jsdom`). The Element Plus components, the memory router, i18n and the
globals of `src/main.js` are provided by `tests/helpers/mount-view.js`.

Coverage runs over all of `src` (javascript and `.vue`). The thresholds of `vitest.config.mjs` are
per glob: 97/94/96/97 on the logic javascript, 73 on `src/views`, lower on
`src/components`, and a global threshold at 35/40/30/36 — one point below the measurement (36,30 /
41,74 / 31,49 / 37,57), high enough that a lost test screen fails the CI.

Status on 11 November 2026: **736 tests**, **36,30 %** of the instructions of `src` (7 478). Per area:

| area | statements | branches | remark |
|---|---|---|---|
| `src` (root: `main`, `App`, i18n) | 62,5 % | 45,6 % | |
| `src/router` | 100 % | 91,7 % | |
| `src/store` | 98,9 % | 95,0 % | |
| `src/utils` | 99,6 % | 96,0 % | |
| `src/views` | 75,4 % | 75,3 % | Login 92,0 · Main 85,3 · OAuth 100 · Privacy 100 |
| `src/components` | 26,1 % | 31,4 % | the mounted screens pull the figure up, the editors stay poorly covered |

The untested components pull the global figure down: that is the honest measurement, not a
regression. Next targets by size and by risk: the application editors
(`appConfigEditor/ESTableEditor`, `ConfigDetails`), `ReportGenerator` / `ReportTask`,
`GenericTableDetails` (record editing), `NYXInfo`, `PGGenericTable`.

### Dependencies

`npm audit` reports 17 vulnerabilities (10 high, 7 moderate) on 9 November 2026, against 25 before
the day's batch of fixes. What ships to the browser and what never leaves the build
chain do not weigh the same:

| package | where it comes from | status |
|---|---|---|
| `postcss`, `serialize-javascript`, `minimatch`, `uuid` | build tooling | **fixed** — the `overrides` of `package.json` force them to the remedied version (8.5.23, 7.1.3, 11.0.1, 11.1.1). Production build and 608 tests verified |
| `webpack-dev-server`, `webpack-dev-middleware` | `@vue/cli-service` 5, `npm run serve` only | nothing in this version: vue-cli 5 requires `webpack-dev-server` 4, the advisories are fixed in 5.2. The served console is not affected |
| `@vue/cli-*`, `cross-spawn`, `execa`, `yorkie`, `glob`, `js-beautify` | same tooling | `npm audit` only offers a **downgrade** to vue-cli 3.12: no remedied version exists in the 5 line. Build and tests, never run in the browser |
| `vue-i18n` 9.14.5 (+ `@intlify/*`) | **the served bundle** | 9.14.5 is the last of the 9 series (tag `legacy9`), which is no longer maintained: GHSA-83rm-6c8r-g728 is only fixed from 11.4.14 |

The exposure of `vue-i18n` is nil in practice today: the messages are JSON files
of the repository, no translated string is built from user input, and `escapeParameter` is not
used. Moving to 11 removes the `legacy` mode: `$i18n.locale` becomes a ref, so every
read and every write — `this.$i18n.locale` in four screens, the `watch` of `App.vue`, the
tests that read the locale — must say `.value`. That is a migration to carry out for its own sake, not an
emergency fix.

### Extending the UI

To add a new specific controller:

=> put a new .vue file inside the folder components/external

To add a new specific table editor:

=> put a new .vue file inside the folder components/tableEditor

### Building the container

The build and runtime stages use Node.js 22 LTS. Vega-Lite 6.5 and newer require Node.js 22 or newer.

```
docker build .
```

### Version History

Current version: **v3.6.29** (11/Nov/2026) — the 3.29.x numbering shown here was
superseded by the 3.5.0 restart of the line; see `versions.md`.

* Fixed table header inputs (configuration filter/search) by restoring scoped header slots.

[Versions](versions.md)
