<template>
  <span>
    <el-dropdown @command="handleCommand">
      <el-button type circle>
        <div
          style="width:16px;height:16px;font-size:14px;"
        >{{$store.getters.creds.user.firstname[0]}}</div>
      </el-button>
      <template #dropdown><el-dropdown-menu>
        <el-dropdown-item command="info">
          <v-icon class="menuicon" name="info-circle" scale="1" />
          &nbsp;&nbsp;{{ $t("logout.info") }}
        </el-dropdown-item>
        <el-dropdown-item v-if="!$store.getters.creds.user.conexion_source || $store.getters.creds.user.conexion_source !== 'ad'" command="password">
          <v-icon class="menuicon" name="key" scale="1" />
          &nbsp;&nbsp;{{ $t("logout.change_pass") }}
        </el-dropdown-item>
        <el-dropdown-item command="privacy">
          <v-icon class="menuicon" name="shield-alt" scale="1" />
          &nbsp;&nbsp;{{ $t("logout.privacy") }}
        </el-dropdown-item>
        <!-- Appearance: three choices, the current one ticked. The theme follows the account
             (`theme` field of the user document), so the choice survives another browser. -->
        <el-dropdown-item divided disabled class="theme-heading">
          {{ $t("theme.appearance") }}
        </el-dropdown-item>
        <el-dropdown-item
          v-for="option in themes"
          :key="option.value"
          :command="'theme:' + option.value"
          :class="{ 'theme-active': theme === option.value }"
        >
          <el-icon class="menuicon"><component :is="option.icon" /></el-icon>
          &nbsp;&nbsp;{{ option.label }}
          <el-icon v-if="theme === option.value" class="theme-check"><component :is="$icons.Check" /></el-icon>
        </el-dropdown-item>
        <el-dropdown-item divided command="logout">
          <v-icon class="menuicon" name="external-link-alt" scale="1" />
          &nbsp;&nbsp;{{ $t("logout.logout") }}
        </el-dropdown-item>
      </el-dropdown-menu></template>
    </el-dropdown>
  </span>
</template>
  
<script>
import axios from "axios";
import { THEMES, applyTheme, readStoredTheme, rememberInSession, storeTheme } from "@/utils/theme";

export default {
  name: "Logout",
  data: () => ({
    // The current theme, for the menu tick. `readStoredTheme` reads the local copy, written at
    // boot and on every choice; failing that, the account provides the value (see the `login`
    // mutation).
    theme: readStoredTheme() || "auto"
  }),
  props: {},
  computed: {
    themes() {
      return THEMES.map((value) => ({
        value,
        label: this.$t("theme." + value),
        icon: {
          light: this.$icons.Sunny,
          dark: this.$icons.Moon,
          auto: this.$icons.Clock
        }[value]
      }));
    }
  },
  created: function() {},
  methods: {
    handleCommand(e) {
      if (e == "info") this.info();
      else if (e == "privacy") this.$router.push("/privacy");
      else if (e == "password") {
        //this.password();
        this.$emit("changepassword");
      } else if (typeof e === "string" && e.indexOf("theme:") === 0) {
        this.setTheme(e.slice("theme:".length));
      } else this.logout();
    },
    // Applied straight away, then saved on the account. A save failure is reported to the user:
    // the theme holds locally, but announcing it as saved would be a lie.
    setTheme(preference) {
      this.theme = preference;
      applyTheme(preference);
      storeTheme(preference);
      const creds = this.$store.getters.creds || {};
      const token = creds.token;
      if (!token) return;
      const url = this.$store.state.apiurl + "cred/preferences?token=" + encodeURIComponent(token);
      axios
        .post(url, { theme: preference })
        .then((response) => {
          if (response.data && response.data.error) throw new Error(response.data.error);
          rememberInSession(preference);
          this.$notify({
            title: this.$t("notifications.message"),
            message: this.$t("theme.saved"),
            type: "success",
            position: "bottom-right"
          });
        })
        .catch((error) => {
          console.warn("theme: the preference was not saved on the account", error);
          this.$notify({
            title: this.$t("notifications.message"),
            message: this.$t("theme.not_saved"),
            type: "warning",
            position: "bottom-right"
          });
        });
    },
    info() {
      this.$alert(
        "<strong>"+this.$t('ui.ui_version')+"</strong> " +
          this.$store.getters.version +
          "<br/><strong>"+this.$t('ui.api_version')+"</strong> "+this.$store.getters.apiVersion+ "<br/><strong>"+this.$t('ui.window_size')+"</strong> (" +
          this.$store.getters.containerSize.width +
          "," +
          this.$store.getters.containerSize.height +
          ")"
          +"<br/><strong>"+this.$t('ui.browser')+"</strong> "+this.$browserDetect.meta.name 
          +"<br/><strong>"+this.$t('ui.browser_version')+"</strong> "+this.$browserDetect.meta.version
          +"<br/><strong>"+this.$t('ui.token_label')+"</strong> "+this.$store.getters.creds.token
          
          ,
        this.$t('ui.nyx_version'),
        {
          confirmButtonText: "OK",
          dangerouslyUseHTMLString: true
        }
      ).catch(() => {
        // User closed the dialog - no action needed
      });
    },
    logout() {
      console.log("BEFCOMMIT");
      this.$store.commit({
        type: "logout",
        data: {}
      });
      console.log("AFTERCOMMIT");
      this.$notify({
        title: this.$t("notifications.message"),
        message: this.$t("notifications.byebye"),
        type: "success",
        position: "bottom-right"
      });
      this.$router.push("/");
    }
  }
};
</script>

<style>
.menuicon {
  margin-bottom: -3px;
}

/* The "Appearance" header is a disabled item: it must not react to hover like a command. */
.el-dropdown-menu__item.theme-heading {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.65;
  cursor: default;
  padding-bottom: 2px;
}

.el-dropdown-menu__item.theme-heading:hover {
  background-color: transparent;
  color: inherit;
}

/* The tick of the current choice. `.el-dropdown-menu__item` is already a flex container:
   `margin-left: auto` pushes it right without overflowing the menu (a `float: right` moved
   it out of the clickable area). */
.theme-check {
  margin-left: auto;
}
</style>
