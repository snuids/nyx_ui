# Version History

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
