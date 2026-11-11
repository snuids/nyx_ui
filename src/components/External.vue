<template>
  <!--div v-bind:style="styleContainerComputed" -->
  <div>
    <iframe
      :src="computedUrl"
      frameborder="0"
      :width="containerWidth"
      :height="containerHeight"
      ref="iframeContent"
      v-bind:style="iFrameContainerComputed"
    ></iframe>
  </div>
</template>

<script>
/* eslint-disable */
import _ from "lodash";
import moment from "moment";

import { currentTheme } from "@/utils/theme";
import { appendQueryParam } from "@/utils/url";


function extractHostname(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
}


export default {
  name: "External",
  data: () => ({
    url: "",
    // The current theme, reactive: an external application does not know our theme, it reads it
    // from its URL. Without this tracked value, the iframe kept the theme of the day it opened.
    themeName: currentTheme()
  }),
  props: {
    config: {
      type: Object
    }
  },
  computed: {
    computedUrl: function() {
      var cururl = this.createUrl();
      return cururl;
    },
    containerHeight: function() {
      var headerheight = 0;
      if (this.$store.getters.currentSubCategory.apps.length > 1) {
        headerheight += 50;
      }
      if (
        this.config.queryFilterChecked ||
        this.config.downloadChecked ||
        this.config.queryBarChecked
      ) {
        headerheight += 50;
      }
      return (
        this.$store.getters.containerSize.height - 64 - headerheight + "px"
      );
      //return "1400px";
    },
    containerWidth: function() {
      var left = 210;
      if (!this.$store.state.menuOpen) left = 0;

      return this.$store.getters.containerSize.width - left + "px";
      //return "1400px";
    },
    iFrameContainerComputed: function() {
      var headerheight = 0;
      if (this.$store.getters.currentSubCategory.apps.length > 1) {
        headerheight += 50;
      }
      if (
        this.config.queryFilterChecked ||
        this.config.downloadChecked ||
        this.config.queryBarChecked
      ) {
        headerheight += 50;
      }

      var left = 210;
      if (!this.$store.state.menuOpen) left = 0;

      return {
        border: "0px solid #888",
        //overflow: "hidden !important",
        position: "fixed",
        top: 64 + headerheight + "px",
        left: left + "px",
        right: "0px"
      };
    }
  },
  methods: {
    createUrl: function() {
      
        var userLang =
          (this.$store.getters.creds &&
            this.$store.getters.creds.user &&
            this.$store.getters.creds.user.language) ||
          this.$i18n.locale ||
          "";

        var url=this.config.config.url.replace(
        /token=TOKEN/g,
        "token=" + this.$store.getters.creds.token
      ).replace(/API/g,
        this.$store.getters.apiurl
      ).replace(/HOST/g,
        extractHostname(window.location.href)
      ).replace(/LANG/g,
        userLang
      ).replace(/\bTHEME\b/g,
        this.themeName
      );
        if (this.config.timeSelectorChecked)
        {
          var startTimeAsUtc = moment(this.$store.getters.timeRange[0]).utc();
          var endTimeAsUtc = moment(this.$store.getters.timeRange[1]).utc();

          url=url.replace(
            /FROMDATE/g,
            startTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss") + "Z"
          ).replace(
            /TODATE/g,
            endTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss") + "Z"
          );
        }

        // An application wired to our context (it carries TOKEN, API or LANG) also receives the
        // theme, even when its configuration does not mention THEME. Forgetting the token in a
        // configuration produces no error: the application simply opens without a theme, and
        // nothing says so. Third-party links (kibana, grafana, cerebro…) stay untouched, since
        // they do not carry those tokens.
        const usesConsoleContext = /token=TOKEN|\bAPI\b|\bLANG\b/.test(
          this.config.config.url
        );
        if (usesConsoleContext && !/\bTHEME\b/.test(this.config.config.url)) {
          url = appendQueryParam(url, "theme", this.themeName);
        }

        return url
    }
  },
  mounted: function() {
    console.log("===============  REGISTERING EXTERNAL:");

    // `nyx:theme` is emitted by `applyTheme` on every light/dark switch: the iframe URL is then
    // recomputed, hence the THEME parameter it carries.
    this.themeHandler = () => {
      this.themeName = currentTheme();
    };
    document.addEventListener("nyx:theme", this.themeHandler);
    this.$globalbus.$on("timerangechanged", payLoad => {
      console.log("GLOBALBUS/KIBANATIMERANGE/");      
      this.createUrl();
    });
  },
  beforeUnmount: function() {
    console.log("===============  UNREGISTERING EXTERNAL:");
    document.removeEventListener("nyx:theme", this.themeHandler);
    this.$globalbus.$off("timerangechanged");
    this.$globalbus.$off("kibanaactivated");
  }
};


</script>

<style>
.kibanatitle {
  font-weight: bolder;
}
</style>

