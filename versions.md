# Version History

## V3.5.2 07/Nov/2026
* The map of the previous release came with a CI gate that failed: the coverage floor is **96 % of branches**, and a new file has to bring branch coverage with it, not just lines — `mapCoords` was at 77.8 % of branches. Two cases were missing (a field name that contains dots, and a geo value that is neither an object nor a string); the file is now at 97 % and the suite green. **7 tests, 207 total**
* `storeActions.spec.js` no longer bets on a millisecond: the "2h" threshold case used `3 × 1440` minutes, exactly the top of the band, and `new Date()` is read a moment after the start — the case passed on the pull request and failed on the merge ten seconds later. It now uses a value inside the band

## V3.5.1 07/Nov/2026
* **Maps can be built from two fields.** The ES Table editor's map used a single `geo_point` field; it now also offers a **latitude field** and a **longitude field**, chosen from the index's numeric (or keyword) fields, for indices that keep the two coordinates apart. When both are set they take precedence over the geo field, and the map query asks for exactly those fields
* The coordinate resolution moved to `src/utils/mapCoords.js` with its tests: two fields, a `geo_point` object, a `"lat,lon"` string, and the case that used to draw a marker at 0,0 in the Gulf of Guinea — a document missing one of the two values now produces no marker at all. **5 new tests, 205 total**
* The map switch is no longer disabled on an index without a `geo_point`, since two fields are enough

## V3.5.0 07/Nov/2026
* The console's versioning starts its own line: **3.5.0**, then the third digit only (3.5.1, 3.5.2, …) for every fix and feature. The Vue 2 console keeps its own tags on branch `v2`
* Fixes the header's month selector, which sat at the bottom of a white box taller than the header itself: the header centres its content with `line-height: 60px`, the field inherited it, and Element Plus's inner wrapper stretched to 58 px inside a 28 px control. The wrapper goes back to `inline-flex` with a normal line height — measured after the fix: control 28 px, text at 18 px from the top, centred with the 40 px round buttons

## V3.0.0 07/Nov/2026
* **The console is now Vue 3 + Element Plus.** Same screens, same data, same API: the port replaces the framework (Vue 2.7 → 3.5, Element UI 2 → Element Plus 2, vue-router 4, vuex 4, vue-i18n 9 with `legacy: true`), the libraries with no Vue 3 release (`vue-awesome`, `vue2-ace-editor`, `vue2-leaflet`, `vue-draggable`, `tiptap` 1) by local components, and the build tool stays `@vue/cli-service` 5
* The look of production is restored rather than re-invented: Element UI 2's 36 px components, 40 px menu entries and 54 px dialog band, its typography on `body` and its heading reset, the dialog and message-box box models — each measured against the old build before being written (`src/styles/element-legacy.css`, `src/views/Main.vue`)
* The Vue 2 console stays available: it is kept on the `v2` branch and served under `/nyxv2/`, so both interfaces can be compared on the same data while the port is judged
* Fixed after the port went live: free text rendered as HTML again (through DOMPurify), Vega modules (a reactive spec is refused by `structuredClone`), the icon field of the app editor (`v-model` vs `value`/`input`), radio spacing, the Excel preview's columns (`min-width`), the time-selector type now sits beside its switch, and each Vega chart has its own container
* Tests: 200 cases (Vitest), plus the guard suites that catch the silent failures of this migration (unknown `el-*` tags, renamed classes, a slot on a template root, a global rule for a component the file does not render)
* Known and deliberate: the free-text and Excel-preview fixes above deviate from the old build; `el-radio label` and `el-config-provider` (language) are still to be migrated

## V3.31.22 07/Nov/2026
* The build takes its public path from `VUE_APP_PUBLIC_PATH` (`publicPath` in `vue.config.js`, `ARG PUBLIC_PATH` in the Dockerfile) and the file server mounts that prefix (`BASE_PATH` in `app.js`). The default is still the root, so the release image is unchanged; the point is to serve the same tree under a sub-path — the console moves to `/nyxv2/` while the Vue 3 build takes the root
* Nothing else changes: same asset URLs at the root, same behaviour, no code touched outside the three build/serve entry points

## V3.31.19 04/Nov/2026
* The privacy notice states the two retentions the platform actually enforces: report execution logs and the reports produced are kept **ninety days**, deleted by a scheduled task, in the four languages (the notice stopped at the account, the seven days of call logs and the thirty days of backups). "Last updated" moves to 4 November 2026 in each language

