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

## Rendu : pourquoi tout était décalé, et ce qui a été corrigé

Trois causes, mesurées en comparant les styles calculés de l'écran de connexion avec la production :

1. **`theme/index.css` était le thème Element UI 2 compilé** (1 Mo, 4474 règles `.el-*`), chargé
   *après* Element Plus. Il écrasait donc les composants par leurs anciennes règles : doubles
   bordures sur les champs, largeurs faussées. Il est retiré ; le thème de l'application vient de
   `api/v1/ui_css` (servi par l'API), qui reste chargé.
2. **Hauteurs de composants** : Element UI 2 faisait des champs de 36 px, Element Plus part de 32.
   `src/styles/element-legacy.css` fixe `--el-component-size: 36px`.
3. **Le titre de la page de connexion** reprenait le `h1` par défaut du navigateur (32 px, gras) au
   lieu des 20 px en graisse normale d'Element UI : règle explicite dans `Login.vue`.

Le bouton portait aussi `color="#048"` (propriété inconnue d'Element UI 2, donc sans effet) et
`size="medium"` (valeur qu'Element Plus ne connaît pas) : les deux sont retirés.

Après correction, l'écran de connexion est **au pixel de la production** : carte 402 × 202, champs
360 × 36, bouton 360 × 40 `#a0cfff`, titre 20 px / 400, même dégradé.

En développement, le thème `api/v1/ui_css` doit être pris sur l'API pointée (`?api=…`), sinon
`index.html` le demande en relatif au serveur webpack, qui répond 404 : c'est ce que fait
désormais `main.js`, uniquement hors production.

## Icônes et tailles : ce qui ne se voyait pas

Element UI 2 dessinait ses icônes avec une **police** (`class="el-icon-edit"`), Element Plus utilise
des **composants SVG**. Rien ne casse dans la console, mais les boutons concernés s'affichent vides —
d'où l'impression de boutons « cassés » un peu partout.

- 66 attributs `icon="el-icon-x"` convertis en `:icon="$icons.X"` (et `:prefix-icon` sur les champs).
- 7 icônes posées en `<i class="el-icon-x">` converties en `<el-icon><component :is="$icons.X" /></el-icon>`.
- Les 28 noms de composants utilisés sont exposés une fois pour toutes dans `main.js`
  (`app.config.globalProperties.$icons`), pour éviter un import par fichier.
- Les **configurations existantes** stockent encore des noms d'origine (`linkbuttonicon:
  "el-icon-download"`) : `src/utils/icons.js` les traduit au rendu, sinon le bouton serait vide.
  Les enregistrements futurs peuvent porter directement le nom Element Plus (`Download`).

Côté tailles, `size="mini"` a disparu d'Element Plus : **349 occurrences** retombaient sur la taille
par défaut, ce qui épaissit tous les tableaux et barres de boutons. Elles sont passées à
`size="small"`.

Cinq tests vérifient que les icônes produisent réellement un `<svg>` monté (jsdom), trois que la
table de correspondance résout tous les noms hérités.

## Barre de gauche : `el-submenu` n'existe plus

Element UI 2 : `<el-submenu>`. Element Plus : **`<el-sub-menu>`**. Un nom qui n'existe plus ne
produit aucune erreur — Vue le traite comme un composant inconnu, affiche le contenu sans le
comportement de repli/dépli, et la barre de gauche cesse de s'ouvrir. `text-color` a également
disparu au profit d'une variable CSS (`--el-menu-text-color`).

Plutôt que de corriger ce seul nom, `tests/element-tags.spec.js` lit les 62 composants du projet et
vérifie que **chaque balise `el-*` utilisée est réellement exportée par Element Plus**. C'est le
garde-fou contre les autres renommages de la même famille, et il aurait signalé celui-ci.

## À savoir (hors migration)

- `master` porte la version **3.31.19** alors que la production tourne en **3.31.21** : les deux
  dernières livraisons (hygiène de session, jeton JupyterLab) vivent seulement sur des branches.
- `.eslintrc.js` n'a pas été adapté à `eslint-plugin-vue` 9 / Vue 3 (le build ne lance pas ESLint,
  `lintOnSave: false`).
- `npm install` exige `--allow-remote=root` : la dépendance `xlsx` est une URL vers cdn.sheetjs.com.
