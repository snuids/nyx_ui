# NYX UI agent notes

## Commands

- Install with `npm install`; this is the local workflow documented in `README.md`. `npm ci` will not work because no lockfile is committed.
- Run the development UI with `npm run serve` (Vue CLI dev server, normally on port `8080`). The backend is external; use the README URL form with `?api=...&user=...&password=...#/`.
- Build the production bundle with `npm run build`; output is `dist/`.
- Run `npm run lint` separately for a source change. `package.json` has no test or typecheck script, and no repository test suite/config is present.
- `npm run build` does not lint: `vue.config.js` sets `lintOnSave: false` and removes the ESLint webpack plugin.
- Build a container with `docker build .`; `Dockerfile` uses Node `20.19.0`, runs `yarn install`/`yarn run build` in the builder stage, then copies `dist/` to `/etc/opt/nyx_ui`, where the runtime Express server in `app.js` serves it on port `7654` (started via `start.sh`, which restarts the Node process in a loop).
- `package-lock.json` and `yarn.lock` are ignored and neither is tracked; local npm installs and Docker's Yarn install have no committed lockfile, so dependency versions can drift between them.
- Version is shown from `package.json` (imported in `store.js` as `v${packageJson.version}`), but the Docker image tag is extracted from the commit message, so keep `package.json`'s `version` in sync with the `vX.Y.Z` commit.

## Runtime and configuration

- This is a frontend-only repository; there is no `api/` backend here. The default Vuex API base is the relative path `api/v1/`.
- Backend success is the response body's `error === ""` (e.g. `if (response.data.error == "")`), not the HTTP status; match this envelope when adding calls. Authenticated requests append `?token=<creds.token>` rather than sending an auth header.
- `src/main.js` overrides the API base from the `?api=...` query parameter (stripping its fragment), while `public/index.html` also requests `api/v1/ui_css`.
- The WebSocket URL is derived from the API/host and uses `/nyx_ui_websocket/`; the backend must provide that endpoint.
- `Login.vue` stores the login response in `localStorage.authResponse`; `Main.vue` restores it through `status` and obtains menus/apps from the backend. `src/router/router.js` defines only `/` (Login) and `/main/:recid` (GenericComponent) and has no auth guard.
- `app.js` and `start.sh` are production static-serving pieces, not the Vue development entrypoint.

## Architecture

- The app is Vue `2.7` with Vue CLI `5`, Vuex, vue-router `3`, and Element UI. Bootstrap from `src/main.js`; routes are in `src/router/router.js`; API, auth, time-range, CRUD, and WebSocket state live in `src/store/store.js`.
- `src/components/GenericComponent.vue` dispatches backend-configured apps. Built-in types are `generic-table`, `external`, `kibana`, `grafana`, `form`, and `upload`; other types resolve `app.config.controller` as a component.
- Component discovery uses webpack `require.context` recursively over `src/components/**/*.vue`, keyed by component basename (skipping `GenericComponent`). Keep basenames unique and match them to backend `config.controller`; table/file editors use analogous basename discovery in `tableEditor/` and `fileEditor/`.
- Backend-driven UI pieces belong in the relevant `src/components` subdirectory: `appConfigEditor/` for app-config forms, `tableEditor/` for record editors, and `fileEditor/` for filesystem editors. Components generally receive a `config` object and use Vuex plus `$globalbus`/`$localbus`.
- `src/lang/` contains the `en`, `fr`, and `el` catalogs; the authenticated user's language selects the locale.
- `theme/index.css` is checked in and imported after Element UI's stylesheet. `element-variables.scss` is not referenced by the checked-in build config, so changing it alone does not change the bundle.

## Release and generated files

- Treat `dist/` as generated, ignored output; change `src/` and run `npm run build` instead of patching `dist/`.
- Azure Static Web Apps deploys pushes to `nodeploymaster` and pull requests to `master`, using `/` as the app location and `api` as the API location.
- Container CI (`.github/workflows/build-container.yml`) runs only for `master` pushes, ignores Markdown-only changes, requires a `vMAJOR.MINOR.PATCH` in the commit message, and pushes `snuids/nyx_ui:vX.Y.Z` for `linux/amd64` and `linux/arm64`.
