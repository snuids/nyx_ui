<template>
  
  <div class="login-container">
    <language-select dark class="login-language" />
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

    <el-card
      v-if="forceChange"
      class="login-card force"
      :body-style="{ padding: '24px 20px' }"
      shadow="hover"
    >
      <el-form class="login-form" label-width="0px" @submit.prevent>
        <el-col :span="24">
          <div class="force-change-title">{{ $t("firstlogin.title") }}</div>
          <div class="force-change-help">{{ $t("firstlogin.help") }}</div>
          <el-form-item label>
            <el-input
              :placeholder="$t('firstlogin.current')"
              type="password"
              autocomplete="off"
              v-model="newPassword.current"
              show-password
            />
          </el-form-item>
          <el-form-item label>
            <el-input
              :placeholder="$t('firstlogin.new')"
              type="password"
              autocomplete="off"
              v-model="newPassword.first"
              show-password
            />
          </el-form-item>
          <el-form-item label>
            <el-input
              :placeholder="$t('firstlogin.repeat')"
              type="password"
              autocomplete="off"
              v-model="newPassword.second"
              show-password
              v-on:keyup.enter="submitNewPassword()"
            />
          </el-form-item>
          <el-button
            class="login-button"
            type="primary"
            size="default"
            color="#048"
            :disabled="changeDisabled"
            :loading="loginunderway"
            @click="submitNewPassword()"
          >{{ $t("firstlogin.submit") }}</el-button>
          <div class="login_error" v-if="newPassword.error">{{ newPassword.error }}</div>
        </el-col>
      </el-form>
    </el-card>

    <el-card v-else class="login-card" :body-style="{ padding: '30px 20px'  }" shadow="hover">
      <el-form class="login-form" label-width="0px">
        <el-col :span="24">
          <el-form-item label>
            <el-input
                            :placeholder="$t('ui.enter_email')"
              name="login"
              autocomplete="none"
              v-model="form.login"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label>
            <el-input
              :placeholder="$t('ui.enter_password')"
              v-on:keyup.enter="validateUser()"
              type="password"
              name="password"
              autocomplete="none"
              v-model="form.password"
            />
          </el-form-item>
          <el-button
            class="login-button"
            @click="validateUser()"
            type="primary"
            :disabled="loginDisabled"
            :loading="loginunderway"
          >{{ $t("ui.login_button") }}</el-button>
          <div class="login_error" v-if="form.error">{{form.error}}</div>
          <template v-if="githubEnabled">
            <div class="login-separator"><span>{{ $t("github.or") }}</span></div>
            <el-button
              class="login-button github-button"
              @click="startGithubLogin()"
              :loading="githubunderway"
            >
              <v-icon name="github" scale="1" />&nbsp;{{ $t("github.signin") }}
            </el-button>
          </template>
        </el-col>
      </el-form>
    </el-card>
    <h1 class="title-login">
      {{config.welcome}}
      <router-link class="privacy-link" to="/privacy">{{ privacyLink }}</router-link>
    </h1>

  </div>
</template>

<script>
/* eslint-disable */

import Vue from "vue";
import axios from "axios";
import { loadLanguageAsync } from "../i18n-setup";
import { privacyNotice } from "@/content/privacy";
import LanguageSelect from "@/components/LanguageSelect";
import { credentialsOverride } from "@/utils/devOverrides";

