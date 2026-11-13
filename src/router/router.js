import { defineAsyncComponent } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import { flushRegistrations } from '@/utils/vue3shim'

/**
 * A route component, with what its module registers.
 *
 * The views register the components they use (`Main.vue` calls `registerComponent('Apps', apps)` and
 * thirty others) at import time, through `@/utils/vue3shim`. While everything was imported at
 * startup, the queue was flushed once before mount — with the routes loaded on demand, those
 * registrations arrive *after* that flush, and `<apps>` / `<logout>` rendered as unknown elements:
 * the app button and the avatar disappeared from the header.
 *
 * So the flush happens per module, before the component is handed to the router.
 */
function route(loader) {
  return defineAsyncComponent(async () => {
    const module = await loader()
    flushRegistrations()
    return module
  })
}

// Each route is loaded when it is visited: before, the four views *and* the generic component
// (which drags the tables, Kibana, Grafana and the editors behind it) were imported at startup, so
// the login screen downloaded the whole console.
const Login = route(() => import('../views/Login.vue'))
const Main = route(() => import('../views/Main.vue'))
const Privacy = route(() => import('../views/Privacy.vue'))
const OAuth = route(() => import('../views/OAuth.vue'))
const Inactive = route(() => import('../views/Inactive.vue'))
const GenericComponent = route(() => import('../components/GenericComponent.vue'))
// import User from '../components/User.vue'
// import Config from '../components/Config.vue'
// import Loading from "@/components/Loading";


/**
 * GitHub returns to `/oauth?code=…`: an OAuth `redirect_uri` cannot carry a fragment, so the
 * return lands on a path, while this router is in hash mode. Without this forward, the
 * console would start on `/`, mount the login screen, and the session would never be
 * completed. The query travels in the fragment, which stays in the browser.
 */
export function normalizeOAuthLocation(win) {
  const w = win || (typeof window !== 'undefined' ? window : null)
  if (!w || !w.location) return
  const path = w.location.pathname.replace(/\/+$/, '')
  if (path !== '/oauth' || w.location.hash) return
  w.history.replaceState(null, '', '/#/oauth' + w.location.search)
}

normalizeOAuthLocation()

export default createRouter({
  // Vue Router 3 used hash mode by default; it is kept so that the existing URLs (/  #/main)
  // keep working.
  history: createWebHashHistory(process.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login
    },
    {
      // Public page: the notice must be readable before having an account.
      path: '/privacy',
      name: 'Privacy',
      component: Privacy
    },
    {
      // Where an inactive account lands: the account exists and its password is right, it is the
      // account that is disabled — the sign-in form cannot help it.
      path: '/inactive',
      name: 'Inactive',
      component: Inactive
    },
    {
      // Landing page of the GitHub sign-in (`?code=…&state=…`). A sibling of `/main`, never a
      // child: a child would inherit the authenticated shell and render the menu of a session
      // that does not exist yet. The path is the `GITHUB_REDIRECT_URI` configured on the API.
      path: '/oauth',
      name: 'OAuth',
      component: OAuth
    },
    {
      path: '/main',
      name: 'Main',
      component: Main,
      children: [
        // {
        //   path: ':category/:subcategory',
        //   name: 'GenericComponent',
        //   component: GenericComponent          
        // },
        {
          path: ':recid',
          name: 'GenericComponent',
          component: GenericComponent          
        },
      ]
    }
  ]
})
