# Version History

## V3.6.40 13/Nov/2026
* **A session cut by an administrator ends on the page that explains it.** The API now answers `ACCOUNT_INACTIVE` to a request carrying the token of a disabled account, and drops the token. The console used to do nothing with that code on a live session; it now clears the store and routes to `/inactive`, instead of the generic « lost session » toast that would invite the person to try again. On the sign-in screen nothing changes: the route already left for that page.
* **The users list can show only the disabled accounts**, with their count in the filter label — the accounts filed by a GitHub sign-in wait there until an administrator decides, and they were lost among the active ones. The filter composes with the search box. Four languages.
* `tests/app-error-reporting.spec.js` (six cases, both moments of the code) and three cases in `tests/components/user.spec.js` (filter alone, count at zero, filter combined with search). **771 tests**.


## V3.6.39 13/Nov/2026
* **A GitHub identity filed as an inactive account is told so.** When the API runs with `GITHUB_UNKNOWN_ACCOUNTS=inactive`, an unknown GitHub identity is created disabled; the OAuth landing page used to answer « No NYX account is linked to this GitHub identity », which is now false — the account exists, it may not come in. `ACCOUNT_INACTIVE` routes to `/inactive`, the same page as the password sign-in.
* `tests/views/oauth.spec.js` covers it: the route ends on `/inactive`, no message is shown and no session is stored. **766 tests**.


## V3.6.38 11/Nov/2026
* **No red toast on top of the inactive page.** Every API answer carrying an `error` is reported by the interceptor in `App.vue`, so the refused sign-in also popped « Error ACCOUNT_INACTIVE » while the route sent the user to `/inactive`. That code is now handled like a lost token: silent, the page says what to do.
* `tests/app-error-reporting.spec.js` pins all four branches: empty error, `ACCOUNT_INACTIVE` (silent), `UNKNOWN_TOKEN`/`NO_TOKEN` (logout), anything else (reported). **765 tests**.


## V3.6.37 11/Nov/2026
* **An inactive account behind the second factor landed nowhere.** With MFA the sign-in is answered twice — first « send the code », then the code itself — and the second answer was only logged to the console: the user typed a correct code and nothing happened. That path routes to `/inactive` like the password-only one.
* `tests/views/inactive.spec.js` covers it: two answers, `DoublePhase` then `ACCOUNT_INACTIVE`, and the route ends on `/inactive`. **761 tests**.


## V3.6.36 11/Nov/2026
* **An inactive account is sent to a page, not to a form it cannot fill.** The API refuses to mint a token (`ACCOUNT_INACTIVE`) once the password is right; the sign-in screen used to print the raw code under the fields, which invited the user to try again for ever. It now routes to **`/inactive`**, a page that says the account was deactivated by an administrator and that it has to be reactivated, with a button back to the sign-in screen. Four languages.
* The session stays on the API's side: an account disabled while signed in keeps its token until it expires, but the next sign-in is refused.
* `tests/views/inactive.spec.js` mounts both screens: the page explains and offers the way back, and a sign-in answering `ACCOUNT_INACTIVE` lands on `/inactive` without storing any credentials — verified by putting the plain error message back, the test fails on `expected '/' to be '/inactive'`. **760 tests**.


## V3.6.35 11/Nov/2026
* **An `inactive` flag on the user record.** The account editor gains a switch beside MFA, and the users list a status column (`Active` / `Inactive`). A document that does **not** carry the field is an **active** account: nothing has to be migrated, and accounts created by a script or before this release keep working unchanged.
* The switch reads the absent value as `false` and writes `inactive: true` only when an administrator turns it on; translations added in the four languages (`en`, `fr`, `el`, `nl`), with a tooltip saying what the flag is for.
* `tests/components/user-details-inactive.spec.js` pins the semantics: a record without the field reads as active and stays without the field, a record carrying `inactive: true` shows the switch on, and setting it writes the boolean without touching login or privileges. **756 tests**.
* Note: the flag is **not enforced yet** — refusing the sign-in of an inactive account is a server-side decision (`nyx_rest`), left for a separate change.


## V3.6.34 11/Nov/2026
* **The fields panel of the form editor did not take the width of its dialog.** Measured in the application editor: the fields table was **333 px wide in a 1139 px dialog**, stuck in the left third with empty space beside it. Element Plus's `el-row` is a flex container, and a card placed directly in it is `flex: 0 1 auto` — Element UI 2's `el-row` was a float clearer, so the layout only broke with the migration. Its two columns also had no row of their own, so they were block children of the card body.
* `styles/element-legacy.css` gives a card in a row the width of that row (`.el-row > .el-card { flex: 1 1 auto }`) — one rule for the 21 places the console puts a card there — and `FormEditor.vue` moves its fields card into a block with a proper `el-row` around its two columns.
* `tests/layout-cards.spec.js` checks both halves: the stylesheet rule is present, and the editor no longer relies on it. Verified by putting the card back in the row — the suite names the pattern. **752 tests**.


## V3.6.33 11/Nov/2026
* **The field dialog of the application editor was drawn at 28 px.** `FormFieldEditor` — the window where a form application's field is defined: name, title, type, subtype, default, colour — carried `size="small"` on all eight of its widgets. Inside a dialog 75 % wide, that read as a cramped form with half an inch of empty space around it. They use the console's size now (36 px), and the label column goes from 120 to 140 px so `Subtype`, `Clearable` and `Default` stop crowding their field.
* `tests/components/form-field-editor.spec.js` mounts the dialog (it teleports, so it queries what the user sees) and checks that it renders its widgets, that none carries `--small`, that they all agree on one size, and that the label column was widened. Verified by putting `size="small"` back on one input — the suite fails on `--small`. **750 tests**.


