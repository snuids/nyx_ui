# Nyx User Interface

![badge](https://img.shields.io/badge/made%20with-vuejs-blue.svg?style=flat-square)
![badge](https://img.shields.io/github/languages/code-size/snuids/nyx_ui)
![badge](https://img.shields.io/github/last-commit/snuids/nyx_ui)
![Azure Static Web Apps CI/CD](https://github.com/snuids/nyx_ui/workflows/Azure%20Static%20Web%20Apps%20CI/CD/badge.svg)


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
npm test              # suite complete (logique + ecrans)
npm run test:coverage # idem, avec le rapport de couverture
```

Deux environnements cohabitent dans la meme suite : `node` pour les modules de logique et le
store, `jsdom` pour les ecrans montes (le fichier de test le declare en tete :
`// @vitest-environment jsdom`). Les composants Element Plus, le routeur memoire, l'i18n et les
globals de `src/main.js` sont fournis par `tests/helpers/mount-view.js`.

La couverture porte sur tout `src` (javascript et `.vue`). Les seuils de `vitest.config.mjs` sont
par glob : 97/96/94/97 sur le javascript de logique, 85/80/50/85 sur `src/views`, 13/68/23/13 sur
`src/components` et un seuil global bas qui sert surtout a reperer un fichier de test perdu.

Etat au 7 novembre 2026 : **352 tests**, **23,2 %** des instructions de `src` (20 970). Par zone :

| zone | statements | fichiers testes |
|---|---|---|
| `src` javascript (logique, store, routeur) | 99,1 % | tous |
| `src/views` | 87,2 % | Login 95,9 · Main 80,8 · Privacy 100 · App.vue 65,6 |
| `src/components` | 13,2 % | GenericComponent 97,7 · QueryBar 98,4 · User 96,3 · QueryFilter 88,9 · GenericTable 74,9 · LandingPage 100 |

Les composants non testes tirent le chiffre global vers le bas : c'est la mesure honnete, pas une
regression. Prochaines cibles par taille et par risque : `GenericTableDetails` (edition d'un
enregistrement), `ReportGenerator` / `ReportTask`, `ConfigDetails` (constructeur d'applications),
`NYXInfo`, `PGGenericTable`.

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

Current version: **v3.29.30** (24/Oct/2026).

* Fixed table header inputs (configuration filter/search) by restoring scoped header slots.

[Versions](versions.md)
