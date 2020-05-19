<template>
  <div id="app" class="nyxapp">    
    <router-view/>
  </div>
</template>

<script>
import axios from "axios";
import _ from "lodash";
/* eslint-disable */
export default {
  name: "App",
  data: () => ({
    axiosInterceptor: null,
    wsInterval:null
  }),
  methods: {
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
            if(response.data != null && response.data.error != null && response.data.error == 'UNKNOWN_TOKEN') {
              console.warn('UNKNOWN_TOKEN')
              if(this.$route.path != '/') {
                this.logoutDebounce(true)
              }
            }
            else if (response.data != null && response.data.error != null && response.data.error != ''){
              this.$notify({
                title: "Error",
                message: response.data.error,
                type: "error",
                position: "bottom-right"
              });
            }

            return response
        }, function(error) {
            console.warn('response interceptor error')
            console.log(response)
            return Promise.reject(error)
        })
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
          title: "Bad token",
          message: "Logout",
          type: "error",
          position: "bottom-right"
        });
      }

    }, 200),
    async loadConfig() {
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
    },

  },
  mounted: function() {
    console.log('mounted')
    if(this.axiosInterceptor == null) {
      this.enableInterceptor()
    }
    if( this.wsInterval==null)
    {
      setInterval(() => {
            this.$store.dispatch('check_websocket')
        }, 3000)
    }

    this.loadConfig();
  },
  beforeDestroy () {
    if( this.wsInterval==null)
      clearInterval(this.wsInterval)
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
