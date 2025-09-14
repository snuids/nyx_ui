<template>
  <div id="grafana-editor">
    <el-card>
      <!-- <h1>{{fieldList}}</h1> -->
      <el-form>
         <!-- <h1>{{dashboards}}</h1> -->
        <el-row>
          <el-col :span="16" style="text-align: left;">
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
                :disabled="currentConfig.config.url==null||dashboards.length==0"
                size="mini"
                type="danger"
                @click="openInGrafana()"
                style="width:100%"
              >Open in Grafana</el-button>
            </el-form-item>
          </el-col>


        </el-row>
        <el-row>
          <el-col :span="8" style="text-align: left;">
            <el-form-item label="Extra parameters" :label-width="formLabelWidth">
              <el-input size="mini" v-model="currentConfig.config.extraParameters" autocomplete="off"></el-input>
            </el-form-item>
            
          </el-col>
          
        </el-row>
        <el-row>
          <el-col :span="8" style="text-align: left;">
            <el-switch v-model="currentConfig.timeSelectorChecked" active-text="Time Selector"></el-switch>
          </el-col>
          <el-col :span="8" style="text-align: left;">
                <el-select
                  size="mini"
                  v-model="currentConfig.timeSelectorType"
                  placeholder="Please select a type"
                  @change="timeSelectorTypeChange"
                  :disabled="!currentConfig.timeSelectorChecked"
                >
                  <el-option label="Free" value="classic"></el-option>
                  <el-option label="Day" value="day"></el-option>
                  <el-option label="Month" value="month"></el-option>
                  <el-option label="Week" value="week"></el-option>
                  <el-option label="Year" value="year"></el-option>
                </el-select>
              </el-col>
              
        </el-row>

            <el-row>
              <el-col :span="8" style="text-align: left;">
              <el-switch
                v-model="currentConfig.timeRefresh"
                @change="timeRefreshSwitchChange"
                active-text="Time Refresh"
              ></el-switch>
              </el-col>
              <el-col :span="8" style="text-align: left;">
              <el-select
                :disabled="!currentConfig.timeRefresh"
                size="mini"
                v-model="currentConfig.timeRefreshValue"
                placeholder="Refresh Interval"
                @change="timeRefreshSelectChange"
              >
                <el-option label="5 seconds" value="5000"></el-option>
                <el-option label="10 seconds" value="10000"></el-option>
                <el-option label="30 seconds" value="30000"></el-option>
                <el-option label="45 seconds" value="45000"></el-option>
                <el-option label="1 minute" value="60000"></el-option>
                <el-option label="5 minutes" value="300000"></el-option>
                <el-option label="15 minutes" value="900000"></el-option>
                <el-option label="30 minutes" value="1800000"></el-option>
                <el-option label="1 hour" value="3600000"></el-option>
                <el-option label="2 hours" value="7200000"></el-option>
                <el-option label="12 hours" value="43200000"></el-option>
                <el-option label="1 day" value="86400000"></el-option>
              </el-select>
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
          .replace("grafananyx", "grafana")
          .replace("kiosk=true", "")          
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