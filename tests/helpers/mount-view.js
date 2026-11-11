/**
 * Mounting the (.vue) screens in jsdom.
 *
 * Until now the tests only covered the logic modules (`vitest.config.mjs`: `node` environment).
 * The 63 single-file components — 24,000 lines, the bulk of the interface — were executed by no
 * test at all. This helper mounts a screen with the same globals as `src/main.js` (`$icons`,
 * `$filters`, `$numeral`, the buses, geolocation) so that the rendering is the application's, not
 * that of an isolated component in an unrealistic environment.
 *
 * The store is the application singleton, as in `tests/store.spec.js`: each test puts it back into
 * its initial state with `resetStore`, otherwise execution order becomes significant.
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

/** Store state at module load: the reference used by `resetStore`. */
const initialState = JSON.parse(JSON.stringify(store.state))

/** Puts the store back into its starting state, applying the test's own values. */
export function resetStore(patch = {}) {
  store.replaceState({ ...JSON.parse(JSON.stringify(initialState)), ...patch })
  return store
}

const Blank = { template: '<div />' }

/** Memory router: screens exercise `$router.push`/`back` without touching the real URL. */
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
 * Mounts a component with the application's plugins and globals.
 *
 * `mocks` takes precedence over the globals (`$notify`, `$prompt`, `$message`): that is how a test
 * observes what would have been displayed to the user.
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
