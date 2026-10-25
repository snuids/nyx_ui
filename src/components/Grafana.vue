<template slot="items">
  <!--div v-bind:style="styleContainerComputed" -->
  
  <div>
    <!-- <h1>Grafana {{ computedUrl }}</h1> -->
    <div v-if="config.downloadChecked" :style="toolbarStyle">
      <el-button
        size="mini"
        icon="el-icon-download"
        :loading="downloadLoading"
        :disabled="!dashboardUid"
        @click="downloadData"
      >{{ $t('grafana.download_data') }}</el-button>
      <span class="grafana-download-hint">{{ $t('grafana.download_hint') }}</span>
    </div>
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


export default {
  name: "External",
  data: () => ({
    url: "",
    downloadLoading: false
  }),
  props: {
    config: {
      type: Object
    }
  },
  computed: {
    computedUrl: function() {
      return this.createUrl();
      
    },
    dashboardUid: function() {
      var cfg = this.config && this.config.config ? this.config.config : {};
      if (cfg.grafanaUid) return cfg.grafanaUid;
      var match = String(cfg.url || "").match(/(?:^|\/)d\/([^/?#]+)/);
      return match ? match[1] : "";
    },
    toolbarStyle: function() {
      var left = this.$store.state.menuOpen ? 210 : 0;
      var top = 64;
      if (this.$store.getters.currentSubCategory.apps.length > 1) {
        top += 50;
      }
      return {
        position: "fixed",
        top: top + "px",
        left: left + "px",
        right: "0px",
        height: "50px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "0 10px",
        background: "#fff",
        zIndex: 10
      };
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
    getTimeRange: function() {
      var range = this.$store.getters.timeRange;
      switch (this.config.timeSelectorType) {
        case "day":
          range = this.$store.getters.timeRangeDay;
          break;
        case "week":
          range = this.$store.getters.timeRangeWeek;
          break;
        case "month":
          range = this.$store.getters.timeRangeMonth;
          break;
        case "year":
          range = this.$store.getters.timeRangeYear;
          break;
      }
      if (!range || range.length < 2) return null;
      return {
        from: moment(range[0]).valueOf(),
        to: moment(range[1]).valueOf()
      };
    },
    getIframeVariables: function() {
      try {
        var iframe = this.$refs.iframeContent;
        if (!iframe || !iframe.contentWindow) return {};
        var params = new URLSearchParams(
          iframe.contentWindow.location.search || ""
        );
        var names = new Set();
        params.forEach(function(value, key) {
          if (key.indexOf("var-") === 0) names.add(key.slice(4));
        });
        var variables = {};
        names.forEach(function(name) {
          var values = params.getAll("var-" + name);
          variables[name] = values.length > 1 ? values : values[0];
        });
        return variables;
      } catch (e) {
        // The iframe may be cross-origin; fall back to the dashboard defaults.
        return {};
      }
    },
    createUrl: function() {
        var cururl = this.config.config.url;
        var range = this.getTimeRange() || {
          from: moment()
            .subtract(6, "hours")
            .valueOf(),
          to: moment().valueOf()
        };
        var startTimeAsUtc = moment(range.from).utc();
        var endTimeAsUtc = moment(range.to).utc();

        var timestring =
          "time:(from:'" +
          startTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
          "Z',mode:absolute,to:'" +
          endTimeAsUtc.format("YYYY-MM-DDTHH:mm:ss.SSS") +
          "Z')";

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

        
        var url="."+this.config.config.url+"?kiosk=true&hideLogo=true"
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
    },
    downloadData: function() {
      if (!this.dashboardUid) {
        this.$notify({
          title: this.$t("grafana.export_failed"),
          message: this.$t("grafana.no_dashboard"),
          type: "warning",
          position: "bottom-right",
          duration: 5000
        });
        return;
      }

      var range = this.getTimeRange();
      if (!range && this.config.timeSelectorChecked) {
        this.$notify({
          title: this.$t("grafana.export_failed"),
          message: this.$t("grafana.export_failed_message"),
          type: "danger",
          position: "bottom-right",
          duration: 5000
        });
        return;
      }

      this.downloadLoading = true;

      var url =
        this.$store.getters.apiurl +
        "sendmessage?token=" +
        this.$store.getters.creds.token;

      var randomID =
        Math.floor((1 + Math.random()) * 0x1000000) +
        "_" +
        Math.floor((1 + Math.random()) * 0x1000000);

      var dashboardTitle = this.config.title || this.dashboardUid;
      var report = {
        title: this.$t("grafana.export_title") + ": " + dashboardTitle,
        description: this.$t("grafana.export_hint"),
        icon: "chart-line",
        reportType: "python",
        exec: "./reports/pythondef/grafana_export.py",
        output: ["xlsx"],
        privileges: [],
        parameters: [
          {
            name: "dashboardUid",
            title: "Dashboard UID",
            type: "text",
            value: this.dashboardUid
          },
          {
            name: "from",
            title: "From",
            type: "text",
            value:
              this.config.timeSelectorChecked && range
                ? String(range.from)
                : ""
          },
          {
            name: "to",
            title: "To",
            type: "text",
            value:
              this.config.timeSelectorChecked && range
                ? String(range.to)
                : ""
          },
          {
            name: "variables",
            title: "Variables",
            type: "text",
            value: JSON.stringify(this.getIframeVariables())
          }
        ]
      };

      var message = {
        destination: "/queue/NYX_REPORT_STEP1",
        body: JSON.stringify({
          id: "id_" + randomID,
          creds: this.$store.getters.creds,
          report: report,
          privileges: this.$store.getters.creds.user.privileges || [],
          task: {
            mailingList: [],
            mailingListCc: [],
            mailingListCci: [],
            mailSubject: "",
            mailTemplate: ""
          }
        })
      };

      axios
        .post(url, message)
        .then(response => {
          if (response.data.error != "") {
            this.$notify({
              title: this.$t("grafana.export_failed"),
              message:
                response.data.error || this.$t("grafana.export_failed_message"),
              type: "danger",
              position: "bottom-right",
              duration: 6000
            });
          } else {
            this.$notify({
              title: this.$t("grafana.export_queued"),
              message: this.$t("grafana.export_queued_message"),
              type: "success",
              position: "bottom-right",
              duration: 7000
            });
          }
        })
        .catch(error => {
          console.log(error);
          this.$notify({
            title: this.$t("grafana.export_failed"),
            message: this.$t("grafana.export_failed_message"),
            type: "danger",
            position: "bottom-right",
            duration: 6000
          });
        })
        .finally(() => {
          this.downloadLoading = false;
        });
    }
  },
  mounted: function() {
    console.log("===============  REGISTERING GRAFANA:");
    this.$globalbus.$on("timerangechanged", payLoad => {
      console.log("GLOBALBUS/KIBANATIMERANGE/");
      this.createUrl();
    });
  },
  beforeDestroy: function() {
    console.log("===============  UNREGISTERING GRAFANA:");
    this.$globalbus.$off("timerangechanged");
    this.$globalbus.$off("kibanaactivated");
  }
};


</script>

<style>
.kibanatitle {
  font-weight: bolder;
}
.grafana-download-hint {
  color: #606266;
  font-size: 12px;
}
</style>