## V3.31.18 02/Nov/2026
* The test suite covers the store's actions, not only its mutations: `switchToApp`, `changeApp`, `logout`, `refreshTimeRange`, `setTab` and the six record/message writes, with axios mocked and a fake websocket — every one of them used to be an untested write whose only failure mode is a screen that keeps its old value. **39 → 133 tests**
* `src/utils/filters.js` and `src/utils/language.js` take over the five Vue filters and the language resolution that were inlined in `main.js`, where importing them mounted the whole application: `formatTS` decides on its own whether a timestamp is in seconds or milliseconds, and `resolveLanguage` picks the interface language on every page load (URL parameter > selector choice > account > English). The duplicate `getUrlVars` of `Login.vue` is gone
* `controllerCatalog`: the page filtering is now a function of the component list (`componentNames`, `componentsNotInPages`), so the "which component can be a page" rule is testable; `NOT_A_PAGE` is exported and checked against `src/components/` — it still carried a stale `App` entry, which no longer exists as a component
* Coverage is measured and gated: v8 over `src` javascript, minus the translation and notice text, the entry point and the router (which imports `.vue` files a node environment cannot parse). Measured on that assiette, the same suite goes from **56.6 % to 99.1 % of lines, 57.4 % to 98.0 % of branches, 31.3 % to 96.7 % of functions** (the 43.28 % of the previous release was computed over data files and the entry point as well), and `ci-tests.yml` now runs `npm run test:coverage` so a pull request that loses assertions turns red instead of passing quietly
* The 62 single-file components are still outside the assiette — they are about three quarters of the code, and measuring them needs `jsdom` + `@vue/test-utils@1` + the vue2 plugin: that is the next decision, not a silent gap. The comment at the top of `vitest.config.mjs` says so
* Current quirks are pinned with a comment rather than fixed in passing: `switchToApp` compares a lower-cased title with the argument as given, `changeApp` throws on an unknown `rec_id`, a relative `apiurl` ending in `/` yields a doubled slash in the websocket URL, `refreshTimeRange` throws before the first `setTimeRange`, and every record write swallows its error

## V3.31.17 02/Nov/2026
* Every French comment of the interface is now English, together with the `describe` / `it` titles of the three spec files — 14 files, and Vitest still reports 39 passed
* Translation data (`src/lang/*.js`) and the privacy notice text are untouched: they are content, not comments. `check-lang-keys` still exits 0
* Comments only: string literals, CSS and template markup are unchanged, and the comment markers count identically in every file

## V3.31.16 02/Nov/2026
* First test suite for the console: Vitest (node environment, no component mounting) and 39 cases over the store, `globalfunctions.js` and the internal-page catalogue — the interface had no test runner, and 27 456 lines of components without a single assertion
* `store.js` is the target that matters: `hasPrivilege` decides what a user sees, `filteredmenus` builds the routes (`value` / `fulltitle` slugs from the category and submenu titles), and `setTimeRange` picks the aggregation interval sent to Elasticsearch (its thresholds are now pinned, from « 1m » for two hours to « 7d » for four months)
* `computeTranslatedText` — the `@en=Hello;fr=Bonjour@` format used by every translated field of the model — is now covered, including two current quirks that a label author must know: a value containing `=` is truncated at the second one, and an untranslated locale returns the raw segments as an **array**, not a string
* `CONTROLLER_PAGES` is checked against the files of `src/components/`: an orphan entry renders a blank page in the screen builder, and a duplicate name makes the picker ambiguous
* New `ci-tests.yml` runs `npm ci`, the language-key check and `npm test` on every pull request; `npm test` and `npm test:coverage` are now scripts

## V3.31.2 01/Nov/2026
* Dutch: the process list column is now « Levenssignaal » instead of « Laatste levenssignaal », which did not fit the column

## V3.31.1 01/Nov/2026
* Dutch (`nl`) added as a fourth interface language: `src/lang/nl.js` translates the 630 keys of `en.js`, and the user form offers « Nederlands » as a choice
* The Greek file was 16 keys behind: the whole `internal` controller picker added in 3.31.0 was missing, so those labels fell back to English — added, and the file is now aligned on all 630 keys
* New `scripts/check-lang-keys.mjs`, run by the build workflow before the image is built: it compares the key sets of every language file with `en.js` against the real objects, and fails when a string is missing. A missing key used to be invisible — the interface silently falls back to English
* Element UI's own Dutch locale is loaded alongside ours (date pickers, table pagination, transfer lists)

