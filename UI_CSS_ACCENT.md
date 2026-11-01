# Changing the NYX UI accent via `api/v1/ui_css`

This document describes how to change the Element UI accent colour globally by editing the
CSS document served by the backend at `api/v1/ui_css`, without rebuilding the frontend.

It was tested on `energy.marmar.ovh` (server `ubuntu@51.178.48.8`) with accent `#004080`;
that change was reverted afterwards.

---

## 1. How `ui_css` works in this stack

- The frontend (`public/index.html`) dynamically appends a stylesheet link:

  ```html
  <link rel="stylesheet" href="api/v1/ui_css">
  ```

- The backend route is in the `nyx_rest` container (`routes/misc.py`):

  ```python
  @app.route('/api/v1/ui_css')
  def cssRest():
      res = state.es.get(index="nyx_config", id="nyx_css")
      return Response(res["_source"]["file"], mimetype='text/css')
  ```

- The CSS is stored in Elasticsearch as:

  | Item | Value |
  |---|---|
  | Alias | `nyx_config` |
  | Concrete index (at the time of writing) | `reindexed-nyx_config-v8` |
  | Document id | `nyx_css` |
  | Field | `_source.file` |

- **Important:** the link is appended while the HTML `<head>` is parsed, so it ends up
  **before** the generated bundle CSS:
  `chunk-vendors.*.css` and `app.*.css` are injected after it. Equal-specificity rules from
  `ui_css` therefore lose to Element UI and to the app's own CSS.
  - Every override must use `!important`, and
  - app rules that already use `!important` on the same selector need a more specific selector
    in `ui_css`.

- The URL is relative (`api/v1/ui_css`), not derived from the `?api=` parameter. In local
  `npm run serve` sessions it requests the dev server, not the remote backend, unless
  `devServer.proxy` is configured.

- The response has no `Cache-Control`, so browsers may keep an old copy; use a hard refresh
  or a new session when testing.

---

## 2. Resulting palette

Element UI derives all primary states from `$--color-primary`. The equivalent shades for
`#004080` are:

| Element shade | Default (`#409EFF`) | New (`#004080`) |
|---|---|---|
| primary | `#409EFF` | `#004080` |
| light-1 | `#53A8FF` | `#1A538D` |
| light-2 / link hover | `#66B1FF` | `#336699` |
| light-3 | `#79BBFF` | `#4D79A6` |
| light-4 | `#8CC5FF` | `#668CB3` |
| light-5 / disabled primary | `#A0CFFF` | `#80A0C0` |
| light-6 | `#B3D8FF` | `#99B3CC` |
| light-7 | `#C6E2FF` | `#B3C6D9` |
| light-8 | `#D9ECFF` | `#CCD9E6` |
| light-9 / plain background | `#ECF5FF` | `#E6ECF2` |
| active (10 % black) | `#3A8EE6` | `#003A73` |
| calendar selected | `#F2F8FE` | `#E6ECF2` |
| focus `rgba(...)` | `rgba(64,158,255,a)` | `rgba(0,64,128,a)` |

For a different accent, recompute the light shades with
`mix(white, accent, n*10%)` and the active shade with `mix(black, accent, 10%)`.

---

## 3. Generate the override stylesheet

The repository already contains the effective theme in `theme/index.css` and the stock
Element theme in `node_modules/element-ui/lib/theme-chalk/index.css`. The script below
extracts every declaration that uses an old accent colour, rewrites it to the new palette,
marks it `!important`, de-duplicates the repeated blocks, and appends fixes for the
app's own hard-coded accents.

Requirements: Node.js and the repo's `postcss` (already installed via Vue CLI).

Save the script to `/tmp/gen_accent.js`:

