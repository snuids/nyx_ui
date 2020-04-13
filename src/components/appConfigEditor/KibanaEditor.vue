<template>
  <div id="kibana-editor">
    <el-card>
      <!-- <h1>{{fieldList}}</h1> -->
      <el-form>
        <el-row>
          <el-col :span="8">
            <el-form-item label="Hidden Query" :label-width="formLabelWidth">
              <el-input size="mini" v-model="currentConfig.config.hiddenQuery" autocomplete="off"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="Filter Column" :label-width="formLabelWidth">
              <el-input size="mini" v-model="currentConfig.config.filtercolumn" autocomplete="off"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="8" style="text-align: left;">
            <el-form-item label="Dashboard" :label-width="formLabelWidth">
              <el-select
                size="mini"
                @change="kibanaDashboardSelected"
                v-model="currentConfig.config.kibanaId"
                placeholder="Select"
                :loading="listLoading"
                style="width:100%"
                filterable
              >
                <el-option
                  v-for="dash in dashboards"
                  :key="dash.id"
                  :label="dash.space+' - '+dash.attributes.title"
                  :value="dash.id"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" style="text-align: left;">
            <el-form-item :label-width="formLabelWidth">
              <el-button
                :disabled="currentConfig.config.kibanaId==null||dashboards.length==0"
                size="mini"
                type="danger"
                @click="openInKibana()"
                style="width:100%"
              >Open in Kibana</el-button>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item
              label="Kibana Time"
              :label-width="formLabelWidth"
              prop="config.kibanaTime"
            >
              <el-input
                size="mini"
                @blur="kibanaTimeChange"
                v-model="currentConfig.config.kibanaTime"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        </el-form>
        <el-form>
        <el-row>&nbsp;</el-row>

        <el-row :gutter="24" style="text-align:left">
          <el-col :span="8">
            <el-form-item label :label-width="formLabelWidth">
              <el-row>
                <el-switch
                  v-model="currentConfig.queryBarChecked"
                  active-text="Query Bar"
                  @change="query_bar_changed"
                ></el-switch>
              </el-row>
              <el-row>
                <el-switch v-model="currentConfig.downloadChecked" active-text="Download"></el-switch>
              </el-row>
              <el-row>
                
              </el-row>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label :label-width="formLabelWidth">
              <el-row>
                <el-switch
                  v-model="currentConfig.queryFilterChecked"
                  active-text="Query Filter"
                  @change="query_filter_changed"
                ></el-switch>
              </el-row>

              <el-row>
                <el-switch v-model="currentConfig.timeSelectorChecked" active-text="Time Selector"></el-switch>
              </el-row>

              <el-row>
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
              </el-row>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label :label-width="formLabelWidth">
            <el-row>
              <el-switch v-model="currentConfig.hideFilter" active-text="Hide Filter"></el-switch>
            </el-row>
            <el-row>
              <el-switch
                v-model="currentConfig.timeRefresh"
                @change="timeRefreshSwitchChange"
                active-text="Time Refresh"
              ></el-switch>
            </el-row>
            <el-row>
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
            </el-row>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <!-- <UserQueriesEditor
                  :currentConfig="currentConfig"
                  :allFields="allFieldsFilter"
          ></UserQueriesEditor>-->
        </el-row>
      </el-form>
      <div></div>
    </el-card>
  </div>
</template>
<script>
import Vue from "vue";
import axios from "axios";
// import _ from "lodash";

import kibanaeditor from "@/components/appConfigEditor/KibanaEditor";
Vue.component("KibanaEditor", kibanaeditor);

