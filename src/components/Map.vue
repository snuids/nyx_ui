<template>
  <div style="height: 400px;width:100%;">
    
    <l-map :zoom="zoom" :center="center" :options="{scrollWheelZoom:false}">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      
      <v-marker-cluster :options="{showCoverageOnHover:false}">
      <l-marker
        v-for="item in markers"
        :key="item.id"
        :icon="item.icon"
        :lat-lng="item.latlng"
        @click="markerClicked(item)"
      >
      </l-marker>
      </v-marker-cluster>
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

import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";


import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
import _ from "lodash";

import Vue2LeafletMarkercluster from 'vue2-leaflet-markercluster'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png")
});

// var defaulticon=L.Icon.extend
// ({options:{
//   iconRetinaUrl: require("leaflet/dist/images/marker-icon.png"),
//   iconUrl: require("leaflet/dist/images/marker-icon.png"),
//   shadowUrl: require("leaflet/dist/images/marker-shadow.png")
// }});

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
    LMarker,
    'v-marker-cluster': Vue2LeafletMarkercluster
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
    prepareData: function() {
      console.log("START PREPARE DATA....");
      var newmarkers=[];
      var icons={};
      var nofmarkers=0;
      
      var transparency=0;
      if (this.config.config.transparency != undefined)
      {
        transparency=this.config.config.transparency/100;
      }
          
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
              markerFillOpacity: 1-transparency,
              markerStrokeWidth: 1,
              markerStrokeColor: "grey",
              // icon style
              iconColor: ((transparency>0.5)?"#000":"#FFF"),
              className: 'myDivIcon'
            })
            icons[key]=newicon;          
        }

        var icon=icons[key];
//        if(this.tableData.length>300)
//          icon=null;


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
      //console.log(icons);
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