## V3.6.32 11/Nov/2026
* **The fields of a form application were the wrong size.** Three Element UI 2 habits survived in `Form.vue`: `formSize: "mini"`, a size Element Plus does not know (it silently falls through to "no size"), a `datetime` field hardcoded at `size="small"` — 28 px where its neighbours were 36 — and number, date and select widgets left at their intrinsic width (150 px, 220 px) beside full-width text fields. Measured before the change: heights 36/36/36/**32**, widths 1029/**150**/**220**/1029.
* All four now use the console's size and the full width: **36 px high and 1029 px wide, uniformly**.
* **Selects were 4 px shorter than the fields everywhere in the console**, not only in forms: Element Plus hardcodes `min-height: 32px` on `.el-select__wrapper` instead of reading `--el-component-size`, so every select sat 4 px above the baseline of its neighbouring field. `styles/element-legacy.css` points the three size variants back at the variables; that is what brings the form's select to 36 px.
* `tests/components/form.spec.js` mounts the component with one field of each type and checks that no widget carries a deprecated size class, that the four agree on one size, and that the number/date/select take the full width. Verified by putting `mini` and the intrinsic widths back — the suite names it. **746 tests**.


## V3.6.31 11/Nov/2026
* **`ElementPlusError: [props] [API] type.text is about to be deprecated in version 3.0.0`** on 63 buttons across eight editor screens — report dialogs, the application editors, the password rules, the link and form editors. Every render of one logged the deprecation, and Element Plus 3 removes the value outright. They carry `link` now, which is the same look; `type="text"` stays legal on `el-input` and was left alone.
* `tests/element-button-link.spec.js` holds it: a `type="text"` inside an `el-button` tag fails the suite, with an assertion on the number of buttons scanned so a matcher that stops matching cannot stay green. Verified by putting the attribute back on one button of the report dialog — the test names `ReportGenerator.vue:66`.
* No stylesheet referenced `.el-button--text`, so nothing else had to move. **743 tests**.


## V3.6.30 11/Nov/2026
* **Generating a report works for anyone who may run it.** The console used to build the whole job itself — definition, privileges, credentials — and post it to `/sendmessage`, which refuses every caller but an administrator: a `reporteditor` account clicked Generate, filled the dialog, and got `403 destination not allowed` printed nowhere. It now posts `{report, parameters, task}` to `/report/generate`, and the API loads the definition, takes the session from the token and builds the job. `ReportTask` does the same with `/report/regenerate`, replaying the snapshot the task already carries.
* What the console sends changed accordingly: only parameter **values**, no `creds`, no `privileges`, no definition body — a browser can no longer redirect a report's `exec` or `jasper` path, and the id of the definition travels as a prop (`reportId`) rather than being smuggled into the document the editor saves.
* A refused submission now says why: the dialog shows the server's error instead of logging it and closing.
* `tests/components/report-generator.spec.js` pins the contract — the id and the values go out, the credentials and the definition do not, the mail settings travel under `task`, the bus event fires and the dialog closes, and an error keeps it open with a danger notification. 741 tests.


