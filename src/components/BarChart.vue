<template>
  <svg :viewBox="viewBox2" :width="containerWidth">
    <defs>
      <!-- <clipPath id="mainrect"> -->
      <clipPath :id="cid">        
        <rect
          :x="marginleft"
          :y="margintop"
          :width="width-marginleft-marginright"
          :height="height-margintop-marginbottom"
        />
      </clipPath>
    </defs>

    <rect x="0" y="0" :width="width" :height="height" class="barchart_background" @mouseup="backgroundUp"/>

    <rect
      :x="marginleft"
      :y="margintop"
      :width="width-marginleft-marginright"
      :height="height-margintop-marginbottom"
      class="barchart_drawrect"
      @mousedown="backDown"
      @mouseup="backUp"
      @mousemove="backMove"
    />

    <!--rect
      :x="marginleft"
      :y="margintop+(height-margintop-marginbottom)/4"
      :width="width-marginleft-marginright"
      :height="height-margintop-marginbottom-(height-margintop-marginbottom)/2"
      class="barchart_drawrect"
      @mousedown="backDown"
      @mouseup="backUp"
      @mousemove="backMove"
    /-->

    <!--line
      :x1="marginleft"
      :y1="margintop+(height-margintop-marginbottom)/2"
      :x2="width-marginright"
      :y2="margintop+(height-margintop-marginbottom)/2"
      style="stroke:rgb(200,200,200);stroke-width:1"
      @mousedown="backDown"
      @mouseup="backUp"
      @mousemove="backMove"
    /-->

    <rect
      v-show="dragStarted"
      :x="movedragXRef-startdragXRef>0?startdragXRef+marginleft:startdragXRef+marginleft+(movedragXRef-startdragXRef)"
      :y="margintop"
      :width="movedragXRef-startdragXRef>0?Math.max(5,movedragXRef-startdragXRef):Math.max(5,startdragXRef-movedragXRef)"
      pointer-events="none"
      :height="height-margintop-marginbottom"
      class="barchart_selectrect"
      @mouseup="backUp"
    />

    <!-- clip-path="url(#mainrect)" -->

    <rect
      v-for="bar in bars"
      :x="bar.x"
      :y="bar.y"
      :width="bar.w"
      :height="bar.h"
      class="barchart_bar"
      @mouseover="barClicked(bar)"
      @mouseout="resetBar(bar)"      
      
      :clip-path="clipurl"
      :pointer-events="pointerevents"
    />
<!--
  -->

    <line
      v-for="tick in ticks"
      :x1="tick.x"
      :y1="tick.y+10"
      :x2="tick.x"
      :y2="tick.y"
      style="stroke:rgb(128,128,128);stroke-width:2"
    />
    <text v-for="tick in ticks" :x="tick.x-16" :y="tick.y+23" class="barchart_tick">{{tick.t}}</text>

    <!-- eslint-enable -->

    <text :x="marginleft" y="15" class="barchart_title">{{description}}</text>
    <text x="410" y="15" class="barchart_details">{{selectedText}}</text>

    <text :x="marginleft-10" :y="margintop+8" text-anchor="end">{{max}}</text>
    <text :x="marginleft-10" :y="height-marginbottom" text-anchor="end">0</text>
    <text :x="marginleft/2" :y="height/2" writing-mode="tb" text-anchor="middle">Documents</text>
  </svg>
</template>

<script>
// import Vue from "vue";
import moment from "moment";

