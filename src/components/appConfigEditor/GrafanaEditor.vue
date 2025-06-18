<template>
  <div id="grafana-editor">
    <el-card>
      <!-- <h1>{{fieldList}}</h1> -->
      <el-form>
         <!-- <h1>{{dashboards}}</h1> -->
        <el-row>
          <el-col :span="8" style="text-align: left;">
            <el-form-item label="Dashboard" :label-width="formLabelWidth">
              <el-select
                size="mini"
                @change="grafanaDashboardSelected"
                v-model="currentConfig.config.url"
                placeholder="Select"
                :loading="listLoading"
                style="width:100%"
                filterable
              >
                <el-option
                  v-for="dash in dashboards"
                  :key="dash.id"
                  :label="dash.title"
                  :value="dash.url"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" style="text-align: left;">
            <el-form-item :label-width="formLabelWidth">
              <el-button
                :disabled="currentConfig.config.grafanaId==null||dashboards.length==0"
                size="mini"
                type="danger"
                @click="openInGrafana()"
                style="width:100%"
              >Open in Grafana</el-button>
            </el-form-item>
          </el-col>


        </el-row>
        </el-form>
        <el-form>
        <el-row>&nbsp;</el-row>
        
      </el-form>
      <div></div>
    </el-card>
  </div>
</template>
<script>
import Vue from "vue";
import axios from "axios";
// import _ from "lodash";

import grafanaeditor from "@/components/appConfigEditor/GrafanaEditor";
Vue.component("GrafanaEditor", grafanaeditor);

export default {
  field: "GrafanaEditor",
  data() {
    return (
      window.__FORM__ || {
        formLabelWidth: "120px",
        formFielfEditorVisible: false,
        currentField: {},
        listLoading: false,
        dashboards: [],
        selectedDash: null,
        selectedDashId: null
      }
    );
  },
  computed: {
    curConfigIn: function() {
      return this.currentConfig;
    },
    fieldList: function() {
      return this.currentConfig.config.headercolumns.map(x => x.field);
    }
  },
  watch: {},
  props: {
    currentConfig: { type: Object }
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    
    prepareData() {
      this.loadGrafanaDashboards();
    },
    openInGrafana() {
      //console.log(this.currentConfig);
      window.open(
        this.currentConfig.config.url
          .replace("kibananyx", "kibana")
          .replace("embed=true", "")
          .replace(",title:Test", "")
          .replace("title:Test,", "")
      );
    },
    grafanaDashboardSelected: function(value) {
      //console.log("Selected Grafana Dashboard ID:", value);
      
      this.curConfig.config.url="./"+value;
      
      //this.currentConfig.config.grafanaId = value;
      //this.$emit("update:currentConfig", this.currentConfig);
    },
 
    loadGrafanaDashboards: function() {
      this.listLoading = true;
      this.dashboards = [];
    axios
    .get(this.$store.getters.apiurl+"grafana/dashboards?token=" + this.$store.getters.creds.token) // Adjust the endpoint as needed
    .then(response => {
      
      this.dashboards = response.data.data || [];
      
    })
    .catch(error => {
      console.error("Failed to load Grafana dashboards:", error);
      this.dashboards = [];
    })
    .finally(() => {
      this.listLoading = false;
    });
      
    }    
  }
};
</script>
<style>
#form-editor .padding-right {
  padding-right: 10px;
}
</style>