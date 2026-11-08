<template>
  <div class="oauth-page">
    <el-card class="oauth-card" shadow="never">
      <div class="oauth-inner">
        <template v-if="!errorMessage">
          <v-icon name="spinner" scale="2" spin />
          <p class="oauth-text">{{ $t("github.waiting") }}</p>
        </template>

        <template v-else>
          <v-icon name="exclamation-triangle" scale="2" class="oauth-error-icon" />
          <p class="oauth-text oauth-error">{{ errorMessage }}</p>
          <el-button type="primary" @click="backToLogin()">{{ $t("github.back") }}</el-button>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script>
/**
 * Landing page of the GitHub sign-in: `/oauth?code=…&state=…`.
 *
 * GitHub sends the browser back here after the user has authorised the app. This page does one
 * thing — hand the `code` and its `state` to POST `/cred/login_github` — and then finishes the
 * session exactly the way the password form does (`Login.vue`'s `authenticate()`): the payload is
 * kept in `localStorage`, the store commits `login`, and the console opens the first application
 * of the account.
 *
 * The `code` is single-use and the `state` dies with this call; neither is kept in the history once
 * the page has run, so the URL is replaced by the application route as soon as it succeeds.
 */
import axios from "axios";
import { getUrlVars } from "@/utils/language";

export default {
  name: "OAuth",
  data: () => ({
    errorMessage: ""
  }),
  created() {
    this.completeSignIn();
  },
  methods: {
    async completeSignIn() {
      const vars = getUrlVars(window.location.href);
      // The console runs in hash mode: `getUrlVars` keeps the fragment, which is never part of a
      // callback parameter.
      const code = (vars.code || "").split("#")[0];
      const state = (vars.state || "").split("#")[0];

      if (!code || !state) {
        this.errorMessage = this.$t("github.failed");
        return;
      }

      let response = null;
      try {
        response = await axios.post(this.$store.getters.apiurl + "cred/login_github", { code, state });
      } catch (e) {
        const data = e && e.response && e.response.data;
        this.errorMessage = (data && data.error) ? this.$t("github.failed") : this.$t("github.unavailable");
        return;
      }

      const data = response && response.data;
      if (!data || data.error != "" || !data.cred) {
        // The API answers "Bad Credentials" for an identity without an account as well as for a
        // refused code: the message says what the user can act on.
        this.errorMessage = this.$t("github.no_account");
        return;
      }

      localStorage.authResponse = JSON.stringify(response);
      if (data.cred.user.language) {
        this.$i18n.locale = data.cred.user.language;
      }
      // `ReportTask` reads `creds.user.user` for report ownership; the password form sets it from
      // the field it posted.
      data.cred.user.user = data.cred.user.login;

      if (data.cred.user.mustResetPassword === true) {
        // The API refuses everything but the password change with such a token, and that form
        // lives on the password login: send the user back there rather than showing a console
        // that answers MUST_CHANGE_PASSWORD to every click.
        this.$store.commit({ type: "login", data });
        this.errorMessage = this.$t("github.change_password");
        return;
      }

      this.$store.commit({ type: "login", data });

      let recid = null;
      try {
        recid = this.$store.getters.filteredmenus[0].submenus[0].apps[0].rec_id;
      } catch (e) {
        recid = null;
      }
      if (!recid) {
        this.errorMessage = this.$t("firstlogin.no_menu");
        return;
      }

      this.$router.replace("/main/" + recid);
    },

    backToLogin() {
      this.$router.push("/");
    }
  }
};
</script>

<style scoped>
.oauth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(0deg, #23a6d5, #23d5ab);
}

.oauth-card {
  width: min(420px, 92vw);
  border-radius: 6px;
}

.oauth-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 18px 8px;
  text-align: center;
}

.oauth-text {
  margin: 0;
  font-size: 14px;
  color: var(--nyx-text, #303133);
}

.oauth-error {
  color: #f56c6c;
}

.oauth-error-icon {
  color: #e6a23c;
}
</style>
