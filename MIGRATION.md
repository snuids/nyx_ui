# Branche Vue 3 / Element Plus — état de la migration

Branche d'essai, **pas destinée à la production**. Elle compile, l'application démarre, l'écran de
connexion s'affiche et sa suite de tests passe. Le reste est de la reprise écran par écran.

- Base : `fix/report-editor-jupyter-token` (= code réellement déployé en v3.31.21, qui n'est pas sur
  `master` — voir « À savoir » plus bas)
- Version du `package.json` : `4.0.0-vue3-test`
- Vérifié : `npm run build` ✅ · `npx vitest run` **153/153** ✅ · rendu navigateur sans erreur JS ✅

## Ce qui a été fait

| sujet | avant | après |
|---|---|---|
| framework | Vue 2.7.16 | **Vue 3.5** (`createApp`) |
| composants | Element UI 2.15 | **Element Plus 2.14** (+ thème sombre en variables CSS, importé) |
| routeur | Vue Router 3, mode hash implicite | **Vue Router 4**, `createWebHashHistory` (URL `#/…` conservées) |
| état | Vuex 3 | **Vuex 4** (`createStore`) |
| traductions | vue-i18n 8 | **vue-i18n 9**, `legacy: true` (donc `this.$t` et `this.$i18n.locale` marchent toujours) |
| filtres de template | 7 usages `{{ x \| formatDate }}` | `$filters.formatDate(x)` / `$numeral(x, fmt)` (Vue 3 n'a plus de filtres) |
| bus d'événements | `new Vue()` + `$on/$off/$emit` | **mitt**, avec les alias `$on/$off/$emit` conservés |
| `Vue.component(...)` | 53 appels à l'import | file d'attente dans `src/utils/vue3shim.js`, rejouée avant le montage |
| slots | `slot="x"` / `slot-scope` | 59 → `#default`, **49 slots nommés** → `<template #x>` |
| divers | `beforeDestroy` (24), `.native` (6), `:visible.sync` (21) | `beforeUnmount`, supprimés, `v-model` |

Bibliothèques remplacées, faute de version Vue 3 :

| paquet Vue 2 | remplacement |
|---|---|
| `vue2-ace-editor` + `brace` | `vue3-ace-editor` + `ace-builds` (imports réécrits) |
| `vue2-leaflet` | `@vue-leaflet/vue-leaflet` |
| `vue-awesome` | `src/components/VIcon.vue` (Font Awesome 6, préfixes `regular/…` gérés) |
| `vue-browser-detect-plugin` | `src/utils/browser.js` (`detect-browser`) |
| `vue-browser-geolocation` | `src/utils/geolocation.js` (promesse sur `navigator.geolocation`) |
| `vue-numeral-filter` | `numeral` + `$numeral` global |
| `vue-infinite-loading` | `vue3-infinite-loading` |
| `vuedraggable` 2 | `vuedraggable` 4 |
| `tiptap` 1 (+ prosemirror) | **retiré** — voir la limite ci-dessous |

## Ce qui est approximatif ou perdu

1. **`FreeTextDetails` (éditeur de texte riche)** : tiptap 1 n'a pas d'équivalent Vue 3 direct. Remplacé
   par une zone de texte qui édite le HTML source. Le contrat (`config`, `freetextchanged`) est
   conservé, la barre de mise en forme a disparu. À reprendre avec tiptap 3.
2. **Carte (`Map.vue`)** : le regroupement de marqueurs (`vue2-leaflet-markercluster`) est retiré —
   les marqueurs s'affichent individuellement. `leaflet-fa-markers` charge par `require()` après avoir
   posé `window.L`, sinon il ne trouve pas Leaflet.
3. **Icônes** : `vue-awesome` appliquait `scale` à la taille du glyphe ; `VIcon` l'applique en
   `font-size`. Le rendu est proche, pas identique au pixel.
4. **Élément Plus** : les composants ont changé de quelques props (`type="text"` → `link`,
   `el-radio :label` → `:value`). Rien n'est corrigé ici : ça n'empêche pas la compilation.
5. **`el-config-provider`** : la langue des composants Element Plus est fixée au démarrage. Changer de
   langue à chaud (bouton de langue) ne traduit pas les widgets Element tant qu'on n'enveloppe pas
   l'application dans `<el-config-provider :locale>`.

## Comment lancer

```sh
npm install --allow-remote=root   # le paquet xlsx vient d'une URL, npm 12 le refuse par défaut
npm run serve                     # ou npm run build puis servir dist/
npx vitest run                    # 153 tests
```

## Mode sombre

`src/main.js` importe `element-plus/theme-chalk/dark/css-vars.css`. Poser `data-theme="dark"` sur
`<html>` suffit à basculer **les composants Element Plus**. L'écran de connexion ne change pas, et
c'est le constat de l'analyse : les 142 couleurs codées en dur dans 29 fichiers de l'application
doivent passer en variables CSS avant qu'un thème complet soit possible.

## À savoir (hors migration)

- `master` porte la version **3.31.19** alors que la production tourne en **3.31.21** : les deux
  dernières livraisons (hygiène de session, jeton JupyterLab) vivent seulement sur des branches.
- `.eslintrc.js` n'a pas été adapté à `eslint-plugin-vue` 9 / Vue 3 (le build ne lance pas ESLint,
  `lintOnSave: false`).
- `npm install` exige `--allow-remote=root` : la dépendance `xlsx` est une URL vers cdn.sheetjs.com.
