<template>
  <div>
    <!--DIALOG REPORT EDITOR -->
    <ReportPeriodicEditor
      :record="curScheduler"
      v-if="reportEditorVisible"
      v-on:dialogclose="reportEditorVisible=false; recordUpdated()"
    ></ReportPeriodicEditor>

    <el-table
      size="mini"
      :data="tableData.filter(data => !search || ((JSON.stringify(data._source).toLowerCase().includes(search.toLowerCase())))
      )"
      :default-sort="{prop: '_source.title', order: 'ascending'}"
      style="width: 100%"
      highlight-current-row
      @current-change="handleCurrentChange"
    >
      <el-table-column width="80">
        <template slot-scope="scope">
          <div style="text-align:center; margin-top:3px;">
            <v-icon :name="scope.row._source.icon" v-if="scope.row._source.icon" scale="1.5" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Report" prop="_source.title" sortable width="300">
        <template slot-scope="scope">
          <div style="font-weight:bolder">{{scope.row._source.title}}</div>
        </template>
      </el-table-column>
      <el-table-column label="Next Run" prop="_source.nextRun" sortable>
        <template slot-scope="scope">
          <div>{{scope.row._source.nextRun | formatDate}}</div>
        </template>
      </el-table-column>
      <el-table-column label="Type">
        <template slot-scope="scope">
          <div>{{scope.row._source.trigger.type}}</div>
        </template>
      </el-table-column>

      <el-table-column label="Days">
        <template slot-scope="scope">
          <span
            v-if="scope.row._source.trigger.type=='daily'"
            v-for="item in scope.row._source.trigger.days"
            :key="item"
          >
            &nbsp;
            <el-tag size="mini" type="info">{{(item+1)}}</el-tag>
          </span>
          <span
            v-if="scope.row._source.trigger.type=='monthly'"
            v-for="item in scope.row._source.trigger.days"
            :key="item"
          >
            &nbsp;
            <el-tag size="mini" type="info">{{(item)}}</el-tag>
          </span>
        </template>
      </el-table-column>

      <el-table-column label="Time">
        <template slot-scope="scope">
          <div>{{scope.row._source.trigger.time}}</div>
        </template>
      </el-table-column>

      <el-table-column align="right" width="220">
        <!-- Removed from line below: slot-scope="scope" -->
        <template slot="header" slot-scope="scope">
          <div>
            <el-tooltip
              v-if="currentRow"
              class="item"
              effect="light"
              content="Duplicate"
              placement="bottom-end"
            >
              <el-button
                circle
                size="mini"
                @click="duplicate()"
                class="dupbutton"
                type="primary"
                plain
                icon="el-icon-copy-document"
              ></el-button>
            </el-tooltip>
          </div>
          <el-input v-model="search" size="mini" placeholder="Type to search" class="searchfield" />
        </template>
        <template slot-scope="scope">
          <el-tooltip class="item" effect="dark" content="Edit" placement="bottom">
            <el-button
              v-if="$store.getters.creds.hasPrivilege('reporteditor')"
              size="mini"
              icon="el-icon-edit"
              @click="editScheduler(scope.$index, scope.row)"
              circle
            ></el-button>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" content="Delete" placement="bottom-end">
            <el-button
              v-if="$store.getters.creds.hasPrivilege('reporteditor')"
              size="mini"
              type="danger"
              icon="el-icon-delete"
              @click="askDeleteScheduler(scope.$index, scope.row)"
              circle
            ></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <el-button
      v-if="$store.getters.creds.hasPrivilege('reporteditor')"
      style="position:fixed; bottom:30px; right:50%; margin-right:-73px; z-index:100"
      type="primary"
      icon="el-icon-plus"
      @click="addScheduler()"
      round
    >New Scheduler</el-button>
  </div>
</template>

<script>
import axios from "axios";
import reportperiodiceditor from "@/components/ReportPeriodicEditor";
import Vue from "vue";
import moment from "moment";

Vue.component("ReportPeriodicEditor", reportperiodiceditor);

export default {
  name: "ReportPeriodic",
  data: () => ({
    tableData: [],
    search: "",
    formLabelWidth: "120px",
    curScheduler: {},
    titleEditor: "",
    reportEditorVisible: false,
    currentRow: null
  }),
  props: {
    config: {
      type: Object
    }
  },
  methods: {
    handleCurrentChange(val) {
      this.currentRow = val;
    },
    closeEditor() {
      this.reportGeneratorVisible = false;
      this.recordUpdated();
    },
    editScheduler(index, row) {
      this.curScheduler = JSON.parse(JSON.stringify(row));
      //this.curReportId = row._id
      //this.curReportIndex = row._index
      //this.titleEditor = "Edit Report"

      //if(this.curReport.parameters===undefined)
      //  this.curReport.parameters=[]

      //if(this.curReport.privileges===undefined)
      //  this.curReport.privileges=[]

      this.reportEditorVisible = true;
    },

    duplicate() {
      this.curScheduler = JSON.parse(JSON.stringify(this.currentRow));
      this.curScheduler._id =
        "id_" + Math.floor((1 + Math.random()) * 0x1000000);
      this.curScheduler._source.nextRun = moment().format();
      this.reportEditorVisible = true;
    },

    addScheduler() {
      this.curScheduler = {
        _id: Math.random()
          .toString(36)
          .replace(/[^a-z]+/g, "")
          .substr(0, 5),
        _index: "nyx_reportperiodic",
        _source: {
          title: "New Periodic Task",
          report: null,
          icon: "clock",
          nextRun: moment().format(),
          trigger: {
            type: "monthly",
            config: [0, 4],
            time: "00:30"
          }
        }
      };

      this.reportEditorVisible = true;
    },
    askDeleteScheduler(index, row) {
      this.$confirm(
        "This will permanently delete the scheduler. Continue?",
        "Warning",
        {
          confirmButtonText: "OK",
          cancelButtonText: "Cancel",
          type: "Danger"
        }
      )
        .then(() => {
          this.$store.commit({
            type: "deleteRecord",
            data: row
          });
          setTimeout(() => {
            this.loadData();
          }, 1000);
          this.$notify({
            title: "Delete completed",
            type: "success",
            position: "bottom-right"
          });
        })
        .catch(() => {
          /*
        this.$message({
          type: 'info',
          message: 'Delete canceled'
        });
        */
        });
    },
    recordUpdated() {
      setTimeout(() => {
        this.loadData();
      }, 1000);
    },
    loadData() {
      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_reportperiodic?token=" +
        this.$store.getters.creds.token;

      axios
        .post(url, { size: 1000 })
        .then(response => {
          if (response.data.error != "") console.log("Report list error...");
          else {
            console.log(response.data.records);
            console.log(this);
            this.tableData = response.data.records;
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
  },
  created: function() {
    this.loadData();
  },

  mounted: function() {},
  beforeDestroy: function() {}
};
</script>

<style>
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

