<template slot="items">
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
import axios from "axios";
import moment from "moment";
import Vue from "vue";

//alert(computedUrl())


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
    url: ""
  }),
  props: {
    config: {
      type: Object
    }
  },
  computed: {
    computedUrl: function() {
      //var url="https://marmar.snuids.be"+this.config.config.url+"?kiosk"
      var url="."+this.config.config.url+"?kiosk"
      //url="http://www.wikipedia.org"
      console.log("GRAFANA URL: ", url);
      return url
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
  methods: {},
  mounted: function() {},
  beforeDestroy: function() {}
};


</script>

<style>
.kibanatitle {
  font-weight: bolder;
}
</style>

