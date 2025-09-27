<template slot="items">
  <div>
    <el-row v-if="config.queryFilterChecked">
      <QueryFilter :config="config" v-on:queryfilterchanged="queryfilterchanged"></QueryFilter>
    </el-row>
    <!-- <h1>USE:{{ JSON.stringify(config.config.useShortUrl) }}>>>> {{ computedurl }}</h1> -->

    <el-row v-if="config.queryBarChecked">
      <QueryBar @querychanged="queryBarChanged" @downloadasked="downloadAsked" :config="config"></QueryBar>
    </el-row>
   
    <div v-if="urlTooLong()">

        <el-row>
          <i style="font-size:100px;" class="el-icon-warning-outline"></i>
        </el-row>

        <el-row>
          <div style="font-size:20px; margin-top:10px;">
            The URL is too long ({{computedurl.length}} characters) for your browser ({{$browserDetect.meta.name}})
          </div>
        </el-row>

        <el-row type="flex" justify="center">
          <el-card style="width:300px; text-align:center; margin-top:10px;" shadow="never">
            <el-table
              :data="browsersData"
              size="mini"
              style="">
              <el-table-column
                prop="name"
                label="Browser"
                width="180">
              </el-table-column>
              <el-table-column
                prop="maxSize"
                label="Max Size">
              </el-table-column>
            </el-table>
          </el-card>
        </el-row>

    </div>
    <iframe
      v-else
      id="kibana-iframe"
      :src="computedurl"
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
import browserDetect from "vue-browser-detect-plugin";
Vue.use(browserDetect);



const $ = require("jquery");

window.$ = $;

