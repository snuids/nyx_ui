<template>
  <!--MAIN DIALOG -->
  <div>
    <el-dialog
      title="Logs Viewer"
      :visible.sync="LogViewerVisible"
      :before-close="closeDialog"
      width="80%"
    >
      <!-- fullscreen -->
      <!-- <div style="max-height:100%;"> -->

      <el-collapse>
        <el-collapse-item :title="'Details on run '+selectedReportInfos.id" name="1">
          <el-table
            :data="tableInfo"
            class="table-details-report-run"
            border
            :show-header="false"
          >
            <!-- style="width: 330px" -->
            <el-table-column prop="attr" label="Attr" width="130"></el-table-column>
            <el-table-column prop="value" label="Value" width="200"></el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>

      <LogViewer :logObj="logObj"></LogViewer>
    </el-dialog>

    <el-table
      size="mini"
      :data="tableData.filter(data => !search || data._source.creds.user.id.toLowerCase().includes(search.toLowerCase()) ||   data._source.report.title.toLowerCase().includes(search.toLowerCase() ))"
      :default-sort="{prop: '_source.treatment.creation', order: 'descending'}"
      style="width: 100%"
      height="1000"
      highlight-current-row
    >
      <el-table-column width="60">
        <template slot-scope="scope">
          <v-icon :name="scope.row._source.report.icon" scale="2" />
        </template>
      </el-table-column>

      <el-table-column width="60" label="Status">
        <template slot-scope="scope">
          <v-icon
            name="spinner"
            spin
            scale="2"
            v-if="scope.row._source.treatment.status == 'Waiting'"
          />
          <v-icon
            style="color:#409EFF"
            name="check-circle"
            scale="2"
            v-if="scope.row._source.treatment.status == 'Finished'"
          />
          <el-tooltip
            class="item"
            effect="dark"
            :content="scope.row._source.treatment.error"
            placement="bottom"
          >
            <v-icon
              style="color:#F56C6C"
              name="exclamation-triangle"
              scale="2"
              v-if="scope.row._source.treatment.status == 'Error'"
            />
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column sortable prop="_source.treatment.creation" label="Creation">
        <template slot-scope="scope">
          <div>{{scope.row._source.treatment.creation | formatDate}}</div>
          <span
            v-if="scope.row._source.treatment.duration"
          >Duration {{scope.row._source.treatment.duration | numeral('0.[0]')}} s</span>
        </template>
      </el-table-column>

      <el-table-column label="Report" prop="_source.report.title" sortable>
        <template slot-scope="scope">
          <div style="font-weight:bolder">{{scope.row._source.report.title}}</div>
        </template>
      </el-table-column>
      <el-table-column label="User" prop="_source.creds.user.id" sortable>
        <template slot-scope="scope">
          <div style="font-weight:bolder">{{scope.row._source.creds.user.id}}</div>
        </template>
      </el-table-column>
      <el-table-column label="Parameters" prop="_source.report.parameters.length">
        <template slot-scope="scope">
          <el-popover
            v-if="scope.row._source.report.parameters?true:false"
            placement="left-start"
            title="Parameters"
            width="400"
            trigger="hover"
          >
            <div
              v-for="item in scope.row._source.report.parameters"
              :key="scope.row._source.id+item.title+item.name"
            >
              &nbsp;
              <el-tag size="mini">{{item.title}}:{{item.value}}</el-tag>
            </div>
            <el-button size="mini" slot="reference">{{scope.row._source.report.parameters.length}}</el-button>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column align="right">
        <template slot-scope="scope">
          <el-tooltip
            class="item"
            effect="dark"
            content="Logs"
            placement="bottom"
            v-if="scope.row._source.report.reportType=='notebook' || scope.row._source.report.reportType=='notebook_doc'"
          >
            <el-button
              v-if="$store.getters.creds.hasPrivilege('reporteditor')"
              size="mini"
              icon="el-icon-document"
              @click="openLogs(scope.$index, scope.row)"
              plain
            ></el-button>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" content="Regenerate" placement="bottom">
            <el-button
              v-if="$store.getters.creds.hasPrivilege('reporteditor')"
              size="mini"
              icon="el-icon-refresh-right"
              @click="regenerateReport(scope.$index, scope.row)"
              plain
            ></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="_source.downloads.length" align="right">
        <!-- Removed from line below: slot-scope="scope" -->
        <template slot="header" slot-scope="scope">
          <el-input v-model="search" size="mini" placeholder="Type to search" class="searchfield" />
        </template>
        <template slot-scope="scope">
          <el-button
            size="mini"
            plain
            :type="getButtonType(item.extension)"
            v-for="item in scope.row._source.downloads"
            :key="item.url"
            @click="downloadFile(item)"
          >{{item.extension}}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import axios from "axios";
import Vue from "vue";
import moment from "moment";
import logviewer from "@/components/LogViewer";

Vue.component("LogViewer", logviewer);

