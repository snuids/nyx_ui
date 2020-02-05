<template>

  <!-- <div> -->
    <!-- <h1>File System</h1>
    <h1>{{config.rec_id}}</h1>
    <h1>{{multipleSelection}}</h1> -->

    <el-card class="file-system-card" :body-style="{ padding: '0px' }" shadow="never" :style="'height:'+ containerHeight">
      <div slot="header" class="clearfix">
        <el-row style="height:28px;" flex>
          <el-col :span="16">            
            <el-breadcrumb  separator-class="el-icon-arrow-right" style="font-size:18px; margin-top: 8px;">
              <el-breadcrumb-item :to="{ path: rootRouterPath }">{{config.config.foldername}}</el-breadcrumb-item>
              <el-breadcrumb-item
                v-for="item in breadcrumbArr"
                :key="item.path"
                :to="{  query: { path: item.path } }"
              >{{item.name}}</el-breadcrumb-item>
            </el-breadcrumb>
          </el-col>
          <el-col :span="8" style="align:right;">
            <el-row style="margin-bottom:0px !important; text-align:right;">
              <el-tooltip class="item" effect="dark" content="Download" placement="bottom" v-if="multipleSelection.length>0" >
                <el-button size="small" style="font-weight:bold;" @click="downloadBtnClick()" circle plain type="info" icon="el-icon-download"></el-button>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" content="Refresh" placement="bottom">
                <el-button size="small" style="font-weight:bold;" @click="listDir()" circle plain type="info" icon="el-icon-refresh"></el-button>
              </el-tooltip>
            </el-row>
          </el-col>
        </el-row>
      </div>

      <el-table :default-sort="sortProperty"
        ref="filesTable"
        :data="tableData" 
        size="mini"
         
        @row-dblclick="rowDoubleClick" 
        @row-click="rowClick" 
        @selection-change="handleSelectionChange"
        :height="tableHeight"

        style="width: 100%;" 
        empty-text="This folder is empty">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="Name" sortable>
          <template slot-scope="scope" style="font-weight:bold;">
            <span class="icon-items">
              <v-icon v-if="scope.row.type=='dir'" name="folder" scale="1.3" />
              <v-icon v-else-if="scope.row.type=='file' && ['png', 'jpg'].indexOf(scope.row.extension.toLowerCase())>-1" name="regular/image" scale="1.3" />
              <v-icon style="color:#EA4335" v-else-if="scope.row.type=='file' && ['pdf'].indexOf(scope.row.extension.toLowerCase())>-1" name="file-pdf" scale="1.3" />
              <v-icon style="color:#4B87E4" v-else-if="scope.row.type=='file' && ['doc', 'docx'].indexOf(scope.row.extension.toLowerCase())>-1" name="file-word" scale="1.3" />
              <v-icon style="color:#0F9D58" v-else-if="scope.row.type=='file' && ['xlsx', 'xls', 'xlsm', 'xltx', 'xltm'].indexOf(scope.row.extension.toLowerCase())>-1" name="file-excel" scale="1.3" />
              <v-icon style="color:#0F9D58" v-else-if="scope.row.type=='file' && ['csv'].indexOf(scope.row.extension.toLowerCase())>-1" name="file-csv" scale="1.3" />
              <v-icon style="color:#F4B400" v-else-if="scope.row.type=='file' && ['ppt', 'pptx'].indexOf(scope.row.extension.toLowerCase())>-1" name="regular/file-powerpoint" scale="1.3" />
              <v-icon v-else-if="scope.row.type=='file' && ['rtf', 'txt'].indexOf(scope.row.extension.toLowerCase())>-1" name="regular/file-alt" scale="1.3" />
              <v-icon v-else name="regular/file" scale="1.3" />
            </span>
            <span  class="noselect">{{scope.row.name}}</span>
          </template>
        </el-table-column>
        <el-table-column label="Last modified" sortable prop="modification_time">
          <template slot-scope="scope"><span class="noselect" >{{scope.row.modification_time | formatTS}}</span> </template>
        </el-table-column>
        <el-table-column prop="size" sortable label="File size">
          <template slot-scope="scope"><span  class="noselect" v-if="scope.row.type=='file'">{{scope.row.size | prettyBytes}}</span></template>
        </el-table-column>
      </el-table>
    </el-card>
  <!-- </div> -->
</template>

<script>
import axios from "axios";

