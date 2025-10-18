<template slot="items">
  <!--div v-bind:style="styleContainerComputed" -->
  <div>
    <h1>{{ computedUrl}}</h1>
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
      
        var url=this.config.config.url.replace(
        /token=TOKEN/g,
        "token=" + this.$store.getters.creds.token
      ).replace(/API/g,
        this.$store.getters.apiurl
      ).replace(/HOST/g,
        extractHostname(window.location.href)
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
        
        return url
    }
  },
  mounted: function() {
    console.log("===============  REGISTERING EXTERNAL:");
    this.$globalbus.$on("timerangechanged", payLoad => {
      console.log("GLOBALBUS/KIBANATIMERANGE/");      
      this.createUrl();
    });
  },
  beforeDestroy: function() {
    console.log("===============  UNREGISTERING EXTERNAL:");
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

