//i18n-setup.js
import { createI18n } from 'vue-i18n'
import { messages as enMessages } from '@/lang/en'
import { messages as frMessages } from '@/lang/fr'
import { messages as elMessages } from '@/lang/el'
import { messages as nlMessages } from '@/lang/nl'
import enLocale from 'element-plus/es/locale/lang/en'
import frLocale from 'element-plus/es/locale/lang/fr'
import elLocale from 'element-plus/es/locale/lang/el'
import nlLocale from 'element-plus/es/locale/lang/nl'

// Element Plus ships its own strings per language; they are merged under `el` so `$t('el.xxx')`
// keeps working exactly as it did with Element UI 2.
// Element Plus exposes `{ name, el: {...} }`; the console calls `$t('el.pagination.total')`, so the
// strings must stay nested under `el`.
const elPack = (locale) => ({ el: { ...(locale && locale.el ? locale.el : locale) } })

const messages = {
  en: {
    ...elPack(enLocale),
    ...enMessages.en,
  },
  fr: {
    ...elPack(frLocale),
    ...frMessages.fr,
  },
  el: {
    ...elPack(elLocale),
    ...elMessages.el,
  },
  nl: {
    ...elPack(nlLocale),
    ...nlMessages.nl,
  },
}

export const localized_messages = messages

// legacy: true keeps `this.$t` and `this.$i18n.locale = ...` working, which is what the components use.
export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages,
  legacy: true,
  globalInjection: true,
})

const locales = { en: enLocale, fr: frLocale, el: elLocale, nl: nlLocale }

/** The Element Plus locale object for a language code, for `app.use(ElementPlus, { locale })`. */
export function elementLocale(lang) {
  return locales[lang] || enLocale
}
