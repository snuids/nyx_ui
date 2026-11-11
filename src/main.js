import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router'
import store from './store/store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Dark theme CSS variables: the switch is then done by setting `data-theme="dark"` on
// <html>, without an extra library.
import 'element-plus/theme-chalk/dark/css-vars.css'
// Element UI 2 dimensions (36 px) that the template assumes: see the file.
import './styles/element-legacy.css'
// Re-skin of the header, the menu and the cards for the dark theme (key `html.dark`).
import './styles/dark.css'
import draggable from 'vuedraggable'
import InfiniteLoading from 'vue3-infinite-loading'
import numeral from 'numeral'
import { elementIcons } from './utils/elementIcons'
import { i18n, elementLocale } from './i18n-setup'
import VIcon from './components/VIcon.vue'
import { filters } from '@/utils/filters'
import { getUrlVars, resolveLanguage } from '@/utils/language'
import { applyTheme, readStoredTheme, watchAutoTheme } from '@/utils/theme'
import { apiOverride } from '@/utils/devOverrides'
import { globalBus, localBus } from '@/utils/bus'
import { browserDetect } from '@/utils/browser'
import { geolocation, getLocation } from '@/utils/geolocation'
import { bindApp } from '@/utils/vue3shim'
// `theme/index.css` was the compiled Element UI 2 theme (1 MB, 4474 `.el-*` rules). Loaded
// after Element Plus, it overrode its components: double borders on the fields, wrong widths.
// The application theme comes from `api/v1/ui_css`, served by the API (gradient, header, dialogs).

const vars = getUrlVars(window.location.href)

// Resolve the UI language on startup so a page reload keeps the user's language.
// Priority: URL parameter (language/lang/locale) > persisted logged-in user language > 'en'.
let storage = {}
try {
  storage = window.localStorage
} catch (e) { /* storage refused */ }

i18n.global.locale = resolveLanguage(vars, storage)

// Theme before mount: without it, the page shows in light while the session is being
// restored, then switches — a white flash on every reload. The choice saved on the account
// (`theme` field of the user document) takes over as soon as the session is restored.
applyTheme(readStoredTheme(storage) || "auto")
watchAutoTheme(() => readStoredTheme(storage) || "auto")

const app = createApp(App)

// `vue-awesome`, `vue-browser-detect-plugin` and `vue-browser-geolocation` have no Vue 3 release;
// VIcon and the two small objects replace them, with the same call surface.
app.component('v-icon', VIcon)
app.component('draggable', draggable)
app.component('infinite-loading', InfiniteLoading)

app.use(store)
app.use(router)
app.use(i18n)
app.use(ElementPlus, { locale: elementLocale(i18n.global.locale) })

app.config.globalProperties.$globalbus = globalBus
app.config.globalProperties.$localbus = localBus
app.config.globalProperties.$browserDetect = browserDetect
app.config.globalProperties.$geolocation = geolocation
// Name exposed by `vue-browser-geolocation` in Vue 2: kept for the existing calls.
app.config.globalProperties.$getLocation = getLocation
// `vue-authenticate` (Vue 2 plugin, absent from this build) provided `$auth`. The LinkedIn
// login screen (`LoginOAuth.vue`) still calls it: without that object, the click raised an
// opaque TypeError. An explicit refusal is exposed instead.
app.config.globalProperties.$auth = {
  authenticate(provider) {
    return Promise.reject(new Error('OAuth sign-in is not available in this build (' + provider + ')'))
  },
}
// Vue 3 removed template filters: `x | formatDate` became `$filters.formatDate(x)` (migration
// codemod). `$numeral` replaces the `numeral` filter of vue-numeral-filter.
// Element Plus no longer has an icon font: its icons are components. They are exposed here
// once and for all, which avoids one import per file in the 62 components.
app.config.globalProperties.$icons = elementIcons
app.config.globalProperties.$filters = filters
app.config.globalProperties.$numeral = (value, format) => numeral(value).format(format)

// `?api=` is a development convenience: the block is compiled out of a production bundle, so the
// console can only talk to the API it was built for. See src/utils/devOverrides.js.
if (process.env.NODE_ENV !== 'production') {
  const apiUrlOverride = apiOverride(window.location.href)
  if (apiUrlOverride) {
    store.state.apiurl = apiUrlOverride
    // The application theme is served by the API (`api/v1/ui_css`) and index.html asks for it
    // relatively: in development it would hit the webpack server, which answers 404. It is
    // therefore taken from the API being targeted. In production, this block is compiled out.
    const themeLink = document.createElement('link')
    themeLink.rel = 'stylesheet'
    themeLink.href = apiUrlOverride.replace(/\/?$/, '/') + 'ui_css'
    document.head.appendChild(themeLink)
  }
}

// The 53 `Vue.component(...)` calls made at import time are replayed here, before mount.
bindApp(app)

app.mount('#app')
