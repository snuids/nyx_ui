
<template>
  <div  v-if="$store.getters.currentSubCategory" style="border: 0px solid pink;height: 100%;overflow:hidden;"  v-loading="loading">
    <div
      v-if="$store.getters.currentSubCategory.apps.length==1"
      style="border: 20px solid orange;height: 100%;overflow:auto;margin-top:5px;" v-bind:style="singleStyleContainerComputed"
    >
      <div style="overflow:auto;"  v-if="!loading">
        <div v-if="$store.getters.currentSubCategory.apps[0].type=='generic-table'">
          <GenericTable :config="$store.getters.currentSubCategory.apps[0]"/>
        </div>
        <div v-else-if="$store.getters.currentSubCategory.apps[0].type=='external'">
          <External :config="$store.getters.currentSubCategory.apps[0]"></External>          
        </div>
        <div class="kibana" v-else-if="$store.getters.currentSubCategory.apps[0].type=='kibana'">
          <Kibana :config="$store.getters.currentSubCategory.apps[0]" :directLoad="true"></Kibana>
        </div>
        <div v-else-if="$store.getters.currentSubCategory.apps[0].type=='form'">
          <Form :config="$store.getters.currentSubCategory.apps[0]"></Form>
        </div>
        <div v-else-if="$store.getters.currentSubCategory.apps[0].type=='upload'">
          <Upload :config="$store.getters.currentSubCategory.apps[0]"></Upload>
        </div>
        <div v-else>          
          <component
            :config="$store.getters.currentSubCategory.apps[0]"
            v-bind:is="$store.getters.currentSubCategory.apps[0].config.controller"
          ></component>
        </div>
      </div>
    </div>
    <!-- More than one application -->
    <div v-else style="overflow:hidden;">
      <el-tabs v-model="selectedTab" 
        @tab-click="handleTabClick">
        <el-tab-pane
          v-bind:style="styleContainerComputed"
          v-for="(app, index) in $store.getters.currentSubCategory.apps"
          :key="app.rec_id"
          :label="app.loc_title"
          :name="app.rec_id"
          :lazy="true"
        >
            <!-- v-if="!loading" -->
          <div 
            style="overflow:auto !important;border:0px solid pink" >
            <div v-if="app.type=='generic-table'">
              <GenericTable :config="app" :key="app.rec_id" />
            </div>
            <div v-else-if="app.type=='external'">
              <External :config="app" :key="app.rec_id"></External>
            </div>
            <div class="kibana" v-else-if="app.type=='kibana'">
              <Kibana :config="app" :key="app.rec_id"></Kibana>
            </div>
            <div v-else-if="app.type=='form'">
              <Form :config="app" :key="app.rec_id"></Form>
            </div>
            <div v-else-if="app.type=='upload'">
              <Upload :config="app" :key="app.rec_id"></Upload>
            </div>
            <div v-else>
               <!-- v-if="selectedTab===app.rec_id" -->
              <component :config="app" v-bind:is="app.config.controller" :key="app.rec_id"></component>
            </div>
          </div>
          <!-- <div v-else>LOADING</div> -->
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>


<script>

import generictable from "@/components/GenericTable";
import pggenerictable from "@/components/PGGenericTable";
import kibana from "@/components/Kibana";
import external from "@/components/External";
import upload from "@/components/Upload";
 // eslint-disable-next-line
import user from "@/components/User";
 // eslint-disable-next-line
import config from "@/components/Config";
import map from "@/components/Map";
import ReportList from "@/components/ReportList";
import ProcessList from "@/components/ProcessList";
import FileSystem from "@/components/FileSystem";
import reporttask from "@/components/ReportTask";
import reportperiodic from "@/components/ReportPeriodic";
import form from "@/components/Form";
import freetext from "@/components/FreeText";
// import loading from "@/components/Loading";
import queryfilter from "@/components/QueryFilter";
import vega from "@/components/Vega";
import LandingPage from "@/components/LandingPage";
import Vue from "vue";

const req = require.context('../components/external/', true, /\.vue$/)

const dynamicComponents = {}
req.keys().forEach(filename => {
  const name = `${filename.split('.')[1].split('/')[1]}`
  const component = req(filename).default
  dynamicComponents[name] = component
})

Vue.component("GenericTable", generictable);
Vue.component("PGGenericTable", pggenerictable);
Vue.component("Kibana", kibana);
Vue.component("External", external);
Vue.component("Upload", upload);
Vue.component("User", user);
Vue.component("Config", config);
Vue.component("Map", map);
Vue.component("Form", form);
Vue.component("FreeText", freetext);
Vue.component("ReportList", ReportList);
Vue.component("ReportTask", reporttask);
Vue.component("ReportPeriodic", reportperiodic);
Vue.component("ProcessList", ProcessList);
Vue.component("FileSystem", FileSystem);
Vue.component("QueryFilter", queryfilter);
Vue.component("Vega", vega);
Vue.component("LandingPage", LandingPage);

const myExport = {
//export default {
  data: () => ({ 
    selectedTab: null, 
    loading: false,
    // currentSubCategory: null
    }),
  components: {
    ...dynamicComponents
  },
  watch: {
    $route(to, from) {
      console.log('WATCHER ROUTE GENERIC COMPONENT')
      if(from.params.recid === to.params.recid) {
        console.log('Same recid, no need to change app')
        return
      }

      console.log('from')
      console.log(from)
      console.log('to')
      console.log(to)

      this.loading=true
      
      this.selectedTab=this.$route.params.recid

      this.$store.commit({
        type: "changeApp",
        data: this.$route.params.recid
      });

      this.$nextTick(() => this.loading=false);

      // setTimeout(() => {this.loading=false}, 500) 

    }
  },
  computed: {
    component () {
      return this.$route.params.component
    },
    styleContainerComputed: function() {
      return {
        overflow: "auto",
        border: 0 + "px solid #eee",
        padding: 1 + "px",
        height: this.containerSize.height - 125 + "px"
      };
    },
    singleStyleContainerComputed: function() {
      return {
        overflow: "auto",
        border: 0 + "px solid #eee",
        padding: 1 + "px",
        height: this.containerSize.height - 70 + "px"
      };
    },
    containerSize() {
      return this.$store.getters.containerSize;
    }
  },
  methods: {
    handleTabClick: function(tab) {
      var path = "/main/" + tab.name

      if(path != this.$route.path)
        this.$router.push(path);
    },
  },
  mounted: function() {
    console.log('MOUNTED GenericComponent')
    
    this.selectedTab=this.$store.getters.activeApp.rec_id

    this.$globalbus.$on("reportgenerated", () => {
      for (var i in this.$store.getters.currentSubCategory.apps) {
        var app = this.$store.getters.currentSubCategory.apps[i];
        if (app.config.controller == "ReportTask") {
          this.selectedTab = app.rec_id;
          break;
        }
      }
    });
    window.dispatchEvent(new Event("resize"));
  },
  destroyed: function() {
    console.log("===============  UN REGISTERING REport Generated:");
    this.$globalbus.$off("reportgenerated");
  },
};

export default myExport
</script>

<style>
.kibana {
  margin: 0px;
  width: 100%;
  overflow:hidden;
}
.nooverflow {
  overflow: hidden;
}

.el-tabs__item {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Opera and Firefox */
}
</style>
