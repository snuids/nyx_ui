import Vue from 'vue'
import App from './App.vue'
import Vuex from 'vuex'
import router from './router/router'
import store from './store/store'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import locale_en from 'element-ui/lib/locale/lang/en.js'
import 'vue-awesome/icons';
import Icon from 'vue-awesome/components/Icon';
import VueI18n from 'vue-i18n'
import 'element-ui/lib/theme-chalk/reset.css'
import {i18n} from  './i18n-setup'
import {filters} from '@/utils/filters'
import {getUrlVars, resolveLanguage} from '@/utils/language'
import ElementLocale from 'element-ui/lib/locale'
import vueNumeralFilterInstaller from 'vue-numeral-filter';
import draggable from "vuedraggable";
import InfiniteLoading from 'vue-infinite-loading';


import '../theme/index.css'




Vue.component('v-icon', Icon)
Vue.component("draggable", draggable);

Vue.use(ElementUI, {locale:locale_en})
Vue.use(Vuex);
Vue.use(VueI18n) 
Vue.use(vueNumeralFilterInstaller);
Vue.use(InfiniteLoading, { /* options */ });



Vue.config.productionTip = false
Vue.prototype.$globalbus = new Vue();
Vue.prototype.$localbus = new Vue();

// The filters themselves live in src/utils/filters.js, where they are testable.
Object.keys(filters).forEach(name => Vue.filter(name, filters[name]))

const vars = getUrlVars(window.location.href);
if (vars["api"]!=undefined)
{  
  store.state.apiurl=vars["api"].split('#')[0];
}

// Resolve the UI language on startup so a page reload keeps the user's language.
// Priority: URL parameter (language/lang/locale) > persisted logged-in user language > 'en'.
let storage = {};
try {
  storage = window.localStorage;
} catch (e) { /* storage refused */ }

i18n.locale = resolveLanguage(vars, storage);

ElementLocale.i18n((key, value) => i18n.t(key, value))

new Vue({
  i18n,
  router,
  store:store,
  render: h => h(App)
}).$mount('#app')