export default {
  name: "BarChart",
  data: () => ({
    viewBox: "0 0 1100 150",
    marginleft: 80,
    marginright: 20,
    margintop: 20,
    marginbottom: 30,
    bars: [],
    ticks: [],
    width: 1100,
    height: 200,
    selectedTick: null,
    selectedText: "",
    description: "",
    startdragX: 0,
    startdragXRef: 0,
    movedragXRef: 0,
    dragWidth: 100,
    max: 0,
    dragStarted: false,
    pointerevents: "auto",
    cid:"CID",
    clipurl:"url(#mainrect)"
  }),
  props: {
    config: {
      type: Object
    },
    series: {
      type: Array
    },
    autotime: {
      type: String
    }
  },
  
  computed: {
    seriesIn: function() {
      return this.series;
    },
    viewBox2: function() {
      var left = 210;
      if (!this.$store.state.menuOpen) left = 0;

      return "0 0 " + (this.$store.getters.containerSize.width - left) + " 200";
    },
    containerWidth: function() {
      var left = 210;
      if (!this.$store.state.menuOpen) left = 0;

      this.width = this.$store.getters.containerSize.width - left;
      // console.log("CONTAINER W=" + this.width);

      return this.$store.getters.containerSize.width - left - 50 + "px";
      //return "1400px";
    }
  },
  watch: {
    seriesIn: {
      handler: function() {
        this.prepareData();
      },
      deep: true
    }
  },
  methods: {
    backDown: function(evt) {
      if (
        !(
          this.config.timeSelectorType == undefined ||
          this.config.timeSelectorType == "classic"
        )
      )
        return;

      this.pointerevents = "none";
      var e = evt.target;
      var dim = e.getBoundingClientRect();
      var x = evt.clientX - dim.left;
      // var y = evt.clientY - dim.top;
      this.startdragX = x;
      this.startdragXRef =
        (x * (this.width - this.marginleft - this.marginright)) / dim.width;
      this.movedragXRef = this.startdragXRef;
      //alert("D x: "+x+" y:"+y);
      //      console.log("DOWN:" + x + " y:" + y);
      this.dragStarted = true;
    },
    backMove: function(evt) {
      if (!this.dragStarted) return;
      var e = evt.target;
      var dim = e.getBoundingClientRect();
      var x = evt.clientX - dim.left;
      // var y = evt.clientY - dim.top;
      this.movedragXRef =
        (x * (this.width - this.marginleft - this.marginright)) / dim.width;

      //console.log("MOVE: " + x + " y:" + y);
    },
    backgroundUp: function(evt) {     
      if(this.dragStarted)
        this.backUp(evt);
    },
    backUp: function(evt) {
      if (
        !(
          this.config.timeSelectorType == undefined ||
          this.config.timeSelectorType == "classic"
        )
      )
        return;

      this.dragStarted = false;
      this.pointerevents = "auto";
      var e = evt.target;
      var dim = e.getBoundingClientRect();
      var x = evt.clientX - dim.left;
      var y = evt.clientY - dim.top;

      console.log("UP: " + x + " y:" + y);

      if(this.startdragX>x)
      {
        var xtemp=this.startdragX;
        this.startdragX=x;
        x=xtemp;
      }

      var totalSeconds =
        (this.$store.getters.timeRange[1] - this.$store.getters.timeRange[0]) /
        1000;
      //this.startdragX=(x/x.dragWidth);

      var staX = (this.startdragX / dim.width) * totalSeconds;
      var startt = moment(this.$store.getters.timeRange[0]).add(
        staX,
        "seconds"
      );

      var endX = (x / dim.width) * totalSeconds;
      var endt = moment(this.$store.getters.timeRange[0]).add(endX, "seconds");

      //alert(startt);
      //alert(endt);

      //alert("U x: "+x+" y:"+y+" W="+this.dragWidth+" dx"+this.startdragX+" T="+staX);

      if (staX < endX) {
        this.$globalbus.$emit("charttimerangeupdated", [
          startt.toDate(),
          endt.toDate()
        ]);
      } else {
        //console.log("staX " + staX + " endX " + endX);
      }
    },
    barClicked: function(bar) {
      this.pointerevents = "auto";
      this.dragStarted = false;
      this.selectedTick = bar;
      this.selectedText = "" + bar.date + "  (" + bar.count + ")";
    },
    resetBar: function(bar) {
      this.pointerevents = "auto";
      this.dragStarted = false;
      this.selectedTick = bar;
      this.selectedText = "" + bar.date + "  (" + bar.count + ")";
    },

    prepareData: function() {
      // console.log("=====> COMPUTING GRAPH");
      var left = 210;
      if (!this.$store.state.menuOpen) left = 0;

      this.width = this.$store.getters.containerSize.width - left;
      // console.log("CONTAINER W=" + this.width);

      var rangetouse;
      //console.log(this.config);
      //console.log("=====> " + this.width);
      //console.log("=====> " + this.config.timeSelectorType);
      switch (this.config.timeSelectorType) {
        case "day":
          rangetouse = this.$store.getters.timeRangeDay;
          break;
        case "week":
          rangetouse = this.$store.getters.timeRangeWeek;
          break;
        case "month":
          rangetouse = this.$store.getters.timeRangeMonth;
          break;
        case "year":
          rangetouse = this.$store.getters.timeRangeYear;
          break;
        default:
          rangetouse = this.$store.getters.timeRange;
          break;
      }

      var totalSeconds = (rangetouse[1] - rangetouse[0]) / 1000;
      this.bars = [];

      var widthX = this.width - this.marginleft - this.marginright;
      var startTime = rangetouse[0].valueOf();

      var max = 0;

      var auto = this.autotime;

      auto = auto.replace("s", "/60");
      auto = auto.replace("m", "");
      auto = auto.replace("h", "*60");
      auto = auto.replace("d", "*60*24");
      auto = auto.replace("w", "*7*60*24");
      auto = eval(auto);
      var totalcols = totalSeconds / (auto * 60);
      //alert(totalcols);
      var barw = (widthX / totalcols) * 0.8;

      this.ticks = [];

      if (totalSeconds < (24 * 3600) / 5) {
        let start = moment(rangetouse[0]);
        let end = moment(rangetouse[1]);
        const remainder = 15 - (start.minute() % 15);

        let dateTimeClean = start.add(remainder, "minutes"); //.format("DD.MM.YYYY, h:mm:ss a");
        dateTimeClean.set({
          seconds: 0
        });
        while (dateTimeClean < end) {
          this.ticks.push({
            x:
              (((dateTimeClean - startTime) / 1000) * widthX) / totalSeconds +
              this.marginleft,
            y: this.height - this.marginbottom,
            t: dateTimeClean.format("H:mm")
          });
          dateTimeClean.add(15, "minutes");
        }
      } else if (totalSeconds < 12 * 3600) {
        let start = moment(rangetouse[0]);
        let end = moment(rangetouse[1]);
        const remainder = 30 - (start.minute() % 30);

        let dateTimeClean = start.add(remainder, "minutes"); //.format("DD.MM.YYYY, h:mm:ss a");
        dateTimeClean.set({
          seconds: 0
        });
        while (dateTimeClean < end) {
          this.ticks.push({
            x:
              (((dateTimeClean - startTime) / 1000) * widthX) / totalSeconds +
              this.marginleft,
            y: this.height - this.marginbottom,
            t: dateTimeClean.format("H:mm")
          });
          dateTimeClean.add(30, "minutes");
        }
      } else if (totalSeconds < 24 * 3600) {
        let start = moment(rangetouse[0]);
        let end = moment(rangetouse[1]);

        let dateTimeClean = start;
        dateTimeClean.set({
          seconds: 0,
          minutes: 0
        });
        dateTimeClean.add(1, "hours");
        while (dateTimeClean < end) {
          this.ticks.push({
            x:
              (((dateTimeClean - startTime) / 1000) * widthX) / totalSeconds +
              this.marginleft,
            y: this.height - this.marginbottom,
            t: dateTimeClean.format("H:mm")
          });
          dateTimeClean.add(1, "hours");
        }
      }else if (totalSeconds < 24 * 3600*3) {
        let start = moment(rangetouse[0]);
        let end = moment(rangetouse[1]);

        let dateTimeClean = start;
        console.log("dateTimeClean.hour()");
        console.log(dateTimeClean.hour());
        dateTimeClean.set({
          hours:((dateTimeClean.hour()/4)>>0)*4,
          seconds: 0,
          minutes: 0
        });
        console.log(dateTimeClean.hour());
        dateTimeClean.add(4, "hours");
        while (dateTimeClean < end) {
//          console.log(dateTimeClean)
//          console.log(dateTimeClean.hour)
          if (dateTimeClean.hour()!=0)
          {
            this.ticks.push({
              x:
                (((dateTimeClean - startTime) / 1000) * widthX) / totalSeconds +
                this.marginleft,
              y: this.height - this.marginbottom,
              t: dateTimeClean.format("H:mm")
            });
            dateTimeClean.add(4, "hours");
          }
          else
          {
            this.ticks.push({
              x:
                (((dateTimeClean - startTime) / 1000) * widthX) / totalSeconds +
                this.marginleft,
              y: this.height - this.marginbottom,
              t: dateTimeClean.format("DD/MMM")
            });
            dateTimeClean.add(4, "hours");
          }
        }
      }
       else if (totalSeconds < 24 * 3600 * 15) {
        let start = moment(rangetouse[0]);
        let end = moment(rangetouse[1]);

        let dateTimeClean = start;
        dateTimeClean.set({
          seconds: 0,
          minutes: 0,
          hours: 0
        });
        dateTimeClean.add(1, "days");
        while (dateTimeClean < end) {
          this.ticks.push({
            x:
              (((dateTimeClean - startTime) / 1000) * widthX) / totalSeconds +
              this.marginleft,
            y: this.height - this.marginbottom,
            t: dateTimeClean.format("DD/MMM")
          });
          dateTimeClean.add(1, "days");
        }
      } else if (totalSeconds < 24 * 3600 * 70) {
        let start = moment(rangetouse[0]);
        let end = moment(rangetouse[1]);

        let dateTimeClean = start;
        dateTimeClean.set({
          seconds: 0,
          minutes: 0,
          hours: 0
        });
        dateTimeClean.add(5, "days");
        while (dateTimeClean < end) {
          this.ticks.push({
            x:
              (((dateTimeClean - startTime) / 1000) * widthX) / totalSeconds +
              this.marginleft,
            y: this.height - this.marginbottom,
            t: dateTimeClean.format("DD/MMM")
          });
          dateTimeClean.add(5, "days");
        }
      }else if (totalSeconds < 24 * 3600 * 140) {
        let start = moment(rangetouse[0]);
        let end = moment(rangetouse[1]);

        let dateTimeClean = start;
        dateTimeClean.set({
          seconds: 0,
          minutes: 0,
          hours: 0
        });
        dateTimeClean.add(10, "days");
        while (dateTimeClean < end) {
          this.ticks.push({
            x:
              (((dateTimeClean - startTime) / 1000) * widthX) / totalSeconds +
              this.marginleft,
            y: this.height - this.marginbottom,
            t: dateTimeClean.format("DD/MMM")
          });
          dateTimeClean.add(10, "days");
        }
      } else {
        let start = moment(rangetouse[0]);
        let end = moment(rangetouse[1]);

        let dateTimeClean = start;
        dateTimeClean.set({
          seconds: 0,
          minutes: 0,
          hours: 0,
          days: 0
        });
        dateTimeClean.add(30, "days");
        while (dateTimeClean < end) {
          this.ticks.push({
            x:
              (((dateTimeClean - startTime) / 1000) * widthX) / totalSeconds +
              this.marginleft,
            y: this.height - this.marginbottom,
            t: dateTimeClean.format("DD/MMM")
          });
          dateTimeClean.add(30, "days");
        }
      }

      // COMPUTE GRAPH

      this.dragWidth = widthX;

      var total = 0;
      for (let ind in this.series[0].data) {
        let dat = this.series[0].data[ind];
        total += dat[1];
        if (dat[1] > max) max = dat[1];
        this.bars.push({
          x:
            (((dat[0] - startTime) / 1000) * widthX) / totalSeconds +
            this.marginleft -
            barw / 2,
          y: this.height - this.marginbottom,
          w: barw,
          date: moment(dat[0]).format("DD/MMM HH:mm"),
          count: dat[1]
        });
      }
      var sizeY = this.height - this.margintop - this.marginbottom;
      for (let ind in this.series[0].data) {
        let dat = this.series[0].data[ind];
        var bar = this.bars[ind];
        bar.h = (dat[1] * sizeY) / max;
        bar.y -= bar.h;
      }
      this.max = max;
      this.description =
        " Total Documents:" + total + " Aggregation:" + this.autotime;
    }
  },
  created: function() {},

  mounted: function() {
    console.log("===============  REGISTERING BarChart:");

    this.width = this.$store.getters.containerSize.width;
    this.viewBox = "0 0 " + this.$store.getters.containerSize.width + " 200"; //+this.height;
    this.cid="ID_"+new Date().getTime();
    this.clipurl="url(#"+this.cid+")";
    //alert(this.viewBox);

    this.prepareData();

    this.$globalbus.$on("timerangechanged", () => {
      console.log("GLOBALBUS/BARTIMERANGE/");
      this.prepareData();
    });
  },
  beforeDestroy: function() {
    console.log("===============  UNREGISTERING MAP:");
    this.$globalbus.$off("timerangechanged");
    this.$globalbus.$off("kibanaactivated");
  }
};
</script>

<style>
.barchart_background {
  fill: rgb(255, 255, 255);
  stroke-width: 1;
  stroke: rgb(200, 200, 200);
}

.barchart_drawrect {
  fill: rgb(255, 255, 255);
  stroke-width: 1;
  stroke: rgb(200, 200, 200);
}
.barchart_bar:hover {
  fill: #409EFF;
  stroke-width: 1;
  /*stroke: #4376c8;*/
  stroke: #409eff;
  opacity: 1;
}

.barchart_bar {
  /*fill: #4376c8;*/
  fill: #40a0ff6c;
  stroke-width: 1.3;
  /*stroke: #4376c8;*/
  stroke: #409eff;
}
.barchart_tick {
  font: 13px sans-serif;
  fill: #606266;
  font-weight: 400;
}
.barchart_title_none {
}
.barchart_details {
  font: 14px sans-serif;
  /*stroke: #4376c8;*/
  fill: #409eff;
}
.barchart_selectrect {
  fill: rgb(226, 226, 222);
  stroke-width: 1;
  stroke: rgb(226, 226, 222);
  opacity: 0.5;
}
</style>
