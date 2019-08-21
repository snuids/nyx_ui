//i18n-setup.js
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import {messages as enmessages} from '@/lang/en'
import {messages as frmessages} from '@/lang/fr'
import {messages as elmessages} from '@/lang/el'
import enlocale from 'element-ui/lib/locale/lang/en.js'
import frlocale from 'element-ui/lib/locale/lang/fr.js'
import ellocale from 'element-ui/lib/locale/lang/el.js'

// Ready translated locale messages

//console.log("enlocale");
//console.log(enmessages);
//console.log("enlocale");

const messages = {
  en: {
    ...enlocale,
    ...enmessages.en
  },
  fr: {
    ...frlocale,
    ...frmessages.fr
  },
  el: {
    ...ellocale,
    ...elmessages.el
  }
}

//Vue.use(ElementUI, {enlocale})
Vue.use(VueI18n)

//console.log(messages);

export const localized_messages=messages;

export const i18n = new VueI18n({
  locale: 'en', // set locale
  fallbackLocale: 'en',
  messages// set locale messages
})

/*const loadedLanguages = ['en'] // our default language that is preloaded 
const elementflanguages={
  "en":enlocale,
  "fr":frlocale
}*/

/*function setI18nLanguage (lang) {
  i18n.locale = lang
  axios.defaults.headers.common['Accept-Language'] = lang
  document.querySelector('html').setAttribute('lang', lang)
  return lang
}

export function loadLanguageAsync (lang) {
    console.log("LOADING "+lang);
  if (i18n.locale !== lang) {    
    console.log("NOt current.");  
    if (elementflanguages[lang] !=undefined)
        {
          var lan=elementflanguages[lang];
          Vue.use(ElementUI, { lan })
        }
    if (!loadedLanguages.includes(lang)) {
        console.log("NOt loaded:"+lang);
      return import( `@/lang/${lang}`).then(msgs => {
        
        i18n.setLocaleMessage(lang, msgs.messages[lang])
        loadedLanguages.push(lang)
        
        return setI18nLanguage(lang)
      })
    } 
    return Promise.resolve(setI18nLanguage(lang))
  }
  return Promise.resolve(lang)
}*/