export default {
  name: "FreeText",
  data: () => ({
    sortProperty:{prop: 'extension', order: 'descending'},
    curPath: "",
    rootRouterPath: null,
    tableData: null,
    breadcrumbArr: [],
    multipleSelection: [],
  }),
  props: {
    config: {
      type: Object
    }
  },
  computed: {
    containerHeight: function() {
      var headerheight = 0;
      if (this.$store.getters.currentApps.apps.length > 1) {
        headerheight += 50;
      }
      return (
        this.$store.getters.containerSize.height - 104 - headerheight + "px"
      );
    },
    tableHeight: function() {
      var headerheight = 0;
      if (this.$store.getters.currentApps.apps.length > 1) {
        headerheight += 50;
      }
      return (
        this.$store.getters.containerSize.height - 157 - headerheight + "px"
      );
    }
  },
  methods: {
    downloadBtnClick() {
      let files = this.multipleSelection.map(a => a.name).join(',');
      this.downloadFiles(files)
    },
    toggleSelection(rows) {
      console.log(rows)
      if (rows) {
        rows.forEach(row => {
          this.$refs.filesTable.toggleRowSelection(row);
        });
      } else {
        this.$refs.filesTable.clearSelection();
      }
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    rowClick(row, column, event) {
      console.log(row)
      console.log(this.$refs.filesTable)
      console.log(event)

      if(this.$refs.filesTable.selection.includes(row)) 
        this.$refs.filesTable.toggleRowSelection(row, false)
      else {
        if(!event.shiftKey)
          this.$refs.filesTable.clearSelection();

        this.$refs.filesTable.toggleRowSelection(row, true)
      }

    },
    rowDoubleClick: function(row, column, event) {
      if (row.type == "dir") {
        console.log("explore dir");
        this.curPath += "/" + row.name;

        // this.$router.replace({ query: { path: this.curPath } })

        this.$router.push({ query: { path: this.curPath } });
      } else if (row.type == "file") {
        console.log("download file");
        console.log(row)
        this.downloadFiles(row.name)
      }
    },
    downloadFiles: function(files) {
      var url =
        this.$store.getters.apiurl +
        "downloadfiles?token=" +
        this.$store.getters.creds.token;

      var query = {
        rec_id: this.config.rec_id,
        path: this.curPath,
        files: files
      };

      axios
        .post(url, query, {responseType: 'arraybuffer'})
        .then(response => {
          console.log(response);

          var file_name = 'download.zip'
          if((files.split(',').length == 1) && (response.headers['content-type'] != "zipfile"))
            file_name = files

          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', file_name) //or any other extension
          document.body.appendChild(link)
          link.click()
        })
        .catch(error => {
          console.log(error);
          this.$notify({
            title: "Error",
            message: "Failed to download file(s)",
            type: "error",
            position: "bottom-right"
          });
        });
    },
    listDir: function() {
      var url =
        this.$store.getters.apiurl +
        "listdir?token=" +
        this.$store.getters.creds.token;

      var query = {
        rec_id: this.config.rec_id,
        path: this.curPath
      };

      axios
        .post(url, query)
        .then(response => {
          console.log(response);
          if (response.data.error == "") {
            this.tableData = response.data.data.sort((a, b) => (a.extension > b.extension) ? 1 : -1);
          }
        })
        .catch(error => {
          console.log(error);
          this.$notify({
            title: "Error",
            message: "Failed to list directory",
            type: "error",
            position: "bottom-right"
          });
        });
    },
    generateBreadcrumbObj: function() {
      var path = this.curPath.split("/");

      var tmp = "";
      var arr = [];

      for (var i = 0; i < path.length; i++) {
        console.log(path[i]);

        if (path[i] != "") {
          tmp += "/" + path[i];

          arr.push({
            name: path[i],
            path: tmp
          });
        }
      }

      this.breadcrumbArr = arr;
    }
  },
  created: function() {},
  mounted: function() {
    console.log(this.$route.query.path);

    if (this.$route.query.path != undefined)
      this.curPath = this.$route.query.path;

    this.generateBreadcrumbObj();

    this.listDir();
    this.rootRouterPath = this.$route.path;
  },
  beforeDestroy: function() {}
};
</script>

<style>
.noselect {
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Opera and Firefox */
}

.file-system-card {
  min-width: 1000px;
  margin-right: 10px;
  margin-top: 10px;
}
.file-system-card .el-breadcrumb__item {
  height:20px !important;
  line-height:20px !important;
}
.file-system-card .el-breadcrumb__item:last-child {
  padding-top: 1px;
}
.file-system-card .el-breadcrumb__item:last-child .el-breadcrumb__inner { 
  color:black;
}


.file-system-card .el-breadcrumb__inner {
  font-weight: bold !important;
  padding: 4px;
}

.file-system-card .el-breadcrumb__inner:hover {
  border-radius: 7px;
  background-color: #F4F4F4;
  color: #409EFF !important;
  cursor: pointer !important;
}

.file-system-card table tr td,th{
  padding:5px 0px !important;
}

.file-system-card table tr th .cell{
  color:grey !important;
}

.file-system-card table .icon-items {
  min-width:25px; 
  display:inline-block; 
  font-size:20px; 
  margin-right:10px;
}
.file-system-card table .icon-items svg{
  vertical-align:bottom;
}

.file-system-card .el-card__header {
  padding: 10px 10px;
}
</style>

