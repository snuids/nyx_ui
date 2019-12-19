<template>
  <!--MAIN DIALOG -->
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
            :key="scope.row._source.id+item.title"
          >
            &nbsp;
            <el-tag size="mini">{{item.title}}:{{item.value}}</el-tag>
          </div>
          <el-button size="mini" slot="reference">{{scope.row._source.report.parameters.length}}</el-button>
        </el-popover>
      </template>
    </el-table-column>

    <el-table-column prop="_source.report.downloads.length" align="right">
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
</template>

<script>
import axios from "axios";

export default {
  name: "ReportTask",
  data: () => ({
    tableData: [],
    search: "",
    dialogFormVisible: false,
    formLabelWidth: "120px",
    curReport: {}
  }),
  props: {
    config: {
      type: Object
    }
  },
  methods: {
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
    loadData() {
      var query = {
        sort: [{ "treatment.creation": { order: "desc" } }],
        size: 100
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
            //console.log(response.data.records);
            for (var i in response.data.records) {
              console.log(response.data.records[i]._source.report);
              response.data.records[i]._source.report = JSON.parse(
                response.data.records[i]._source.report
              );
            }
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
    this.timer = setInterval(this.loadData, 5000);
  },

  mounted: function() {},
  beforeDestroy: function() {
    clearInterval(this.timer);
  }
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

