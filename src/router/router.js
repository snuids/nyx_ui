import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Main from '../views/Main.vue'
import Privacy from '../views/Privacy.vue'
import OAuth from '../views/OAuth.vue'


import GenericComponent from '../components/GenericComponent.vue'
// import User from '../components/User.vue'
// import Config from '../components/Config.vue'
// import Loading from "@/components/Loading";


/**
 * GitHub renvoie sur `/oauth?code=…` : une `redirect_uri` OAuth ne peut pas porter de fragment, donc
 * le retour arrive sur un chemin, alors que ce routeur est en mode hash. Sans ce report, la console
 * demarrerait sur `/`, monterait l'ecran de connexion, et la session ne serait jamais terminee.
 * La requete passe dans le fragment, qui reste cote navigateur.
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
  // Vue Router 3 utilisait le mode hash par defaut ; on le conserve pour que les URL
  // existantes (/  #/main) continuent de fonctionner.
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
