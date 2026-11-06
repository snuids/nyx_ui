import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router'
import store from './store/store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Variables CSS du theme sombre : la bascule se fait ensuite en posant `data-theme="dark"` sur
// <html>, sans bibliotheque supplementaire.
import 'element-plus/theme-chalk/dark/css-vars.css'
// Dimensions d'Element UI 2 (36 px) que le gabarit suppose : voir le fichier.
import './styles/element-legacy.css'
import draggable from 'vuedraggable'
import InfiniteLoading from 'vue3-infinite-loading'
import numeral from 'numeral'
import { i18n, elementLocale } from './i18n-setup'
import VIcon from './components/VIcon.vue'
import { filters } from '@/utils/filters'
import { getUrlVars, resolveLanguage } from '@/utils/language'
import { apiOverride } from '@/utils/devOverrides'
import { globalBus, localBus } from '@/utils/bus'
import { browserDetect } from '@/utils/browser'
import { geolocation } from '@/utils/geolocation'
import { flushRegistrations } from '@/utils/vue3shim'
// `theme/index.css` etait le theme Element UI 2 compile (1 Mo, 4474 regles `.el-*`). Charge apres
// Element Plus, il ecrasait ses composants : doubles bordures sur les champs, largeurs faussees.
// Le theme de l'application vient de `api/v1/ui_css`, servi par l'API (degrade, en-tete, dialogues).

const vars = getUrlVars(window.location.href)

// Resolve the UI language on startup so a page reload keeps the user's language.
// Priority: URL parameter (language/lang/locale) > persisted logged-in user language > 'en'.
let storage = {}
try {
  storage = window.localStorage
} catch (e) { /* storage refused */ }

i18n.global.locale = resolveLanguage(vars, storage)

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
// Vue 3 removed template filters: `x | formatDate` became `$filters.formatDate(x)` (migration
// codemod). `$numeral` replaces the `numeral` filter of vue-numeral-filter.
app.config.globalProperties.$filters = filters
app.config.globalProperties.$numeral = (value, format) => numeral(value).format(format)

// `?api=` is a development convenience: the block is compiled out of a production bundle, so the
// console can only talk to the API it was built for. See src/utils/devOverrides.js.
if (process.env.NODE_ENV !== 'production') {
  const apiUrlOverride = apiOverride(window.location.href)
  if (apiUrlOverride) {
    store.state.apiurl = apiUrlOverride
    // Le theme de l'application est servi par l'API (`api/v1/ui_css`) et index.html le demande en
    // relatif : en developpement il tomberait sur le serveur webpack, qui repond 404. On le prend
    // donc sur l'API pointee. En production, ce bloc est compile hors du bundle.
    const themeLink = document.createElement('link')
    themeLink.rel = 'stylesheet'
    themeLink.href = apiUrlOverride.replace(/\/?$/, '/') + 'ui_css'
    document.head.appendChild(themeLink)
  }
}

// The 53 `Vue.component(...)` calls made at import time are replayed here, before mount.
flushRegistrations(app)

app.mount('#app')
