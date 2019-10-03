<template>
  <div style="height: 400px;width:100%;">
    <l-map :zoom="zoom" :center="center">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      <!--l-marker :lat-lng="marker"></l-marker-->
      <l-marker
        v-for="item in markers"
        :key="item.id"
        :lat-lng="item.latlng"
        @click="markerClicked(item)"
      >
        <!--v-popup :content="item.content"></v-popup-->
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import Vue from "vue";
import Vue2Leaflet from "vue2-leaflet";

import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
import _ from "lodash";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png")
});

Vue.component("l-map", Vue2Leaflet.LMap);
Vue.component("l-tile-layer", Vue2Leaflet.LTileLayer);
Vue.component("l-marker", Vue2Leaflet.LMarker);
Vue.component("l-tooltip", Vue2Leaflet.LTooltip);
Vue.component("l-popup", Vue2Leaflet.LPopup);
Vue.component("l-control-zoom", Vue2Leaflet.LControlZoom);
Vue.component("l-geo-json", Vue2Leaflet.LGeoJson);
Vue.component("l-feature-group", Vue2Leaflet.LFeatureGroup);

import "leaflet/dist/leaflet.css";

//alert(JSON.stringify(LMarker))

export default {
  name: "Map",
  data: () => ({
    zoom: 13,
    center: L.latLng(47.41322, -1.219482),
    url: "https://{s}.tile.osm.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
    marker: L.latLng(47.41322, -1.219482),
    markers: []
  }),
  props: {
    config: {
      type: Object
    },
    tableData: {
      type: Array
    }
  },
  computed: {
    tableDataIn: function() {
      return this.tableData;
    }
  },
  watch: {
    tableDataIn: {
      handler: function() {
        this.prepareData();
      },
      deep: true
    }
  },
  methods: {
    markerClicked: function(marker) {
      this.$emit("mapclicked", marker);
    },
    prepareData: function() {
      var newmarkers=[];
      
      for(var rec in this.tableData)
      {
        var record=this.tableData[rec]._source;
        
        var resorg=_.get(record,this.config.config.mapfield);
        
        var res=resorg;
        if (res.lat !=null)
        {
          res=[res.lon,res.lat];
        }

        console.log(res);
        var newm={"source":this.tableData[rec],"id":this.tableData[rec]._id,"latlng": L.latLng(res[1],res[0])}
        newmarkers.push(newm);

        //break;
      }
      this.markers = newmarkers;
    }
  },
  created: function() {},

  mounted: function() {
    console.log("===============  REGISTERING MAP:");

    this.prepareData();

    this.zoom = this.config.config.mapzoom;
    this.center = L.latLng(
      this.config.config.maplong,
      this.config.config.maplat
    );
    //alert(this.zoom)
    // setTimeout(function() { window.dispatchEvent(new Event('resize')) }, 250);

    this.$globalbus.$on("timerangechanged", () => {
      console.log("GLOBALBUS/MAPTIMERANGE/");
      //this.createUrl();
    });
  },
  beforeDestroy: function() {
    console.log("===============  UNREGISTERING MAP:");
    this.$globalbus.$off("timerangechanged");
    this.$globalbus.$off("kibanaactivated");
  }
};
</script>

