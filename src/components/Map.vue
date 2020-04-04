<template>
  <div style="height: 400px;width:100%;">
    <l-map :zoom="zoom" :center="center" :options="{scrollWheelZoom:false}">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      <!--l-marker :lat-lng="marker"></l-marker-->
      <l-marker
        v-for="item in markers"
        :key="item.id"
        :lat-lng="item.latlng"
        :icon="getIcon(item)"
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
import { LMap, LTileLayer, LMarker } from 'vue2-leaflet';
import '@fortawesome/fontawesome-free/css/all.css'
import '@fortawesome/fontawesome-free/js/all.js'

import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
import _ from "lodash";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png")
});

import "leaflet/dist/leaflet.css";

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
  components: {
    LMap,
    LTileLayer,
    LMarker
  },
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
    getIcon: function(item) {
var greenIcon = new L.Icon({
  html: 'A</v-icon><i class="fa fa-horse fa-2x"></i>',
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
return greenIcon;

      //return null;
// var firefoxIcon = L.icon({
//         iconUrl: 'http://joshuafrazier.info/images/firefox.svg',
//         iconSize: [38, 95], // size of the icon
//         });
//         return firefoxIcon; 

      // var firefoxIcon = L.icon({
      //   iconUrl: 'http://joshuafrazier.info/images/firefox.svg',
      //   iconSize: [38, 95], // size of the icon
      //   });
      //   return firefoxIcon; 

                const fontAwesomeIcon = L.divIcon({
            html: '</v-icon><i class="fa fa-horse fa-2x"></i>',
            iconSize: [40, 40],
            className: 'myDivIcon'
        });
return fontAwesomeIcon; 
    },
    prepareData: function() {
      var newmarkers=[];
      
      for(var rec in this.tableData)
      {
        var record=this.tableData[rec]._source;
        
        var resorg=_.get(record,this.config.config.mapfield);
        
        var res=resorg;
        if ((res!=null)&&(res.lat !=null))
        {
          console.log(res)
          res=[res.lat,res.lon];
        }

        if (typeof(res)=='string'){
          var newm={"source":this.tableData[rec],"id":this.tableData[rec]._id,"latlng": L.latLng(res.split(',')[0],res.split(',')[1])}
          newmarkers.push(newm);

        } else if (res!=null)
        {
          var newm={"source":this.tableData[rec],"id":this.tableData[rec]._id,"latlng": L.latLng(res[0],res[1])}
          newmarkers.push(newm);
        }

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
      this.config.config.maplat,
      this.config.config.maplong,
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
<style>
.myDivIcon {
  border:solid 1px red;
  color: red;
  text-align: center;
  /* Horizontally center the text (icon) */
  line-height: 20px;
  /* Vertically center the text (icon) */
}
</style>
