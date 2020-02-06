<template>
  <div>
    <!-- <div v-loading="!ready"> -->
    <span v-if="dialogFormVisible">
      <component
        v-if="config.config.editorComponent!=null && config.config.editorComponent!=''"
        v-bind:is="config.config.editorComponent"
        :editMode="editMode"
        :record="currentRecord.original"
        :config="config"
        v-on:dialogcloseupdated="recordUpdated()"
        v-on:dialogclose="dialogFormVisible=false"
      ></component>
      <GenericTableDetails
        v-else
        :record="currentRecord.original"
        :config="config"
        v-on:dialogcloseupdated="recordUpdated()"
        v-on:dialogclose="dialogFormVisible=false"
      ></GenericTableDetails>
    </span>

    <el-row v-if="config.queryBarChecked">
      <QueryBar @querychanged="queryBarChanged" @downloadasked="downloadAsked" :config="config"></QueryBar>
    </el-row>

    <el-row v-if="config.queryFilterChecked">
      <QueryFilter
        @queryfilterchanged="queryFilterChanged"
        @downloadasked="downloadAsked"
        :config="config"
        v-on:queryfilter_changed="queryfilterchanged"
      ></QueryFilter>
    </el-row>
    <el-row v-if="config.mapChecked">
      <el-col>
        <Map :config="config" :tableData="tableData" v-on:mapclicked="mapClicked"></Map>
      </el-col>
    </el-row>
    <el-row v-if="config.graphicChecked">
      <el-col>
        <BarChart :autotime="autotime" :config="config" :series="series"></BarChart>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-table
          size="mini"
          :data="tableData"
          style="width: 100%"
          highlight-current-row
          @current-change="handleCurrentRecordChange"
          v-loading="!ready"
        >
          <el-table-column
            v-for="header in config.config.headercolumns"
            :key="header.field"
            :label="header.title"
            :prop="header.field"
            sortable
          >
            <template slot-scope="scope">
              <div v-if="header.type=='select'">
                <el-select
                  @change="selectChanged(scope.row, header)"
                  size="mini"
                  v-model="scope.row._source[header.field.replace('_source.', '')]"
                  placeholder="Select"
                >
                  <el-option
                    v-for="item in header.options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></el-option>
                </el-select>
              </div>
              <div
                v-else-if="(header.type=='long' || header.type=='double') && header.format != null && header.format.length > 0"
              >{{computeRec(scope.row,header.field) | numeral(header.format)}}</div>
              <div v-else-if="header.type=='boolean'">
                <el-switch
                  v-model="scope.row._source[header.field.replace('_source.', '')]"
                  :disabled="header.disabled"
                  @change="switchChanged(scope.row, header)"
                ></el-switch>
              </div>
              <div v-else>{{computeRec(scope.row,header.field)}}</div>
            </template>
          </el-table-column>
          <el-table-column label="Actions" align="right">
            <template slot="header" slot-scope="scope">
              <div>
                <el-tooltip
                  v-if="config.config.index.indexOf('*')==-1 && currentRow && $store.getters.creds.hasPrivilege(config.config.writeprivileges)"
                  class="item"
                  effect="light"
                  content="Duplicate"
                  placement="bottom-end"
                >
                  <el-button
                    circle
                    size="mini"
                    @click="duplicateRecord()"
                    type="primary"
                    icon="el-icon-copy-document"
                  ></el-button>
                </el-tooltip>
                <el-tooltip
                  v-if="config.config.index.indexOf('*')==-1 && $store.getters.creds.hasPrivilege(config.config.writeprivileges)"
                  class="item"
                  effect="light"
                  content="Add"
                  placement="bottom"
                >
                  <el-button
                    circle
                    size="mini"
                    @click="addRecord()"
                    type="primary"
                    icon="el-icon-plus"
                  ></el-button>
                </el-tooltip>
                <el-tooltip
                  v-if="!config.queryBarChecked && !config.queryFilterChecked"
                  class="item"
                  effect="light"
                  content="Refresh"
                  placement="bottom-start"
                >
                  <el-button
                    circle
                    size="mini"
                    @click="refreshData()"
                    class="regreshbutton"
                    plain
                    icon="el-icon-refresh"
                  ></el-button>
                </el-tooltip>
              </div>
            </template>
            <template slot-scope="scope">
              <el-button
                size="mini"
                plain
                icon="el-icon-setting"
                @click="handleView(scope.$index, scope.row)"
              ></el-button>
              <el-button
                v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
                size="mini"
                type="danger"
                icon="el-icon-delete"
                @click="handleDelete(scope.$index, scope.row)"
              ></el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";
