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

Le même renommage casse les **styles** : les règles de `Main.vue` visaient `.el-submenu__title` et
`.el-submenu .el-menu-item` (40 px de haut), qui ne correspondent plus rien — les entrées reprenaient
donc les 56 px par défaut, d'où une barre de gauche beaucoup plus haute. Les règles sont dupliquées
pour `.el-sub-menu__title` et `.el-sub-menu .el-menu-item`.

Et l'en-tête centre ses enfants par `line-height: 60px` alors que les boutons Element Plus sont en
`inline-flex` (donc posés sur la ligne de base) et dimensionnés par `--el-component-size` : le bouton
rond de droite descendait et rétrécissait (36 px au lieu de 40). Il est réaligné et remis à 40 px.

Deux tests couvrent désormais cette famille de pannes, car elle ne produit aucune erreur :
`tests/element-tags.spec.js` vérifie que **chaque balise `el-*` utilisée est réellement exportée par
Element Plus**, et `tests/element-classes.spec.js` que **chaque classe `el-*` citée dans nos styles
existe dans sa feuille CSS**. Ce second audit ne trouve plus que quatre classes, toutes assumées
(le nom de classe propre au projet et les anciens sélecteurs conservés).

## Fenêtres modales : un modèle de boîte différent

Element UI 2 appliquait le rembourrage à `__header` et `__body` ; Element Plus le met sur
`.el-dialog` lui-même (16 px). Conséquence : l'en-tête bleu (`api/v1/ui_css`) ne touchait plus les
bords de la fenêtre — il flottait à l'intérieur, sans les coins arrondis, sur une bande de 40 px, et
la croix de fermeture restait noire. Le modèle de boîte d'Element UI 2 est rétabli : bande pleine
largeur de 54 px, titre blanc de 18 px, croix blanche, corps à 30/20 px.

Vérifié hors de l'application, avec une page de harnais chargeant la feuille compilée et `ui_css` :
en-tête à 0 px des bords, 520 px de large comme la fenêtre, fond `rgb(64,158,255)`.

## Sept composants ne rendaient rien, et les mesures de l'en-tête

Le codemod avait transformé `<template slot="items">` en `<template #items>` **à la racine** de sept
composants (Form, Kibana, Grafana, External, Upload, Vega, ChangePassword). Un bloc de template qui
porte un `v-slot` n'est rendu par personne : ces écrans étaient vides, sans erreur. Les racines sont
nettoyées et `tests/template-root.spec.js` refuse désormais un `<template>` racine avec slot.

`ChangePassword` utilisait `:visible="visible"`, propriété qui n'existe plus : le dialogue ne
s'ouvrait jamais. C'est `v-model="visible"`.

Enfin, pour l'en-tête et les dialogues, la comparaison a été faite **contre la vraie référence** :
deux pages de harnais, l'une chargeant Element UI 2.15.14 et `ui_css` (la production), l'autre la
feuille compilée de la branche. Mesures identiques après correction :

| mesure | production | branche |
|---|---|---|
| boutons ronds de l'en-tête | 39 x 40, à 9 px du haut | 40 x 40, à 9 px |
| bande de titre | 54 px, titre à 20 px du bord | 54 px, titre à 20 px |
| croix de fermeture | 16 px, à 20/20 | 24 px, à 20/20 |
| boutons d'applications | 39 x 40 | 40 x 40 |

## À savoir (hors migration)

- `master` porte la version **3.31.19** alors que la production tourne en **3.31.21** : les deux
  dernières livraisons (hygiène de session, jeton JupyterLab) vivent seulement sur des branches.
- `.eslintrc.js` n'a pas été adapté à `eslint-plugin-vue` 9 / Vue 3 (le build ne lance pas ESLint,
  `lintOnSave: false`).
- `npm install` exige `--allow-remote=root` : la dépendance `xlsx` est une URL vers cdn.sheetjs.com.

## État au 2026-11-06 (fin de session)

**Déploiement de comparaison** : branche `feat/vue3-element-plus`, dernier commit `f2714cf`.
Image `snuids/nyx_ui:v4.0.0-nyxv3`, construite sur `energy` avec `--build-arg PUBLIC_PATH=/nyxv3/`,
servie sous **https://energy.marmar.ovh/nyxv3/** par le service `nyx_ui_v3` du compose de production
(`BASE_PATH=/nyxv3/`) et deux routes nginx (`/nyxv3/`, `/nyxv3/api/`). La racine reste en 3.31.21.

