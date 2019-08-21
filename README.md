# Nyx User Interface

## Introduction

The NYX UI includes an online configuration tools that can create the following pages:

* A Kibana page
* A generic table page (PostGreSQL or ElasticSearch)
* An in house controller
* An Upload page
* A Form
* A Free Text page
* A Vega graph



### Generic Table:




## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```



### Compiles and minifies for production
```
npm run build
```
Lauching application

==> http://localhost:8080/?api=https://YOUR_REST_API_SERVER/api/v1/&user=admin&password=*******#/

Rest API swagger

=> Rest API swagger https://YOUR_REST_API_SERVER/api/doc/

### Extending the UI

To add a new specific controller:

=> put a new .vue file inside the folder components/external

To add a new specific table editor:

=> put a new .vue file inside the folder components/tableEditor

### Building the container

```
docker build .
```

Warning: Don't forget to issue a **npm run build** first 