```js
const fs = require('fs');
const postcss = require(process.cwd() + '/node_modules/postcss');

const MAP = {
  '#409EFF': '#004080',
  '#53A8FF': '#1A538D',
  '#66B1FF': '#336699',
  '#79BBFF': '#4D79A6',
  '#8CC5FF': '#668CB3',
  '#A0CFFF': '#80A0C0',
  '#B3D8FF': '#99B3CC',
  '#C6E2FF': '#B3C6D9',
  '#D9ECFF': '#CCD9E6',
  '#ECF5FF': '#E6ECF2',
  '#3A8EE6': '#003A73',
  '#F2F8FE': '#E6ECF2'
};

function mapValue(value) {
  let changed = false;
  let out = value.replace(/#[0-9a-f]{6}/gi, (m) => {
    const repl = MAP[m.toUpperCase()];
    if (repl) {
      changed = true;
      return repl;
    }
    return m;
  });
  out = out.replace(/rgba?\(\s*64\s*,\s*158\s*,\s*255\s*([^)]*)\)/gi, (m, rest) => {
    changed = true;
    return `rgba(0, 64, 128${rest})`;
  });
  return changed ? out : null;
}

function contextOf(node) {
  const ctx = [];
  let p = node.parent;
  while (p && p.type !== 'root') {
    if (p.type === 'atrule') {
      if (/keyframes$/i.test(p.name)) return null;
      ctx.unshift(`@${p.name} ${p.params}`.trim());
    }
    p = p.parent;
  }
  return ctx;
}

const files = [
  process.cwd() + '/node_modules/element-ui/lib/theme-chalk/index.css',
  process.cwd() + '/theme/index.css'
];

const decls = new Map();
for (const file of files) {
  const root = postcss.parse(fs.readFileSync(file, 'utf8'));
  root.walkRules((rule) => {
    const ctx = contextOf(rule);
    if (ctx === null) return;
    if (!rule.selector || rule.selector.startsWith('@')) return;
    rule.walkDecls((decl) => {
      const v = mapValue(decl.value || '');
      if (!v) return;
      const key = `${ctx.join('|')}||${rule.selector}||${decl.prop}`;
      decls.set(key, { ctx, selector: rule.selector, prop: decl.prop, value: v });
    });
  });
}

const groups = new Map();
for (const d of decls.values()) {
  const gkey = `${d.ctx.join('|')}||${d.selector}`;
  let g = groups.get(gkey);
  if (!g) {
    g = { ctx: d.ctx, selector: d.selector, props: new Map() };
    groups.set(gkey, g);
  }
  g.props.set(d.prop, d.value);
}

let out = '';
out += '/* NYX accent override: #409EFF palette -> #004080 palette.\n';
out += '   Generated from Element UI Chalk and theme/index.css.\n';
out += '   ui_css loads before the app bundle, so every declaration is !important. */\n\n';
for (const g of groups.values()) {
  const pad = '  '.repeat(g.ctx.length);
  for (const c of g.ctx) out += c + ' {\n';
  out += pad + g.selector + ' {\n';
  for (const [prop, value] of g.props) {
    out += pad + '  ' + prop + ': ' + value + ' !important;\n';
  }
  out += pad + '}\n';
  for (let i = 0; i < g.ctx.length; i++) out += '  '.repeat(g.ctx.length - 1 - i) + '}\n';
  out += '\n';
}

/* App-level styles that use the old accent or need extra specificity. */
out += `
/* src/views/Main.vue: app rule already uses !important */
.el-dialog .el-dialog__header,
.nyxapp .el-dialog__header {
  background-color: #004080 !important;
}

/* src/components/FileSystem.vue: app rule already uses !important */
.nyxapp .file-system-card .el-breadcrumb__inner:hover {
  color: #004080 !important;
}

/* src/components/IconPicker.vue */
.icon-item:hover {
  border-color: #004080 !important;
  background-color: #E6ECF2 !important;
}
.icon-item.selected {
  border-color: #004080 !important;
  background-color: #004080 !important;
}

/* src/components/appConfigEditor/ESTableEditor.vue */
#indexPattern:focus {
  border-color: #004080 !important;
}

/* src/components/BarChart.vue (SVG) */
.barchart_bar {
  fill: #0040806c !important;
  stroke: #004080 !important;
}
.barchart_bar:hover {
  fill: #004080 !important;
  stroke: #004080 !important;
}
.barchart_details {
  fill: #004080 !important;
}