## V3.31.0 01/Nov/2026
* The `internal` application type now offers a list of the existing controllers instead of a free text field: the pages first (`Activity`, `Config`, `User`, `ProcessList`, `ReportList`, `ReportTask`, `ReportPeriodic`, `SendMessage`, `QueryFilter`, `NYXInfo`, `LandingPage`), then any other component of `src/components`
* The chosen controller is described under the field, so an administrator does not have to guess what a component does; a name that is not in the list can still be typed
* The list is read from `src/components` (`src/controllerCatalog.js`), so a component added to the project shows up without editing the catalogue
* Corrected the help text that claimed a controller must be added to "the external nyx_ui folder" and the UI recompiled

## V3.30.0 01/Nov/2026
* Added an Activity page (internal controller) reading the API audit trail from `nyx_apicalls-*`: `1h`/`24h`/`7d`/`30d` presets and custom range, user/path/error filters, call, error and active-user counters, p50/p95/p99 latency, most called endpoints, error and user breakdowns, the last 200 calls and a CSV export through the standard export path
* Counters use `filter` and `cardinality` aggregations so they stay exact when the `terms` lists are capped at ten buckets
* The index mapping is read through `/api/v1/esmapping/` so the terms aggregations work with or without `.keyword` sub-fields
* The page is metadata-driven: it is enabled by an `internal` `nyx_app` document with `config.controller = "Activity"` (see `docs/apps/`)
* Added English, French and Greek translations for the page

## V3.29.31 25/Oct/2026
* Added a “Download data” option to Grafana apps; all panel query results are exported to an Excel workbook by the report system, with one sheet per panel and resolved dashboard variables

## V3.29.30 24/Oct/2026
* Fixed the configuration list search field and other table header inputs by restoring scoped header slots (Element UI renders header content through `$scopedSlots`)

## V3.29.29 24/Oct/2026
* Upgraded tiptap to 1.32.2 and tiptap-extensions to 1.35.2 so the Free Text editor imports resolve
* Fixed the Free Text default content to use the translated label instead of a literal `{{ $t(...) }}` string
* The Free Text editor now edits the working config copy

## V3.29.28 24/Oct/2026
* Fixed the white screen caused by the container build resolving webpack 5.112 (now pinned to 5.107.2)
* Committed `package-lock.json` and switched the container build to `npm ci` for reproducible builds

## V3.29.27 24/Oct/2026
* Disabled production source maps to shrink the bundle and stop shipping source code
* Removed unused dependencies and replaced jQuery with native DOM APIs
* Fixed lint errors across the codebase so `npm run lint` passes again
* Fixed bar chart width side effect, unreachable code, `v-if`/`v-for` usage, and unsafe `hasOwnProperty` calls

## V3.29.26 14/Oct/2026
* Fixed the duplicated Tuesday entry in the periodic report scheduler so Thursday is available

## V3.29.25 14/Oct/2026
* Reused the external JupyterLab application's token for Lambda notebook and input links

## V3.29.24 14/Oct/2026
* Removed the duplicate vertical scrollbar from the AppConfig component
* Removed the duplicate vertical scrollbar from the ReportTask component

## V3.29.23 14/Oct/2026
* Removed the extra horizontal scrollbar from the menu selector

## V3.29.22 09/Oct/2026
* Fixed Docker action editor initialization so the Restart/Start/Stop dropdown works again
* Fixed the Action label to focus the dropdown

## V3.29.20 03/Oct/2026
* Keep the user's language across page reloads: resolve locale at startup from URL (language/lang/locale) then persisted user language, and re-apply after session restore

## V3.29.19 03/Oct/2026
* Finished i18n: views, login, logout info, password rules, table editors and remaining components localized (en/fr/el)


## V3.29.18 03/Oct/2026
* Localized the table/viewer components and notifications (generic/PG tables, details, file system, users, send message, config, form) in en/fr/el


## V3.29.17 03/Oct/2026
* Localized the report components (report editor, list, periodic scheduler, task, generator) in en/fr/el


