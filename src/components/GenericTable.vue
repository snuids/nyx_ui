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

    <!-- A `div`, not an `el-row`: in Element Plus `el-row` is a flex container, so the bar it
         holds shrank to the width of its content (337 px instead of 890 on the Docker screen)
         instead of taking the full width as it did with Element UI 2. -->
    <div v-if="config.queryBarChecked">
      <QueryBar @querychanged="queryBarChanged" @downloadasked="downloadAsked" :config="config"></QueryBar>
    </div>

    <div v-if="config.queryFilterChecked">
      <QueryFilter
        @queryfilterchanged="queryFilterChanged"
        @downloadasked="downloadAsked"
        :config="config"
        v-on:queryfilter_changed="queryfilterchanged"
      ></QueryFilter>
    </div>
    <el-row v-if="config.mapChecked">
      <el-col style="padding-right:6px;">
        <Map :config="config" :tableData="mapTableData" v-on:mapclicked="mapClicked"></Map>
      </el-col>
    </el-row>
    <el-row v-if="config.graphicChecked">
      <el-col>
        <BarChart :autotime="autotime" :config="config" :series="series"></BarChart>
      </el-col>
    </el-row>
    <el-row  v-if="rows>=100">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        v-model:current-page="currentPage"
        :page-sizes="[100, 200, 300, 400, 500]"
        :page-size="pagesize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="rows">
      </el-pagination>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-table
          size="small"
          :data="tableData"
          style="width: 100%"
          highlight-current-row
          @current-change="handleCurrentRecordChange"
          v-loading="!ready"
          ref="genericTable"
          fit
          @sort-change="sortChanged"
        >
          <el-table-column
            v-for="header in config.config.headercolumns"
            :key="header.field"
            :label="computeTranslatedText(header.title,$store.getters.creds.user.language)"
            :prop="header.field"
            :width="header.format=='icon'?'100px':''"
            sortable
            show-overflow-tooltip
            
          >
            <!-- show-overflow-tooltip -->
            <template #default="scope">
              <span v-if="header.type=='select'">
                <el-select
                  @change="selectChanged(scope.row, header)"
                  size="small"
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
              </span>
              <span
                v-else-if="(header.type=='long' || header.type=='double') && header.format != null && header.format.length > 0"
              >{{ $numeral(computeRec(scope.row,header.field), header.format) }}</span>
              <span v-else-if="header.type=='boolean'">
                <el-switch
                  v-model="scope.row._source[header.field.replace('_source.', '')]"
                  :disabled="header.disabled"
                  @change="switchChanged(scope.row, header)"
                ></el-switch>
              </span>
              <span v-else-if="header.format=='icon'" class="icon-cell">
                <v-icon
                  v-if="computeIcon(scope.row,header.field)!=''"
                  :color="computeIconColor(scope.row,header.field)"
                  :name="computeIcon(scope.row,header.field)"
                  scale="1.5"
                />
              </span>
              <span v-else-if="header.format=='link'" class="link-cell">                
                <el-button 
                  v-if="scope && computeRec(scope.row,header.field)" 
                  size="small"
                  :icon="buttonIcon(header.linkbuttonicon)"
                  :circle="header.linkbuttoncircle" 
                  :round="header.linkbuttonround" 
                  :plain="header.linkbuttonplain" 
                  :type="header.linkbuttontype"
                  @click="openLink(scope.row,header.field)"
                >{{header.linktext}}</el-button>
              </span>
              <span v-else>{{computeRec(scope.row,header.field)}}</span>
            </template>
          </el-table-column>
          <el-table-column label="Actions" align="right" width="150px;">
            <template #header>
              <div>
                <el-tooltip
                  v-if="config.config.index.indexOf('*')==-1 && currentRow && $store.getters.creds.hasPrivilege(config.config.writeprivileges)"
                  class="item"
                  effect="light"
                  :content="$t('generic.duplicate')"
                  placement="bottom-end"
                  :open-delay="1000"
                >
                  <el-button
                    circle
                    size="small"
                    @click="duplicateRecord()"
                    type="primary"
                    :icon="$icons.CopyDocument"
                  ></el-button>
                </el-tooltip>
                <el-tooltip
                  v-if="config.config.index.indexOf('*')==-1 && $store.getters.creds.hasPrivilege(config.config.writeprivileges)"
                  class="item"
                  effect="light"
                  :content="$t('generic.add')"
                  placement="bottom"
                  :open-delay="1000"
                >
                  <el-button
                    circle
                    size="small"
                    @click="addRecord()"
                    type="primary"
                    :icon="$icons.Plus"
                  ></el-button>
                </el-tooltip>
                <el-tooltip
                  v-if="!config.queryBarChecked && !config.queryFilterChecked"
                  class="item"
                  effect="light"
                  content="Refresh"
                  placement="bottom-start"
                  :open-delay="1000"
                >
                  <el-button
                    circle
                    size="small"
                    @click="refreshData()"
                    class="regreshbutton"
                    plain
                    :icon="$icons.Refresh"
                  ></el-button>
                </el-tooltip>
              </div>
            </template>
            <template #default="scope">
              <el-button
                size="small"
                plain
                :icon="$icons.Setting"
                @click="handleView(scope.$index, scope.row)"
              ></el-button>
              <el-button
                v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
                size="small"
                type="danger"
                :icon="$icons.Delete"
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
import { iconComponent } from "@/utils/icons";
import { registerComponent } from '@/utils/vue3shim'
import axios from "axios";
import moment from "moment";
import Vue from "vue";
import generictabledetails from "@/components/GenericTableDetails";
import map from "@/components/Map";
import barchart from "@/components/BarChart";
import querybar from "@/components/QueryBar";
import queryfilter from "@/components/QueryFilter";
import _ from "lodash";
import { computeTranslatedText } from "../globalfunctions";
import { buildSearchQuery, genericSearchUrl, resolveTimeRange } from "@/utils/esQuery";

