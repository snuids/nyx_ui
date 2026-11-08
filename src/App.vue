<template>
  <el-config-provider :locale="elementLocale($i18n.locale)">
    <div id="app" class="nyxapp">    
      <router-view/>
    </div>
  </el-config-provider>
</template>

<script>
import axios from "axios";
import _ from "lodash";
import { elementLocale } from "./i18n-setup";
/* eslint-disable */
export default {
  name: "App",
  // Element Plus etait installe une fois pour toutes avec la langue lue au demarrage
  // (`app.use(ElementPlus, { locale })`) : le selecteur de date gardait donc la langue du boot, alors
  // que les libelles de la console suivaient le compte des la connexion. Un utilisateur dont le
  // navigateur se souvenait du grec voyait sa console en francais et son calendrier en grec.
  // `el-config-provider` rend la langue des composants Element Plus reactive.
  watch: {
    "$i18n.locale": function(locale) {
      this.rememberLanguage(locale);
    },
  },
  data: () => ({
    axiosInterceptor: null,
    wsInterval:null
  }),
  methods: {
    // La langue d'Element Plus, pour `el-config-provider` : reactive, elle suit `$i18n.locale`.
    elementLocale: elementLocale,
    // Une langue choisie doit aussi se retenir et se dire au document, sinon le prochain demarrage
    // repart d'une autre et le navigateur signale la mauvaise langue aux lecteurs d'ecran.
    rememberLanguage(locale) {
      if (!locale) return;
      document.documentElement.lang = locale;
      try {
        localStorage.nyx_language = locale;
      } catch (e) {
        /* storage refused: the choice lives for this session only */
      }
    },
    enableInterceptor() {
        console.log('enable interceptors axios')

        this.axiosInterceptor = axios.interceptors.request.use((config) => {
            // console.log('request interceptor success')
            return config
        }, (error) => {
            // console.log('request interceptor error')
            return Promise.reject(error)
        })
        
        axios.interceptors.response.use((response) => {
            // console.log('response interceptor success')
            // console.log(response)
            this.reportApiError(response.data)
            return response
        }, (error) => {
            /* Depuis nyx_rest 3.22.23 les refus de token ne repondent plus 200 : NO_TOKEN et
             * UNKNOWN_TOKEN sont des 401, NO_PRIVILEGE et MUST_CHANGE_PASSWORD des 403. Sans ce
             * branchement, `axios` rejette la promesse et aucun `.then()` ne s'execute : l'ecran
             * restait fige au lieu de deconnecter. Le corps garde sa forme, c'est donc le meme
             * traitement que pour un 200 d'erreur. */
            const payload = error.response && error.response.data
            this.reportApiError(payload)
            if (!(payload && payload.error)) {
              console.warn('response interceptor error')
              console.log(error)
            }
            return Promise.reject(error)
        })
    },

    /* Un refus d'authentification deconnecte, toute autre erreur de l'API se signale. Un 401 sur
     * l'ecran de connexion n'est pas une session perdue : il reste silencieux. */
    reportApiError(data) {
        if (data == null || data.error == null || data.error == '') {
            return
        }
        if (data.error == 'UNKNOWN_TOKEN' || data.error == 'NO_TOKEN') {
            console.warn(data.error)
            if (this.$route.path != '/') {
                this.logoutDebounce(true)
            }
            return
        }
        this.$notify({
            title: "Error",
            message: data.error,
            type: "error",
            position: "bottom-right"
        });
    },

    disableInterceptor() {
        axios.interceptors.request.eject(this.axiosInterceptor)
    },  

    logoutDebounce: _.debounce(function(badToken=true)  {
      console.log('LOGOUT')
      this.$store.commit({
        type: "logout",
        data: {}
      });
      
      if(this.$route.path != '/') {
        this.$router.push("/");
      }

      if(badToken) {
        this.$notify({
          title: this.$t("ui.bad_token"),
          message: "Logout",
          type: "error",
          position: "bottom-right"
        });
      }

    }, 200),
    async loadConfig() {
      try {
        const response = await axios.get(
          this.$store.getters.apiurl + "config",
          {}
        );

        if (response.data.error == "") {
          this.initialized = true;
          this.config = response.data;

          if(response.data.elastic_version != null) {
            this.$store.commit({
              type: "elasticVersion",
              data: response.data.elastic_version
            });
          }

        }
      } catch (error) {
        console.warn('Backend API not available:', error.message);
        // App can still run without backend config
      }
    },

  },
  mounted: function() {
    console.log('mounted')
    if(this.axiosInterceptor == null) {
      this.enableInterceptor()
    }
    if( this.wsInterval==null)
    {
      this.wsInterval = setInterval(() => {
            this.$store.dispatch('check_websocket')
        }, 3000)
    }

    this.loadConfig();

    // Listen for websocket messages globally
    this.$globalbus.$on("messagereceived", payLoad => {
      console.log("GLOBALBUS/APP/MESSAGERECEIVED", payLoad);
      console.log("payLoad stringified:", JSON.stringify(payLoad));
      
      // Handle nested data structure from websocket
      const data = payLoad.data || payLoad;
      
      if(data.notif_type == "global") {
        console.log("APP: Showing notification with:", {
          title: data.notif_title,
          message: data.notif_message,
          type: data.notif_message_type
        });
        
        try {
          // Show notification toast
          this.$notify({
            title: data.notif_title || 'Notification',
            message: data.notif_message || '',
            type: data.notif_message_type || 'info',
            position: 'bottom-right',
            duration: 4500
          });
          console.log("APP: Notification called successfully");
        } catch (err) {
          console.error("APP: Error showing notification:", err);
        }
      }
    });
  },
  beforeUnmount () {
    if( this.wsInterval!=null)
      clearInterval(this.wsInterval)
    
    // Clean up listener
    this.$globalbus.$off("messagereceived");
  }
};
</script>
<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  background-color: aqua;
}

#nav a {
  padding: 30px;
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  padding: 30px;
  color:red;
}
/* 
.nyxapp
{

} 
*/
</style>
