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
              >{{ $t('cfg.open_in_grafana') }}</el-button>
            </el-form-item>
          </el-col>


        </el-row>
        <el-row>
          <el-col :span="8" style="text-align: left;">
            <el-form-item :label="$t('cfg.extra_parameters')" :label-width="formLabelWidth">
              <el-input size="mini" v-model="currentConfig.config.extraParameters" autocomplete="off"></el-input>
            </el-form-item>
            
          </el-col>
          
        </el-row>
        <el-row>
          <el-col :span="8" style="text-align: left;">
            <el-switch v-model="currentConfig.timeSelectorChecked" :active-text="$t('cfg.time_selector')"></el-switch>
          </el-col>
          <el-col :span="8" style="text-align: left;">
                <el-select
                  size="mini"
                  v-model="currentConfig.timeSelectorType"
                  :placeholder="$t('cfg.select_type')"
                  @change="timeSelectorTypeChange"
                  :disabled="!currentConfig.timeSelectorChecked"
                >
                  <el-option :label="$t('cfg.free')" value="classic"></el-option>
                  <el-option :label="$t('cfg.day')" value="day"></el-option>
                  <el-option :label="$t('cfg.month')" value="month"></el-option>
                  <el-option :label="$t('cfg.week')" value="week"></el-option>
                  <el-option :label="$t('cfg.year')" value="year"></el-option>
                </el-select>
              </el-col>
              
        </el-row>

            <el-row>
              <el-col :span="8" style="text-align: left;">
              <el-switch
                v-model="currentConfig.timeRefresh"
                @change="timeRefreshSwitchChange"
                :active-text="$t('cfg.time_refresh')"
              ></el-switch>
              </el-col>
              <el-col :span="8" style="text-align: left;">
              <el-select
                :disabled="!currentConfig.timeRefresh"
                size="mini"
                v-model="currentConfig.timeRefreshValue"
                :placeholder="$t('cfg.refresh_interval')"
                @change="timeRefreshSelectChange"
              >
                <el-option :label="$t('cfg.seconds_5')" value="5s"></el-option>
                <el-option :label="$t('cfg.seconds_10')" value="10s"></el-option>
                <el-option :label="$t('cfg.seconds_30')" value="30s"></el-option>
                <el-option :label="$t('cfg.seconds_45')" value="45s"></el-option>
                <el-option :label="$t('cfg.minute_1')" value="1m"></el-option>
                <el-option :label="$t('cfg.minutes_5')" value="5m"></el-option>
                <el-option :label="$t('cfg.minutes_15')" value="15m"></el-option>
                <el-option :label="$t('cfg.minutes_30')" value="30m"></el-option>
                <el-option :label="$t('cfg.hour_1')" value="1h"></el-option>
                <el-option :label="$t('cfg.hours_2')" value="2h"></el-option>
                <el-option :label="$t('cfg.hours_12')" value="12h"></el-option>
                <el-option :label="$t('cfg.day_1')" value="1d"></el-option>
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
import axios from "axios";
// import _ from "lodash";

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
    .catch(() => {
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