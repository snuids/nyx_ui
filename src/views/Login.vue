<template>
  
  <div class="login-container">
    <div class="title-icon"></div>
    <div class="login-logo1">
    </div>
    <div class="title-icon2">
      <v-icon
        style="color:white"
        name="spinner"
        scale="3"
        spin
        v-if="!initialized || loginunderway"
      />
      <v-icon
        style="color:white"
        :name="config.icon"
        scale="3"
        v-if="initialized  && !loginunderway"
      />
    </div>

    <div class="title-disclaimer">
      <b>Nyx</b> Platform <b>{{this.$store.getters.version}}</b> ({{$store.getters.elasticVersion}})
    </div>

    <el-card class="login-card" :body-style="{ padding: '30px 20px'  }" shadow="hover">
      <el-form class="login-form" label-width="0px">
        <el-col :span="24">
          <el-form-item label>
            <el-input
              placeholder="Enter email address"
              name="login"
              autocomplete="none"
              v-model="form.login"
              size="medium"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label>
            <el-input
              placeholder="Password"
              v-on:keyup.enter.native="validateUser()"
              type="password"
              name="password"
              autocomplete="none"
              v-model="form.password"
              size="medium"
            />
          </el-form-item>
          <el-button
            class="login-button"
            @click="validateUser()"
            type="primary"
            size="default"
            color="#048"
            
            :disabled="loginDisabled"
            :loading="loginunderway"
          >Login</el-button>
          <div class="login_error" v-if="form.error">{{form.error}}</div>
        </el-col>
      </el-form>
    </el-card>
    <h1 class="title-login">
      {{config.welcome}}
      
    </h1>

  </div>
</template>

<script>
/* eslint-disable */

import Vue from "vue";
import axios from "axios";
import { loadLanguageAsync } from "../i18n-setup";

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(
    m,
    key,
    value
  ) {
    vars[key] = value;
  });
  return vars;
}

export default {
  data: () => ({
    form: {
      login: "",
      password: "",
      error: ""
    },
    config: {
      icon: "fingerprint",
      welcome: "loading"
    },
    loginunderway: false,
    initialized: false
  }),
  created: function() {
    setTimeout(this.loadConfig, 1000);
  },
  methods: {
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

    async validateUser() {
      try {
        this.loginunderway = true;
        const response = await axios.post(
          this.$store.getters.apiurl + "cred/login",
          { login: this.form.login, password: this.form.password }
        );

        if (response.data.error == "") {
          this.authenticate(response);
        } else {
          this.loginunderway = false;

          if (response.data.error == "DoublePhase") {
            this.$prompt("Please input your code", "Second Phase", {
              confirmButtonText: "OK",
              cancelButtonText: "Cancel",
              inputPattern: /[0-9]{5}/,
              inputErrorMessage: "Invalid Code"
            })
              .then(({ value }) => {
                // Try to login with double phase
                axios
                  .post(this.$store.getters.apiurl + "cred/login", {
                    login: this.form.login,
                    password: this.form.password,
                    doublecode: value
                  })
                  .then(response => {
                    if (response.data.error != "")
                      console.log("Double AUth Error...");
                    else {
                      this.authenticate(response);
                    }
                  })
                  .catch(error => {
                    console.log(error);
                  });
              })
              .catch(() => {
                this.$message({
                  type: "info",
                  message: "Input canceled"
                });
              });
          } else {
            this.form.error = response.data.error;

          }
        }
      } catch (e) {
        this.form.error = e;
        this.loginunderway = false;
        console.log(e);
      }
    },
    authenticate(response) {
      
      console.log('LOGIN -- authenticate')

      localStorage.authResponse = JSON.stringify(response)

      this.$i18n.locale = response.data.cred.user.language;
      Vue.config.lang = response.data.cred.user.language;
      //alert(this.$i18n.locale);

      response.data.cred.user.user = this.form.login;
      this.$store.commit({
        type: "login",
        data: response.data
      });
      this.loginunderway = false;

      var rec_id = null
      try {
        
        rec_id  = this.$store.getters.filteredmenus[0].submenus[0].apps[0].rec_id
      }
      catch (e) {
        
        this.loginunderway = false;
        console.log(e);
        this.$router.push("/");
      }

      // var path = "/main/"+app.fulltitle.replace(/ /g,'').toLowerCase()
      var path = "/main/"+rec_id
      

      if(this.$store.getters.redirection) {
        console.log('REDIRECTION: '+this.$store.getters.redirection)
        path = this.$store.getters.redirection
        this.$store.state.redirection = null

        rec_id = path.replace('/main/', '')
      }

      this.$store.commit({
        type: "changeApp",
        data: rec_id
      });



      if(response.data.cred.user.privileges.includes('admin')) {
        // this.$store.dispatch("privileges");
        // this.$store.dispatch("filters");

        this.$store.commit({
          type: "privileges",
          data: response.data.all_priv
        });
        //alert(JSON.stringify(response.data.all_filters))
        this.$store.commit({
          type: "filters",
          data: response.data.all_filters
        });
      }


      console.log('push this path: '+path)

      this.$router.push(path);
      this.$store.commit({
        type: "version",
        data: response.data.version
      });
      this.$notify({
        title: this.$t("notifications.message"),
        message:
          this.$t("notifications.welcome") +
          " v(" +
          response.data.version +
          ")",
        type: "success",
        position: "bottom-right"
      });
      this.form.login = "";
      this.form.password = "";

      
        
      window.dispatchEvent(new Event("resize"));
    }
  },
  computed: {
    loginDisabled() {
      return (
        this.form.login.length == 0 ||
        this.form.password.length == 0 ||
        this.loginunderway
      );
    }
  },
  mounted: function() {
    var vars = getUrlVars();
    if (vars["user"] != undefined) {
      this.form.login = vars["user"].split("#")[0];
    }
    if (vars["password"] != undefined) {
      this.form.password = vars["password"].split("#")[0];
    }
  }
};
</script>

<style>
.loginheader {
  font-size: large;
  font-weight: bolder;
  color: #4376c8;
}
.login_error {
  margin-top: 10px;
  height: 30px;
  color: red;
}

.title-login {
  position: absolute;
  width: 100%;
  text-align: center;
  top: 50%;
  color: white;
  margin-top: 170px;
  font-family: "Helvetica Neue";
}

.title-disclaimer {
  position: absolute;
  text-align: center;
  bottom: 0%;
  right: 0%;
  color: white;
  font-family: "Helvetica Neue";
  padding:3px;
}

.title-icon {
  position: absolute;
  left: 50%;
  text-align: center;
  width: 100px;
  height: 100px;
  margin-left: -50px;
  margin-top: -190px;
  top: 50%;
  color: red;
  font-family: "Helvetica Neue";
  border: solid 2px white;
  border-radius: 80px;
}

.title-icon2 {
  position: absolute;
  left: 50%;
  text-align: center;
  width: 100px;
  height: 100px;
  margin-left: -48px;
  margin-top: -162px;
  top: 50%;
  color: red;
  font-family: "Helvetica Neue";
}

.login-button {
  width: 100%;
  margin-top: 10px;
}

.login-container {
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  height: 100%;
  background-color: #048;
}

.login-card {
  position: absolute;
  left: 50%;
  height: 200px;
  top: 50%;
  margin-top: -50px;
  width: 400px;
  margin-left: -200px;
}

.login-form .el-input__inner{
  /*
  border-radius:50px !important;
  */
}

.login-form .el-button{
  margin-top: 12px;

}
</style>
