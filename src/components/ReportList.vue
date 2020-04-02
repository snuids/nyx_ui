<template>
  <div>
    <!--DIALOG REPORT EDITOR -->
    <ReportEditor
      :record="curReport"
      :id="curReportId"
      :index="curReportIndex"
      :title="titleEditor"
      :isAdd="isAdd"
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
      <el-table-column :label="$t('report.report')" prop="_id" sortable>
        <template slot-scope="scope">
          <div style="font-weight:bolder">{{computeTranslatedText(scope.row._source.title,$store.getters.creds.user.language)}}</div>
          <span>{{computeTranslatedText(scope.row._source.description,$store.getters.creds.user.language)}}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('report.output')" width="180">
        <template slot-scope="scope">
          <span v-for="item in scope.row._source.output" :key="item">
            &nbsp;
            <el-tag size="mini" type="info">{{item}}</el-tag>
          </span>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('generic.privileges')"
        v-if="$store.getters.creds.hasPrivilege('reporteditor')"
        width="120"
      >
        <template slot-scope="scope">
          <el-popover
            v-if="(scope.row._source.privileges?true:false) && (scope.row._source.privileges.length>0)"
            placement="left-start"
            :title="$t('generic.privileges')"
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
        :label="$t('generic.parameters')"
        v-if="$store.getters.creds.hasPrivilege('reporteditor')"
        width="120"
      >
        <template slot-scope="scope">
          <el-popover
            v-if="(scope.row._source.parameters?true:false) && (scope.row._source.parameters.length>0)"
            placement="left-start"
            :title="$t('generic.parameters')"
            width="300"
            trigger="hover"
            size="mini"
          >
            <span :key="item.name" v-for="item in scope.row._source.parameters">
              &nbsp;
              <el-tag size="mini">{{item.title}}/{{item.type}}</el-tag>
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
              :content="$t('generic.add')"
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
          <el-input v-model="search" size="mini" :placeholder="$t('generic.type_to_search')" class="searchfield" />
        </template>
        <template slot-scope="scope">
          <el-tooltip class="item" effect="dark" :content="$t('generic.generate')" placement="bottom-start">
            <el-button
              size="mini"
              icon="el-icon-caret-right"
              @click="askParameters(scope.$index, scope.row)"
              plain
            ></el-button>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" :content="$t('generic.edit')" placement="bottom">
            <el-button
              v-if="$store.getters.creds.hasPrivilege('reporteditor')"
              size="mini"
              icon="el-icon-setting"
              @click="editReport(scope.$index, scope.row)"
              plain
            ></el-button>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" :content="$t('generic.delete')" placement="bottom-end">
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
import {computeTranslatedText} from '../globalfunctions'

export default {
  name: "ReportList",
  data: () => ({
    isAdd:false,
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
    computeTranslatedText: function(inText,inLocale){
      
      return computeTranslatedText(inText,inLocale);
    },
    handleCurrentChange(val) {
      this.currentRow = val;
    },
    closeEditor() {
      this.reportGeneratorVisible = false;
      this.recordUpdated();
    },
    editReport(index, row) {
      this.isAdd=false;
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
      this.isAdd=true;
      this.curReportId = Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substr(0, 5);
      this.curReportIndex = "nyx_reportdef";

      this.titleEditor = "New Report";

      this.curReport = {
        title: "New Report",
        exec: "./reports/pythondef/myreport.py",
        jasper: "./reports/jasper/myjasper.jrxml",
        notebook:"mynotebook",
        icon: "regular/clipboard",
        parameters: [],
        privileges: [],
        
        output : [
            "docx"
        ],
        parameters : [
          {
            "name" : "param1",
            "title" : "param1",
            "type" : "text",
            "value" : "TEST PARAM"
          },
          {
            "name" : "param2",
            "title" : "param2",
            "type" : "interval",
            "value" : "now-30d:now"
          }
        ],

        reportType:"notebook_doc"
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
            //console.log(response.data.records);
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