/* src/components/ReportTask.vue inline icon colour */
svg.fa-icon[style*="#409EFF"],
svg.fa-icon[style*="#409eff"],
svg.fa-icon[style*="64, 158, 255"] {
  color: #004080 !important;
}

/* existing ui_css rule, overridden later in the same sheet */
.title-disclaimer {
  color: #004080 !important;
}
`;

fs.writeFileSync('/tmp/nyx_accent_004080.css', out);
console.log('rules:', groups.size, 'bytes:', out.length, 'lines:', out.split('\n').length);
```

Run it from the repository root:

```bash
cd /Users/snuids/Documents/GitHub/nyx_ui
node /tmp/gen_accent.js
```

Expected output is roughly:

```text
rules: 196 bytes: 21589 lines: 900
```

If the app or Element UI theme changes, regenerate this file. `theme/index.css` contains
several duplicated copies of the generated theme; the script de-duplicates them.

---

## 4. Back up the current Elasticsearch document

```bash
ssh -i /Users/snuids/.aws/airng_rsa ubuntu@51.178.48.8 '
TS=$(date +%Y%m%d_%H%M)
sudo docker exec docker-compose-nyx_restapi-1 python -c "
import requests
print(requests.get(\"http://elasticsearch:9200/nyx_config/_doc/nyx_css\").json()[\"_source\"][\"file\"], end=\"\")
" > ~/nyx_css_backup_${TS}.css
wc -c ~/nyx_css_backup_${TS}.css
'
```

Copy it locally as well if desired:

```bash
scp -i /Users/snuids/.aws/airng_rsa ubuntu@51.178.48.8:~/nyx_css_backup_*.css /tmp/
```

---

## 5. Upload and apply the override

Copy the generated CSS to the server and into the `nyx_rest` container:

```bash
scp -i /Users/snuids/.aws/airng_rsa /tmp/nyx_accent_004080.css ubuntu@51.178.48.8:~/nyx_accent_004080.css

ssh -i /Users/snuids/.aws/airng_rsa ubuntu@51.178.48.8 '
sudo docker cp ~/nyx_accent_004080.css docker-compose-nyx_restapi-1:/tmp/nyx_accent_004080.css
'
```

Build the new document and write it to Elasticsearch. This script resolves the write
index from the `nyx_config` alias, replaces the two old blues already present in the
stored CSS, and appends the generated override:

```bash
ssh -i /Users/snuids/.aws/airng_rsa ubuntu@51.178.48.8 '
sudo docker exec docker-compose-nyx_restapi-1 python -c "
import re
import requests

ES = \"http://elasticsearch:9200\"
alias = requests.get(ES + \"/_alias/nyx_config\").json()
index = list(alias.keys())[0]

old = requests.get(ES + \"/nyx_config/_doc/nyx_css\").json()[\"_source\"][\"file\"]
override = open(\"/tmp/nyx_accent_004080.css\").read()

new = re.sub(r\"#409eff\", \"#004080\", old, flags=re.I).rstrip()
new += \"\\n\\n/* ===== #004080 component accent overrides ===== */\\n\" + override

r = requests.put(ES + \"/\" + index + \"/_doc/nyx_css\", json={\"file\": new})
print(\"update:\", r.status_code, r.json().get(\"result\"), \"version:\", r.json().get(\"_version\"))

v = requests.get(ES + \"/nyx_config/_doc/nyx_css\").json()
f = v[\"_source\"][\"file\"]
print(\"index:\", v[\"_index\"], \"bytes:\", len(f), \"version:\", v.get(\"_version\"))
print(\"has 004080:\", \"#004080\" in f)
"
'
```

The document grows from ~1.1 KB to ~22.8 KB because it now contains the full override layer.

Note: if `_alias/nyx_config` maps to more than one index, pick the entry whose aliases
has `"is_write_index": true` instead of `list(alias.keys())[0]`.

---

## 6. Verify

Check the API endpoint from inside the backend container:

```bash
ssh -i /Users/snuids/.aws/airng_rsa ubuntu@51.178.48.8 '
sudo docker exec docker-compose-nyx_restapi-1 python -c "
import requests
r = requests.get(\"http://localhost:8000/api/v1/ui_css\")
print(r.status_code, r.headers.get(\"Content-Type\"), len(r.text))
"
'
```

