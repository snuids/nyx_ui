# Version History

## V3.6.19 09/Nov/2026
* **Balayage du mode sombre : les gris du theme clair ecrits en dur.** Apres les libelles de l'editeur d'enregistrement (3.6.18), neuf fichiers en portaient encore. Sur les surfaces sombres de la console, ils tombaient entre **1,3:1 et 2,9:1** : presents, illisibles. Les regles passent aux variables d'Element Plus, qui basculent avec le theme — `--el-text-color-regular` (#606266 en clair, #cfd3dc en sombre, 9,3 a 11,6:1) et `--el-text-color-primary` (#303133 / #e5eaf3, jusqu'a 14,4:1). En clair, la valeur rendue est identique au pixel
* **`#app` portait `color: #2c3e50`.** C'est la racine de l'application : tout texte sans couleur propre en heritait et restait donc sombre sur fond sombre, malgre `html.dark body`. C'etait la cause de fond, celle qui expliquait les retouches ponctuelles des versions precedentes
* Corriges avec lui : `Activity` (titres de panneaux), `Grafana` (indication de telechargement), `IconPicker` (legende des icones), `ESTableEditor` (deux boutons texte, la cellule de tableau, le champ `#indexPattern` qui recopiait les styles d'Element en blanc), et les trois regles de `Main.vue` qui peignaient les dialogues
* Deux exceptions assumees, documentees dans le test : les `<option>` du select de langue (peintes par le systeme sur blanc) et la page de confidentialite (une feuille de papier, blanche dans les deux themes)
* Les regles `#nav` d'`App.vue`, heritees du squelette Vue CLI et sans element correspondant (l'une peignait un fond `aqua`), sont supprimees
* Test de garde : aucun composant ne peut plus figer un gris du theme clair — le parcours des `.vue` echoue sur `color: #2c3e50|303133|464646|606266|333|666` hors des deux exceptions. 608 tests

## V3.6.18 09/Nov/2026
* **Les libelles de l'editeur d'enregistrement redeviennent lisibles en mode sombre.** La feuille du composant figeait `color: #464646` sur `.el-form-item__label` : sur la surface `#1f2430` des cartes, les noms de champs tombaient a **1,6:1** — presents, mais illisibles. La regle passe a `var(--el-text-color-regular)`, la variable d'Element Plus qui bascule avec le theme (`#606266` en clair, `#cfd3dc` en sombre, soit **10,4:1** sur cette meme surface)
* Meme gris ecrit en dur dans l'editeur SQL des applications (`tableEditor/SQLEditor.vue`) : corrige avec, la regle etant identique
* Un test de plus (`dark-theme-text.spec.js`) : les deux composants doivent styler le libelle par la variable du theme, jamais par un code hexadecimaire — c'est exactement ce genre de regression qui ne casse aucune compilation

## V3.6.17 08/Nov/2026
* **Le lien de confidentialite reste seul, et le texte d'accueil au-dessus.** Le lien descend au milieu, en bas de la page (`left: 50%`, `bottom: 12px`, `translateX(-50%)`), hors du bloc carte + titre : il ne se dispute plus la ligne avec « Energy Monitoring Platform »
* **La composition remonte sur une fenetre courte.** Le groupe carte + titre est place par `clamp(96px, 50% - 70px, 100% - 400px)` : sur un ecran de portable ou en zoom, il remonte pour laisser la place au pied de page au lieu de passer dessous. Les deux decors (anneau et icone) sont desormais dans le groupe et se placent par rapport au haut de la carte, donc ils la suivent — ancores a `50%`, ils se retrouvaient sur la carte quand le groupe remontait
* Sous 470px de haut (telephone en paysage, zoom fort), les decors sont masques et le groupe remonte a 8px : sans cela le titre passait sous le lien de confidentialite. La requete media est en **fin de feuille** — meme specificite que la regle generale, seul l'ordre decide, et placee avant elle ne s'appliquait jamais (le defaut a ete vu a la mesure, pas a la compilation)
* Geometrie verifiee a 380, 470, 500, 577, 640 et 800px de haut : l'ecart entre le titre et le lien reste positif partout (26 a 124px)

