<template>
  <div>
    <!--DIALOG REPORT EDITOR -->
    <ReportEditor
      :record="curReport"
      :id="curReportId"
      :index="curReportIndex"
      :title="titleEditor"
      v-if="reportEditorVisible"
      v-on:dialogclose="reportEditorVisible=false; recordUpdated()"
    ></ReportEditor>

    <!--DIALOG REPORT GENERATOR -->
    <ReportGenerator
      :record="curReport"
      v-if="reportGeneratorVisible"
      v-on:dialogclose="closeEditor()"
    ></ReportGenerator>

    <!--:default-sort="{prop: '_id', order: 'descending'}"-->
    <el-table
      size="mini"
      :data="tableData.filter(data => !search || ((JSON.stringify(data._source).toLowerCase().includes(search.toLowerCase())))            
      )"
      style="width: 100%"
      highlight-current-row
      @current-change="handleCurrentChange"
    >
      <el-table-column width="40">
        <template slot-scope="scope">
          <div style="text-align:center;">
            <v-icon :name="scope.row._source.icon" scale="1.5" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Report" prop="_id" sortable>
        <template slot-scope="scope">
          <div style="font-weight:bolder">{{scope.row._source.title}}</div>
          <span>{{scope.row._source.description}}</span>
        </template>
      </el-table-column>
      <el-table-column label="Output" width="180">
        <template slot-scope="scope">
          <span v-for="item in scope.row._source.output" :key="item">
            &nbsp;
            <el-tag size="mini" type="info">{{item}}</el-tag>
          </span>
        </template>
      </el-table-column>

      <el-table-column
        label="Privileges"
        v-if="$store.getters.creds.hasPrivilege('reporteditor')"
        width="120"
      >
        <template slot-scope="scope">
          <el-popover
            v-if="(scope.row._source.privileges?true:false) && (scope.row._source.privileges.length>0)"
            placement="left-start"
            title="Privileges"
            width="200"
            trigger="hover"
            size="mini"
          >
            <span :key="item" v-for="item in scope.row._source.privileges">
              &nbsp;
              <el-tag size="mini">{{item}}</el-tag>
            </span>

            <el-button size="mini" slot="reference">{{scope.row._source.privileges.length}}</el-button>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column
        label="Parameters"
        v-if="$store.getters.creds.hasPrivilege('reporteditor')"
        width="120"
      >
        <template slot-scope="scope">
          <el-popover
            v-if="(scope.row._source.parameters?true:false) && (scope.row._source.parameters.length>0)"
            placement="left-start"
            title="Parameters"
            width="300"
            trigger="hover"
            size="mini"
          >
            <span :key="item.name" v-for="item in scope.row._source.parameters">
              &nbsp;
              <el-tag size="mini">{{item.value}}</el-tag>
            </span>
            <el-button size="mini" slot="reference">{{scope.row._source.parameters.length}}</el-button>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column align="right" width="300">
        <!-- Removed from line below: slot-scope="scope"-->
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
            <el-tooltip
              v-if="$store.getters.creds.hasPrivilege('reporteditor')"
              class="item"
              effect="light"
              content="Add"
              placement="bottom"
            >
              <el-button
                circle
                size="mini"
                @click="addReport()"
                class="addbutton"
                type="primary"
                plain
                icon="el-icon-plus"
              ></el-button>
            </el-tooltip>
          </div>
          <el-input v-model="search" size="mini" placeholder="Type to search" class="searchfield" />
        </template>
        <template slot-scope="scope">
          <el-tooltip class="item" effect="dark" content="Generate" placement="bottom-start">
            <el-button
              size="mini"
              icon="el-icon-caret-right"
              @click="askParameters(scope.$index, scope.row)"
              plain
            ></el-button>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" content="Edit" placement="bottom">
            <el-button
              v-if="$store.getters.creds.hasPrivilege('reporteditor')"
              size="mini"
              icon="el-icon-setting"
              @click="editReport(scope.$index, scope.row)"
              plain
            ></el-button>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" content="Delete" placement="bottom-end">
            <el-button
              v-if="$store.getters.creds.hasPrivilege('reporteditor')"
              size="mini"
              type="danger"
              icon="el-icon-delete"
              @click="askDeleteReport(scope.$index, scope.row)"
              plain
            ></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import axios from "axios";
import reporteditor from "@/components/ReportEditor";
import reportgenerator from "@/components/ReportGenerator";
import Vue from "vue";
Vue.component("ReportEditor", reporteditor);
Vue.component("ReportGenerator", reportgenerator);

export default {
  name: "ReportList",
  data: () => ({
    tableData: [],
    search: "",
    dialogFormVisible: false,
    dialogEditorVisible: false,
    reportGeneratorVisible: false,
    reportEditorVisible: false,
    formLabelWidth: "120px",
    curReport: {},
    titleEditor: "",
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
    editReport(index, row) {
      this.curReport = JSON.parse(JSON.stringify(row._source));
      this.curReportId = row._id;
      this.curReportIndex = row._index;
      this.titleEditor = "Edit Report";

      if (this.curReport.parameters === undefined)
        this.curReport.parameters = [];

      if (this.curReport.privileges === undefined)
        this.curReport.privileges = [];

      this.reportEditorVisible = true;
    },
    duplicate() {
      this.curReportId = "id_" + Math.floor((1 + Math.random()) * 0x1000000);
      this.curReportIndex = "nyx_reportdef";

      this.titleEditor = "New Report";

      this.curReport = JSON.parse(JSON.stringify(this.currentRow._source));

      this.reportEditorVisible = true;
    },
    addReport() {
      this.curReportId = Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substr(0, 5);
      this.curReportIndex = "nyx_reportdef";

      this.titleEditor = "New Report";

      this.curReport = {
        title: "",
        exec: "",
        icon: "file",
        parameters: [],
        privileges: [],
        output: []
      };

      this.reportEditorVisible = true;
    },
    askDeleteReport(index, row) {
      this.$confirm(
        "This will permanently delete the report. Continue?",
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
    askParameters(index, row) {
      this.curReport = JSON.parse(JSON.stringify(row._source));
      this.reportGeneratorVisible = true;
    },
    recordUpdated() {
      setTimeout(() => {
        this.loadData();
      }, 1000);
    },
    loadData() {
      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_reportdef?token=" +
        this.$store.getters.creds.token;

      axios
        .post(url, { sort: [{ "title.keyword": { order: "asc" } }], size: 500 })
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
    this.$store.getters.creds.hasPrivilege("toto");
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

