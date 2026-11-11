# Vue 3 / Element Plus branch — migration status

> **Historical record.** The migration below is done: Vue 3 and Element Plus have been in production
> since the 3.5.x line, and the current version is v3.6.29 (see `versions.md`). This file is kept as
> the journal of the work, not as a description of the current state. Where it and the code
> disagree, the code wins — in particular:
>
> - item 4 of "What is approximate or lost" (`el-radio :label`) was fixed in 3.6.27, along with the
>   19 radios it concerned;
> - item 5 (`el-config-provider`) was wrapped around the console in 3.6.3;
> - the suite is **736 tests** today, not the 153 / 197 quoted below;
> - the trial branch this was written on no longer exists: the work landed on `master`.

Trial branch, **not intended for production**. It compiles, the application starts, the login
screen renders and its test suite passes. The rest is rework, screen by screen.

- Base: `fix/report-editor-jupyter-token` (= the code actually deployed in v3.31.21, which is not on
  `master` — see "Worth knowing" below)
- `package.json` version: `4.0.0-vue3-test`
- Verified: `npm run build` ✅ · `npx vitest run` **153/153** ✅ · browser render with no JS error ✅

## What has been done

| topic | before | after |
|---|---|---|
| framework | Vue 2.7.16 | **Vue 3.5** (`createApp`) |
| components | Element UI 2.15 | **Element Plus 2.14** (+ dark theme in CSS variables, imported) |
| router | Vue Router 3, implicit hash mode | **Vue Router 4**, `createWebHashHistory` (URLs `#/…` kept) |
| state | Vuex 3 | **Vuex 4** (`createStore`) |
| translations | vue-i18n 8 | **vue-i18n 9**, `legacy: true` (so `this.$t` and `this.$i18n.locale` still work) |
| template filters | 7 uses of `{{ x \| formatDate }}` | `$filters.formatDate(x)` / `$numeral(x, fmt)` (Vue 3 has no filters any more) |
| event bus | `new Vue()` + `$on/$off/$emit` | **mitt**, with the `$on/$off/$emit` aliases kept |
| `Vue.component(...)` | 53 calls at import time | queue in `src/utils/vue3shim.js`, replayed before mount |
| slots | `slot="x"` / `slot-scope` | 59 → `#default`, **49 named slots** → `<template #x>` |
| misc | `beforeDestroy` (24), `.native` (6), `:visible.sync` (21) | `beforeUnmount`, removed, `v-model` |

Libraries replaced, for lack of a Vue 3 release:

| Vue 2 package | replacement |
|---|---|
| `vue2-ace-editor` + `brace` | `vue3-ace-editor` + `ace-builds` (imports rewritten) |
| `vue2-leaflet` | `@vue-leaflet/vue-leaflet` |
| `vue-awesome` | `src/components/VIcon.vue` (Font Awesome 6, `regular/…` prefixes handled) |
| `vue-browser-detect-plugin` | `src/utils/browser.js` (`detect-browser`) |
| `vue-browser-geolocation` | `src/utils/geolocation.js` (promise over `navigator.geolocation`) |
| `vue-numeral-filter` | `numeral` + global `$numeral` |
| `vue-infinite-loading` | `vue3-infinite-loading` |
| `vuedraggable` 2 | `vuedraggable` 4 |
| `tiptap` 1 (+ prosemirror) | **removed** — see the limitation below |

## What is approximate or lost

1. **`FreeTextDetails` (rich text editor)**: tiptap 1 has no direct Vue 3 equivalent. Replaced by a
   text area that edits the raw HTML. The contract (`config`, `freetextchanged`) is kept, the
   formatting toolbar is gone. To be redone with tiptap 3.
2. **Map (`Map.vue`)**: marker clustering (`vue2-leaflet-markercluster`) is removed — the markers
   render individually. `leaflet-fa-markers` loads through `require()` after setting `window.L`,
   otherwise it does not find Leaflet.
3. **Icons**: `vue-awesome` applied `scale` to the glyph size; `VIcon` applies it as `font-size`.
   The rendering is close, not pixel-identical.
4. **Element Plus**: the components changed a few props (`type="text"` → `link`, `el-radio :label`
   → `:value`). Nothing is fixed here: it does not prevent compilation.
5. **`el-config-provider`**: the language of the Element Plus components is fixed at startup.
   Switching language at runtime (language button) does not translate the Element widgets unless
   the application is wrapped in `<el-config-provider :locale>`.

## How to run

```sh
npm install --allow-remote=root   # the xlsx package comes from a URL, npm 12 refuses it by default
npm run serve                     # or npm run build then serve dist/
npx vitest run                    # 153 tests
```