export default {
  name: "ReportTask",
  data: () => ({
    tableData: [],
    search: "",
    dialogFormVisible: false,
    LogViewerVisible: false,
    loadingData: false,
    formLabelWidth: "120px",
    curReport: {},
    logObj: {},
    selectedReportInfos: {},
    tableInfo: []
  }),
  props: {
    config: {
      type: Object
    }
  },
  methods: {
    openLogs(index, row) {

      console.log("openLogs");
      this.logObj = null
      this.logObj = {}
      this.logObj.indice = "nyx_reportlog";
      this.logObj.id = row._id;
      this.logObj.search = true;
      this.LogViewerVisible = true;


      this.selectedReportInfos = JSON.parse(JSON.stringify(row._source));
      this.tableInfo = [];
      this.tableInfo.push({
        attr: "RunId",
        value: row._source.id
      });

      this.tableInfo.push({
        attr: "Runtime",
        value: moment(row._source["@timestamp"], moment.ISO_8601).format(
          "DD MMM YYYY - HH:mm:ss"
        )
      });
      this.tableInfo.push({
        attr: "User",
        value: row._source.creds.user.id
      });
      this.tableInfo.push({
        attr: "Status",
        value: row._source.treatment.status
      });
      this.tableInfo.push({
        attr: "Duration",
        value: row._source.treatment.duration.toFixed(2) + "s"
      });
      if (row._source.treatment.error != "") {
        this.tableInfo.push({
          attr: "Error",
          value: row._source.treatment.error
        });
      }

      this.tableInfo.push({
        attr: "Start Treatment",
        value: moment(row._source.treatment.start, moment.ISO_8601).format(
          "HH:mm:ss"
        )
      });
      this.tableInfo.push({
        attr: "End Treatment",
        value: moment(row._source.treatment.end, moment.ISO_8601).format(
          "HH:mm:ss"
        )
      });
    },
    regenerateReport(index, row) {
      console.log("regenerate");
      console.log(index);
      console.log(row._source.report);

      var url =
        this.$store.getters.apiurl +
        "sendmessage?token=" +
        this.$store.getters.creds.token;

      var randomID =
        Math.floor((1 + Math.random()) * 0x1000000) +
        "_" +
        Math.floor((1 + Math.random()) * 0x1000000);

      var message = {
        destination: "/queue/NYX_REPORT_STEP1",
        body: JSON.stringify({
          id: "id_" + randomID,
          creds: this.$store.getters.creds,
          report: row._source.report,
          privileges: this.$store.getters.creds.user.privileges
        })
      };

      axios
        .post(url, message)
        .then(response => {
          if (response.data.error != "") console.log("Report list error...");
          else {
            console.log(this);
            // this.$globalbus.$emit("reportgenerated");
          }

          this.$notify({
            title: "Report asked.",
            type: "success",
            message: "Regeneration of a report asked",
            position: "bottom-right"
          });

          setTimeout(() => {this.loadData()}, 500)
        })
        .catch(error => {
          console.log(error);
        });
    },
    askParameters(index, row) {
      this.curReport = JSON.parse(JSON.stringify(row._source));
      for (var i in this.curReport.parameters) {
        var param = this.curReport.parameters[i];
        if (param.type == "date") {
          param.value = new Date();
        } else if (param.type == "interval") {
          param.value = [new Date(), new Date()];
        }
      }
      this.dialogFormVisible = true;
    },
    getButtonType(extension) {
      if (extension == "pdf") return "danger";
      if (extension == "csv") return "success";
      if (extension == "xls") return "success";
      if (extension == "xlsx") return "success";
      if (extension == "doc") return "primary";
      if (extension == "docx") return "primary";

      return "info";
    },
    downloadFile(item) {
      //alert(item.url);
      // var win =
      window.open(item.url, "_blank");
    },
    loadData : _.throttle(function() {
      if(this.loadingData)
        return

      this.loadingData = true

      var query = {
        _source: ['creds.user.id', 'id', 'report.title', 'report.parameters', 'report.icon', 'treatment.status', 'treatment.creation', 
                  'treatment.error', 'treatment.start', 'treatment.end', 'treatment.duration',
                  'report.reportType', 'downloads', 'report'],
        sort: [{ "treatment.creation": { order: "desc" } }],
        size: 50
      };

      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_reporttask-*?token=" +
        this.$store.getters.creds.token;

      axios
        .post(url, query)
        .then(response => {
          if (response.data.error != "") console.log("Report list error...");
          else {
            console.log(response.data.records);
            for (var i in response.data.records) {
              // console.log(response.data.records[i]._source.report);
              response.data.records[i]._source.report = JSON.parse(
                response.data.records[i]._source.report
              );
            }
            this.tableData = response.data.records;
          }
          this.loadingData = false
        })
        .catch(error => {
          this.loadingData = false
          console.log(error);
        });
    },1500),
    closeDialog: function() {
      this.LogViewerVisible = false;
      this.$emit("dialogclose");
    }
  },
  created: function() {
    this.loadData();
    this.timer = setInterval(this.loadData, 5000);
  },

  mounted: function() {},
  beforeDestroy: function() {
    clearInterval(this.timer);
  }
};
</script>

<style>
.table-details-report-run tr td {
  padding: 0px !important;
}

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 4px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both;
}

.box-card {
  width: 380px;
}
</style>