## V3.6.29 11/Nov/2026
* **`GET /js/mode-yaml.js` and `GET /js/theme-tomorrow_night.js` — 404 on every screen with an editor.** ACE does not fail on a module it does not know: it builds a `<script src>` from `basePath` and fetches it. With the bundle served under `/js/`, that was `/js/mode-yaml.js`, which nothing serves. The modules were in the bundle all along, but the 55 `require("ace-builds/…")` calls that register them sat in `mounted` and in the `@init` handler — and `ace.edit()` asks for the theme *before* those run. The theme was therefore never applied either: this is the same root cause as the white editor the `theme="chrome"` prop never fixed.
* `src/utils/aceModules.js` registers the eleven modules once, as side-effect imports, before any editor exists: the core, the language tools, `mode-html`, `mode-yaml`, `mode-javascript`, `mode-less`, `mode-sql`, the `javascript` and `sql` snippets, and both themes. The 55 scattered `require`s are gone from the five editor components and from `mixins/aceTheme.js`, which loses `registerAceThemes` — it existed to compensate, and compensation is no longer needed.
* `tests/ace-modules.spec.js` holds three failures: a `lang="…"` in a template with no matching `mode-` import in the registry (`text` excepted, it ships in ACE's core), a theme named by the mixin but not imported, and any `require("ace-builds/…")` left outside the registry. Verified by removing `mode-sql`: *"add mode-<lang> …: expected [ 'sql' ] to deeply equal []"*.
* **736 tests**.


## V3.6.28 11/Nov/2026
* **`ElementPlusError: [ElOnlyChild] no valid child node found`** in the list of generated reports. A tooltip needs one element child to hang on; the error icon of `ReportTask.vue` was hidden behind `v-if="status == 'Error'"` *inside* its own tooltip, so every row that had **not** failed left a comment node there — the warning fired as soon as the screen opened, on the rows where everything had gone well. The `v-if` is on the tooltip now, which is what was meant: nothing renders when there is no error.
* Five more of the same shape, found by scanning: the edit and delete buttons of `ReportList.vue` and `ReportPeriodic.vue`, and the logs and regenerate buttons of `ReportTask.vue` — each tooltip wrapped a button carrying `v-if="hasPrivilege('reporteditor')"`, so a user without the privilege got an empty tooltip *and* the warning. The condition is on the tooltip, and the logs button's two conditions are merged into one attribute.
* `tests/element-only-child.spec.js` scans for the shape: a `el-tooltip`/`el-popover` without `v-if` whose first child has one fails the suite. Verified by putting the old attribute back on the error icon — the test fails and names `ReportTask.vue:129`.
* `tests/sfc-compile.spec.js` is new, and was earned: one of the six rewrites left a stray quote (`<el-button"`) in two files, **the suite stayed green** because nothing mounts those components, and only the build caught it. Every `.vue` file is now parsed by `@vue/compiler-sfc` — 63 components, two seconds, no mocks. Verified the same way: breaking one template fails the test that names it.
* **733 tests**.


## V3.6.27 11/Nov/2026
* **`ElementPlusError: [el-radio] label act as value is about to be deprecated in version 3.0.0`.** The console put the *value* of a radio in `label` — the Element UI 2 API — on 19 radios across six screens, so every screen that showed one logged the deprecation at mount. They carry `value="…"` now; the selected values themselves are untouched (`absolute`/`relative`, `topic`/`queue`, `jasper_jdbc`, …), so no behaviour changed.
* `tests/element-radio-value.spec.js` checks it statically: any `el-radio` / `el-radio-button` with a `label` and no `value` fails the suite, with a second assertion on the number of tags found so a broken matcher cannot pass silently. Verified by putting the old attribute back on one radio in `Main.vue` — the test fails and names the file.
* Found because the warning is a runtime one, printed by the component itself: nothing in the build, the suite or the coverage said anything. Note that the deprecation will become a removal in Element Plus 3.
* 666 tests.


## V3.6.26 11/Nov/2026
* **`console.log` no longer reaches the browser.** The console had **294** of them in `src/` — one per screen, one per table, one per chart — and they shipped in every chunk: `LOGIN -- authenticate`, `START PREPARE DATA....`, `enable interceptors axios` were readable in the production bundle, along with the payloads being handled. Terser now removes `console.log` and `console.debug` outright (`pure_funcs` in `vue.config.js`), in every chunk, rather than silencing them at runtime: what is not in the bundle cannot print, and cannot be read by whoever opens the devtools.
* `console.warn` (9) and `console.error` (11) are kept — a real failure should still say so — and the bundle still carries 122 of those, from our code and from the libraries.
* The calls stay in the sources: they are what makes a local debugging session readable, and `.eslintrc.js` already turns `no-console` into an error when linting with `NODE_ENV=production`.
* Measured on the build: only **7** `console.log` remain in `dist/js` (all inside vendored libraries, not ours), the marker strings are gone from every chunk, and the weight is unchanged (`app` 134,37 KiB, `chunk-vendors` 1 939 KiB) — the win is silence, not bytes.
* 664 tests unchanged; no source file was touched.


## V3.6.25 11/Nov/2026
* **The app button and the avatar were gone.** They rendered as `<apps></apps>` and `<logout></logout>` — unknown elements. `Main.vue` registers the thirty components it uses (`Apps`, `Logout`, `ChangePassword`, …) through `@/utils/vue3shim`, which queued them and replayed the queue **once, before mount**. That was right while every module was imported at startup; 3.6.24 made the routes `defineAsyncComponent`, so `Main.vue` loaded *after* that flush and its registrations were never applied. The rest of the header was unaffected, so nothing looked broken until you missed a button.
* `registerComponent` now applies immediately when the app instance is known, and `bindApp()` remembers it; `router.js` also flushes after each route module is imported, so a late module cannot queue behind a flush that already happened. `tests/vue3shim.spec.js` pins both paths.
* The regression was mine, introduced by the deferred routes in 3.6.24 and shipped without opening the console past the login screen — the router test asserted which screen each path mounts, not that the screens still resolve their children. Verified after this fix by logging in to the production console: `<apps>` and `<logout>` resolve, the popover and the avatar dropdown are back.
* 637 tests.


## V3.6.24 10/Nov/2026
* **The first screen downloads half the JavaScript it used to.** Measured on the production build, per file and gzipped: `chunk-vendors` + `app` were 2 327 + 166 KiB and now weigh 583 + 42 KiB; the login screen then pulls the three icon sets it displays (solid 311, brands 219, regular 37 KiB) and two small view chunks (10 KiB) — **1 202 KiB against 2 493 KiB, −52 %**. The script tags alone go from 2 493 to 629 KiB; the rest of the drop is only realised on screens that show no icon, which the console never does. Nothing is removed from the console; three things stopped being loaded before the first screen.
* **Routes are deferred.** `Login`, `Main`, `Privacy`, `OAuth` and `GenericComponent` were imported at startup, so the login form downloaded the tables, Kibana, Grafana and every editor behind it. They are `defineAsyncComponent` now — the test resolves the loader, so it still pins which screen each path mounts.
* **FontAwesome is loaded per style, on first use** (`src/utils/fontAwesome.js`): `library.add(fas, far, fab)` registered ~2 000 icons in the initial bundle for the twenty the first screen shows. The set cannot be narrowed — the icon is chosen by the user in the picker and stored in the configuration — so it is deferred instead: the first icon of a style loads that style once (≈ 300 KB gzipped, cached), and `IconPicker` asks for the three sets when its dialog opens so its thousand thumbnails do not become a thousand requests. `<v-icon>` paints a name it already knows synchronously, so re-rendered menus do not flicker.
* Per-icon chunks were tried first and rejected: webpack produced 2 700 chunks (23 MB of `dist`) and Vite — which runs the tests — eagerly pulled every matched module into the graph, which made the coverage report attribute 2 700 statements that are not ours (35 % → 26 %). One chunk per style is predictable on both sides.
* **Element Plus ships 33 icons instead of ~300.** `main.js` imported `* as ElementPlusIcons` for a `$icons` object the templates only read by literal name; `src/utils/elementIcons.js` pins the list and `tests/elementIcons.spec.js` compares it to the sources both ways, so a new `$icons.X` fails the suite until it is added (and a stale entry fails it too).
* 635 tests (+24). Coverage up slightly: 35,18 / 40,85 / 31,12 / 36,33 against 34,75 / 40,37 / 30,8 / 35,94 — the floor in `vitest.config.mjs` does not move.
* `vue.config.js` gains three resolve aliases (`@fa-solid`, `@fa-regular`, `@fa-brands`): the FontAwesome 6 packages declare `"exports": { ".": "./index.mjs", "./*": "./*.js" }`, so a wildcard request with a `.js` suffix is rejected and the bare import fails on a wildcard context.

## V3.6.23 10/Nov/2026
* **The user form has a single surface in dark mode now.** The `--el-fill-color-blank` remapping introduced in 3.6.21 is not only used by the transfer panels: it is also the background of an `el-collapse`'s sections. Picked up on the dialog, it painted the header **and** the body of each section in **#262c3a** in the middle of a **#1f2430** surface, with a footer back at #1f2430 beneath them: the form opened on two blacks — a lighter block ringed in dark
* The sections go back to `transparent` (`html.dark .el-overlay .el-dialog .el-collapse-item__header` / `__wrap`), their separations take `var(--nyx-border)`. Only the fields and the two lists of the transfer stay raised, as everywhere else in the console. Measured after the fix on the served bundle: dialog, body, sections and footer all at `rgb(31,36,48)`, fields and panels at `rgb(38,44,58)`
* **The disabled field kept a third grey.** `--el-disabled-bg-color` is declared on `html` as `var(--el-fill-color-light)` and resolves there to **#262727**: the value is inherited already computed, so the remapping done in the dialog did not reach it. The "ID/Courriel" field, not editable while editing, takes the same shade as the active fields; its text and its border stay those of a disabled field
* Light theme re-measured unchanged: dialog, sections and panels white, disabled field #f5f7fa
* One more test in `dark-theme-text.spec.js` (transparent sections, `--el-disabled-bg-color` picked up in the dialog): 611 tests, coverage unchanged at 34,75 / 40,37 / 30,8 / 35,94

## V3.6.22 09/Nov/2026
* **The coverage gate goes from 22 to 34 %** (branches 32 → 39, functions 18 → 30, lines 23 → 35). The suite measures 34,75 / 40,37 / 30,8 / 35,94 over 610 tests: the global threshold was **twelve points below the measurement**, so it could no longer flag anything. The new thresholds are roughly one point below the measurement, so that a lost test screen shows in CI instead of drifting silently
* Checked in both directions before merging: with `statements: 99` the CI fails ("Coverage for statements (34.75%) does not meet global threshold (99%)"), with `statements: 34` it passes. The gate really bites
* The per-glob thresholds (logic 97/94/96/97, views 73, components) do not move: they are the ones that carry the quality of the suite, the global threshold is only the net

## V3.6.21 09/Nov/2026
* **The user edit dialog is a console dialog again in dark mode.** The body already took `--nyx-surface` (#1f2430), but what it contains kept Element's values for dark: the two transfer panels are painted in `--el-bg-color-overlay` (**#1d1e1f, almost black**, on a #1f2430 surface, and they occupy two thirds of the window) and their header written in `--el-color-black` — black on #262727, i.e. **1,0:1**, the panel title invisible. Measured in the browser, on the served sheet
* The variables are picked up **in the dialog** (`--el-bg-color-overlay`, `--el-fill-color-light`, `--el-fill-color-blank`, `--el-transfer-border-color` towards the `--nyx-*` palette) rather than component by component: the application editor, which stacks the same elements, benefits too. The transfer header moves to `var(--nyx-text)`
* **The Grafana download bar follows the theme.** `background: "#fff"` as an inline style left a white band above the dark console; it takes `var(--nyx-surface, #fff)` — the variable only exists in dark, hence the white fallback — and a bottom border in dark mode, otherwise its limit blends into the page
* Two more tests in `dark-theme-text.spec.js` (remapping of the dialog variables, Grafana bar). 610 tests

## V3.6.20 09/Nov/2026
* **Four families of security advisories closed by `overrides`.** `postcss` 8.5.23, `serialize-javascript` 7.1.3, `minimatch` 11.0.1 and `uuid` 11.1.1 are forced in `package.json`: ten Dependabot alerts fewer (21 before, 11 after). All four come from the build chain (`@vue/cli-service`, `terser-webpack-plugin`) and none ships in the served bundle; production build and 608 tests verified afterwards
* **`vue-i18n` 9.14.4 → 9.14.5**, the last of the 9 series (tag `legacy9`). It fixes the moderate advisory on `escapeParameterHtml`. The next advisory — XSS via `srcdoc` in a message — is only fixed from 11.4.14: 9.x is no longer maintained. The migration to 11 removes the `legacy` mode, so `$i18n.locale` becomes a ref and every read as well as every write must say `.value` (four screens, the `watch` of `App.vue`, the tests). Tried then reverted: 12 tests fall, it is not a fix but a migration
* Residual exposure of `vue-i18n`: nil in practice. The messages are JSON files of the repository, no translated string is built from user input, and `escapeParameter` is not used
* 11 alerts remain, all in the tooling frozen by `vue-cli` 5 (`webpack-dev-server` 4, `@vue/cli-*`): `npm audit` only offers a *downgrade* to vue-cli 3.12, no remedied version exists in the 5 line. Documented in the README, section "Dependencies", with the status of each package
* The README also brings its figures up to date: 608 tests, 34,75 % of the instructions of `src` (it announced 352 tests and 23,2 %)

## V3.6.19 09/Nov/2026
* **Dark mode sweep: the light theme's greys written in hard.** After the labels of the record editor (3.6.18), nine files still carried some. On the dark surfaces of the console, they fell between **1,3:1 and 2,9:1**: present, unreadable. The rules move to the Element Plus variables, which switch with the theme — `--el-text-color-regular` (#606266 in light, #cfd3dc in dark, 9,3 to 11,6:1) and `--el-text-color-primary` (#303133 / #e5eaf3, up to 14,4:1). In light, the rendered value is identical to the pixel
* **`#app` carried `color: #2c3e50`.** It is the root of the application: every text without a colour of its own inherited it and therefore stayed dark on a dark background, despite `html.dark body`. It was the underlying cause, the one that explained the one-off patches of the previous versions
* Fixed with it: `Activity` (panel titles), `Grafana` (download hint), `IconPicker` (icon caption), `ESTableEditor` (two text buttons, the table cell, the `#indexPattern` field which copied Element's styles in white), and the three rules of `Main.vue` that painted the dialogs
* Two accepted exceptions, documented in the test: the `<option>`s of the language select (painted by the system on white) and the privacy page (a sheet of paper, white in both themes)
* The `#nav` rules of `App.vue`, inherited from the Vue CLI skeleton and with no matching element (one painted an `aqua` background), are removed
* Guard test: no component can freeze a light-theme grey any more — the walk over the `.vue` files fails on `color: #2c3e50|303133|464646|606266|333|666` outside the two exceptions. 608 tests

## V3.6.18 09/Nov/2026
* **The labels of the record editor are readable again in dark mode.** The component's sheet froze `color: #464646` on `.el-form-item__label`: on the `#1f2430` surface of the cards, the field names fell to **1,6:1** — present, but unreadable. The rule moves to `var(--el-text-color-regular)`, the Element Plus variable that switches with the theme (`#606266` in light, `#cfd3dc` in dark, i.e. **10,4:1** on that same surface)
* Same grey written in hard in the applications' SQL editor (`tableEditor/SQLEditor.vue`): fixed with it, the rule being identical
* One more test (`dark-theme-text.spec.js`): both components must style the label through the theme variable, never through a hexadecimal code — this is exactly the kind of regression that breaks no compilation

## V3.6.17 08/Nov/2026
* **The privacy link stays alone, and the welcome text above it.** The link moves down to the middle, at the bottom of the page (`left: 50%`, `bottom: 12px`, `translateX(-50%)`), outside the card + title block: it no longer competes for the line with "Energy Monitoring Platform"
* **The composition moves up on a short window.** The card + title group is placed by `clamp(96px, 50% - 70px, 100% - 400px)`: on a laptop screen or when zoomed, it moves up to leave room for the footer instead of going under it. The two decorations (ring and icon) are now in the group and place themselves relative to the top of the card, so they follow it — anchored at `50%`, they ended up on the card when the group moved up
* Below 470px high (phone in landscape, heavy zoom), the decorations are hidden and the group moves up to 8px: without that the title went under the privacy link. The media query is at the **end of the sheet** — same specificity as the general rule, only the order decides, and placed before it, it never applied (the defect was seen on measurement, not at compile time)
* Geometry checked at 380, 470, 500, 577, 640 and 800px high: the gap between the title and the link stays positive everywhere (26 to 124px)

## V3.6.16 08/Nov/2026
* **The welcome text no longer goes under the card.** The card was in absolute position and the title placed at `50% + 170px`: as long as the card measured 200px the title fell just below it, but as soon as it grew (GitHub button) the card covered it — white text on a white background, invisible. The card and the title now form a single column group, whose top edge is the one the card had: the title follows the real height
* **The privacy link moves to the middle, at the bottom of the page.** It was on the title's line, where it competed for room with the welcome text; it is now positioned alone (`left: 50%`, `bottom: 12px`, `translateX(-50%)`), outside the card + title group
* The first password change panel keeps its own offset (`50% - 180px`), otherwise it would overflow at the bottom on a laptop
* 2 more tests: the link is no longer in the title nor in the group (it is at page level) and the rule that places it is checked

## V3.6.15 08/Nov/2026
* **The login card no longer freezes its height.** It had `height: 200px`, the size of the password form alone: the GitHub button adds a separator and a button (~60px), the content overflowed the card and you had to scroll to reach it. The card now sizes itself on its content (`min-height: 200px`, the rest `auto`), with the same top edge and the same horizontal centring as before so the form does not move
* The first password change panel follows the same rule (`min-height: 340px`): it has to grow too when an error message is added
* `.login-container` scrolls (`overflow-y: auto`) on a window shorter than the card — laptop, browser zoom — instead of cutting the bottom of the form
* Three tests: the button only appears if `/config` answers `login.github`, and a guard on the stylesheet (no fixed `height` on the card) — jsdom does not compute layout, an overflow would not show at mount

## V3.6.14 08/Nov/2026
* **The GitHub return arrives on a path, the console is in hash mode.** An OAuth `redirect_uri` cannot contain a fragment: GitHub therefore calls `/oauth?code=...`, a path the console does not know how to route — the application started on `/`, mounted the login screen, and the session was never completed. `normalizeOAuthLocation()` (at router load) moves the query into the fragment (`/#/oauth?code=...`) before the router reads the URL
* Same thing on the server side: nginx must serve the index on `/oauth` (the image's static server answers 404 on an unknown path). Without this application-side carriage, the `/oauth` screen remains essential: it reads `code` and `state` in both URL forms
* 5 tests for the carriage (`tests/router-oauth-location.spec.js`): move, trailing slash, already fragmented URL, other paths, absence of `window`

## V3.6.13 08/Nov/2026
* **Login with GitHub.** The button only appears if the API answers `login.github` on `/config` — it is the API that holds the client id and the secret, so the console never builds the URL itself: it asks `GET cred/oauth/state` and follows the returned URL
* **The `/oauth` return page completes the session like the form.** It reads `?code` and `?state` from the URL (fragment included: `getUrlVars` keeps it, it is removed before sending), posts to `cred/login_github`, then does exactly what `Login.vue` does when the password passes: `localStorage.authResponse`, screen locale, store `login` commit, opening the account's first application. It replaces the URL instead of pushing an entry there, so that the `code` — single use — does not stay in the history
* **The refusal cases are stated, not swallowed**: URL without code (manual return), identity without a NYX account ("no account is associated"), account without application (the existing `firstlogin.no_menu` message instead of the `TypeError` on `loc_title`), provisional password (redirect to the password login, the only place where it can be changed), unreachable server
* Routes: `/oauth` is a **sibling** of `/main`, not a child — a child would inherit the authenticated shell and draw the menu of a session that does not exist yet
* 8 `github.*` keys added to the four catalogues (the `check-lang-keys` check stays at 666 aligned keys), and `tests/views/oauth.spec.js` covers the six outcomes above

## V3.6.12 08/Nov/2026
* **The theme now follows every application plugged into the context.** An external application that carries `TOKEN`, `API` or `LANG` receives `theme` even if its configuration does not cite `THEME`: forgetting the token produced no error, the application simply opened without a theme (the misleading symptom: `token` and `lang` arrive, `theme` is missing). The parameter is added before the fragment and only if it is absent; the third-party links (kibana, grafana, cerebro, nodered, rediscom, jupyter) stay intact

## V3.6.11 08/Nov/2026
* **The "Info" window of the user menu is readable again in dark theme.** `Main.vue` paints the confirmation boxes with the light theme's colours — title `#303133`, content `#606266` — and an explicit colour wins over Element Plus's dark variables: on the `#141414` background rendered by the box, the title fell to **1,9:1** and the content (version, API version, window size, browser, token) to **3,2:1**, both below the AA threshold of 4,5:1. Same family as the status page titles fixed in 3.6.10, same remedy: `html.dark` picks up `.el-message-box__title`, `__content` and `__message` (including `p` and `strong`) on `var(--nyx-text)`
* Measured in the browser, after the fix, in the real box opened from the menu: title and content at **14,44:1**, zero text element below 4,5:1 — except the label of the primary button, which is white on Element Plus's `#409eff` blue (**2,78:1**), identical in light theme and left as is so as not to change the console's charter
* Light theme checked unchanged: white box, title `#303133`, content `#606266`
* `tests/dark-theme-text.spec.js` gains two assertions: the cause is still in `Main.vue` (if it disappears, the override becomes useless and the test says so) and the dark theme does pick it up

## V3.6.10 08/Nov/2026
* **Dark mode: the status page labels were unreadable.** They are in `<h3>`, and `element-legacy.css` forces `h1..h6 { color: #606266 }`: that light-theme grey falls to 2,5:1 on a dark card. `dark.css` picks up the titles (`var(--nyx-text)`), the contrast measured on the page goes from 2,5:1 to 11:1 and no element below 4,5:1 remains
* **New `THEME` parameter for external applications.** `External.vue` already replaced `token=TOKEN`, `API`, `HOST`, `LANG`, `FROMDATE` and `TODATE`; it now replaces `THEME` with the current theme (`light` or `dark`): `https://app.exemple/?theme=THEME`. The screen follows the light/dark switches without being remounted (`nyx:theme`). The token is framed by word boundaries, `MYTHEMEAPP` stays intact
* External app documentation updated in the four languages (`configdetails.desc_external_detail_4`, in the help of the configuration screen)

## V3.6.9 08/Nov/2026
* **The report status animation no longer ran.** `ReportTask` displays "Waiting" with `<v-icon name="spinner" spin scale="2" />`; the circle with its dots showed, motionless. `spin` was a `vue-awesome` prop that `VIcon` never took over, and FontAwesome's animation lives in its stylesheet, which this project does not load: the prop was ignored, on the three calls that use it (report status, two form processing buttons). `VIcon` takes `spin` and applies a full turn per second itself
* **File browser: infinite scrolling had nothing left to load.** `listDir` removed the rows of `allData` with `splice` (and the row was written twice); `loadMore` spliced too and never stopped. Switched to `slice`, with end-of-list detection
* **Status page: it crashed if the WebSocket module had no client yet.** The template read `WebSocketServer[0]._source.clients[0].logins` behind a guard that only checked `_source`; a module that has just started has no `clients`. Both reads go through a computed that returns `{ clients: 0, logins: [] }`
* **Kibana screen: crash at mount outside the time bar.** `createUrl` read `timeRange[0]` while the ranges are `null` before the first period choice (direct link, reload); `updateQuery` raised the same on a URL without `query:'...'`
* **Pagination or sort before any period choice: TypeError in the store.** `refreshTimeRange` read `lastTimeRangeEvent`, which only exists after the first `setTimeRange`; the mutation now does nothing in that case
* Coverage of the data screens (`NYXInfo` 74 %, `FileSystem` 63 %, `Kibana` 47 %, `PGGenericTable` 41 %) and of the icon component — 567 tests

## V3.6.8 08/Nov/2026
* **The report type description card cuts its text.** Each type had its own template block, with a fixed height on the card (70 px, 90 px for Jasper JDBC) and `el-col`s placed directly in the card, without `el-row`: the Jasper JDBC description takes three lines, the third was invisible and a scrollbar appeared in the card. The five blocks become one, driven by a `type -> {translation key, icon}` table; the card takes the height of its content, the icon and the text share a flex line. Measurement: 92 px high with 90 px of content (scrollbar) -> 105 px, whole text, no overflow
* **The JRXML drop zone overflows its row.** `el-upload` carried `style="height:30px"` and the `dragger` 40 px for two lines of text: the `dragger` measured 82 px inside a 30 box and went over the next field; it also started at the column edge while the neighbouring fields are indented by the label width. It is wrapped in an `el-form-item` without a label and its height is free: x=633 l=486 h=30 -> x=753 l=366, the x and the width of the fields of its column
* Five more tests lock the structure (no inline height on the card nor on the zone, icon/text flex line, one description for each of the five types, zone inside a `form-item`) — 399 tests

## V3.6.7 08/Nov/2026
* **A token refusal logs out again.** `nyx_rest` 3.22.23 no longer answers 200 when it refuses a token: `NO_TOKEN` and `UNKNOWN_TOKEN` are 401s, `NO_PRIVILEGE` and `MUST_CHANGE_PASSWORD` 403s. The response interceptor only looked at the bodies of successful responses, so `axios` rejected the promise without any `.then()` running: the lost session left the screen frozen instead of bringing back the login. The body handling is now shared by both branches (`reportApiError`), and a 401 on the login screen stays silent
* The rest is unchanged: the API's route errors still answer 200 and are still notified the same way, and the `{"error": …}` body keeps its shape
* **The "Send" button of the Docker dialog is back on the selector's line.** In Element Plus `el-select` is 100 % wide, where Element UI 2 left it inline: selector and button shared an `el-col`, so the selector took the line and "Send" fell under it, left-aligned. A flex line (`flex: 1` for the selector, `min-width: 0` so that it shrinks instead of pushing) puts them side by side again; the "Action" label goes from `type="text"` (deprecated) to `link`. Measurement: `Send` from (434,288) under a 430 px selector to (793,252) on the same line as a 360 px selector
* **The user form is wider, and fits in the window.** The dialog was 700 px: 180 px fields, privilege and filter lists stuck to the right edge, cut descriptions. It goes to `min(1040px, 94vw)` (350 px fields); the lists needed a second fix — `element-legacy.css` gives them `flex: 0 0 250px` and `el-row` is a flex container, so the `<el-transfer>` sized itself on its content and the panels fell to 200 px whatever the width: width 100 % and flex basis 300 px. Expanded, the form is 938 px and its footer went off-screen on a 577 px window: `max-height: 90vh` with a scrolling body, footer always visible
* **The test bench covers the screens.** 46 files, 394 tests: Login, Main, Privacy, App.vue, the routing table, GenericComponent, GenericTable, QueryBar, QueryFilter, User, and the screens of 3.6.6. Coverage now runs over all `src` (javascript **and** `.vue`) and is displayed in GitHub — run summary, HTML artifact and pull request comment updated in place. The runner moves to Vitest 5, which brings the critical `npm audit` advisories down to zero; the measurement changes with it (AST remapping) and the thresholds are re-based, as the comment of `vitest.config.mjs` says

## V3.6.6 07/Nov/2026
*No application change: tests only. The shipped bundle is byte-for-byte the 3.6.5 one.*
* **Coverage of the screens that produced this week's regressions.** Four specs mount components that had none: `Map` (88,7 % of statements), `Activity` (88,2 %), `LambdaEditor` (74,9 %), `ReportEditor` (65,9 %). Overall statements go from **23,3 % to 33,9 %**, the component block from **17,2 % to 29,0 %**, with 36 new tests (394 in total)
* `Map` — the two defects of the day are pinned: with no zoom and no centre configured the component falls back to zoom 2 / null island (Leaflet throws on `L.latLng(undefined, undefined)`, and a `zoom` of `undefined` leaves the tile layer with nothing to draw), it frames itself on its markers, keeps **one marker per position** (1 000 documents over a dozen positions froze the tab) and caps the loop
* `Activity` — the counters' colours are asserted (neutral = `var(--nyx-text, #303133)`, errors red or green), the exact aggregation count and its fallback to capped buckets, the `top endpoints` percentages, the query (epoch millis on the configured time field, `onlyErrors`, export without aggs), and the API error being shown instead of an empty table
* `LambdaEditor` — the log sits in a `div.lambda-log` (full width, not inside a flex `el-row`), long lines wrap, the *Edit code* button carries no `min-width`, the working copy does not touch the received record, the runner → file → function hierarchy comes from the index, and the notebook opens with the Jupyter token
* `ReportEditor` — the footer holds two 12/12 columns (two `span="24"` cannot share a row) with *Edit code* on the left and *Cancel/Confirm* on the right, and the help cards all carry `.desc-card` (three of the five rows did not, which is why the dark theme missed them)
* `tests/invalid-inline-style.spec.js` — a source guard on the whole family: a `style="{...}"` left over from Vue 2 in a template attribute is discarded by the browser, and that is how `LogViewer`'s log stopped wrapping without a single error
* The whole-`src` thresholds move with the measurement base (33 / 83 / 44 / 33) and say so in the config: statements rise, branches and functions fall because the untested parts of those screens are now measured. The per-glob floors are unchanged and remain the ones to read

## V3.6.5 07/Nov/2026
* **The lambda log takes the full width.** The viewer sat in an `el-row`, which Element Plus renders as a flex container: the log card shrank to the width of its content — 672 px in a 767 px pane, measured on `Lambdas` (`id_29242399`). A `div` with `width: 100%` and `min-width: 0` restores the full width and lets it shrink with the window instead of pushing a scrollbar
* **Long log lines wrap.** The message cell carried `style="{ color:black;white-space: pre-wrap !important;}"` — Vue 2 markup left in an attribute, which the browser discards as invalid CSS: neither the colour nor the wrap applied, so a JSON line widened the table. It is a `.log-message` class now (`pre-wrap` + `overflow-wrap: anywhere`)
* The *Edit code* button of that dialog loses its `min-width: 112px`, which — with the four field columns of the same row — pushed the row past the available width and put a horizontal scrollbar under the dialog

## V3.6.4 07/Nov/2026
* **Grafana follows the theme.** The dashboards are embedded in an iframe and keep their own theme: in the dark console the panel stayed white. `createUrl` now appends `theme=light|dark`, which Grafana reads from the URL (verified on the 13.2.4 instance: the same dashboard goes from `rgb(251,251,251)` to `rgb(17,18,23)`, text `rgb(204,204,220)`). All 17 Grafana applications follow without being edited
* The switch is live: `Grafana.vue` listens to `nyx:theme` and recomputes the iframe's `src`, so passing from Dark to Light restyles the panel without a reload (measured: `&theme=dark` → `&theme=light`, background back to `rgb(251,251,251)`)
* An application that pins its own theme in *Extra parameters* keeps it — the per-app choice is an explicit decision, the console-wide one is a default. `src/utils/grafanaTheme.js` holds the rule and is tested (7 tests)
* *Extra parameters* are now appended whether or not the time selector is on: the field was silently ignored when the dashboard had a time selector, which would have made a per-app `theme=` impossible on most of them

## V3.6.3 07/Nov/2026
* **The SVG chart's axes are readable.** In `BarChart.vue` the x labels had a class, but the three y labels (maximum, zero, the rotated *documents*) and the title had **none**: they took the browser's default black, so on the dark background only the abscissa was dimly visible and the ordinate not at all. The root `<svg>` gains a `barchart` class, the y labels a `barchart_axis` class, both painted from `dark.css` in the console's text colour
* **The Activity app**: the path column of *top endpoints* is drawn over a very light blue bar while the text takes the theme's light colour — a light path on a light bar. The bar becomes a translucent blue in dark, and the four KPI counters stop being hard-coded `#303133`: the neutral value is now `var(--nyx-text, #303133)`, so the red and the green stay semantic and the neutral reads on both themes
* **The code editor follows the theme.** `vue3-ace-editor` reads its `theme` once, in its own `mounted`, and `ace.edit` falls back silently to `ace-tm` (white) when the theme module is not loaded — so `theme="chrome"` in five files had in fact never applied. A `mixins/aceTheme.js` keeps the prop in step *and* re-themes the mounted editors through `el.env.editor`, and `dark.css` repaints the editor and its token palette (the `ace-tm` colours are made for a white background). A guard test fails the build if an `<editor>` ever goes back to a fixed theme
* **Why a French account saw the Greek calendar.** Element Plus was installed once, at boot, with the language read from the browser (`app.use(ElementPlus, { locale })`); the console's own labels then switched to the account's language at login, but the date picker kept the boot language for the whole session. A browser that remembered Greek therefore showed a French console with a Greek calendar. `App.vue` now wraps the console in `el-config-provider`, so every Element Plus component follows `$i18n.locale`; the chosen language is also written back to `localStorage.nyx_language` and to `<html lang>`. Reproduced by starting in `el` (login page Greek) and signing in with a French account: calendar French, storage rewritten to `fr`
* `range-separator="To"` was hard-coded English in the time selector: `time.to` is now translated in the four catalogues (`au`, `to`, `tot`, `έως`)
* 243 tests, gate green (98,86 % statements / 96,45 % branches / 96,29 % functions), `aceTheme.js` at 100 %

## V3.6.2 07/Nov/2026
* **The charts follow the theme.** Vega draws on a canvas, so no stylesheet could reach it: the applications' specs leave `config` empty, which means Vega's default theme — black labels and titles, invisible on the dark page. `src/utils/chartTheme.js` repaints the **chrome** (axis, legend, title, text, transparent background) and leaves the marks alone, since their colours carry the meaning the author chose; a key written in the spec still wins. Verified on `/main/id_24434251`: axis labels light, bars untouched
* The hand-drawn SVG chart (`BarChart.vue`) gets the same treatment in CSS — its background, ticks and selection rectangle are classes, so `html.dark` rules suffice. Bars keep the brand blue
* A `nyx:theme` event on `document`, dispatched by `applyTheme`, lets a chart redraw itself when the choice changes; `Vega.vue` listens and re-embeds, and drops the listener on unmount
* **The description cards of the application editor and of the report editor are readable in dark.** They carry an inline `background-color:rgb(236,245,255)` (and one cream `rgb(255,245,236)`), so the light text landed on a light card — only an `!important` rule can override an inline style. The report editor's three rows without `.transition-box` now carry a `desc-card` class so the same rule reaches them
* **The report editor's footer holds on one line**: two `el-col :span="24"` cannot share a row, so *Edit code* sat above *Cancel/Confirm*. Left column 12 (edit), right column 12 (cancel/confirm), both at the same y — measured 147 / 920 / 1021 px on one line
* `tests/chartTheme.spec.js` (4 tests: marks untouched, explicit keys win, no config, no mutation) and 4 more on `theme.js` (`currentTheme`, the event's detail, a document without event support). 234 tests, gate green

## V3.6.1 07/Nov/2026
* The theme now survives a reload that has no local copy: the session snapshot (`authResponse`, written at login time) is touched when a preference is saved, so clearing `localStorage.nyx_theme` and reloading no longer replays the previous theme. Verified: save Dark → clear the local copy → reload → still dark, and the copy is rewritten
* `rememberInSession()` in `theme.js` (with its tests) rather than in the component: an unreadable or hostile storage answers false instead of throwing, three new tests
* Note for the release itself: `v3.6.0` already existed on Docker Hub from the Vue 2 line (amd64 only, image built long before), so a `docker pull` right after the merge served that **old** console while the version string still read 3.6.0. Check `docker image inspect … --format '{{.Created}}'` after the pull, not just the tag

## V3.6.0 07/Nov/2026
* **Light, dark, or automatic.** A third block in the avatar menu (`Logout.vue`): *Appearance* — Light, Dark, Auto (by hour). The choice applies at once, without a reload, and the tick marks the current one
* *Auto* darkens from 20:00 and lightens at 07:00, and re-reads the clock every ten minutes and when the tab comes back, so a console left open all day follows the evening instead of staying white
* **The preference follows the account.** It is written on the user document (`theme`, next to `language` and `privileges`) through the new `POST /cred/preferences` — so another browser, another machine, the same theme. `localStorage` keeps a copy so a reload paints the right theme before the session restores, without a white flash; the account value takes over as soon as the login returns
* A save that fails is said: the theme still holds locally, but the notification says it was not saved on the account rather than claiming success
* The dark theme itself: `styles/dark.css` repaints what the console paints by hand — page background, header (whitened by the API's `ui_css` with an `!important`), left menu, module cards, dialogs, and the table headers that `Main.vue` forces to **black** text (`html.dark .el-table th > .cell`), which was the least readable part of the first attempt. Element Plus supplies the rest through its own `html.dark` variables
* `tests/theme.spec.js`: 17 tests — the hour boundaries (19:59 / 20:00 / 06:59 / 07:00), an unknown value falling back to auto, a storage that refuses reads and writes, the DOM attributes, and the auto watch (tick, focus, unsubscribe). `theme.js` at 100 % statements and branches

## V3.5.3 07/Nov/2026
* **The map draws again.** A map whose editor left the zoom and the centre empty (they are optional) opened on a grey background with no marker: Leaflet throws `Invalid LatLng object` on `L.latLng(undefined, undefined)`, and a `zoom` of `undefined` leaves the tile layer with no view to compute. The component now defaults to zoom 2 and a null island, and — when the editor imposes no centre — frames itself on its markers (`fitBounds`, or `setView(13)` for a single point). Measured on `/main/id_33529269`: **15 tiles loaded, 12 markers visible**, the view spanning Belgium
* One marker per position: the example index returns 1000 documents over a dozen positions, and stacking 1000 icons on one point froze the browser tab (the page stopped answering, DOM probes timed out). The cap is 500 and duplicates are collapsed; the popup still opens the document behind the first one
* **The module cards are back.** `.process_ok` and its `:hover` had been deleted as dead CSS — the class is built by `:class="'process_' + dat.css_class"`, so it appears in no template and the healthy modules' cards lost their size, border and background (`Overview`, `/main/id_19934403`: 13 cards at 284 × 124, white, 2 px border)

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
* Coverage is measured and gated: v8 over `src` javascript, minus the translation and notice text, the entry point and the router (which imports `.vue` files a node environment cannot parse). Measured on that measurement base, the same suite goes from **56.6 % to 99.1 % of lines, 57.4 % to 98.0 % of branches, 31.3 % to 96.7 % of functions** (the 43.28 % of the previous release was computed over data files and the entry point as well), and `ci-tests.yml` now runs `npm run test:coverage` so a pull request that loses assertions turns red instead of passing quietly
* The 62 single-file components are still outside that measurement base — they are about three quarters of the code, and measuring them needs `jsdom` + `@vue/test-utils@1` + the vue2 plugin: that is the next decision, not a silent gap. The comment at the top of `vitest.config.mjs` says so
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