export default {
  components: { LanguageSelect },
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
    // GitHub sign-in: the button is shown only when the API answers that it is configured.
    githubunderway: false,
    // Provisional password: the API only allows the password change until one is chosen.
    forceChange: false,
    newPassword: { current: "", first: "", second: "", error: "" },
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

    async startGithubLogin() {
      this.githubunderway = true;
      try {
        const response = await axios.get(this.$store.getters.apiurl + "cred/oauth/state");
        if (response.data.error == "" && response.data.url) {
          // The API also set the `state` cookie this browser must give back.
          window.location.href = response.data.url;
          return;
        }
        this.form.error = this.$t("github.unavailable");
      } catch (e) {
        this.form.error = this.$t("github.unavailable");
      }
      this.githubunderway = false;
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
                  message: this.$t("ui.input_canceled")
                });
              });
          } else {
            this.form.error = response.data.error;

          }
        }
      } catch (e) {
        this.loginunderway = false;
        const data = e && e.response && e.response.data;
        if (data && data.error === "TOO_MANY_ATTEMPTS") {
          // The application gate answers 429: without this message, the user saw
          // "Request failed with status code 429" and believed the password was wrong.
          this.form.error = this.$t("firstlogin.locked", { seconds: data.retry_after });
        } else if (data && data.error) {
          this.form.error = data.error;
        } else {
          this.form.error = this.$t("firstlogin.unreachable");
          console.log(e);
        }
      }
    },
    submitNewPassword() {
      const p = this.newPassword;
      p.error = "";
      if (p.first !== p.second) {
        p.error = this.$t("firstlogin.mismatch");
        return;
      }
      if (p.first.length < 12) {
        p.error = this.$t("firstlogin.too_short");
        return;
      }
      this.loginunderway = true;
      const url = this.$store.getters.apiurl + "cred/changepassword?token=" +
        this.$store.getters.creds.token;
      axios
        .post(url, { old_password: p.current, new_password: p.first })
        .then(() => {
          this.loginunderway = false;
          this.forceChange = false;
          this.newPassword = { current: "", first: "", second: "", error: "" };
          this.form.password = "";
          this.$notify({
            title: this.$t("firstlogin.done_title"),
            message: this.$t("firstlogin.done"),
            type: "success",
            position: "bottom-right"
          });
        })
        .catch(error => {
          this.loginunderway = false;
          const details = error && error.response && error.response.data;
          p.error = (details && details.error) || this.$t("firstlogin.failed");
        });
    },
    authenticate(response) {
      
      console.log('LOGIN -- authenticate')

      localStorage.authResponse = JSON.stringify(response)

      this.$i18n.locale = response.data.cred.user.language;
      // `Vue.config.lang` was Element UI 2's locale switch; Element Plus reads the locale from
      // the i18n instance, and Vue 3 has no global `Vue` object — the assignment threw here, after
      // the token was stored and before the store commit, so the login looked refused.

      response.data.cred.user.user = this.form.login;
      this.$store.commit({
        type: "login",
        data: response.data
      });
      this.loginunderway = false;

      if (response.data.cred.user.mustResetPassword === true) {
        // The password is provisional: the API would refuse every following call. So it is
        // chosen here, before entering the application.
        this.forceChange = true;
        return;
      }

      var rec_id = null
      try {
        
        rec_id  = this.$store.getters.filteredmenus[0].submenus[0].apps[0].rec_id
      }
      catch (e) {
        // Account without an assigned application: stop here. Continuing with a null rec_id
        // crashed the interface on "reading 'loc_title'", which showed a TypeError as the
        // error message.
        this.loginunderway = false;
        console.log(e);
        this.form.error = this.$t("firstlogin.no_menu");
        this.$router.push("/");
        return;
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



      if(response.data.cred.user.privileges.includes('admin') || response.data.cred.user.privileges.includes('user')) {
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
    changeDisabled() {
      const p = this.newPassword;
      return !p.current || !p.first || p.first !== p.second || this.loginunderway;
    },
    privacyLink() {
      return privacyNotice((this.$i18n && this.$i18n.locale) || "en").link;
    },
    // `/config` carries `login.github`: the API is the one that knows whether it holds a GitHub
    // client id, secret and redirect URI, so the console never builds the URL itself.
    githubEnabled() {
      return !!(this.config && this.config.login && this.config.login.github);
    },
    loginDisabled() {
      return (
        this.form.login.length == 0 ||
        this.form.password.length == 0 ||
        this.loginunderway
      );
    }
  },
  mounted: function() {
    // `?user=` / `?password=` prefill the form in development only: the block is compiled out of a
    // production bundle, where the same link would put a password in the URL, the history and the
    // proxy logs. See utils/devOverrides.js.
    if (process.env.NODE_ENV !== 'production') {
      const prefill = credentialsOverride(window.location.href);
      if (prefill.login) {
        this.form.login = prefill.login;
      }
      if (prefill.password) {
        this.form.password = prefill.password;
      }
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
  /* Element UI 2 ramenait les titres a 20 px en graisse normale ; sans sa feuille de style, le
     navigateur applique son h1 par defaut (32 px, gras). */
  font-size: 20px;
  font-weight: 400;
}

/* The title is again the original element, with its class: size, weight and colour unchanged.
   The link lives inside it, as a block, so it sits below without shifting the title. */
/* The language selector: top right, above the background. It is declared here and not in
   Privacy.vue, whose stylesheet is only loaded when the notice is opened. */
.login-language {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 10;
}

.privacy-link {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  font-weight: normal;
  color: #ffffff;
  text-decoration: underline;
}

.privacy-link:hover {
  color: #ffffff;
  opacity: 0.85;
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

/* « ou » entre les deux moyens de se connecter : une regle simple, pour ne pas laisser le
   second bouton collé au premier. */
.login-separator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 2px;
  color: #909399;
  font-size: 12px;
}

.login-separator::before,
.login-separator::after {
  content: "";
  flex: 1;
  border-top: 1px solid #dcdfe6;
}

.github-button {
  margin-top: 6px;
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

/* The first-change panel has three fields: the login card itself has a fixed height of 200 px.
   Without this variant, the last field and the button fall outside the frame. */
.login-card.force {
  height: 340px;
  margin-top: -180px;
  width: 420px;
  margin-left: -210px;
}

.login-form .el-input__inner{
  /*
  border-radius:50px !important;
  */
}

.login-form .el-button{
  margin-top: 12px;
  /* Element UI 2 : bouton de 40 px. Element Plus suit --el-component-size (36 px ici). */
  height: 40px;
  width: 100%;
}
</style>
