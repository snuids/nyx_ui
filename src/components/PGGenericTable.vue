<template>
  <div>
    <!-- <div v-loading="!ready"> -->
    <span v-if="dialogFormVisible">
      <component
        v-if="config.config.editorComponent!=null"
        v-bind:is="config.config.editorComponent"
        :editMode="editMode"
        :record="currentRecord"
        :config="config"
        v-on:dialogcloseupdated="recordUpdated()"
        v-on:dialogclose="dialogFormVisible=false"
      ></component>
      <PGGenericTableDetails
        v-else
        :record="currentRecord"
        :tableSchema="tableSchema"
        :config="config"
        :editMode="editMode"
        v-on:dialogcloseupdated="recordUpdated()"
        v-on:dialogclose="dialogFormVisible=false"
      ></PGGenericTableDetails>
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
              <div v-else-if="header.type=='boolean'">
                <el-switch
                  v-model="scope.row._source[header.field.replace('_source.', '')]"
                  :disabled="header.disabled"
                  @change="switchChanged(scope.row, header)"
                ></el-switch>
              </div>
              <div v-else>                
                {{computeRec(scope.row,header.field)}}
                <!-- {{header}} -->
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Actions" align="right">
            <!-- Removed from line below: slot-scope="scope" -->
            <template slot="header" slot-scope="scope">
              <div>
                <el-tooltip
                  v-if="config.config.index && config.config.index.length>0 && currentRow"
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
                  v-if="config.config.index && config.config.index.length>0"
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
            <template slot-scope="scope" v-if="config.config.index && config.config.index.length>0">
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
import pggenerictabledetails from "@/components/PGGenericTableDetails";
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
Vue.component("PGGenericTableDetails", pggenerictabledetails);