## V3.6.16 08/Nov/2026
* **Le texte d'accueil ne passe plus sous la carte.** La carte etait en position absolue et le titre pose a `50% + 170px` : tant que la carte mesurait 200px le titre tombait juste en dessous, mais des qu'elle grandit (bouton GitHub) la carte le recouvrait — texte blanc sur fond blanc, invisible. La carte et le titre forment maintenant un seul groupe en colonne, dont le bord haut est celui qu'avait la carte : le titre suit la hauteur reelle
* **Le lien de confidentialite passe au milieu, en bas de la page.** Il etait sur la ligne du titre, ou il se disputait la place avec le texte d'accueil ; il est desormais positionne seul (`left: 50%`, `bottom: 12px`, `translateX(-50%)`), hors du groupe carte + titre
* Le panneau de premier changement de mot de passe garde son decalage propre (`50% - 180px`), sinon il deborderait par le bas sur un portable
* 2 tests de plus : le lien n'est plus dans le titre ni dans le groupe (il est au niveau de la page) et la regle qui le place est verifiee

## V3.6.15 08/Nov/2026
* **La carte de connexion ne fige plus sa hauteur.** Elle avait `height: 200px`, la taille du seul formulaire mot de passe : le bouton GitHub ajoute un separateur et un bouton (~60px), le contenu debordait de la carte et il fallait defiler pour l'atteindre. La carte se dimensionne desormais sur son contenu (`min-height: 200px`, le reste en `auto`), avec le meme bord haut et le meme centrage horizontal qu'avant pour ne pas deplacer le formulaire
* Le panneau de premier changement de mot de passe suit la meme regle (`min-height: 340px`) : il doit grandir lui aussi quand un message d'erreur s'ajoute
* `.login-container` defile (`overflow-y: auto`) sur une fenetre plus courte que la carte — portable, zoom navigateur — au lieu de couper le bas du formulaire
* Trois tests : le bouton n'apparait que si `/config` repond `login.github`, et une garde sur la feuille de style (pas de `height` fixe sur la carte) — jsdom ne calcule pas de mise en page, un debordement ne se verrait pas au montage

## V3.6.14 08/Nov/2026
* **Le retour de GitHub arrive sur un chemin, la console est en mode hash.** Une `redirect_uri` OAuth ne peut pas contenir de fragment : GitHub appelle donc `/oauth?code=...`, un chemin que la console ne sait pas router — l'application demarrait sur `/`, montait l'ecran de connexion, et la session n'etait jamais terminee. `normalizeOAuthLocation()` (au chargement du routeur) deplace la requete dans le fragment (`/#/oauth?code=...`) avant que le routeur ne lise l'URL
* Meme chose cote serveur : nginx doit servir l'index sur `/oauth` (le serveur statique de l'image repond 404 sur un chemin inconnu). Sans ce report applicatif, l'ecran `/oauth` reste indispensable : il lit `code` et `state` dans les deux formes d'URL
* 5 tests pour le report (`tests/router-oauth-location.spec.js`) : deplacement, barre oblique finale, URL deja fragmente, autres chemins, absence de `window`