## Dark mode

`src/main.js` imports `element-plus/theme-chalk/dark/css-vars.css`. Setting `data-theme="dark"` on
`<html>` is enough to switch **the Element Plus components**. The login screen does not change, and
that is the finding of the analysis: the 142 hard-coded colours in 29 files of the application must
move to CSS variables before a full theme is possible.

## Rendering: why everything was off, and what was fixed

Three causes, measured by comparing the computed styles of the login screen with production:

1. **`theme/index.css` was the compiled Element UI 2 theme** (1 MB, 4474 `.el-*` rules), loaded
   *after* Element Plus. It therefore overrode the components with their old rules: double borders
   on the fields, wrong widths. It is removed; the application's theme comes from
   `api/v1/ui_css` (served by the API), which stays loaded.
2. **Component heights**: Element UI 2 made 36 px fields, Element Plus starts at 32.
   `src/styles/element-legacy.css` sets `--el-component-size: 36px`.
3. **The login page title** picked up the browser default `h1` (32 px, bold) instead of the 20 px
   regular weight of Element UI: explicit rule in `Login.vue`.

The button also carried `color="#048"` (a property unknown to Element UI 2, therefore without
effect) and `size="medium"` (a value Element Plus does not know): both are removed.

After the fix, the login screen is **pixel-identical to production**: card 402 × 202, fields
360 × 36, button 360 × 40 `#a0cfff`, title 20 px / 400, same gradient.

In development, the `api/v1/ui_css` theme must be taken from the pointed API (`?api=…`), otherwise
`index.html` requests it relative to the webpack server, which answers 404: that is what `main.js`
does now, only outside production.

## Icons and sizes: what could not be seen

Element UI 2 drew its icons with a **font** (`class="el-icon-edit"`), Element Plus uses **SVG
components**. Nothing breaks in the console, but the buttons concerned render empty — hence the
impression of "broken" buttons here and there.

- 66 `icon="el-icon-x"` attributes converted to `:icon="$icons.X"` (and `:prefix-icon` on the fields).
- 7 icons set as `<i class="el-icon-x">` converted to `<el-icon><component :is="$icons.X" /></el-icon>`.
- The 28 component names used are exposed once and for all in `main.js`
  (`app.config.globalProperties.$icons`), to avoid one import per file.
- The **existing configurations** still store original names (`linkbuttonicon:
  "el-icon-download"`): `src/utils/icons.js` translates them at render time, otherwise the button
  would be empty. Future records can carry the Element Plus name directly (`Download`).

On the size side, `size="mini"` disappeared from Element Plus: **349 occurrences** fell back to the
default size, which thickens every table and button bar. They moved to `size="small"`.

Five tests check that the icons really produce a mounted `<svg>` (jsdom), three that the mapping
table resolves every inherited name.

## Left bar: `el-submenu` no longer exists

Element UI 2: `<el-submenu>`. Element Plus: **`<el-sub-menu>`**. A name that no longer exists
produces no error — Vue treats it as an unknown component, renders the content without the
collapse/expand behaviour, and the left bar stops opening. `text-color` has also disappeared in
favour of a CSS variable (`--el-menu-text-color`).

The same rename breaks the **styles**: the rules of `Main.vue` targeted `.el-submenu__title` and
`.el-submenu .el-menu-item` (40 px high), which no longer match anything — the entries therefore
fell back to the default 56 px, hence a much taller left bar. The rules are duplicated for
`.el-sub-menu__title` and `.el-sub-menu .el-menu-item`.

And the header centres its children with `line-height: 60px` while the Element Plus buttons are
`inline-flex` (therefore sitting on the baseline) and sized by `--el-component-size`: the round
button on the right sank and shrank (36 px instead of 40). It is realigned and set back to 40 px.

