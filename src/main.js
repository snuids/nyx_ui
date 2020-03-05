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
import moment from "moment";
import VueI18n from 'vue-i18n'
import 'element-ui/lib/theme-chalk/reset.css'
import {i18n} from  './i18n-setup'
import ElementLocale from 'element-ui/lib/locale'
import vueNumeralFilterInstaller from 'vue-numeral-filter';
import draggable from "vuedraggable";
import InfiniteLoading from 'vue-infinite-loading';


import '../theme/index.css'


console.log("===============");
console.log("Starting");
console.log("===============");

Vue.component('v-icon', Icon)
Vue.component("draggable", draggable);

Vue.use(ElementUI, {locale:locale_en})
Vue.use(Vuex);
Vue.use(VueI18n) 
Vue.use(vueNumeralFilterInstaller);
Vue.use(InfiniteLoading, { /* options */ });



Vue.config.productionTip = false
Vue.prototype.$globalbus = new Vue();

Vue.filter('formatDate', function(value) {
  if (value) {
    return moment(String(value)).format('DD/MM/YYYY HH:mm')
  }
});

Vue.filter('formatTS', function(value) {
  if (value) {
    if(value < 10000000000)
      value *= 1000 

    return moment(value).format('DD/MM/YYYY HH:mm')
  }
});

Vue.filter('formatTS2', function(value) {
  if (value) {
    if(value < 10000000000)
      value *= 1000 

    return moment.utc(value).local().format('DD/MM HH:mm:ss')
  }
});

Vue.filter('capitalize', function (value) {
  if (!value) return ''
  value = value.toString()
  return value.charAt(0).toUpperCase() + value.slice(1)
})

Vue.filter('prettyBytes', function (num) {
  // jacked from: https://github.com/sindresorhus/pretty-bytes
  if (typeof num !== 'number' || isNaN(num)) {
    throw new TypeError('Expected a number');
  }

  var exponent;
  var unit;
  var neg = num < 0;
  var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  if (neg) {
    num = -num;
  }

  if (num < 1) {
    return (neg ? '-' : '') + num + ' bytes';
  }

  exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
  num = (num / Math.pow(1000, exponent)).toFixed(0) * 1;
  unit = units[exponent];

  return (neg ? '-' : '') + num + ' ' + unit;
});

function getUrlVars() {
  var vars = {};
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
      vars[key] = value;
  });
  return vars;
}

var vars=getUrlVars();
if (vars["api"]!=undefined)
{  
  store.state.apiurl=vars["api"].split('#')[0];
}

ElementLocale.i18n((key, value) => i18n.t(key, value))

new Vue({
  i18n,
  router,
  store:store,
  render: h => h(App)
}).$mount('#app')