## V3.6.13 08/Nov/2026
* **Connexion avec GitHub.** Le bouton n'apparait que si l'API repond `login.github` sur `/config` — c'est elle qui detient le client id et le secret, la console ne construit donc jamais l'URL elle-meme : elle demande `GET cred/oauth/state` et suit l'URL renvoyee
* **La page de retour `/oauth` termine la session comme le formulaire.** Elle lit `?code` et `?state` de l'URL (fragment compris : `getUrlVars` le garde, il est retire avant l'envoi), poste sur `cred/login_github`, puis fait exactement ce que fait `Login.vue` quand le mot de passe passe : `localStorage.authResponse`, locale de l'ecran, commit `login` du store, ouverture de la premiere application du compte. Elle remplace l'URL au lieu d'y empiler une entree, pour que le `code` — a usage unique — ne reste pas dans l'historique
* **Les cas de refus sont dits, pas avales** : URL sans code (retour a la main), identite sans compte NYX (« aucun compte n'est associe »), compte sans application (le message existant de `firstlogin.no_menu` au lieu du `TypeError` sur `loc_title`), mot de passe provisoire (on renvoie vers la connexion par mot de passe, seul endroit ou il se change), serveur injoignable
* Routes : `/oauth` est **frere** de `/main`, pas enfant — un enfant heriterait du shell authentifie et dessinerait le menu d'une session qui n'existe pas encore
* 8 cles `github.*` ajoutees aux quatre catalogues (le controle `check-lang-keys` reste a 666 cles alignees), et `tests/views/oauth.spec.js` couvre les six issues ci-dessus

## V3.6.12 08/Nov/2026
* **Le theme suit desormais toutes les applications branchees sur le contexte.** Une application externe qui porte `TOKEN`, `API` ou `LANG` recoit `theme` meme si sa configuration ne cite pas `THEME` : oublier le jeton ne produisait aucune erreur, l'application s'ouvrait simplement sans theme (le symptome trompeur : `token` et `lang` arrivent, `theme` manque). Le parametre est ajoute avant le fragment et seulement s'il est absent ; les liens tiers (kibana, grafana, cerebro, nodered, rediscom, jupyter) restent intacts

## V3.6.11 08/Nov/2026
* **La fenetre « Info » du menu utilisateur redevient lisible en theme sombre.** `Main.vue` peint les boites de confirmation avec les couleurs du theme clair — titre `#303133`, contenu `#606266` — et une couleur explicite l'emporte sur les variables sombres d'Element Plus : sur le fond `#141414` rendu par la boite, le titre tombait a **1,9:1** et le contenu (version, version d'API, taille de fenetre, navigateur, jeton) a **3,2:1**, tous deux sous le seuil AA de 4,5:1. Meme famille que les titres de la page d'etat corriges en 3.6.10, meme remede : `html.dark` reprend `.el-message-box__title`, `__content` et `__message` (y compris `p` et `strong`) sur `var(--nyx-text)`
* Mesure au navigateur, apres correction, dans la vraie boite ouverte depuis le menu : titre et contenu a **14,44:1**, zero element de texte sous 4,5:1 — hors le libelle du bouton principal, qui est le blanc sur bleu `#409eff` d'Element Plus (**2,78:1**), identique en theme clair et laisse tel quel pour ne pas changer la charte du console
* Theme clair verifie inchange : boite blanche, titre `#303133`, contenu `#606266`
* `tests/dark-theme-text.spec.js` gagne deux assertions : la cause est toujours dans `Main.vue` (si elle disparait, l'override devient inutile et le test le dit) et le theme sombre la reprend bien

## V3.6.10 08/Nov/2026
* **Mode sombre : les libelles de la page d'etat etaient illisibles.** Ils sont dans des `<h3>`, et `element-legacy.css` force `h1..h6 { color: #606266 }` : ce gris du theme clair tombe a 2,5:1 sur une carte sombre. `dark.css` reprend les titres (`var(--nyx-text)`), le contraste mesure sur la page passe de 2,5:1 a 11:1 et il ne reste aucun element sous 4,5:1
* **Nouveau parametre `THEME` pour les applications externes.** `External.vue` remplacait deja `token=TOKEN`, `API`, `HOST`, `LANG`, `FROMDATE` et `TODATE` ; il remplace maintenant `THEME` par le theme en cours (`light` ou `dark`) : `https://app.exemple/?theme=THEME`. L'ecran suit les bascules clair/sombre sans etre remonte (`nyx:theme`). Le jeton est encadre de limites de mot, `MYTHEMEAPP` reste intact
* Documentation de l'app external mise a jour dans les quatre langues (`configdetails.desc_external_detail_4`, dans l'aide de l'ecran de configuration)

## V3.6.9 08/Nov/2026
* **L'animation de l'etat des rapports ne tournait plus.** `ReportTask` affiche « Waiting » avec `<v-icon name="spinner" spin scale="2" />` ; le rond avec ses points s'affichait, immobile. `spin` etait une prop de `vue-awesome` que `VIcon` n'a jamais reprise, et l'animation de FontAwesome vit dans sa feuille de style, que ce projet ne charge pas : la prop etait ignoree, sur les trois appels qui l'utilisent (etat des rapports, deux boutons de traitement du formulaire). `VIcon` prend `spin` et applique lui-meme un tour complet par seconde
* **Explorateur de fichiers : le defilement infini n'avait plus rien a charger.** `listDir` retirait les lignes de `allData` avec `splice` (et la ligne etait ecrite deux fois) ; `loadMore` spliceait aussi et ne s'arretait jamais. Passe en `slice`, avec detection de fin de liste
* **Page d'etat : elle tombait si le module WebSocket n'avait pas encore de client.** Le template lisait `WebSocketServer[0]._source.clients[0].logins` derriere un garde qui ne verifiait que `_source` ; un module qui vient de demarrer n'a pas de `clients`. Les deux lectures passent par un computed qui rend `{ clients: 0, logins: [] }`
* **Ecran Kibana : plantage au montage hors barre de temps.** `createUrl` lisait `timeRange[0]` alors que les plages valent `null` avant le premier choix de periode (lien direct, rechargement) ; `updateQuery` levait la meme chose sur une URL sans `query:'...'`
* **Pagination ou tri avant tout choix de periode : TypeError dans le store.** `refreshTimeRange` lisait `lastTimeRangeEvent` qui n'existe qu'apres le premier `setTimeRange` ; la mutation ne fait plus rien dans ce cas
* Couverture des ecrans de donnees (`NYXInfo` 74 %, `FileSystem` 63 %, `Kibana` 47 %, `PGGenericTable` 41 %) et du composant d'icone — 567 tests

## V3.6.8 08/Nov/2026
* **La carte de description des types de rapport coupe son texte.** Chaque type avait son bloc de template, avec une hauteur fixe sur la carte (70 px, 90 px pour Jasper JDBC) et des `el-col` poses directement dans la carte, sans `el-row` : la description de Jasper JDBC fait trois lignes, la troisieme etait invisible et une barre de defilement apparaissait dans la carte. Les cinq blocs deviennent un seul, pilote par une table `type -> {cle de traduction, icone}` ; la carte prend la hauteur de son contenu, l'icone et le texte partagent une ligne flex. Mesure : 92 px de haut avec 90 px de contenu (barre de defilement) -> 105 px, texte entier, aucun debordement
* **La zone de depot JRXML deborde de sa ligne.** `el-upload` portait `style="height:30px"` et le `dragger` 40 px pour deux lignes de texte : le `dragger` mesurait 82 px dans une boite de 30 et passait par-dessus le champ suivant ; il partait aussi du bord de la colonne alors que les champs voisins sont indentees de la largeur du libelle. Il est enveloppe dans un `el-form-item` sans libelle et sa hauteur est libre : x=633 l=486 h=30 -> x=753 l=366, l'x et la largeur des champs de sa colonne
* Cinq tests de plus verrouillent la structure (pas de hauteur inline sur la carte ni sur la zone, ligne flex icone/texte, une description pour chacun des cinq types, zone dans un `form-item`) — 399 tests

## V3.6.7 08/Nov/2026
* **Un refus de token deconnecte a nouveau.** `nyx_rest` 3.22.23 ne repond plus 200 quand il refuse un token : `NO_TOKEN` et `UNKNOWN_TOKEN` sont des 401, `NO_PRIVILEGE` et `MUST_CHANGE_PASSWORD` des 403. L'intercepteur de reponse ne regardait que les corps des reponses reussies, donc `axios` rejetait la promesse sans qu'aucun `.then()` ne s'execute : la session perdue laissait l'ecran fige au lieu de ramener a la connexion. Le traitement du corps est maintenant partage par les deux branches (`reportApiError`), et un 401 sur l'ecran de connexion reste silencieux
* Le reste est inchange : les erreurs de route de l'API continuent de repondre 200 et sont toujours notifiees de la meme facon, et le corps `{"error": …}` garde sa forme
* **Le bouton « Send » du dialogue Docker revient sur la ligne du selecteur.** En Element Plus `el-select` fait 100 % de large, la ou Element UI 2 le laissait en ligne : selecteur et bouton partageaient une `el-col`, donc le selecteur prenait la ligne et « Send » tombait dessous, aligne a gauche. Une ligne flex (`flex: 1` pour le selecteur, `min-width: 0` pour qu'il retrecisse au lieu de pousser) les remet cote a cote ; le libelle « Action » passe de `type="text"` (deprecie) a `link`. Mesure : `Send` de (434,288) sous un selecteur de 430 px a (793,252) sur la meme ligne qu'un selecteur de 360 px
* **Le formulaire utilisateur est plus large, et tient dans la fenetre.** Le dialogue faisait 700 px : champs de 180 px, listes de privileges et de filtres collees au bord droit, descriptions coupees. Il passe a `min(1040px, 94vw)` (champs de 350 px) ; les listes demandaient un second correctif — `element-legacy.css` leur donne `flex: 0 0 250px` et `el-row` est un conteneur flex, donc le `<el-transfer>` se dimensionnait sur son contenu et les panneaux tombaient a 200 px quelle que soit la largeur : largeur 100 % et base flex de 300 px. Deplie, le formulaire fait 938 px et son pied de page sortait de l'ecran sur une fenetre de 577 px : `max-height: 90vh` avec un corps defilant, pied toujours visible
* **Le banc de tests couvre les ecrans.** 46 fichiers, 394 tests : Login, Main, Privacy, App.vue, la table de routage, GenericComponent, GenericTable, QueryBar, QueryFilter, User, et les ecrans de la 3.6.6. La couverture porte desormais sur tout `src` (javascript **et** `.vue`) et s'affiche dans GitHub — resume du run, artefact HTML et commentaire de PR mis a jour sur place. Le runner passe a Vitest 5, ce qui ramene les avis critiques de `npm audit` a zero ; la mesure change avec lui (remappage AST) et les seuils sont re-bases, ce que dit le commentaire de `vitest.config.mjs`

## V3.6.6 07/Nov/2026
*No application change: tests only. The shipped bundle is byte-for-byte the 3.6.5 one.*
* **Coverage of the screens that produced this week's regressions.** Four specs mount components that had none: `Map` (88,7 % des statements), `Activity` (88,2 %), `LambdaEditor` (74,9 %), `ReportEditor` (65,9 %). Overall statements go from **23,3 % to 33,9 %**, the component block from **17,2 % to 29,0 %**, with 36 new tests (394 in total)
* `Map` — the two defects of the day are pinned: with no zoom and no centre configured the component falls back to zoom 2 / null island (Leaflet throws on `L.latLng(undefined, undefined)`, and a `zoom` of `undefined` leaves the tile layer with nothing to draw), it frames itself on its markers, keeps **one marker per position** (1 000 documents over a dozen positions froze the tab) and caps the loop
* `Activity` — the counters' colours are asserted (neutral = `var(--nyx-text, #303133)`, errors red or green), the exact aggregation count and its fallback to capped buckets, the `top endpoints` percentages, the query (epoch millis on the configured time field, `onlyErrors`, export without aggs), and the API error being shown instead of an empty table
* `LambdaEditor` — the log sits in a `div.lambda-log` (full width, not inside a flex `el-row`), long lines wrap, the *Edit code* button carries no `min-width`, the working copy does not touch the received record, the runner → file → function hierarchy comes from the index, and the notebook opens with the Jupyter token
* `ReportEditor` — the footer holds two 12/12 columns (two `span="24"` cannot share a row) with *Edit code* on the left and *Cancel/Confirm* on the right, and the help cards all carry `.desc-card` (three of the five rows did not, which is why the dark theme missed them)
* `tests/invalid-inline-style.spec.js` — a source guard on the whole family: a `style="{...}"` left over from Vue 2 in a template attribute is discarded by the browser, and that is how `LogViewer`'s log stopped wrapping without a single error
* The whole-`src` thresholds move with the assiette (33 / 83 / 44 / 33) and say so in the config: statements rise, branches and functions fall because the untested parts of those screens are now measured. The per-glob floors are unchanged and remain the ones to read

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