## V3.29.16 03/Oct/2026
* Localized the application config editors (Kibana, Grafana, ES table, form, link, upload, file system, query filter) in en/fr/el


## V3.29.15 03/Oct/2026
* Localized the Nyx Info dashboard (en/fr/el)


## V3.29.14 02/Oct/2026
* Widened the application editor dialog and auto-sized its labels so translations no longer wrap


## V3.29.13 02/Oct/2026
* External apps: added a LANG placeholder replaced by the user language in the URL
* Documented the LANG placeholder in the external app help text (en/fr/el)


## V3.29.12 02/Oct/2026
* Completed the Greek (el) translations and added the missing French Save label
* Removed 14 unused translation keys


## V3.29.11 02/Oct/2026
* Localized the Excel viewer (dialog title, row-limit notice, loading and notification messages) in English, French and Greek


## V3.29.10 02/Oct/2026
* Updated axios, js-yaml and moment to patched versions
* Upgraded vega and vega-lite to v6, vega-embed to 7.3
* Replaced the deprecated xlsx npm package with the maintained SheetJS 0.20.3 build


## V3.29.9 02/Oct/2026
* Fixed crash when generating ES values for reports with a timestamp and interval parameter
* Fixed report range filter to use the configured timestamp field
* Enabled the periodic report Update button when parameters change
* Restored privileges and filters for non-admin users on session restore


## V3.29.8 02/Oct/2026
* Fixed missing lodash imports in QueryBar, QueryFilter and ReportTask
* Removed duplicated password maximum-length validation
* Fixed ReportEditor validation rules array
* Removed duplicate parameters entry from new report template


## V3.29.5 24/Jun/2026
* Excel preview added

## V3.29.4 30/May/2026
* Powered by Grafana icon hidden

## V3.29.2 17/May/2026
* ReportEditor: Jasper uploads now use user-specific path (./jasperdef/{login}/{filename})
* Added IconPicker component with visual icon selection (957 Font Awesome icons)
* ConfigDetails: Replaced text input with IconPicker for better icon selection
* ReportEditor: Integrated IconPicker for consistent icon selection experience
* ReportEditor: Added datasource selection combobox for Jasper reports
* ReportEditor: Datasources loaded via generic_search API with description labels
* SQLEditor: Added editable description field for SQL queries
* SQLEditor: Added informational card with editor usage tips and keyboard shortcuts

## V3.29.1 16/May/2026
* Fixed uncaught error when closing version info dialog
* Store now dynamically reads version from package.json

## V3.29.0 16/May/2026
* SQLEditor: Fixed dialog rendering with append-to-body
* SQLEditor: Added record ID to dialog title
* SQLEditor: Fixed ace editor initialization and data loading
* LambdaEditor: Added append-to-body for proper dialog display

## V3.28.6 27/Apr/2026
* Jupylab path updated
* better external address handling

## V3.28.4 27/Apr/2026
* Vega fixed

## V3.27.0 18/Oct/2025
* Added FROMDATE and TODATE in external url.  

## V3.26.2 15/Jul/2020  
* FIX: User that have "admin" or "user" privilege can access filters and privileges

## V3.24.0 11/May/2020  
* Nyx Info enhanced
* Docker ediutor template added


## V3.23.0 07/May/2020  
* Nyx Info added
* Dynamic query filters


## V3.20.0 22/Apr/2020  
* Pagination added for alstic search


## V3.19.1 18/Apr/2020  
* PostGRES table supports pagination.
* PostGRES table columns can be localized.
* PostGRES table ordering fixed.


## V3.19.0 09/Apr/2020  
* Query filter selected can use a query


## V3.18.0 09/Apr/2020  
* Config Details Interface Improved.


## V3.17.0 09/Apr/2020  
* Web Socket Added.


## V3.16.0 07/Apr/2020  
* Marker Cluster added.
* Better query filter translations.
* Maps can have more than 100 markers.

## V3.15.0 06/Apr/2020  
* Icon and color functions added to the map component
* Query filter support a strict free text mode


## V3.14.0 03/Apr/2020  
* Fix bug with location fields (inversion of Lat and Long)
* Update VueLeaflet Component

## V3.13.0 02/Apr/2020  
* Upload component can filter file extensions. 
* Periodic reports translation updated. 
* Lambda details interface updated.
