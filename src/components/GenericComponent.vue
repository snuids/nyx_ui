
<template>
  <div  v-if="currentApps" style="border: 0px solid pink;height: 100%;overflow:hidden;" >
    <div
      v-if="currentApps.apps.length==1"
      style="border: 20px solid orange;height: 100%;overflow:auto;margin-top:5px;" v-bind:style="singleStyleContainerComputed"
    >
      <div style="overflow:auto;">
        <div v-if="currentApps.apps[0].type=='generic-table'">
          <GenericTable :config="currentApps.apps[0]"/>
        </div>
        <div v-else-if="currentApps.apps[0].type=='external'">
          <External :config="currentApps.apps[0]"></External>          
        </div>
        <div class="kibana" v-else-if="currentApps.apps[0].type=='kibana'">
          <Kibana :config="currentApps.apps[0]" :directLoad="true"></Kibana>
        </div>
        <div v-else-if="currentApps.apps[0].type=='form'">
          <Form :config="currentApps.apps[0]"></Form>
        </div>
        <div v-else-if="currentApps.apps[0].type=='upload'">
          <Upload :config="currentApps.apps[0]"></Upload>
        </div>
        <div v-else>          
          <component
            :config="currentApps.apps[0]"
            v-bind:is="currentApps.apps[0].config.controller"
          ></component>
        </div>
      </div>
    </div>
    <!-- More than one application -->
    <div v-else style="overflow:hidden;">
      <el-tabs v-model="selectedTab" @tab-click="handleTabClick">
        <el-tab-pane
          v-bind:style="styleContainerComputed"
          v-for="(app,index) in currentApps.apps"
          :key="'TAB-'+index"
          :label="app.loc_title"
          :name="'TAB-'+index"
          :lazy="true"
        >
          <div style="overflow:auto !important;border:0px solid pink">
            <div v-if="app.type=='generic-table'">
              <GenericTable :config="app"/>
            </div>
            <div v-else-if="app.type=='external'">
              <External :config="app"></External>
            </div>
            <div class="kibana" v-else-if="app.type=='kibana'">
              <Kibana :config="app"></Kibana>
              <!-- <Kibana :config="app" :directLoad="index==0"></Kibana> -->
            </div>
            <div v-else-if="app.type=='form'">
              <Form :config="app"></Form>
            </div>
            <div v-else-if="app.type=='upload'">
              <Upload :config="app"></Upload>
            </div>
            <div v-else>
              <component :config="app" v-bind:is="app.config.controller"></component>
            </div>
          </div>
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

const myExport = {
//export default {
  data: () => ({ 
    selectedTab: "TAB-0", 
    currentApps: null
    }),
  components: {
    ...dynamicComponents
  },
  watch: {
    $route(to, from) {
      console.log('WATCHER ROUTE GENERIC COMPONENT')
      console.log('from')
      console.log(from)
      console.log('to')
      console.log(to)

      var filteredmenus = this.$store.getters.filteredmenus

      var app = null
      for(var i=0; i < filteredmenus.length; i++) {
        var menu = filteredmenus[i]

        var str_cat = menu.category.replace(/ /g,'').toLowerCase()
        
        if(str_cat == this.$route.params.category) {

          console.log(menu)
          for(var j=0; j < menu.submenus.length; j++) {
            var submenu = menu.submenus[j]
  
            var str_app = submenu.title.replace(/ /g,'').toLowerCase()
  
            if(str_app == this.$route.params.app) {
              app = submenu
              break
            }
  
          }
          if(app !== null)
            break

        }

      }

      console.log('CHANGE APP')
      console.log(app)

      this.currentApps = null
      this.$nextTick(() => {
        this.currentApps = JSON.parse(JSON.stringify(app))
      });

      this.$store.commit({
        type: "changeApps",
        data: app
      });

      this.changeApp()
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
      var index = parseInt(tab.name.substring(4));
      
      this.$store.commit({
        type: "setTab",
        data: this.$store.getters.currentApps.apps[index]
      });

      // if (this.$store.getters.currentApps.apps[index].type == "kibana") {
      //   this.$globalbus.$emit(
      //     "kibanaactivated",
      //     this.$store.getters.currentApps.apps[index]
      //   );
      // }
    },
    changeApp: function() {
      this.currentApps = null

      this.selectedTab = "TAB-0"

      this.$nextTick(() => {
        this.currentApps = JSON.parse(JSON.stringify(this.$store.getters.currentApps))
      });
    },
  },
  mounted: function() {
    this.currentApps = this.$store.getters.currentApps

    this.$globalbus.$on("reportgenerated", () => {
      for (var i in this.currentApps.apps) {
        var app = this.currentApps.apps[i];
        if (app.config.controller == "ReportTask") {
          this.selectedTab = "TAB-" + i;
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
</style>