export default {
  name: "PGGenericTable",
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
    tableSchema: [],
    previousValue: "",
    currentRow: null,
    colnames:[],
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
        this.loadData();
      },
      deep: true
    }
    // queryField: function() {
    //   console.log("Query changed.....");
    //   this.queryChanged();
    // }
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
      // console.log("duplicating record");
      // console.log(this.currentRecord);
      // this.currentRecord = JSON.parse(JSON.stringify(this.currentRow));
      // this.currentRecord.original._id =
      //   "id_" + Math.floor((1 + Math.random()) * 0x1000000);
      // this.dialogFormVisible = true;
      // this.editMode = "duplicate";

      
      this.currentRecord = JSON.parse(JSON.stringify(this.currentRow));
      this.dialogFormVisible = true;
      console.log("=============++>")
      console.log(this.currentRecord )
      this.editMode = "duplicate";
    },
    addRecord: function() {
      this.currentRecord = {};
      this.dialogFormVisible = true;
      this.editMode = "add";
      
    },
    partialUpdateRecord: function(newRec, header) {
      // var headerName = header.field.replace("_source.", "");
      // var newObj = newRec.original;

      // // for (var i in newObj._source) {
      // //   if (i == headerName) {
      // //     newObj._source[i] = newRec._source[i];
      // //   }
      // // }

      // newObj._source[headerName] = newRec._source[headerName];

      // this.$store.commit({
      //   type: "updateRecord",
      //   data: newObj
      // });
      // this.$notify({
      //   title: "Record updated.",
      //   type: "success",
      //   message: "Record updated.",
      //   position: "bottom-right",
      //   duration: 1000
      // });
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
      if (aRec && aRec.length > 40) aRec = aRec.substring(0, 50) + "...";
      return aRec;
    },
    computeRec: function(row, field) {
      // var rec = row;
      // if (field.indexOf("_source") == 0) {
      //   rec = row["_source"];
      //   var res = "";
      //   if (field.indexOf("@") == -1)
      //     res = _.get(rec, field.replace("_source.", ""));
      //   else res = rec[field.replace("_source.", "")];
      //   if (res == undefined) return "";
      //   else return this.cutRec("" + res);
      // }
      // if (field.indexOf("@") == -1) return this.cutRec(_.get(rec, field));
      // else res = rec[field];
      return row[field];
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
      console.log(row)      
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
            type: "deletePGRecord",
            data: {"row":row,"config":this.config}
          });
          setTimeout(() => {
            this.loadData();
          }, 1000);
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
      console.log("=>=>=>+>=>=>=>=> Load DATA");
      if (download == undefined) download = false;
      console.log("LOAD DATA...Download=" + download);

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
        default:
          rangetouse = this.$store.getters.timeRange;
          this.autotime = this.$store.getters.autoTime;
          break;
      }

      var url =
        this.$store.getters.apiurl +
        "pg_search/" +
        this.config.rec_id +
        "?token=" +
        this.$store.getters.creds.token +
        "&download=" +
        (download ? 1 : 0)+
        "&output=" +
        exportformat +
        doc_type;

      var query = {
        size: download ? 10000 : 200
      };

      if (
        this.config.config.timefield != null &&
        this.config.config.timefield != ""
      ) {
        console.log(this.config.timeSelectorType);
        console.log(rangetouse);

        if (rangetouse != null) {
          var timeRange = rangetouse;

          var range = {
            gte: timeRange[0].getTime(),
            lte: timeRange[1].getTime(),
            format: "epoch_millis"
          };
          query["range"]=range;

          
        } 
      }
      if (this.config.queryBarChecked && this.queryField != "") {
        query["query"] = this.queryField;
      }            
      
      console.log("JSON.stringify(query)");
      console.log(JSON.stringify(query));
      
      axios
        .post(url, query)
        .then(response => {
          console.log(
            "LOAD DATA RES...Download=" + download + " =>" + exportformat
          );

          this.ready = true;

          if (response.data.error != "") {
            this.$notify({
              title: "Error",
              message: response.data.error,
              type: "error",
              position: "bottom-right"
            });
          } else {
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
                return;
              }
            }
            this.tableData=[];


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
              for (var col in this.config.config.headercolumns) {
                var curcol = this.config.config.headercolumns[col];

                if (curcol.type == "date" || curcol.type == "timestamp") {
                  for (var data in response.data.records) {
                    var record = response.data.records[data];
                    var format = "YYYY-MM-DD HH:mm:ss";
                    if (curcol.format != undefined) {
                      format = curcol.format;
                    }

                    var curtime =
                      record[curcol.field];
                    if (curcol.type == "timestamp") {
                      if (curtime != undefined) {
                        curtime = parseInt(curtime);
                      }
                    }
                    if (curtime != undefined) {
                      record[
                        curcol.field
                      ] = moment(curtime).format(format);
                    }
                  }
                }
              }
            }

            this.tableData = response.data.records;
            this.tableSchema=response.data.colnames;
            var dates = [];
            if (response.data.aggs!=null && response.data.aggs["2"] != null) {
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
            }
            this.autotime=response.data.aggtime;
          }
        })
        .catch(error => {
          console.log(error);
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

        //this.$globalbus.$emit("charttimerangeupdated",[this.$refs.generic.chart.series.w.globals.minX,this.$refs.generic.chart.series.w.globals.maxX])
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
      this.queryField = q;
      this.refreshData();
    },
    queryFilterChanged: function(q) {
      this.queryfilter = q;
      this.refreshData();
    },
    downloadAsked: function(format) {
      this.loadData(true, format);
    }
  },
  created: function() {
    console.log("===============  CREATED:");
    this.loadData();
  },
  mounted: function() {
    if (this.config.graphicChecked) {
      //      this.$refs.generic.chart.addEventListener("click", this.graphClicked);
    }

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

    // console.log("===============  REGISTERING: querychanged");
    // this.$globalbus.$on("querychanged", payLoad => {
    //   console.log("GLOBALBUS/GENERICTABLE/QUERYCHANGED --> "+payLoad);

    //   if (this.config.queryBarChecked) {
    //     this.queryField = payLoad;

    //     // check if the active app is the current app (when multiple tabs)
    //     if(this.$store.getters.activeApp.title == this.config.title) {
    //       this.ready = false;
    //       this.refreshData();
    //     }
    //   }
    // });

    // console.log("===============  REGISTERING: queryfilterchanged");
    // this.$globalbus.$on("queryfilterchanged", payLoad => {
    //   console.log("GLOBALBUS/GENERICTABLE/QUERYCHANGED --> "+payLoad);

    //   if (this.config.queryFilterChecked) {
    //       this.queryfilter = payLoad;

    //     // check if the active app is the current app (when multiple tabs)
    //     if(this.$store.getters.activeApp.title == this.config.title) {
    //       this.ready = false;
    //       this.loadData();

    //     }
    //   }
    // });

    // console.log("===============  REGISTERING: downloadasked");
    // this.$globalbus.$on("downloadasked", payLoad => {
    //   if(this.$store.getters.activeApp.title == this.config.title) {
    //     console.log("GLOBALBUS/GENERICTABLE/DOWNLOADASKED format -->"+payLoad);
    //     console.log('going to launch DL')
    //     this.loadData(true, payLoad);

    //   }
    // });
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