export default {
  name: "Kibana",
  data: () => ({
    url: "",
    finalquery: "",
    computedurl: "",
    ready: false,
    queryField: "",
    queryfilter: "",
    timerange: "",
    specificTime: null,
    browsersData: [
      {
        name: 'Chrome',
        maxSize:'32779'
      }, 
      {
        name: 'Android',
        maxSize:'8192'
      },
      {
        name: 'Firefox',
        maxSize:'>64k'
      },
      {
        name: 'Safari',
        maxSize:'>64k'
      },
      {
        name: 'IE11',
        maxSize:2047
      },
      {
        name: 'Edge 16',
        maxSize:2047
      },
    ],
  }),
  watch: {
    queryField: function() {
      this.queryChanged();
    },
    configin: function() {
      this.createUrl();
    }
  },
  props: {
    config: {
      type: Object
    },
    // directLoad: {
    //   type: Boolean
    // }
  },
  computed: {
    configin: function() {
      return this.config;
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
      //headerheight += 66; // TEMP
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

      return {};
    },
    styleContainerComputed: function() {
      if (this.$store.getters.currentSubCategory.apps.length == 1) {
        return {
          border: "10px solid green",
          overflow: "hidden !important",
          position: "absolute",
          bottom: "0px",
          top: "60px",
          left: "210px",
          right: "0px"
        };
      } else {
        return {
          border: "1px solid red",
          overflow: "auto",
          position: "absolute !important",
          bottom: "0px",
          top: "0px",
          left: "0px",
          right: "0px"
        };
      }
    }
  },
  methods: {
    urlTooLong: function() {
      // console.log('urlTooLong')      
      // console.log(this.computedurl.length)      
      // console.log(this.$browserDetect)      

      if((this.$browserDetect.isEdge || this.$browserDetect.isIE) && this.computedurl.length > 2046)
        return true
      if(this.$browserDetect.isChrome && this.computedurl.length > 32778)
        return true
      if(this.$browserDetect.isChromeIOS > 8192)
        return true

      return false
    },
    queryfilterchanged: function(query) {
      this.queryfilter = query;
      this.createUrl();
    },
    downloadAsked: function(format) {
      this.handleCommand(format);
    },
    handleCommand: function(output) {
      this.$notify({
        title: "Message sent to server", //"Data loaded",
        message: "Waiting for response...",
        type: "success",
        position: "bottom-right",
        duration: 3000
      });

      var url =
        this.$store.getters.apiurl +
        "kibana_load" +
        "?token=" +
        this.$store.getters.creds.token +
        "&output=" +
        output;

      axios.post(url, { export: output }).then(response => {
        console.log("LOAD DATA RES...Download =>" + output);

        this.ready = true;

        if (response.data.error == "") {
          if (response.data.type == "mail") {
            this.$notify({
              title: "Data Sent By Mail",
              message:
                "Records : " +
                response.data.total +
                " (" +
                response.data.took +
                " ms)",
              type: "success",
              position: "bottom-right",
              duration: 4000
            });
            return;
          } else {
            window.open(response.data.url, "_blank");
            this.$notify({
              title: this.$t("notifications.data_loaded"), //"Data loaded",
              message:
                this.$t("notifications.records") +
                ": " +
                response.data.records +
                " (" +
                response.data.timespan +
                " ms)",
              type: "success",
              position: "bottom-right",
              duration: 3000
            });
            return;
          }
        }
      });
    },
    queryBarChanged:function(q)
    {
      console.log("********************************queryBarChanged");
      this.queryField = q;
      
      this.createUrl();
    }
    ,
    queryChanged: _.debounce(function() {
      console.log("DEBOUNCED:" + this.queryField);
      this.createUrl();
    }, 1500),
    createUrl: function() {
      if (this.ready) {
        console.log("UPDATE QUERY...");
        var cururl = this.config.config.url;
        if (this.config.config.useShortUrl) {
          cururl = this.config.config.shorturl;
          
        }
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
        
        if (this.config.timeSelectorChecked && timestring != null)
          cururl = cururl.replace(/time:\([^\)]*\)/g, timestring);
        //alert("CURURL2:" + cururl);
        if (this.config.config.useShortUrl)
          this.computedurl = cururl;
        else
          this.computedurl = this.updateQuery(cururl);
        //alert("CURURL3:" + this.computedurl);
      }
    },
    updateQuery(url) {
      var curquery = "";
      if (this.config.queryBarChecked && this.queryField != "") {
        curquery = this.queryField;
      } else curquery = "*";

      if (
        this.config.config.hiddenQuery != undefined &&
        this.config.config.hiddenQuery != ""
      ) {
        if(this.config.config.hiddenQuery.includes("{{id}}")){
          this.config.config.hiddenQuery = this.config.config.hiddenQuery.replace(/{{id}}/g, this.$store.getters.creds.user.id)
        }
        if(this.config.config.hiddenQuery.includes("{{login}}")){
          this.config.config.hiddenQuery = this.config.config.hiddenQuery.replace(/{{login}}/g, this.$store.getters.creds.user.login)
        }
        if (curquery == "") curquery = this.config.config.hiddenQuery;
        else
          curquery =
            "(" + this.config.config.hiddenQuery + ") AND (" + curquery + ")";
      }

      var fullurl = url;

      const myregex = /(query:'[^']*')/g;
      var match = myregex.exec(fullurl);

      var queryextract = match[0].replace("query:'", "").replace("'", "");
      var replacement = "";
      if (queryextract == "" || queryextract == "*") {
        replacement = curquery;
      } else {
        replacement = "(" + queryextract + ") AND (" + curquery + ")";
      }
      if (this.queryfilter != "" && this.config.queryFilterChecked) {
        if (replacement == "*" || replacement == "")
          replacement = this.queryfilter;
        else replacement = "(" + replacement + ") AND " + this.queryfilter;
      }

      if (this.specificTime != undefined) {
        if (replacement == "*" || replacement == "")
          replacement = this.specificTime;
        else replacement = "(" + replacement + ") AND " + this.specificTime;
      }

      this.finalquery = replacement;
      console.log("FINAL QUERY:" + this.finalquery);
      replacement = "query:'" + replacement + "'";

      var result = fullurl.replace(myregex, replacement);
      
      //console.log(result);
      return result;
    },
    injectStyleIframe: function() {
      var iframe = document.getElementById("kibana-iframe");

      var hideFilterStyle =
        "filter-bar {  background-color: white !important; border-bottom:none !important;}  .filter-bar {  background-color: white !important; border-bottom:none !important;} ";

      if (this.config.hideFilter) {
        hideFilterStyle =
          "  filter-bar {display: none;}  .filter-bar {   background-color: white !important; border-bottom:none !important; height: 0px;visibility: hidden; padding: 0px !important;}";
      }

      $("iframe")
        .contents()
        .find("head")
        .append(
          $(
            "<style type='text/css'> dashboard-viewport-provider {background-color: white !important;}  .theme-light .dshDashboardViewport-withMargins{background-color:white !important;} " +
              hideFilterStyle +
              "  </style>"
          )
        );
    }
  },
  created: function() {
    setTimeout(
      function() {
        this.injectStyleIframe();
      }.bind(this),
      1500
    );
      
    this.ready = true;
    this.createUrl();

    // if (this.directLoad) {
    //   this.ready = true;
    //   this.createUrl();
    // }
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

