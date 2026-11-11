<template>
  <div style="width: 100%;">
    <div :id="id" style="width: 100%;"></div>
    <el-button
      circle
      size="small"
      @click="prepareVega()"
      class="regreshbutton"
      type="primary"
      plain
      :icon="$icons.Refresh"
    ></el-button>
    
  </div>
</template>
  
<script>
import vegaEmbed from "vega-embed";
import moment from "moment";
import { currentTheme } from "@/utils/theme";
import { darkChartConfig } from "@/utils/chartTheme";

// One id per chart, from a counter: Vue 3 has no `_uid`, so `"chart" + this._uid` produced the same
// `chartundefined` for every module. Two Vega apps on one page (the `Vega` / `Vega2` tabs) then
// shared a div and the second chart drew over the first.
let chartCounter = 0;

export default {
  name: "Vega",

  data: () => ({
    vegaSpec: {}
    //    ,switches:[]
  }),
  props: {
    config: {
      type: Object
    }
  },
  computed: {
    configin: function() {
      return this.config;
    },
    containerSize: function() {
      return this.$store.getters.containerSize;
    },
    menuOpen: function() {
      return this.$store.getters.menuOpen;
    }
  },
  watch: {
    configin: function() {
      this.prepareVega();
    },
    containerSize: function() {
      //console.log("===============>");
      this.prepareVega();
    },
    menuOpen: function() {
      // Redraw chart when menu opens/closes
      this.prepareVega();
    }
  },
  methods: {
    prepareVega: function() {
      // Check if config is available
      if (!this.configin || !this.configin.config || !this.configin.config.vegaSpec) {
        console.warn("Vega config not available yet");
        return;
      }

      try {
        // A local plain object, never a component data property: vega 6 clones the spec with
        // `structuredClone`, which throws `DataCloneError` on a Vue 3 reactive Proxy — that is what
        // left every Vega module blank while the console showed one rejection per chart.
        let spec = JSON.parse(this.configin.config.vegaSpec);

        // The spec is written by the application author: it does not know our theme. Only the
        // decoration is repainted (axes, legend, titles), the marks keep their colours.
        if (currentTheme() === "dark") {
          spec.config = darkChartConfig(spec.config);
        }
        
        // Calculate available width accounting for menu state
        const menuWidth = this.menuOpen ? 201 : 0; // Menu is 201px when open
        const chartWidth = this.$store.getters.containerSize.width - menuWidth - 100;
        
        // Add autosize for responsiveness at the top level
        spec.autosize = {
          type: "fit",
          contains: "padding"
        };
        
        // Handle vertical concatenation
        if (spec.vconcat != undefined) {
          for (var i = 0; i < spec.vconcat.length; i++) {
            spec.vconcat[i].width = chartWidth;
          }
        }
        
        // Handle horizontal concatenation
        if (spec.hconcat != undefined) {
          // Divide width among horizontally concatenated charts
          const individualWidth = Math.floor(chartWidth / spec.hconcat.length) - 20;
          for (let i = 0; i < spec.hconcat.length; i++) {
            spec.hconcat[i].width = individualWidth;
          }
        }
        
        // Set width for single charts (no concat)
        if (!spec.vconcat && !spec.hconcat) {
          spec.width = chartWidth;
        }
        
        if (
          spec != undefined 
        ) {
          var vegadata = JSON.stringify(spec);

          // Replace token parameter value with actual token from store
          vegadata = vegadata.replace(/token=([@A-Za-z0-9-]*)/g, 
            'token=' + this.$store.getters.creds.token);
          // Replace start parameter value with time range start
          var startTimeAsUtc = moment(this.$store.getters.timeRange[0])
            .utc()
            .toISOString();
          vegadata = vegadata.replace(/start=([@:.A-Za-z0-9-]*)/g, 
            'start=' + startTimeAsUtc);

          // Replace end parameter value with time range end
          var endTimeAsUtc = moment(this.$store.getters.timeRange[1])
            .utc()
            .toISOString();
          vegadata = vegadata.replace(/end=([@:.A-Za-z0-9-]*)/g, 
            'end=' + endTimeAsUtc);

          // Parse back the modified data
          spec = JSON.parse(vegadata);

          // this.vegaSpec.data.url = this.vegaSpec.data.url.replace(
          //   /@TOKEN@/g,
          //   this.$store.getters.creds.token
          // );

          // var startTimeAsUtc = moment(this.$store.getters.timeRange[0])
          //   .utc()
          //   .toISOString();
          // var endTimeAsUtc = moment(this.$store.getters.timeRange[1])
          //   .utc()
          //   .toISOString();
          // this.vegaSpec.data.url = this.vegaSpec.data.url.replace(
          //   /@START@/g,
          //   startTimeAsUtc
          // );
          // this.vegaSpec.data.url = this.vegaSpec.data.url.replace(
          //   /@END@/g,
          //   endTimeAsUtc
          // );
        }

        vegaEmbed("#" + this.id, spec, {
          actions: true,
          renderer: "canvas"
        });
        console.log("Vega chart rendered successfully");
      } catch (error) {
        console.error("Error rendering Vega chart:", error);
      }
    }
  },
  created: function() {
    this.id = "chart" + ++chartCounter;
  },
  mounted: function() {
    console.log("===============  REGISTERING VEGA:");
    // The handler is kept so `$off` can remove *this* listener: `mitt` removes by reference, and a
    // call without one silently removes nothing — every revisit added a render on top of the old.
    this.timerangeHandler = () => {
      console.log("GLOBALBUS/VEGATIMERANGE/");
      this.prepareVega();
    };
    this.$globalbus.$on("timerangechanged", this.timerangeHandler);
    // A theme change repaints the decoration of the chart: it is drawn on a canvas, no
    // stylesheet can take it over.
    this.themeHandler = () => {
      this.prepareVega();
    };
    document.addEventListener("nyx:theme", this.themeHandler);
    this.prepareVega();
  },
  beforeUnmount: function() {
    console.log("===============  UNREGISTERING VEGA:");
    this.$globalbus.$off("timerangechanged", this.timerangeHandler);
    document.removeEventListener("nyx:theme", this.themeHandler);
  }
};
</script>

<style>
.upload {
  text-align: left;
  padding-left: 10px;
}
</style>