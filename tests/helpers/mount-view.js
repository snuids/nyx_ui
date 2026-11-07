/**
 * Montage des ecrans (.vue) dans jsdom.
 *
 * Jusqu'ici les tests ne couvraient que les modules de logique (`vitest.config.mjs` : environnement
 * `node`). Les 63 composants mono-fichier — 24 000 lignes, l'essentiel de l'interface — n'etaient
 * executes par aucun test. Ce helper monte un ecran avec les memes globals que `src/main.js`
 * (`$icons`, `$filters`, `$numeral`, les bus, la geolocalisation) pour que le rendu soit celui de
 * l'application, pas celui d'un composant isole dans un environnement irrealiste.
 *
 * Le store est le singleton de l'application, comme dans `tests/store.spec.js` : chaque test le
 * remet dans son etat initial avec `resetStore`, sinon l'ordre d'execution devient significatif.
 */

import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createRouter, createMemoryHistory } from 'vue-router'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import numeral from 'numeral'

import { i18n } from '@/i18n-setup'
import { filters } from '@/utils/filters'
import { globalBus, localBus } from '@/utils/bus'
import { browserDetect } from '@/utils/browser'
import { geolocation, getLocation } from '@/utils/geolocation'
import VIcon from '@/components/VIcon.vue'
import store from '@/store/store.js'

/** Etat du store au chargement du module : reference pour `resetStore`. */
const initialState = JSON.parse(JSON.stringify(store.state))

/** Remet le store dans son etat de depart, en appliquant les valeurs du test. */
export function resetStore(patch = {}) {
  store.replaceState({ ...JSON.parse(JSON.stringify(initialState)), ...patch })
  return store
}

const Blank = { template: '<div />' }

/** Routeur memoire : les ecrans testent `$router.push`/`back` sans toucher a l'URL reelle. */
export function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Login', component: Blank },
      { path: '/privacy', name: 'Privacy', component: Blank },
      { path: '/main/:recid', name: 'Main', component: Blank },
      { path: '/:pathMatch(.*)*', name: 'fallback', component: Blank },
    ],
  })
}

/**
 * Monte un composant avec les plugins et globals de l'application.
 *
 * `mocks` prend le dessus sur les globals (`$notify`, `$prompt`, `$message`) : c'est par la qu'un
 * test observe ce qui aurait ete affiche a l'utilisateur.
 */
export async function mountView(component, options = {}) {
  const {
    at = '/',
    stubs = {},
    mocks = {},
    props = {},
    components = {},
    attachTo = null,
    router: providedRouter = null,
  } = options

  i18n.global.locale = options.locale || 'en'

  const router = providedRouter || makeRouter()
  await router.push(at)
  await router.isReady()

  const wrapper = mount(component, {
    props,
    attachTo,
    global: {
      plugins: [store, router, i18n, ElementPlus],
      stubs,
      components: { 'v-icon': VIcon, VIcon, ...components },
      mocks: {
        $globalbus: globalBus,
        $localbus: localBus,
        $browserDetect: browserDetect,
        $geolocation: geolocation,
        $getLocation: getLocation,
        ...mocks,
      },
      config: {
        globalProperties: {
          $icons: ElementPlusIcons,
          $filters: filters,
          $numeral: (value, format) => numeral(value).format(format),
          $globalbus: globalBus,
          $localbus: localBus,
          $browserDetect: browserDetect,
          $geolocation: geolocation,
          $getLocation: getLocation,
          $auth: {
            authenticate: (provider) =>
              Promise.reject(new Error(`OAuth sign-in is not available in this build (${provider})`)),
          },
        },
      },
    },
  })

  return { wrapper, router, store }
}
