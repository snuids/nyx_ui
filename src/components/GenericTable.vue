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
        :current-page.sync="currentPage"
        :page-sizes="[100, 200, 300, 400, 500]"
        :page-size="pagesize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="rows">
      </el-pagination>
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
            <template slot-scope="scope">
              <span v-if="header.type=='select'">
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
              </span>
              <span
                v-else-if="(header.type=='long' || header.type=='double') && header.format != null && header.format.length > 0"
              >{{computeRec(scope.row,header.field) | numeral(header.format)}}</span>
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
                  size="mini"
                  :icon="header.linkbuttonicon"
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
            <template slot="header" slot-scope="scope">
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
                  :content="$t('generic.add')"
                  placement="bottom"
                  :open-delay="1000"
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
                  :open-delay="1000"
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
import queryfilter from "@/components/QueryFilter";
import _ from "lodash";
import { computeTranslatedText } from "../globalfunctions";

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

Vue.component("Map", map);
Vue.component("BarChart", barchart);
Vue.component("QueryBar", querybar);
Vue.component("GenericTableDetails", generictabledetails);
Vue.component("QueryFilter", queryfilter);


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
    handleCurrentChange: function(e) {
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
        size: download ? 10000 : this.pagesize,
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
      //alert(this.config.config.hiddenQuery);
      if (
        this.config.config.hiddenQuery != undefined &&
        this.config.config.hiddenQuery != ""
      ) {
        if(this.config.config.hiddenQuery.includes("{{id}}")){
          this.config.config.hiddenQuery = this.config.config.hiddenQuery.replace(/{{id}}/g, this.$store.getters.creds.user.id)
        }
        if(this.config.config.hiddenQuery.includes("{{login}}")){
          this.config.config.hiddenQuery = this.config.config.hiddenQuery.replace(/{{login}}/g, this.$store.getters.creds.user.login)
        }
        //console.log("this.config.config.hiddenQuery")        
        //console.log(this.config.config.hiddenQuery)        
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
        this.config.config.orderField != "" &&
        Object.keys(this.sort).length==0
      ) {
        query.sort = [];
        var order = {};
        var direction = "asc";
        if (this.config.config.orderDirection) direction = "desc";

        order[this.config.config.orderField] = { order: direction };
        query.sort.push(order);
      }

      if(Object.keys(this.sort).length!=0)
      {
        query.sort = [];
        query.sort.push(this.sort);
      }

      if (
        this.config.config.exportColumns != undefined &&
        this.config.config.exportColumns != ""
      ) {
        query.extra = { exportColumns: this.config.config.exportColumns };
      }
      
      if(query.extra == undefined)
        query.extra={"currentpage":this.currentPage,
            "pagesize":this.pagesize}
      else
      {
        query.extra.currentpage=this.currentPage;
        query.extra.pagesize=this.pagesize;
      }


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
            message: "Query Failed",
            type: "error",
            position: "bottom-right"
          });
          if(this.refAutoRefresh != null)
            clearInterval(this.refAutoRefresh)
        });

      if (this.config.mapChecked && !this.dontrefreshMap)
      {
        query2=JSON.parse(JSON.stringify(query));
        query2.size=1000;
        query2._source=[this.config.config.mapfield];

        if (this.config.config.functionfields!=null && this.config.config.functionfields!='')
        {
          var fields=this.config.config.functionfields.split(',');
          for (var field in fields)
          {
            query2._source.push(fields[field]);
          }
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
  beforeDestroy: function() {
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