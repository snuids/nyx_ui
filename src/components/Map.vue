<template>
  <div style="height: 400px;width:100%;">
    <l-map :zoom="zoom" :center="center" :options="{scrollWheelZoom:false}">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      <!--l-marker :lat-lng="marker"></l-marker-->
      <l-marker
        v-for="item in markers"
        :key="item.id"
        :icon="item.icon"
        :lat-lng="item.latlng"
        @click="markerClicked(item)"
      >
        <!-- :icon="getIcon(item)" -->
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

import 'leaflet-fa-markers/L.Icon.FontAwesome.css'
import 'leaflet-fa-markers/L.Icon.FontAwesome.js'


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
// var greenIcon = new L.Icon({
//   iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });
//return greenIcon;
var toto=L.icon.fontAwesome({
    //iconClasses: "fa fa-info-circle myDivIcon", // you _could_ add other icon classes, not tested.
    //iconClasses: "fa fa-building myDivIcon", // you _could_ add other icon classes, not tested.
    iconClasses: "fa fa-play-circle myDivIcon", // you _could_ add other icon classes, not tested.
    // marker/background style
    markerColor: "#F00000",
    markerFillOpacity: 0.9,
    markerStrokeWidth: 1,
    markerStrokeColor: "black",
    // icon style
    iconColor: "#FFF",
    className: 'myDivIcon'
  })
  return toto;

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
      console.log("START PREPARE DATA....");
      var newmarkers=[];
      var icons={};
      var nofmarkers=0;
            
      var has_colorfunction=false;
      if (this.config.config.colorfunction != undefined && this.config.config.colorfunction!="")
      {
        has_colorfunction=true;
        var color_function = new Function("x",this.config.config.colorfunction);        
      }

      var has_iconfunction=false;
      if (this.config.config.iconfunction != undefined && this.config.config.iconfunction!="")
      {
        has_iconfunction=true;
        var icon_function = new Function("x",this.config.config.iconfunction);        
      }

      for(var rec in this.tableData)
      {
        if(nofmarkers>1000)
          break;
        nofmarkers+=1;
        var record=this.tableData[rec]._source;
        
        var resorg=_.get(record,this.config.config.mapfield);
        
        var res=resorg;
        if ((res!=null)&&(res.lat !=null))
        {          
          res=[res.lat,res.lon];
        }

        var color="green";
        if (has_colorfunction)
        {
          color=color_function(record);
        }
        var icon="info-circle";
        if (has_iconfunction)
        {
          icon=icon_function(record);
        }

        var key=icon+color.replace(/#/g,"");
        if (icons[key]==undefined)
        {          
          var newicon=L.icon.fontAwesome({
              iconClasses: "fa fa-"+icon+" myDivIcon", // you _could_ add other icon classes, not tested.
              markerColor: color,
              markerFillOpacity: 0.5,
              markerStrokeWidth: 1,
              markerStrokeColor: "black",
              // icon style
              iconColor: "#FFF",
              className: 'myDivIcon'
            })
            icons[key]=newicon;          
        }

        var icon=icons[key];
        if(this.tableData.length>50)
          icon=null;

        if (typeof(res)=='string'){          
          if (res.indexOf(",")>0)
          {
            var newm={"source":this.tableData[rec],"icon":icon,"id":this.tableData[rec]._id,"latlng": L.latLng(res.split(',')[0],res.split(',')[1])}
            newmarkers.push(newm);
          }

        } else if (res!=null)
        {
          var newm={"source":this.tableData[rec],"icon":icon,"id":this.tableData[rec]._id,"latlng": L.latLng(res[0],res[1])}
          newmarkers.push(newm);
        }

        

        //break;
      }
      console.log(icons);
      this.markers = newmarkers;
      console.log("END PREPARE DATA....");
    }
  },
  created: function() {
    console.log("===============  MAP CREATED:");
    this.zoom = this.config.config.mapzoom;
    this.center = L.latLng(
      this.config.config.maplat,
      this.config.config.maplong,
    );
    console.log("===============  MAP END CREATED:");
  },

  mounted: function() {
    console.log("===============  REGISTERING MAP:");
    console.log("===============  MAP MOUNTED:");

    this.prepareData();

    console.log("===============  MAP MOUNTED2:");
    
    this.$globalbus.$on("timerangechanged", () => {
      console.log("GLOBALBUS/MAPTIMERANGE/");      
    });
    console.log("===============  MAP END MOUNTED:");
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
  text-align: center;
  margin-top:-10px;
  margin-left:-2px;
  /* Horizontally center the text (icon) */
  line-height: 20px;
  /* Vertically center the text (icon) */
}
</style>