export default {
  field: "KibanaEditor",
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
    // ,
    // allFieldsFilter() {
    //   return Object.assign({}, ...Object.keys(this.allFields).map(k => ({[k]: {'field': k}})));
    // }
  },
  watch: {},
  props: {
    currentConfig: { type: Object }
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    query_filter_changed:function() {
        if(this.curConfig.queryFilterChecked)
          this.curConfig.queryBarChecked=false;

    },
    query_bar_changed:function() {
        if(this.curConfig.queryBarChecked)
          this.curConfig.queryFilterChecked=false;

    },
    timeSelectorTypeChange() {
      if (this.curConfig.timeSelectorType != null)
        this.curConfig.timeSelectorChecked = true;

      var tmp = JSON.parse(JSON.stringify(this.curConfig));
      this.curConfig = null;
      this.curConfig = tmp;
    },
    timeRefreshSelectChange() {
      if (this.curConfig.timeRefreshValue != null)
        this.curConfig.timeRefresh = true;


      this.computeUrlFromKibana();


      var tmp = JSON.parse(JSON.stringify(this.curConfig));
      this.curConfig = null;
      this.curConfig = tmp;
    },
    
    timeRefreshSwitchChange() {
      this.computeUrlFromKibana();


      var tmp = JSON.parse(JSON.stringify(this.curConfig));
      this.curConfig = null;
      this.curConfig = tmp;

      console.log(this.curConfig.config.url)
    },
    prepareData() {
      this.loadKibanaDashboards();
    },
    openInKibana() {
      console.log(this.currentConfig);
      window.open(
        this.currentConfig.config.url
          .replace("kibananyx", "kibana")
          .replace("embed=true", "")
          .replace(",title:Test", "")
          .replace("title:Test,", "")
      );
    },
    kibanaTimeChange() {
      console.log("kibana time changed");
      this.computeUrlFromKibana();
    },
    computeUrlFromKibana() {
      console.log("computeUrlFromKibana");
      if (this.selectedDash != null) {
        var space = "";
        if (this.selectedDash.space != "default") {
          space = "s/" + this.selectedDash.space; //.toLowerCase();
        }
        this.currentConfig.config.url =
          "." +
          this.$store.getters.kibanaurl.replace("kibana", "kibananyx") +
          space +
          "/app/kibana#" +
          this.computeKibanaUrlFromSelectedDash();
      }
    },
    kibanaDashboardSelected() {
      for (var i in this.dashboards) {
        if (this.dashboards[i].id == this.currentConfig.config.kibanaId) {
          console.log("FOUND");
          this.selectedDash = this.dashboards[i];
          console.log(this.dashboards[i]);
        }
      }

      var space = "";
      if (this.selectedDash.space != "default") {
        space = "s/" + this.selectedDash.space; //.toLowerCase();
      }

      this.currentConfig.config.url =
        "." +
        this.$store.getters.kibanaurl.replace("kibana", "kibananyx") +
        space +
        "/app/kibana#" +
        this.computeKibanaUrlFromSelectedDash();

      var tmp = JSON.parse(JSON.stringify(this.currentConfig));
      this.currentConfig = null;
      this.currentConfig = tmp;
    },
    loadKibanaDashboards: function() {
      this.listLoading = true;
      this.dashboards = [];

      this.addDashboards(
        {
          page: 1,
          per_page: 1000,
          total: 4,
          saved_objects: [
            {
              type: "dashboard",
              id: "ede7b7b0-eb5e-11e9-b31c-91fd0a97e7fc",
              attributes: {
                title: "LUTOSA - Calendar",
                hits: 0,
                description: "",
                panelsJSON: [
                  {
                    embeddableConfig: {},
                    gridData: { h: 20, i: "1", w: 41, x: 0, y: 0 },
                    id: "67239870-eb5e-11e9-b31c-91fd0a97e7fc",
                    panelIndex: "1",
                    title: "Calendar",
                    type: "visualization",
                    version: "6.5.4"
                  },
                  {
                    embeddableConfig: {},
                    gridData: { h: 10, i: "2", w: 7, x: 41, y: 0 },
                    id: "83795190-eb5e-11e9-b31c-91fd0a97e7fc",
                    panelIndex: "2",
                    title: "Days",
                    type: "visualization",
                    version: "6.5.4"
                  },
                  {
                    embeddableConfig: {},
                    gridData: { h: 10, i: "3", w: 7, x: 41, y: 10 },
                    id: "9faf26a0-eb5e-11e9-b31c-91fd0a97e7fc",
                    panelIndex: "3",
                    title: "Open days",
                    type: "visualization",
                    version: "6.5.4"
                  },
                  {
                    embeddableConfig: {},
                    gridData: { h: 10, i: "4", w: 48, x: 0, y: 20 },
                    id: "342e2c20-eb6b-11e9-b31c-91fd0a97e7fc",
                    panelIndex: "4",
                    title: "Targets",
                    type: "visualization",
                    version: "6.5.4"
                  }
                ],
                optionsJSON: {
                  darkTheme: false,
                  hidePanelTitles: false,
                  useMargins: true
                },
                version: 1,
                timeRestore: false,
                kibanaSavedObjectMeta: {
                  searchSourceJSON: {
                    query: { language: "lucene", query: "" },
                    filter: []
                  }
                }
              },
              updated_at: "2019-10-10T14:45:45.529Z",
              version: 5
            },
            {
              type: "dashboard",
              id: "0c8aea00-174a-11e9-8fa5-c79677d29cc9",
              attributes: {
                title: "Nyx API",
                hits: 0,
                description: "",
                panelsJSON:
                  '[{"embeddableConfig":{},"gridData":{"x":0,"y":12,"w":18,"h":27,"i":"1"},"id":"235bc8e0-1749-11e9-8fa5-c79677d29cc9","panelIndex":"1","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"x":0,"y":0,"w":48,"h":12,"i":"2"},"id":"6aaced00-1749-11e9-8fa5-c79677d29cc9","panelIndex":"2","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"x":18,"y":25,"w":15,"h":14,"i":"3"},"id":"cdba9780-1749-11e9-8fa5-c79677d29cc9","panelIndex":"3","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"x":33,"y":25,"w":15,"h":14,"i":"4"},"id":"ddc92830-1749-11e9-8fa5-c79677d29cc9","panelIndex":"4","type":"visualization","version":"6.5.4"},{"gridData":{"x":18,"y":12,"w":30,"h":13,"i":"5"},"version":"6.5.4","panelIndex":"5","type":"visualization","id":"a863c3c0-174a-11e9-8fa5-c79677d29cc9","embeddableConfig":{}}]',
                optionsJSON:
                  '{"darkTheme":false,"hidePanelTitles":true,"useMargins":true}',
                version: 1,
                timeRestore: false,
                kibanaSavedObjectMeta: {
                  searchSourceJSON:
                    '{"query":{"language":"lucene","query":""},"filter":[]}'
                }
              },
              updated_at: "2019-01-13T15:54:24.567Z",
              version: 4
            },
            {
              type: "dashboard",
              id: "c0beaa00-1e18-11e9-8fa5-c79677d29cc9",
              attributes: {
                title: "Nyx User Statistics",
                hits: 0,
                description: "",
                panelsJSON:
                  '[{"embeddableConfig":{},"gridData":{"x":0,"y":0,"w":48,"h":13,"i":"1"},"id":"30d22e80-1e18-11e9-8fa5-c79677d29cc9","panelIndex":"1","type":"visualization","version":"6.5.4","title":"Statistics"},{"embeddableConfig":{},"gridData":{"x":0,"y":13,"w":24,"h":15,"i":"2"},"id":"5cb9ce40-1e18-11e9-8fa5-c79677d29cc9","panelIndex":"2","title":"Users","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"x":24,"y":13,"w":24,"h":15,"i":"3"},"id":"cdba9780-1749-11e9-8fa5-c79677d29cc9","panelIndex":"3","title":"Platforms","type":"visualization","version":"6.5.4"}]',
                optionsJSON:
                  '{"darkTheme":false,"hidePanelTitles":false,"useMargins":true}',
                version: 1,
                timeRestore: false,
                kibanaSavedObjectMeta: {
                  searchSourceJSON:
                    '{"query":{"language":"lucene","query":""},"filter":[]}'
                }
              },
              updated_at: "2019-01-22T07:38:47.328Z",
              version: 1
            },
            {
              type: "dashboard",
              id: "7bbb3390-2243-11e9-9a68-772c982ed0ab",
              attributes: {
                title: "Docker",
                hits: 0,
                description: "",
                panelsJSON:
                  '[{"gridData":{"x":0,"y":15,"w":48,"h":22,"i":"1"},"version":"6.5.4","panelIndex":"1","type":"visualization","id":"9b91cb80-2242-11e9-9a68-772c982ed0ab","embeddableConfig":{}},{"gridData":{"x":0,"y":0,"w":48,"h":15,"i":"2"},"version":"6.5.4","panelIndex":"2","type":"visualization","id":"195fc210-2243-11e9-9a68-772c982ed0ab","embeddableConfig":{}}]',
                optionsJSON:
                  '{"darkTheme":false,"useMargins":true,"hidePanelTitles":false}',
                version: 1,
                timeRestore: false,
                kibanaSavedObjectMeta: {
                  searchSourceJSON:
                    '{"query":{"query":"","language":"lucene"},"filter":[]}'
                }
              },
              updated_at: "2019-01-27T14:54:44.552Z",
              version: 1
            }
          ]
        },
        "nyx"
      );

      var url = this.$store.getters.kibanaurl + "api/spaces/space";
      axios
        .get(url)
        .then(response => {
          console.log("Space success...");
          this.loadKibanaDashboards2(response.data);
        })
        .catch(error => {
          console.log(error);
          this.listLoading = false;
        });
    },
    loadKibanaDashboards2: async function(spaces) {
      console.log(spaces);
      this.dashboards = [];
      for (var i in spaces) {
        var space = spaces[i];

        var spaceurl = "";

        if (space.id != "default") spaceurl = "s/" + space.id + "/";
        var url =
          this.$store.getters.kibanaurl +
          spaceurl +
          "api/saved_objects/_find?type=dashboard&per_page=1000&page=1";

        const response = await axios.get(url, {});

        this.addDashboards(response.data, space.id);
      }
      var tmp = JSON.parse(JSON.stringify(this.currentConfig));
      this.currentConfig = null;
      this.currentConfig = tmp;

      this.listLoading = false;
    },
    addDashboards: function(newdashs, space) {
      for (var i in newdashs.saved_objects) {
        var dash = newdashs.saved_objects[i];
        dash.space = space;
        this.dashboards.push(dash);
      }
    }
  }
};
</script>
<style>
#form-editor .padding-right {
  padding-right: 10px;
}
</style>