And from outside through OpenResty:

```bash
curl -sk -o /tmp/ui_css_live.css -w "%{http_code} %{content_type} %{size_download}\n" \
  https://energy.marmar.ovh/api/v1/ui_css
grep -c "#004080" /tmp/ui_css_live.css
```

Expected: `200`, `text/css`, roughly 22.8 KB. `grep -c "#004080"` should report
roughly 200 lines (the override contains ~200 `#004080` rules, plus the two values
replaced in the original CSS).

Optional browser check (headless Chrome) — load `api/v1/ui_css` **before** the app CSS and
inspect computed styles:

```html
<link rel="stylesheet" href="https://energy.marmar.ovh/api/v1/ui_css">
<link rel="stylesheet" href="https://energy.marmar.ovh/css/chunk-vendors.<hash>.css">
<link rel="stylesheet" href="https://energy.marmar.ovh/css/app.<hash>.css">
<button class="el-button el-button--primary">Primary</button>
```

With the override applied, `.el-button--primary` computes to `rgb(0, 64, 128)`, and the
disabled state computes to `rgb(128, 160, 192)`.

In DevTools, verify:

- `.el-button--primary` → background/border `#004080`
- `.el-button--primary:hover` → `#336699`
- `.el-button--primary.is-disabled` → `#80A0C0`
- `.el-tabs__active-bar`, `.el-menu-item.is-active`, `.el-checkbox__input.is-checked .el-checkbox__inner`
- focused `.el-input__inner` border

---

## 7. Revert

Use the backup created in step 4:

```bash
ssh -i /Users/snuids/.aws/airng_rsa ubuntu@51.178.48.8 '
sudo docker cp ~/nyx_css_backup_YYYYMMDD_HHMM.css docker-compose-nyx_restapi-1:/tmp/nyx_css_old.css
sudo docker exec docker-compose-nyx_restapi-1 python -c "
import requests
css = open(\"/tmp/nyx_css_old.css\").read()
r = requests.put(\"http://elasticsearch:9200/reindexed-nyx_config-v8/_doc/nyx_css\", json={\"file\": css})
print(r.status_code, r.json().get(\"result\"), r.json().get(\"_version\"))
"
'
```

Or write to the resolved index from the alias if the concrete index changed:

```python
index = list(requests.get("http://elasticsearch:9200/_alias/nyx_config").json().keys())[0]
requests.put("http://elasticsearch:9200/" + index + "/_doc/nyx_css", json={"file": css})
```

Verify the endpoint is back to 1,156 bytes:

```bash
curl -sk https://energy.marmar.ovh/api/v1/ui_css | wc -c
```

---

## 8. Caveats

- **Load order:** `ui_css` is before the bundle; use `!important`. If an app rule also uses
  `!important`, raise the selector's specificity (as done for `.el-dialog__header`).
- **Hard-coded blues in the app:** `ui_css` covers the current ones via the script's tail,
  but a future code change can add more. Search before regenerating:

  ```bash
  grep -rn --include='*.vue' -E '#409EFF|#409eff|#66b1ff|#3a8ee6' src
  ```

  `src/views/Main.vue` and `src/components/FileSystem.vue` are the two places that use
  `!important` and therefore need more specific selectors.
- **Charts / data-driven colours:** Vega/ApexCharts palettes come from backend app
  configuration, not from Element CSS. The script only fixes the SVG classes in
  `BarChart.vue`.
- **Login page:** the gradient in `.login-container` is intentional and is not changed by
  this procedure.
- **Cache:** no `Cache-Control` is sent; hard-refresh the browser or use a private window.
- **Reindexing:** the document lives under an alias named `nyx_config`. If the platform
  reindexes that configuration from another source, the change may be overwritten; check
  `_version`/content after a reindex.
- **Long-term alternative:** recompiling Element UI from Sass with
  `$--color-primary: #004080` in the frontend (see the repo's `element-variables.scss`)
  produces the same palette without a 23 KB override layer and without `!important`.
