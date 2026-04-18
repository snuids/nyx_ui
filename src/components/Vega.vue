<template slot="items">
  <div style="width: 100%;">
    <div :id="id" style="width: 100%;"></div>
    <el-button
      circle
      size="mini"
      @click="prepareVega()"
      class="regreshbutton"
      type="primary"
      plain
      icon="el-icon-refresh"
    ></el-button>
    
  </div>
</template>
  
<script>
import vegaEmbed from "vega-embed";
import moment from "moment";

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
        this.vegaSpec = JSON.parse(this.configin.config.vegaSpec);
        
        // Calculate available width accounting for menu state
        const menuWidth = this.menuOpen ? 201 : 0; // Menu is 201px when open
        const chartWidth = this.$store.getters.containerSize.width - menuWidth - 100;
        
        // Add autosize for responsiveness at the top level
        this.vegaSpec.autosize = {
          type: "fit",
          contains: "padding"
        };
        
        // Handle vertical concatenation
        if (this.vegaSpec.vconcat != undefined) {
          for (var i = 0; i < this.vegaSpec.vconcat.length; i++) {
            this.vegaSpec.vconcat[i].width = chartWidth;
          }
        }
        
        // Handle horizontal concatenation
        if (this.vegaSpec.hconcat != undefined) {
          // Divide width among horizontally concatenated charts
          const individualWidth = Math.floor(chartWidth / this.vegaSpec.hconcat.length) - 20;
          for (var i = 0; i < this.vegaSpec.hconcat.length; i++) {
            this.vegaSpec.hconcat[i].width = individualWidth;
          }
        }
        
        // Set width for single charts (no concat)
        if (!this.vegaSpec.vconcat && !this.vegaSpec.hconcat) {
          this.vegaSpec.width = chartWidth;
        }
        
        if (
          this.vegaSpec != undefined 
        ) {
          var vegadata = JSON.stringify(this.vegaSpec);

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
          this.vegaSpec = JSON.parse(vegadata);

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

        vegaEmbed("#" + this.id, this.vegaSpec, {
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
    this.id = "chart" + this._uid;
  },
  mounted: function() {
    console.log("===============  REGISTERING VEGA:");
    this.$globalbus.$on("timerangechanged", payLoad => {
      console.log("GLOBALBUS/VEGATIMERANGE/");
      this.prepareVega();
    });
    this.prepareVega();
  },
  beforeDestroy: function() {
    console.log("===============  UNREGISTERING VEGA:");
    this.$globalbus.$off("timerangechanged");
  }
};
</script>

<style>
.upload {
  text-align: left;
  padding-left: 10px;
}
</style>