const req = require.context("../components/tableEditor/", true, /\.vue$/);

//console.log("A=========================> DYNAMIC COMPONENTS");
const dynamicComponents = {};
req.keys().forEach(filename => {
  const name = `${filename.split(".")[1].split("/")[1]}`;
  const component = req(filename).default;
  dynamicComponents[name] = component;
  //console.log(component);
});
//console.log("B=========================> DYNAMIC COMPONENTS");

registerComponent("Map", map);
registerComponent("BarChart", barchart);
registerComponent("QueryBar", querybar);
registerComponent("GenericTableDetails", generictabledetails);
registerComponent("QueryFilter", queryfilter);


export default {
  name: "GenericTable",
  components: {
    ...dynamicComponents
  },
  data: () => ({
    rows:0,
    dontrefreshMap:false,
    currentPage:1,
    pagesize:100,   
    sort:{}, 
    ready: false,
    loadOnEdit: true,
    autotime: "1d",
    query: "",
    queryField: "",
    queryfilter: "",
    currentRecord: { original: {} },
    tableData: [],
    mapTableData: [],
    previousValue: "",
    currentRow: null,
    dialogFormVisible: false,
    autoRefresh: null,
    autoRefreshTime: null,
    editMode: null,
    refAutoRefresh: null,
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
      },
      deep: true
    }
  },
  methods: {
    // Saved configurations carry an Element UI 2 icon name ("el-icon-download"): Element Plus
    // expects a component, so it is translated here.
    buttonIcon: function(name) {
      return iconComponent(name, this.$icons)
    },
    sortChanged:function(e){
      //alert(JSON.stringify(e.column));
      
      this.sort={}
      if(e.column.order != null)
        this.sort[e.column.property.replace("_source.","")]={"order":e.column.order.substring(0,4).replace("asce","asc")};
      this.dontrefreshMap=true;
      this.refreshData();
    },
    handleSizeChange: function(e) {
      //console.log("Size changed.....");
      this.pagesize=e;
      this.currentPage=1; 
      this.dontrefreshMap=true;
      this.refreshData();
    },
    handleCurrentChange: function() {
      //console.log("Current changed....."); 
      this.dontrefreshMap=true;
      this.refreshData();     
    },
    computeTranslatedText: function(inText, inLocale) {
      return computeTranslatedText(inText, inLocale);
    },
    handleCommand: function(e) {
      //console.log("Command changed.....");
      this.loadData(true, e);
    },
    handleCurrentRecordChange(val) {
      this.currentRow = val;
    },
    duplicateRecord: function() {
      //console.log("duplicating record");
      //console.log(this.currentRecord);
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
        title: this.$t("rep.record_updated"),
        type: "success",
        message: this.$t("rep.record_updated"),
        position: "bottom-right",
        duration: 1000
      });
    },
    selectChanged: function(newRec, header) {
      this.partialUpdateRecord(newRec, header);
    },
    switchChanged: function(newRec, header) {
      //console.log(newRec);
      //console.log(header);
      this.partialUpdateRecord(newRec, header);
    },
    cutRec(aRec) {
      if (aRec == undefined) return "";
      //if (aRec.length > 40) aRec = aRec.substring(0, 50) + "...";
      return aRec;
    },
    openLink: function(row, field) {
      let rec = row;
      if (field.indexOf("_source") == 0) {
        rec = row["_source"];
        var res = "";
        if (field.indexOf("@") == -1)
          res = _.get(rec, field.replace("_source.", ""));
        else res = rec[field.replace("_source.", "")];
        if (res == undefined) return "";
        else 
          window.open(this.cutRec("" + res), "_blank");
      }
      
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
    computeIcon: function(row, field) {
      var rec = row;
      if (field.indexOf("_source") == 0) {
        rec = row["_source"];
        var res = "";
        if (field.indexOf("@") == -1)
          res = _.get(rec, field.replace("_source.", ""));
        else res = rec[field.replace("_source.", "")];

        if (res == undefined) return "";
        else return this.cutRec("" + res).split(">")[0];
      }
      if (field.indexOf("@") == -1)
        return this.cutRec(_.get(rec, field)).split(">")[0];
      else res = rec[field].split(">")[0];

      return res;
    },
    computeIconColor: function(row, field) {
      var rec = row;
      if (field.indexOf("_source") == 0) {
        rec = row["_source"];
        var res = "";
        if (field.indexOf("@") == -1)
          res = _.get(rec, field.replace("_source.", ""));
        else res = rec[field.replace("_source.", "")];
        if (res == undefined) return "grey";
        else if (field.indexOf(">") == -1)
          return this.cutRec("" + res).split(">")[1];
      }

      return "grey";
    },
    recordUpdated: function() {
      this.dialogFormVisible = false;
      setTimeout(() => {
        this.loadData();
      }, 1000);
    },
    mapClicked: function(row) {
      // this.currentRecord = row.source;
      // this.dialogFormVisible = true;
      // this.editMode = "edit";
      
      this.handleView(0, row.source);
    },
    queryfilterchanged: function(query) {
      this.queryfilter = query;
      this.loadData();
    },
    queryChanged: _.debounce(function() {
      //console.log("DEBOUNCED:" + this.queryField);
      this.ready = false;
      this.loadData();
    }, 1500),
    async getRecordFromRow(row) {
      try {
        var url =
          this.$store.getters.apiurl +
          "generic/" +
          row._index +
          "/" +
          row._id +
          "?token=" +
          this.$store.getters.creds.token +
          "&doc_type=" +
          row._type;

        const response = await axios.get(url);

        if (
          response.status == 200 &&
          response.data != null &&
          response.data.error != null &&
          response.data.error == ""
        ) {
          console.log('get record from db')
          let updatedRecord = JSON.parse(JSON.stringify(response.data.data));
          updatedRecord.original = JSON.parse(
            JSON.stringify(response.data.data)
          );

          return updatedRecord;
        } else {
          console.warn(
            "fail to retrieve the document, returning the row"
          );
          return row;
        }
      } catch (e) {
        console.error(e);
        return row;
      }
    },
    handleView(index, row) {
      this.currentRecord = {}; // required by the detail watcher
      this.editMode = "edit";

      if (this.loadOnEdit) {
        this.getRecordFromRow(row)
          .then(response => {
            this.currentRecord = response;
            this.dialogFormVisible = true;
          })
          .catch(error => {
            console.log(error);
          });
      } else {
        this.currentRecord = row;
        this.dialogFormVisible = true;
      }
    },
    handleDelete(index, row) {
      this.$confirm(
        this.$t("generic.delete_record"),
        this.$t("generic.warning"),
        {
          confirmButtonText: this.$t("generic.ok"),
          cancelButtonText: this.$t("generic.cancel"),
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
            message: this.$t("rep.delete_completed"),
            position: "bottom-right"
          });
        })
        .catch(() => {
          this.$notify({
            title: "Cancelled",
            type: "info",
            message: this.$t("rep.delete_canceled"),
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

      // The query lives in `utils/esQuery.js`: this component only keeps the call and the response.
      const payload = this.config.config || {};

      const { range, interval } = resolveTimeRange(this.config.timeSelectorType, {
        classic: this.$store.getters.timeRange,
        day: this.$store.getters.timeRangeDay,
        week: this.$store.getters.timeRangeWeek,
        month: this.$store.getters.timeRangeMonth,
        year: this.$store.getters.timeRangeYear,
        autoClassic: this.$store.getters.autoTime,
        autoDay: this.$store.getters.autoTimeDay,
        autoWeek: this.$store.getters.autoTimeWeek,
        autoMonth: this.$store.getters.autoTimeMonth,
        autoYear: this.$store.getters.autoTimeYear,
      });
      this.autotime = interval;

      const url = genericSearchUrl({
        apiurl: this.$store.getters.apiurl,
        index: payload.index,
        token: this.$store.getters.creds.token,
        download,
        exportformat,
        docType: payload.doc_type,
      });

      const built = buildSearchQuery({
        config: this.config,
        pagesize: this.pagesize,
        download,
        currentPage: this.currentPage,
        timeRange: range,
        interval,
        queryField: this.queryField,
        queryfilter: this.queryfilter,
        sort: this.sort,
        user: this.$store.getters.creds.user || {},
      });
      const query = built.query;
      this.query = built.queryText;

      axios
        .post(url, query)
        .then(response => {
          this.ready = true;

          //console.log(response);

          if (
            response.data.records != null ||
            (download && response.status == 200)
          ) {
            if (download) {
              if (response.data.type == "mail") {
                this.$notify({
                  title: this.$t("ui.data_sent_mail"),
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

            this.rows=response.data.total;

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
            this.$refs.genericTable.doLayout()
          }
          this.setAutoRefresh()
        })
        .catch(error => {
          console.error(error);
          this.$notify({
            title: "Error",
            message: this.$t("ui.query_failed"),
            type: "error",
            position: "bottom-right"
          });
          if(this.refAutoRefresh != null)
            clearInterval(this.refAutoRefresh)
        });

      if (this.config.mapChecked && !this.dontrefreshMap)
      {
        // `query2` was an implicit global (it worked because the `var` of the query builder hoisted
        // it): declared here, it belongs to the function.
        const query2 = JSON.parse(JSON.stringify(query));
        query2.size=1000;
        // Both map fields (lat / lon) must be requested explicitly: a query that only brings back
        // `mapfield` leaves the map empty when the index has no geo_point.
        var mapCfg = this.config.config;
        query2._source=[];
        if (mapCfg.maplatfield && mapCfg.maplonfield) {
          query2._source=[mapCfg.maplatfield, mapCfg.maplonfield];
        } else if (mapCfg.mapfield) {
          query2._source=[mapCfg.mapfield];
        }

        if (this.config.config.functionfields!=null && this.config.config.functionfields!='')
        {
          var fields=this.config.config.functionfields.split(',');
          for (var field in fields)
          {
            query2._source.push(fields[field]);
          }
        }

        if (query2._source.length == 0) {
          // No map field configured: Elasticsearch is left to return the whole document.
          delete query2._source;
        }


        axios
          .post(url, query2)
          .then(response => {
            this.mapTableData = response.data.records;
          });            
            
      }
      this.dontrefreshMap=false;
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
        this.currentPage=1;   
        setTimeout(this.updateTimeRange, 1000);
      }
      this.previousValue = newvalue;
    },
    updateTimeRange() {
      const start = new Date();
      start.setTime(this.$refs.generic.chart.series.w.globals.minX);
      this.currentPage=1;      

      this.$globalbus.$emit("charttimerangeupdated", [
        this.$refs.generic.chart.series.w.globals.minX,
        this.$refs.generic.chart.series.w.globals.maxX
      ]);
    },

    queryBarChanged: function(q) {
      console.log("********************************queryBarChanged");
      this.queryField = q;
      this.currentPage=1;
      this.refreshData();
    },
    queryFilterChanged: function(q) {
      console.log("********************************queryFilterChanged");
      this.queryfilter = q;
      this.currentPage=1;
      this.refreshData();
    },
    downloadAsked: function(format) {
      this.loadData(true, format);
    },
    setAutoRefresh: function() {
      if(this.config.autoRefreshTime == null)
        return

      if(this.refAutoRefresh != null)
        clearInterval(this.refAutoRefresh)

      this.refAutoRefresh =  setInterval(() => {
        this.refreshData()
      }, this.config.autoRefreshTime)

    },
   
  },
  mounted: function() {
    console.log("===============  MOUNTED:");
    
    if (!this.config.queryFilterChecked && !this.config.queryBarChecked)
      this.loadData();

    console.log("===============  REGISTERING: timerangechanged");
    this.$globalbus.$on("timerangechanged", payLoad => {
      console.log("GLOBALBUS/GENERICTABLE/TIMERANGECHANGED");
      console.log(this.config.timeSelectorType);
      this.currentPage=1;
      console.log(payLoad.subtype);
      if (this.config.timeSelectorType == undefined)
        this.config.timeSelectorType = "classic";
      if (payLoad.subtype == this.config.timeSelectorType) this.loadData();
      else console.log("Ignoring time change.");
    });
  },
  beforeUnmount: function() {
    console.log("===============  UNREGISTERING: timerangechanged");
    this.$globalbus.$off("timerangechanged");


    if(this.refAutoRefresh != null)
      clearInterval(this.refAutoRefresh)
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

.icon-cell {
  height: 24px;
  text-align: center;
  max-width: 40px;
}
</style>