/**
 * The ACE modules the console uses, registered once, at import time.
 *
 * ACE knows nothing about bundlers: `ace.edit(el, { theme: 'ace/theme/tomorrow_night' })` looks the
 * module up in its own registry, and when it is not there it **fetches it over HTTP** from
 * `basePath` — which, for a bundle served under `/js/`, means `GET /js/theme-tomorrow_night.js`.
 * Nothing serves that file, so the browser reported two 404s on every screen with an editor:
 *
 *   GET https://energy.marmar.ovh/js/mode-yaml.js             404
 *   GET https://energy.marmar.ovh/js/theme-tomorrow_night.js  404
 *
 * The modules were in the bundle all along, but the `require(...)` calls that register them sat in
 * the `@init` handler and in `mounted`, which run *after* `ace.edit` has already asked for the
 * theme. Hence the 404s, and hence the white editor the `theme="chrome"` prop never fixed (see
 * `mixins/aceTheme.js`).
 *
 * Side-effect imports have no such ordering problem: the modules are defined when this file is
 * evaluated, which is before any editor exists. The list below is the union of what the six editor
 * screens asked for separately, `snippets/*` included — the language tools resolve their snippets
 * the same way, over HTTP, when they are missing.
 */

import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-less";
import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/snippets/javascript";
import "ace-builds/src-noconflict/snippets/sql";
import "ace-builds/src-noconflict/theme-chrome";
import "ace-builds/src-noconflict/theme-tomorrow_night";
