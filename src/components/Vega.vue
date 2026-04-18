<template slot="items">
  <div>
    <el-button
      circle
      size="mini"
      @click="prepareVega()"
      class="regreshbutton"
      type="primary"
      plain
      icon="el-icon-refresh"
    ></el-button>
    <div :id="id"></div>
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
    }
  },
  watch: {
    configin: function() {
      this.prepareVega();
    },
    containerSize: function() {
      //console.log("===============>");
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
        this.vegaSpec.width = this.$store.getters.containerSize.width - 420;
        //this.vegaSpec.height = this.$store.getters.containerSize.height-120;
        if (this.vegaSpec.vconcat != undefined) {
          for (var i = 0; i < this.vegaSpec.vconcat.length; i++) {
            this.vegaSpec.vconcat[i].width =
              this.$store.getters.containerSize.width - 420;
            //this.vegaSpec.height = this.$store.getters.containerSize.height-120;
          }
        }

        if (
          this.vegaSpec.data != undefined &&
          this.vegaSpec.data.url != undefined
        ) {
          this.vegaSpec.data.url = this.vegaSpec.data.url.replace(
            /@TOKEN@/g,
            this.$store.getters.creds.token
          );

          var startTimeAsUtc = moment(this.$store.getters.timeRange[0])
            .utc()
            .toISOString();
          var endTimeAsUtc = moment(this.$store.getters.timeRange[1])
            .utc()
            .toISOString();
          this.vegaSpec.data.url = this.vegaSpec.data.url.replace(
            /@START@/g,
            startTimeAsUtc
          );
          this.vegaSpec.data.url = this.vegaSpec.data.url.replace(
            /@END@/g,
            endTimeAsUtc
          );
        }

        vegaEmbed("#" + this.id, this.vegaSpec);
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