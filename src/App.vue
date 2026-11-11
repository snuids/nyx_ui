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
  // Element Plus used to be installed once and for all with the language read at startup
  // (`app.use(ElementPlus, { locale })`): the date picker therefore kept the boot language,
  // while the console labels followed the account from login on. A user whose browser
  // remembered Greek saw a French console and a Greek calendar.
  // `el-config-provider` makes the Element Plus component language reactive.
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
    // The Element Plus language, for `el-config-provider`: reactive, it follows `$i18n.locale`.
    elementLocale: elementLocale,
    // A chosen language must also be remembered and announced to the document, otherwise the next
    // start begins from another one, and the browser reports the wrong language to screen readers.
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
            /* Since nyx_rest 3.22.23 token refusals no longer answer 200: NO_TOKEN and
             * UNKNOWN_TOKEN are 401s, NO_PRIVILEGE and MUST_CHANGE_PASSWORD 403s. Without this
             * branch, `axios` rejects the promise and no `.then()` runs: the screen stayed frozen
             * instead of logging out. The body keeps its shape, so the handling is the same as
             * for an error answered with a 200. */
            const payload = error.response && error.response.data
            this.reportApiError(payload)
            if (!(payload && payload.error)) {
              console.warn('response interceptor error')
              console.log(error)
            }
            return Promise.reject(error)
        })
    },

    /* An authentication refusal logs out, any other API error is reported. A 401 on the
     * login screen is not a lost session: it stays silent. */
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
  /* `#2c3e50` was the light theme's grey, set on the application root: any text without a
     colour of its own inherited it, so it stayed dark on a dark background (1.7:1 on
     `--nyx-surface`). Element Plus switches that variable with the theme (#303133 in light,
     #e5eaf3 in dark). The `#nav` rules, inherited from the Vue CLI skeleton and with no
     matching element, go with it (one of them painted an `aqua` background). */
  color: var(--el-text-color-primary);
}
/* 
.nyxapp
{

} 
*/
</style>
