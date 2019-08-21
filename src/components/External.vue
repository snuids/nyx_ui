<template slot="items">
  <!--div v-bind:style="styleContainerComputed" -->   
  <div>     
       
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
import Vue from 'vue';


export default {
  name: "External",
  data: () => ({
    url: "",
  }),
  props: {
    config: {
      type: Object
    }
  },
  computed: {
    computedUrl: function(){
      return this.config.config.url.replace(/token=TOKEN/g,"token="+this.$store.getters.creds.token);
    },
    containerHeight: function() {
      var headerheight=0;
      if(this.$store.getters.currentApps.apps.length>1)
      {        
        headerheight+=50;
      }
      if(this.config.queryFilterChecked || this.config.downloadChecked || this.config.queryBarChecked)
      {
        headerheight+=50;
      }
      return (this.$store.getters.containerSize.height-64-headerheight) + "px";
      //return "1400px";
    },
    containerWidth: function() {
      var left=210;
      if(!this.$store.state.menuOpen)
        left=0;

      return (this.$store.getters.containerSize.width-left) + "px";
      //return "1400px";
    },
    iFrameContainerComputed: function() {
      var headerheight=0;
      if(this.$store.getters.currentApps.apps.length>1)
      {
        headerheight+=50;
      }
      if(this.config.queryFilterChecked || this.config.downloadChecked || this.config.queryBarChecked)
      {
        headerheight+=50;
      }
    
      var left=210;
      if(!this.$store.state.menuOpen)
        left=0;

      return {
        border:"0px solid #888",
        //overflow: "hidden !important",
        position:"fixed",
        top:(64+headerheight)+"px",
        left:left+"px",
        right:"0px"        
      };
        
    }    
  },
  methods: {    
  },
  mounted: function() {
    

  },
  beforeDestroy: function() {
    
  }
};
</script>

<style>
.kibanatitle
{
  font-weight:bolder;
}

</style>

