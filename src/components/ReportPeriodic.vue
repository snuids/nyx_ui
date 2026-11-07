<template>
  <div>
    <!--DIALOG REPORT EDITOR -->
    <ReportPeriodicEditor
      :record="curScheduler"
      v-if="reportEditorVisible"
      v-on:dialogclose="reportEditorVisible=false; recordUpdated()"
    ></ReportPeriodicEditor>

    <el-table
      size="small"
      :data="tableData.filter(data => !search || ((JSON.stringify(data._source).toLowerCase().includes(search.toLowerCase())))
      )"
      :default-sort="{prop: '_source.title', order: 'ascending'}"
      style="width: 100%"
      highlight-current-row
      @current-change="handleCurrentChange"
    >
      <el-table-column width="80">
        <template #default="scope">
          <div style="text-align:center; margin-top:3px;">
            <v-icon :name="scope.row._source.icon" v-if="scope.row._source.icon" scale="1.5" />
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('report.report')" prop="_source.title" sortable width="300">
        <template #default="scope">
          <div style="font-weight:bolder">{{scope.row._source.title}}</div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('report.next_run')" prop="_source.nextRun" sortable>
        <template #default="scope">
          <div>{{ $filters.formatDate(scope.row._source.nextRun) }}</div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('report.type')">
        <template #default="scope">
          <div>{{scope.row._source.trigger.type}}</div>
        </template>
      </el-table-column>

      <el-table-column :label="$t('report.days')">
        <template #default="scope">
          <template v-if="scope.row._source.trigger.type=='daily'">
            <span v-for="item in scope.row._source.trigger.days" :key="item">
              &nbsp;
              <el-tag size="small" type="info">{{(item+1)}}</el-tag>
            </span>
          </template>
          <template v-else-if="scope.row._source.trigger.type=='monthly'">
            <span v-for="item in scope.row._source.trigger.days" :key="item">
              &nbsp;
              <el-tag size="small" type="info">{{(item)}}</el-tag>
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column :label="$t('report.time')">
        <template #default="scope">
          <div>{{scope.row._source.trigger.time}}</div>
        </template>
      </el-table-column>

      <!-- 260 px : avec une ligne selectionnee, l'en-tete porte deux boutons ronds (28 px) et le
           champ de recherche (150 px, marge de 10) — 228 px de contenu, soit plus que les 196 px
           utiles d'une colonne de 220 : le champ passait sous les boutons. -->
      <el-table-column align="right" width="260">
        <!-- Element UI renders header content via $scopedSlots; keep it scoped -->
        <template #header>
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
                size="small"
                @click="duplicate()"
                class="dupbutton"
                type="primary"
                plain
                :icon="$icons.CopyDocument"
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
                size="small"
                @click="addScheduler()"
                class="addbutton"
                type="primary"
                plain
                :icon="$icons.Plus"
              ></el-button>
            </el-tooltip>            
          </div>
          <el-input v-model="search" size="small" :placeholder="$t('generic.type_to_search')" class="searchfield" />
        </template>
        <template #default="scope">
          <el-tooltip class="item" effect="dark" :content="$t('generic.edit')" placement="bottom">
            <el-button
              v-if="$store.getters.creds.hasPrivilege('reporteditor')"
              size="small"
              :icon="$icons.Edit"
              @click="editScheduler(scope.$index, scope.row)"
              circle
            ></el-button>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" :content="$t('generic.delete')" placement="bottom-end">
            <el-button
              v-if="$store.getters.creds.hasPrivilege('reporteditor')"
              size="small"
              type="danger"
              :icon="$icons.Delete"
              @click="askDeleteScheduler(scope.$index, scope.row)"
              circle
            ></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
   
  </div>
</template>

<script>
import { registerComponent } from '@/utils/vue3shim'
import axios from "axios";
import reportperiodiceditor from "@/components/ReportPeriodicEditor";
import Vue from "vue";
import moment from "moment";

registerComponent("ReportPeriodicEditor", reportperiodiceditor);

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
          title: this.$t("rep.new_periodic"),
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
            title: this.$t("rep.delete_completed"),
            type: "success",
            position: "bottom-right"
          });
        })
        .catch(() => {
          /*
        this.$message({
          type: 'info',
          message: this.$t("rep.delete_canceled")
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
           // console.log(response.data.records);
           // console.log(this);
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
  beforeUnmount: function() {}
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

