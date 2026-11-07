<template>
  <div style="height: 600px;width:100%;">
    
    <l-map ref="mapRef" :zoom="zoom" :center="center" :options="{scrollWheelZoom:false}">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      
      <l-marker
        v-for="item in markers"
        :key="item.id"
        :icon="item.icon"
        :lat-lng="item.latlng"
        @click="markerClicked(item)"
      >
      </l-marker>
    </l-map>
   
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet';
import { resolveLatLng } from '@/utils/mapCoords';
import '@fortawesome/fontawesome-free/css/all.css'
import '@fortawesome/fontawesome-free/js/all.js'

import 'leaflet-fa-markers/L.Icon.FontAwesome.css'

import L from "leaflet";
// `leaflet-fa-markers` n'est pas un module : il lit un global `L`. Il est donc charge par require()
// apres l'avoir pose, et non par un import (qui s'executerait avant, les imports etant hisses).
window.L = L;
require('leaflet-fa-markers/L.Icon.FontAwesome.js');
delete L.Icon.Default.prototype._getIconUrl;
import _ from "lodash";


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
    markers: [],
    // vrai quand l'editeur impose un centre : le plan ne se recadre alors pas sur ses marqueurs
    explicitCenter: false
  }),
  components: {
    LMap,
    LTileLayer,
    LMarker,
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
      // Un marqueur par position : l'index d'exemple renvoie 1000 documents sur trois positions, et
      // empiler 1000 icones au meme point bloquait le navigateur sans rien montrer de plus.
      var seen={};
      
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
        if(nofmarkers>500)
          break;
        nofmarkers+=1;
        var record=this.tableData[rec]._source;
        
        // Coordonnees du document : deux champs (lat / lon) ou un geo_point — la resolution vit dans
        // `utils/mapCoords.js`, avec ses tests (un document sans coordonnee ne produit pas de marqueur).
        var res = resolveLatLng(record, this.config.config);

        if (res != null) {
          var positionKey = Array.isArray(res) ? res.join(",") : String(res);
          if (seen[positionKey]) continue;
          seen[positionKey] = true;
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

        icon=icons[key];
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
          newm={"source":this.tableData[rec],"icon":icon,"id":this.tableData[rec]._id,"latlng": L.latLng(res[0],res[1])}
          newmarkers.push(newm);
        }

        

        //break;
      }
      //console.log(icons);
      this.markers = newmarkers;
      // Le plan se cadre sur ses marqueurs quand aucun centre n'a ete choisi dans l'editeur : sans
      // cela, la carte s'ouvre sur un point arbitraire et les marqueurs sont hors champ (ou, quand le
      // zoom et le centre sont absents, aucune tuile n'est calculee du tout).
      this.$nextTick(() => { this.fitToMarkers(); });
      console.log("END PREPARE DATA....");
    },
    // Centre le plan sur les marqueurs, sauf si l'editeur impose deja un centre (`maplat`/`maplong`).
    fitToMarkers: function() {
      if (this.explicitCenter || !this.markers || this.markers.length == 0) return;
      var map = this.$refs.mapRef && this.$refs.mapRef.leafletObject;
      if (!map) return;
      var points = this.markers.map(function(m) { return m.latlng; });
      if (points.length == 1) {
        map.setView(points[0], 13);
      } else {
        map.fitBounds(L.latLngBounds(points), { padding: [20, 20] });
      }
    }
  },
  created: function() {
    console.log("===============  MAP CREATED:");
    // Un zoom ou un centre absent (champ vide dans l'editeur) ne doit pas casser la carte : Leaflet
    // leve « Invalid LatLng object » sur `L.latLng(undefined, undefined)`, et un zoom `undefined`
    // laisse la couche de tuiles sans vue a calculer — d'ou un fond gris et aucun marqueur.
    var conf = this.config.config || {};
    this.explicitCenter =
      conf.maplat !== undefined && conf.maplat !== null &&
      conf.maplong !== undefined && conf.maplong !== null;
    this.zoom = conf.mapzoom ? conf.mapzoom : 2;
    this.center = this.explicitCenter ? L.latLng(conf.maplat, conf.maplong) : L.latLng(0, 0);
    console.log("===============  MAP END CREATED:");
  },

  mounted: function() {
    console.log("===============  REGISTERING MAP:");
    console.log("===============  MAP MOUNTED:");

    this.prepareData();

    console.log("===============  MAP MOUNTED2:");
    
    // `mitt` retire un ecouteur par reference : sans la garder, `$off` n'en retire aucun et chaque
    // visite empile un rendu supplementaire.
    this.timerangeHandler = () => {
      console.log("GLOBALBUS/MAPTIMERANGE/");
    };
    this.$globalbus.$on("timerangechanged", this.timerangeHandler);
    console.log("===============  MAP END MOUNTED:");
  },
  beforeUnmount: function() {
    console.log("===============  UNREGISTERING MAP:");
    this.$globalbus.$off("timerangechanged", this.timerangeHandler);
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
