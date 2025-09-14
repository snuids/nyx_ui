<template slot="items">
  <!--div v-bind:style="styleContainerComputed" -->
  
  <div>
    <!-- <h1>Grafana {{ computedUrl }}</h1> -->
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
      return this.createUrl();
      
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
      var headerheight = 0;//66;
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
        var cururl = this.config.config.url;
        var startTimeAsUtc = moment(this.$store.getters.timeRange[0]).utc();
        var endTimeAsUtc = moment(this.$store.getters.timeRange[1]).utc();

        var timestring =
          "time:(from:'" +
          startTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
          "Z',mode:absolute,to:'" +
          endTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
          "Z')";

        switch (this.config.timeSelectorType) {
          case "day":
            var startTimeAsUtc = moment(
              this.$store.getters.timeRangeDay[0]
            ).utc();
            var endTimeAsUtc = moment(
              this.$store.getters.timeRangeDay[1]
            ).utc();

            timestring =
              "time:(from:'" +
              startTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
              "Z',mode:absolute,to:'" +
              endTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
              "Z')";
            break;
          case "week":
            var startTimeAsUtc = moment(
              this.$store.getters.timeRangeWeek[0]
            ).utc();
            var endTimeAsUtc = moment(
              this.$store.getters.timeRangeWeek[1]
            ).utc();

            timestring =
              "time:(from:'" +
              startTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
              "Z',mode:absolute,to:'" +
              endTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
              "Z')";
            break;
          case "month":
            var startTimeAsUtc = moment(
              this.$store.getters.timeRangeMonth[0]
            ).utc();
            var endTimeAsUtc = moment(
              this.$store.getters.timeRangeMonth[1]
            ).utc();

            timestring =
              "time:(from:'" +
              startTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
              "Z',mode:absolute,to:'" +
              endTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
              "Z')";
            break;
          case "year":
            var startTimeAsUtc = moment(
              this.$store.getters.timeRangeYear[0]
            ).utc();
            var endTimeAsUtc = moment(
              this.$store.getters.timeRangeYear[1]
            ).utc();

            timestring =
              "time:(from:'" +
              startTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
              "Z',mode:absolute,to:'" +
              endTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
              "Z')";
            break;
        }
        this.timerange = timestring;

        this.specificTime = undefined;

        if (
          this.config.config.specificTimeField != undefined &&
          this.config.config.specificTimeField != ""
        ) {
          var t = moment(this.$store.getters.timeRangeMonth[0]).format(
            this.config.config.specificTimeFormat
          );
          this.specificTime =
            this.config.config.specificTimeField + ":" + '"' + t + '"';
          console.log(t);
          console.log(timestring);
        }

        //alert("====>"+timestring);
        timestring=timestring.replace(",mode:absolute,","").replace("'to:'","&to=").replace("from:'","&from=").replace("(","").replace(")","")
        .replace(/'/g,"").replace("time:", "");

        
        var url="."+this.config.config.url+"?kiosk"
        url=url.replace("grafana/","grafananyx/");
        console.log("GRAFANA URL: ", url);
        
        if (this.config.timeRefresh && this.config.timeRefreshValue) {
          url = url + "&refresh=" + this.config.timeRefreshValue;
        }

        if (this.config.timeSelectorChecked && timestring != null)
          url = url + timestring;
        else if(this.config.config.extraParameters != null)
        {
          url=url+"&"+this.config.config.extraParameters        
        }
        
        
        return url
    }
  },
  mounted: function() {
    console.log("===============  REGISTERING KIBANA:");
    this.$globalbus.$on("timerangechanged", payLoad => {
      console.log("GLOBALBUS/KIBANATIMERANGE/");
      this.createUrl();
    });
    // this.$globalbus.$on("kibanaactivated", payLoad => {
    //   console.log("GLOBALBUS/KIBANAACTIVATED/");
    //   if (payLoad.title == this.config.title && !this.ready) {
    //     this.ready = true;
    //   }

    //   setTimeout(
    //     function() {
    //       this.injectStyleIframe();
    //     }.bind(this),
    //     1500
    //   );

    //   this.createUrl();
    // });
  },
  beforeDestroy: function() {
    console.log("===============  UNREGISTERING KIBANA:");
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

