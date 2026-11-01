import Vue from 'vue'
import Router from 'vue-router'
import Login from '../views/Login.vue'
import Main from '../views/Main.vue'
import Privacy from '../views/Privacy.vue'


import GenericComponent from '../components/GenericComponent.vue'
// import User from '../components/User.vue'
// import Config from '../components/Config.vue'
// import Loading from "@/components/Loading";


Vue.use(Router);


export default new Router({
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login
    },
    {
      // Page publique : on doit pouvoir lire la notice avant d'avoir un compte.
      path: '/privacy',
      name: 'Privacy',
      component: Privacy
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