import Vue from "vue";
import generictabledetails from "@/components/GenericTableDetails";
import map from "@/components/Map";
import barchart from "@/components/BarChart";
import querybar from "@/components/QueryBar";
import _ from "lodash";

const req = require.context("../components/tableEditor/", true, /\.vue$/);

const dynamicComponents = {};
req.keys().forEach(filename => {
  const name = `${filename.split(".")[1].split("/")[1]}`;
  const component = req(filename).default;
  dynamicComponents[name] = component;
});

Vue.component("Map", map);
Vue.component("BarChart", barchart);
Vue.component("QueryBar", querybar);
Vue.component("GenericTableDetails", generictabledetails);

export default {
  name: "GenericTable",
  components: {
    ...dynamicComponents
  },
  data: () => ({
    ready: false,
    autotime: "1d",
    query: "",
    queryField: "",
    queryfilter: "",
    currentRecord: { original: {} },
    tableData: [],
    previousValue: "",
    currentRow: null,
    dialogFormVisible: false,
    editMode: null,
    options: {
      chart: {
        stacked: false,
        zoom: {
          type: "x",
          enabled: true
        },
        toolbar: {
          autoSelected: "zoom",
          tools: {
            pan: false,
            reset: false
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 2
      },
      markers: {
        size: 3,
        style: "full"
      },
      colors: ["#0165fc"],
      title: {
        text: "Documents",
        align: "left"
      },

      yaxis: {
        min: 0,
        labels: {
          formatter: function(val) {
            return (val / 1).toFixed(0);
          }
        },
        title: {
          text: "Documents"
        }
      },
      xaxis: {
        type: "datetime"
      },
      tooltip: {
        shared: false,
        y: {
          formatter: function(val) {
            return (val / 1).toFixed(0);
          }
        }
      }
    },
    series: [
      {
        name: "Documents",
        data: []
      }
    ]
  }),

  props: {
    headers: {
      type: Array
    },
    data: {
      type: Array
    },
    config: {
      type: Object
    }
  },
  computed: {
    configin: function() {
      return this.config;
    }
  },
  watch: {
    configin: {
      handler: function() {
        console.log("Config changed.....");
      },
      deep: true
    }
  },
  methods: {
    handleCommand: function(e) {
      console.log("Command changed.....");
      this.loadData(true, e);
    },
    handleCurrentRecordChange(val) {
      this.currentRow = val;
    },
    duplicateRecord: function() {
      console.log("duplicating record");
      console.log(this.currentRecord);
      this.currentRecord = JSON.parse(JSON.stringify(this.currentRow));
      this.currentRecord.original._id =
        "id_" + Math.floor((1 + Math.random()) * 0x1000000);
      this.dialogFormVisible = true;
      this.editMode = "duplicate";
    },
    addRecord: function() {
      this.currentRecord = {
        _id: "id_" + Math.floor((1 + Math.random()) * 0x1000000),
        _index: this.config.config.index,
        _source: {}
      }; // required by the detail watcher
      for (var i in this.config.config.headercolumns) {
        var col = this.config.config.headercolumns[i].field.replace(
          "_source.",
          ""
        );
        if (col == "_id") continue;
        this.currentRecord._source[col] = "";
      }
      this.currentRecord.original = JSON.parse(
        JSON.stringify(this.currentRecord)
      );
      this.dialogFormVisible = true;
      this.editMode = "create";
    },
    partialUpdateRecord: function(newRec, header) {
      var headerName = header.field.replace("_source.", "");
      var newObj = newRec.original;

      newObj._source[headerName] = newRec._source[headerName];

      this.$store.commit({
        type: "updateRecord",
        data: newObj
      });
      this.$notify({
        title: "Record updated.",
        type: "success",
        message: "Record updated.",
        position: "bottom-right",
        duration: 1000
      });
    },
    selectChanged: function(newRec, header) {
      this.partialUpdateRecord(newRec, header);
    },
    switchChanged: function(newRec, header) {
      console.log(newRec);
      console.log(header);
      this.partialUpdateRecord(newRec, header);
    },
    cutRec(aRec) {
      if (aRec == undefined) return "";
      if (aRec.length > 40) aRec = aRec.substring(0, 50) + "...";
      return aRec;
    },
    computeRec: function(row, field) {
      var rec = row;
      if (field.indexOf("_source") == 0) {
        rec = row["_source"];
        var res = "";
        if (field.indexOf("@") == -1)
          res = _.get(rec, field.replace("_source.", ""));
        else res = rec[field.replace("_source.", "")];
        if (res == undefined) return "";
        else return this.cutRec("" + res);
      }
      if (field.indexOf("@") == -1) return this.cutRec(_.get(rec, field));
      else res = rec[field];
      //return field;
    },
    recordUpdated: function() {
      this.dialogFormVisible = false;
      setTimeout(() => {
        this.loadData();
      }, 1000);
    },
    mapClicked: function(row) {
      this.currentRecord = row.source;
      this.dialogFormVisible = true;
      this.editMode = "edit";
    },
    queryfilterchanged: function(query) {
      this.queryfilter = query;
      this.loadData();
    },
    queryChanged: _.debounce(function() {
      console.log("DEBOUNCED:" + this.queryField);
      this.ready = false;
      this.loadData();
    }, 1500),
    handleView(index, row) {
      this.currentRecord = {}; // required by the detail watcher
      this.currentRecord = row;
      this.dialogFormVisible = true;
      this.editMode = "edit";
    },
    handleDelete(index, row) {
      this.$confirm(
        "This will permanently delete the record. Continue?",
        "Warning",
        {
          confirmButtonText: "OK",
          cancelButtonText: "Cancel",
          type: "warning"
        }
      )
        .then(() => {
          //this.tableData.splice(index, 1);
          this.$store.commit({
            type: "deleteRecord",
            data: row
          });
          setTimeout(() => {
            this.loadData();
          }, 3000);
          this.$notify({
            title: "Success",
            type: "success",
            message: "Delete completed",
            position: "bottom-right"
          });
        })
        .catch(() => {
          this.$notify({
            title: "Cancelled",
            type: "info",
            message: "Delete canceled",
            position: "bottom-right"
          });
        });
    },
    refreshData: function() {
      this.ready = false;
      this.$store.commit({
        type: "refreshTimeRange",
        data: {}
      });
      this.loadData();
    },
    loadData: function(download, exportformat) {  
      console.log("GENERIC TABLE - Load DATA");
      if (download == undefined) download = false;
      // console.log("LOAD DATA...Download=" + download);

      var doc_type = "";
      if (
        this.config.config.doc_type != undefined &&
        this.config.config.doc_type != ""
      ) {
        doc_type = "&doc_type=" + this.config.config.doc_type;
      }

      var rangetouse;

      switch (this.config.timeSelectorType) {
        case "week":
          rangetouse = this.$store.getters.timeRangeWeek;
          this.autotime = this.$store.getters.autoTimeWeek;
          break;
        case "month":
          rangetouse = this.$store.getters.timeRangeMonth;
          this.autotime = this.$store.getters.autoTimeMonth;
          break;
        case "year":
          rangetouse = this.$store.getters.timeRangeYear;
          this.autotime = this.$store.getters.autoTimeYear;
          break;

        case "day":
          rangetouse = this.$store.getters.timeRangeDay;
          this.autotime = this.$store.getters.autoTimeDay;
          break;

        default:
          rangetouse = this.$store.getters.timeRange;
          this.autotime = this.$store.getters.autoTime;
          break;
      }

      var url =
        this.$store.getters.apiurl +
        "generic_search/" +
        this.config.config.index +
        "?token=" +
        this.$store.getters.creds.token +
        "&download=" +
        (download ? 1 : 0) +
        "&output=" +
        exportformat +
        doc_type;

      var query = {
        size: download ? 10000 : 100,
        query: {
          bool: {
            must: [
              {
                match_all: {}
              }
            ]
          }
        }
      };
      if (
        this.config.config.timefield != null &&
        this.config.config.timefield != ""
      ) {
        if (rangetouse != null) {
          var timeRange = rangetouse;

          var range = {
            gte: timeRange[0].getTime(),
            lte: timeRange[1].getTime(),
            format: "epoch_millis"
          };
          var query2 = {
            range: {}
          };
          query2.range[this.config.config.timefield] = range;
          query.query.bool.must.push(query2);

          if (this.config.graphicChecked) {
            query.aggs = {
              "2": {
                date_histogram: {
                  field: this.config.config.timefield,
                  interval: this.autotime, //this.$store.getters.autoTime,
                  time_zone: "Europe/Berlin",
                  min_doc_count: 1
                }
              }
            };
          }
        } else {
          console.log("TIME RANGE IS NOT DEFINED...");
          query.query.bool.must.push({
            range: {
              "@timestamp": {
                gte: "now-1d",
                lte: "now",
                format: "epoch_millis"
              }
            }
          });
        }
      }
      var curquery = "";
      if (this.config.queryBarChecked && this.queryField != "") {
        curquery = this.queryField;
      }
      if (
        this.config.config.hiddenQuery != undefined &&
        this.config.config.hiddenQuery != ""
      ) {
        if (curquery == "") curquery = this.config.config.hiddenQuery;
        else
          curquery =
            "(" + this.config.config.hiddenQuery + ") AND (" + curquery + ")";
      }

      if (this.queryfilter != "" && this.config.queryFilterChecked) {
        if (curquery == "") curquery = this.queryfilter;
        else curquery = "(" + curquery + ") AND (" + this.queryfilter + ")";
      }

      this.query = curquery;

      if (curquery != "") {
        query.query.bool.must.push({
          query_string: {
            query: curquery,
            analyze_wildcard: true,
            default_field: "*"
          }
        });
      }

      if (
        this.config.config.orderField != undefined &&
        this.config.config.orderField != ""
      ) {
        query.sort = [];
        var order = {};
        var direction = "asc";
        if (this.config.config.orderDirection) direction = "desc";

        order[this.config.config.orderField] = { order: direction };
        query.sort.push(order);
      }
      if (
        this.config.config.exportColumns != undefined &&
        this.config.config.exportColumns != ""
      ) {
        query.extra = { exportColumns: this.config.config.exportColumns };
      }
      axios
        .post(url, query)
        .then(response => {
          this.ready = true;

          if (response.data.records != null) {
            if (download) {
              if (response.data.type == "mail") {
                this.$notify({
                  title: "Data Sent By Mail",
                  message:
                    "Records : " +
                    response.data.total +
                    " (" +
                    response.data.took +
                    " ms)",
                  type: "success",
                  position: "bottom-right",
                  duration: 4000
                });
                return;
              } else {
                window.open(response.data.url, "_blank");
                this.$notify({
                  title: this.$t("notifications.data_loaded"),
                  message:
                    this.$t("notifications.records") +
                    ": " +
                    response.data.total +
                    " (" +
                    response.data.took +
                    " ms)",
                  type: "success",
                  position: "bottom-right",
                  duration: 1500
                });
                return;
              }
            }
            for (let i in response.data.records) {
              response.data.records[i].original = JSON.parse(
                JSON.stringify(response.data.records[i])
              );
            }
            this.tableData = response.data.records;

            var dates = [];
            if (response.data.aggs != null && response.data.aggs["2"] != null) {
              var aggs = response.data.aggs["2"]["buckets"];
              for (let i in aggs) {
                dates.push([aggs[i].key, aggs[i].doc_count]);
              }

              this.series = [
                {
                  name: "Documents",
                  data: dates
                }
              ];
            } else {
              this.series = [
                {
                  name: "Documents",
                  data: []
                }
              ];
            }

            this.$notify({
              title: this.$t("notifications.data_loaded"), //"Data loaded",
              message:
                this.$t("notifications.records") +
                ": " +
                response.data.total +
                " (" +
                response.data.took +
                " ms)",
              type: "success",
              position: "bottom-right",
              duration: 1500
            });

            if (this.config.config.headercolumns) {
              // console.log(this.config.config)

              for (var col in this.config.config.headercolumns) {
                var curcol = this.config.config.headercolumns[col];

                var fieldtouse = curcol.field;
                if (
                  curcol.field != "_id" &&
                  curcol.field != "_index" &&
                  curcol.field.indexOf("_source") != 0
                ) {
                  fieldtouse = "_source." + curcol.field;
                  curcol.field = fieldtouse;
                }

                if (curcol.type == "date" || curcol.type == "timestamp") {
                  for (var data in response.data.records) {
                    var record = response.data.records[data];
                    var format = "YYYY-MM-DD HH:mm:ss";
                    if (curcol.format != undefined) {
                      format = curcol.format;
                    }

                    var curtime =
                      record["_source"][curcol.field.replace("_source.", "")];

                    var curtime = _.get(
                      record["_source"],
                      curcol.field.replace("_source.", "")
                    );

                    if (curtime != undefined) {
                      record["_source"][
                        curcol.field.replace("_source.", "")
                      ] = moment(curtime).format(format);
                    }
                  }
                }
              }
            }

            this.tableData = response.data.records;
          }
        })
        .catch(error => {
          console.error(error);
          this.$notify({
            title: "Error",
            message: "Query Failed",
            type: "error",
            position: "bottom-right"
          });
        });
    

    },
    graphClicked() {
      var newvalue =
        this.$refs.generic.chart.series.w.globals.minX +
        "-" +
        this.$refs.generic.chart.series.w.globals.maxX;
      if (newvalue != this.previousValue) {
        console.log("MOUSE =============");
        console.log(Date(this.$refs.generic.chart.series.w.globals.maxX));
        console.log(Date(this.$refs.generic.chart.series.w.globals.minX));
        setTimeout(this.updateTimeRange, 1000);
      }
      this.previousValue = newvalue;
    },
    updateTimeRange() {
      const start = new Date();
      start.setTime(this.$refs.generic.chart.series.w.globals.minX);
      this.$globalbus.$emit("charttimerangeupdated", [
        this.$refs.generic.chart.series.w.globals.minX,
        this.$refs.generic.chart.series.w.globals.maxX
      ]);
    },

    queryBarChanged: function(q) {
      console.log('********************************queryBarChanged')
      this.queryField = q;
      this.refreshData();
    },
    queryFilterChanged: function(q) {
      console.log('********************************queryFilterChanged')
      this.queryfilter = q;
      this.refreshData();
    },
    downloadAsked: function(format) {
      this.loadData(true, format);
    }
  },
  created: function() {
    console.log("===============  CREATED:");

    if(!this.config.queryFilterChecked && !this.config.queryBarChecked)
      this.loadData();

    console.log("===============  REGISTERING: timerangechanged");
    this.$globalbus.$on("timerangechanged", payLoad => {
      console.log("GLOBALBUS/GENERICTABLE/TIMERANGECHANGED");
      console.log(this.config.timeSelectorType);
      console.log(payLoad.subtype);
      if (this.config.timeSelectorType == undefined)
        this.config.timeSelectorType = "classic";
      if (payLoad.subtype == this.config.timeSelectorType) this.loadData();
      else console.log("Ignoring time change.");
    });
  },
  beforeDestroy: function() {
    console.log("===============  UNREGISTERING: timerangechanged");
    this.$globalbus.$off("timerangechanged");
  }
};
</script>

<style>
.small {
  height: 200px;
}
.input-label {
  display: inline-block;
  width: 130px;
  margin-top: 3px;
  margin-right: 5px;
}
</style>