**Tests** : 197, dont des garde-fous statiques qui ont chacun évité une régression réelle —
`template-slots`, `template-root`, `i18n-instance` (`i18n.t` interdit), `draggable-item`,
`global-properties` (tout `this.$xxx` doit être déclaré dans `main.js`), `vicon-color`.

**Corrigé pendant les essais comparatifs** (chaque point = un commit) : `i18n.t` dans `data()`
(fenêtres qui ne s'ouvraient pas), `<draggable>` sans slot `#item` (onglet Table vide), `el-row` en
flex qui écrasait les bandeaux et les cartes, `el-input` en bloc (champ sous les boutons),
`el-col` sans `span` (pied de dialogue), `$getLocation` absent, taille des icônes, popovers.

**Divergences assumées avec la production** (à reporter en prod si souhaité) :
- colonne d'actions du rapport périodique : 260 px au lieu de 220 (le champ de recherche ne passe
  plus sous les boutons) ;
- ~~bouton de téléchargement à droite du champ~~ — revenu dans le champ le 2026-11-07 (voir plus bas) ;
- 10 px / 32 px d'espacement dans le bandeau de filtres.

Les autres écarts constatés étaient déjà présents en production et n'ont pas été modifiés : combobox
« Time Selector » vide, rapport périodique qui empile son champ sous les boutons quand une ligne est
sélectionnée.

## Écran « Users Config » (comparé le 2026-11-07)

Comparaison de `/#/main/id_28534460` avec `/nyxv3/#/main/id_28534460`, même compte, fenêtre
1280 × 577, mêmes sélecteurs et `getBoundingClientRect` / `getComputedStyle` des deux côtés.

| mesure | production (Element UI 2) | branche avant | branche après |
|---|---|---|---|
| hauteur de ligne du tableau | 41 px | 33 px | **41 px** |
| padding vertical des cellules | 6 px | 4 px | **6 px** |
| padding horizontal du `.cell` | 10 px | 8 px | **10 px** |
| graisse de l'en-tête | 700 | 600 | **700** |
| boutons d'action de la colonne | 44 × 28, padding 7/15 | 36 × 24, padding 5/11 | **44 × 28** |
| bouton « + » de l'en-tête | 28 × 28 | 28 × 28 | 28 × 28 |
| champ de recherche | 150 × 28, texte à 26 px du bord | 150 × 26, texte à 8 px | **150 × 28, texte à 26 px** |
| ligne d'en-tête | 59 px | 42 px | 54 px |
| colonnes Privileges / Filters | 102 / 101 px | 94 / 94 px | 94 / 94 px |
| fenêtre « User Form » | 947 px | 918 px | 958 px |
| ligne de formulaire du dialogue | 41 px | 32 px | 40 px |
| boutons du pied de dialogue | 89 / 92 px | 95 / 98 px | **89 / 92 px** |

Quatre causes, toutes dans `src/styles/element-legacy.css` (règles d'Element UI 2 que la feuille de
thème emportait avec elle, ou tailles que `size="small"` a décalées après la conversion de `mini`) :

1. **Cellules** : le « mini » d'Element UI 2 fait 6 px de padding vertical, un `.cell` à 10 px et un
   en-tête en 700 ; le « small » d'Element Plus, 4 px, 8 px et 600. Les lignes faisaient 33 px.
2. **Boutons et champs `size="small"`** (349 appels ex-`mini`) : Element Plus les rend à 24 px, avec
   5/11 de padding ; il en faut 28 px et 7/15. `--el-component-size-small` passe à 28 px et le texte
   d'un champ `small` reprend ses 15 px de retrait.
3. **En-tête de tableau** : la largeur complète du `.cell` et le `nowrap` d'Element UI 2 manquaient
   (le champ de recherche passait à la ligne, en-tête à 70 px) ; et le champ, aligné sur la ligne de
   base, descendait sous le bouton « + » — centré, il reprend la position de production.
4. **Dialogues** : le pied de dialogue gardait `12px 23px` (boutons 6 px trop larges) et le contenu
   d'un `el-form-item` n'a plus de hauteur de ligne en Element Plus (il est `flex`), donc les lignes
   faisaient 32 px au lieu de 41.