Two tests now cover this family of failures, because it produces no error:
`tests/element-tags.spec.js` checks that **every `el-*` tag used is really exported by
Element Plus**, and `tests/element-classes.spec.js` that **every `el-*` class cited in our styles
exists in its CSS sheet**. That second audit now finds only four classes, all accepted (the
project's own class name and the old selectors kept).

## Modal windows: a different box model

Element UI 2 applied the padding to `__header` and `__body`; Element Plus puts it on
`.el-dialog` itself (16 px). Consequence: the blue header (`api/v1/ui_css`) no longer touched the
edges of the window — it floated inside, without the rounded corners, over a 40 px band, and the
close cross stayed black. The Element UI 2 box model is restored: full-width band of 54 px, white
title of 18 px, white cross, body at 30/20 px.

Verified outside the application, with a harness page loading the compiled sheet and `ui_css`:
header at 0 px from the edges, 520 px wide like the window, background `rgb(64,158,255)`.

## Seven components rendered nothing, and the header measurements

The codemod had turned `<template slot="items">` into `<template #items>` **at the root** of seven
components (Form, Kibana, Grafana, External, Upload, Vega, ChangePassword). A template block that
carries a `v-slot` is rendered by nobody: those screens were empty, without error. The roots are
cleaned and `tests/template-root.spec.js` now rejects a root `<template>` with a slot.

`ChangePassword` used `:visible="visible"`, a property that no longer exists: the dialog never
opened. It is `v-model="visible"`.

Finally, for the header and the dialogs, the comparison was made **against the real reference**:
two harness pages, one loading Element UI 2.15.14 and `ui_css` (production), the other the branch's
compiled sheet. Identical measurements after the fix:

| measurement | production | branch |
|---|---|---|
| round header buttons | 39 x 40, 9 px from the top | 40 x 40, at 9 px |
| title band | 54 px, title at 20 px from the edge | 54 px, title at 20 px |
| close cross | 16 px, at 20/20 | 24 px, at 20/20 |
| application buttons | 39 x 40 | 40 x 40 |

## Worth knowing (outside the migration)

- `master` carries version **3.31.19** while production runs **3.31.21**: the last two releases
  (session hygiene, JupyterLab token) live only on branches.
- `.eslintrc.js` was not adapted to `eslint-plugin-vue` 9 / Vue 3 (the build does not run ESLint,
  `lintOnSave: false`).
- `npm install` requires `--allow-remote=root`: the `xlsx` dependency is a URL to cdn.sheetjs.com.

## Status on 2026-11-06 (end of session)

**Comparison deployment**: branch `feat/vue3-element-plus`, last commit `f2714cf`. Image
`snuids/nyx_ui:v4.0.0-nyxv3`, built on `energy` with `--build-arg PUBLIC_PATH=/nyxv3/`, served under
**https://energy.marmar.ovh/nyxv3/** by the `nyx_ui_v3` service of the production compose
(`BASE_PATH=/nyxv3/`) and two nginx routes (`/nyxv3/`, `/nyxv3/api/`). The root stays on 3.31.21.

**Tests**: 197, including static guard rails that each prevented a real regression —
`template-slots`, `template-root`, `i18n-instance` (`i18n.t` forbidden), `draggable-item`,
`global-properties` (every `this.$xxx` must be declared in `main.js`), `vicon-color`.

**Fixed during the comparison trials** (each point = one commit): `i18n.t` in `data()` (windows
that did not open), `<draggable>` without an `#item` slot (empty Table tab), `el-row` in flex
overriding the banners and the cards, `el-input` in block (field under the buttons), `el-col`
without `span` (dialog footer), missing `$getLocation`, icon sizes, popovers.

**Deliberate divergences from production** (to be reported to prod if wanted):
- periodic report action column: 260 px instead of 220 (the search field no longer falls under the
  buttons);
- ~~download button to the right of the field~~ — back inside the field on 2026-11-07 (see below);
- 10 px / 32 px spacing in the filter banner.

The other differences found were already present in production and were not changed: empty
"Time Selector" combobox, periodic report stacking its field under the buttons when a row is
selected.

## "Users Config" screen (compared on 2026-11-07)

Comparison of `/#/main/id_28534460` with `/nyxv3/#/main/id_28534460`, same account, 1280 × 577
window, same selectors and `getBoundingClientRect` / `getComputedStyle` on both sides.

| measurement | production (Element UI 2) | branch before | branch after |
|---|---|---|---|
| table row height | 41 px | 33 px | **41 px** |
| vertical padding of the cells | 6 px | 4 px | **6 px** |
| horizontal padding of `.cell` | 10 px | 8 px | **10 px** |
| header weight | 700 | 600 | **700** |
| action buttons of the column | 44 × 28, padding 7/15 | 36 × 24, padding 5/11 | **44 × 28** |
| header "+" button | 28 × 28 | 28 × 28 | 28 × 28 |
| search field | 150 × 28, text at 26 px from the edge | 150 × 26, text at 8 px | **150 × 28, text at 26 px** |
| header row | 59 px | 42 px | 54 px |
| Privileges / Filters columns | 102 / 101 px | 94 / 94 px | 94 / 94 px |
| "User Form" window | 947 px | 918 px | 958 px |
| dialog form row | 41 px | 32 px | 40 px |
| dialog footer buttons | 89 / 92 px | 95 / 98 px | **89 / 92 px** |

Four causes, all in `src/styles/element-legacy.css` (Element UI 2 rules that the theme sheet took
with it, or sizes that `size="small"` shifted after the `mini` conversion):

1. **Cells**: Element UI 2's "mini" is 6 px vertical padding, a `.cell` at 10 px and a 700 header;
   Element Plus's "small", 4 px, 8 px and 600. The rows were 33 px.
2. **Buttons and fields `size="small"`** (349 ex-`mini` calls): Element Plus renders them at 24 px,
   with 5/11 of padding; 28 px and 7/15 are needed. `--el-component-size-small` moves to 28 px and
   the text of a `small` field gets back its 15 px inset.
3. **Table header**: the full width of `.cell` and the `nowrap` of Element UI 2 were missing
   (the search field wrapped, header at 70 px); and the field, aligned on the baseline, sank under
   the "+" button — centred, it gets back the production position.
4. **Dialogs**: the dialog footer kept `12px 23px` (buttons 6 px too wide) and the content of an
   `el-form-item` no longer has a line height in Element Plus (it is `flex`), so the rows were
   32 px instead of 41.

Finally, the action column showed a **pencil in a square** (`$icons.Edit`, Element Plus's `Edit`
icon) where production draws the plain pencil of `el-icon-edit`: the five edit buttons move to
`$icons.EditPen`.

What remains different, measured and not fixed:

- **header row 54 px instead of 59**: Element UI 2 got 48 px of content (a 40 px line plus the
  room for the descender); Element Plus no longer has that overflow. The controls are at the same
  coordinates (button at 81 px from the top against 80, field at 80 px);
- **automatic Privileges / Filters columns at 94 px instead of 102 / 101**: in production the sum
  of the columns (1063) exceeds the table width (1048); Element Plus distributes the remaining
  room equally;
- **"User Form" window at 958 px instead of 947**: the Privileges section measures 319 px against
  303, the body of an `el-transfer` panel no longer having the fixed 246 px of Element UI 2.

Non-regression check: `Reports › Periodic` (same columns, same 59 px row, only the already
accepted 260 px gap of the action column), 197 tests green, application rendered without error.

## Header time selector (2026-11-07)

On `Modules › Calls` (`#/main/id_21206339`), the date/time field and the **Absolute /
Relative** buttons were neither at the same height nor of the same size: field 28 px at 16-18 px
from the top, radio group 22 px six pixels lower. Production measurement, same screen, same
window: field [586, 17, 400, 28], group [994, 17, 164, 28].

| measurement | production | branch before | branch after |
|---|---|---|---|
| date/time field | 28 px at y = 17 | 28 px at y = 16 | **28 px at y = 17** |
| Absolute/Relative group | 28 px at y = 17 | 22 px at y = 22 | **28 px at y = 17** |
| "Last 4 h" button (relative mode) | 28 px | 26 px | **28 px at y = 17** |

Three causes: the `small` radio buttons (ex-`mini`) lose 6 px (`padding: 5px 11px` in Element
Plus against `7px 15px` in Element UI 2); `el-radio-group` aligns on the baseline, so a shorter
group sinks under the field; and the field carried a `style="top:1px"` inherited from
Element UI 2, which shifted its paint one pixel more than its neighbour. Rules added:
`.el-radio-button--small .el-radio-button__inner { padding: 7px 15px; height: 28px }`,
`.time-selector-row .el-radio-group { vertical-align: middle; position: relative; top: 1px }`, and
the inline style removed from `Main.vue`.

Left: the date field measures 420 px instead of 400 (the "To" separator is a 50 px flex block in
Element Plus, 29 px in production); the whole block is right-aligned, the gap only shows on the
left edge of the field.

## Query bar: the download button is back inside the field (2026-11-07)

On `Docker › Containers` (`#/main/id_21834322`), the download button was set **next to** the
field, in the 37 px separating it from the "Refresh" button: it floated between the two. In
production it is inside the field, 5 px from its right edge.

| measurement | production | branch before | branch after |
|---|---|---|---|
| query field | [213, 118, 913, 28] | [213, 118, 887, 28] | **[213, 118, 913, 28]** |
| download button | [1101, 118, 20, 28] | outside, [1117, 118, 24, 28] | **[1101, 118, 20, 28]** |
| distance to the right edge | 5 px | — | **5 px** |

The button is put back into the field's `slot suffix` (as in the original code);
`.query-bar .query-input .el-input__wrapper { padding: 0 5px 0 15px }` is needed — three classes,
because the global rule `.el-input--small .el-input__wrapper` is compiled further down and would
win at equal specificity — otherwise the suffix inherits the 15 px padding (icon at 15 px from the
edge) and the field grows by 2 px. The `.xlsx` / `.csv` popover still opens on hover.