Enfin, la colonne d'actions montrait un **crayon dans un carré** (`$icons.Edit`, l'icône `Edit`
d'Element Plus) là où la production dessine le crayon seul d'`el-icon-edit` : les cinq boutons
d'édition passent à `$icons.EditPen`.

Ce qui reste différent, mesuré et non corrigé :

- **ligne d'en-tête 54 px au lieu de 59** : Element UI 2 obtenait 48 px de contenu (ligne de 40 px
  plus la place du jambage) ; Element Plus n'a plus ce débord. Les contrôles sont aux mêmes
  coordonnées (bouton à 81 px du haut contre 80, champ à 80 px) ;
- **colonnes automatiques Privileges / Filters à 94 px au lieu de 102 / 101** : en production la
  somme des colonnes (1063) dépasse la largeur du tableau (1048) ; Element Plus répartit la place
  restante à égalité ;
- **fenêtre « User Form » à 958 px au lieu de 947** : la section Privileges mesure 319 px contre 303,
  le corps d'un panneau de `el-transfer` n'ayant plus les 246 px fixes d'Element UI 2.

Contrôle de non-régression : `Reports › Periodic` (mêmes colonnes, mêmes 59 px de ligne, seul l'écart
déjà assumé de la colonne d'actions à 260 px), 197 tests verts, application rendue sans erreur.

## Sélecteur de temps de l'en-tête (2026-11-07)

Sur `Modules › Calls` (`#/main/id_21206339`), le champ date/heure et les boutons **Absolute /
Relative** n'étaient ni à la même hauteur ni de la même taille : champ 28 px à 16-18 px du haut,
groupe radio 22 px six pixels plus bas. Mesure de la production, même écran, même fenêtre : champ
[586, 17, 400, 28], groupe [994, 17, 164, 28].

| mesure | production | branche avant | branche après |
|---|---|---|---|
| champ date/heure | 28 px à y = 17 | 28 px à y = 16 | **28 px à y = 17** |
| groupe Absolute/Relative | 28 px à y = 17 | 22 px à y = 22 | **28 px à y = 17** |
| bouton « Last 4 h » (mode relatif) | 28 px | 26 px | **28 px à y = 17** |

Trois causes : les boutons radio `small` (ex-`mini`) perdent 6 px (`padding: 5px 11px` d'Element
Plus contre `7px 15px` d'Element UI 2) ; `el-radio-group` s'aligne sur la ligne de base, donc un
groupe plus court descend sous le champ ; et le champ portait un `style="top:1px"` hérité
d'Element UI 2, qui décalait sa peinture d'un pixel de plus que son voisin. Règles ajoutées :
`.el-radio-button--small .el-radio-button__inner { padding: 7px 15px; height: 28px }`,
`.time-selector-row .el-radio-group { vertical-align: middle; position: relative; top: 1px }`, et le
style en ligne retiré de `Main.vue`.

Reste : le champ de dates mesure 420 px au lieu de 400 (le séparateur « To » est un bloc flex de
50 px dans Element Plus, 29 px en production) ; tout le bloc est aligné à droite, l'écart ne se voit
que sur le bord gauche du champ.

## Barre de requête : le bouton de téléchargement est revenu dans le champ (2026-11-07)

Sur `Docker › Containers` (`#/main/id_21834322`), le bouton de téléchargement était posé **à côté**
du champ, dans les 37 px qui le séparent du bouton « Refresh » : il flottait entre les deux. En
production il est dans le champ, à 5 px de son bord droit.

| mesure | production | branche avant | branche après |
|---|---|---|---|
| champ de requête | [213, 118, 913, 28] | [213, 118, 887, 28] | **[213, 118, 913, 28]** |
| bouton de téléchargement | [1101, 118, 20, 28] | à l'extérieur, [1117, 118, 24, 28] | **[1101, 118, 20, 28]** |
| distance au bord droit | 5 px | — | **5 px** |

Le bouton est replacé dans le `slot suffix` du champ (comme dans le code d'origine) ; il faut
`.query-bar .query-input .el-input__wrapper { padding: 0 5px 0 15px }` — trois classes, car la règle
globale `.el-input--small .el-input__wrapper` est compilée plus loin et l'emporterait à spécificité
égale — sinon le suffixe hérite des 15 px de rembourrage (icône à 15 px du bord) et le champ grandit
de 2 px. Le popover `.xlsx` / `.csv` s'ouvre toujours au survol.
