

<template>

  <div>
    <!-- <h1>File System</h1>
        v-on:dialogcloseupdated="recordUpdated()"
    <h1>{{multipleSelection}}</h1> -->
    <span v-if="dialogFileEditor">
      <component
        v-if="editorComponent!=null && editorComponent!=''"
        v-bind:is="editorComponent"
        :editMode="'edit'"
        :file="selectedFile"
        :fileName="selectedFileName"
        :config="config"
        v-on:dialogsave="pushFile"
        v-on:dialogclose="dialogFileEditor=false"
      ></component>
    </span>

    <el-card class="file-system-card" :body-style="{ padding: '0px' }" shadow="never" :style="'height:'+ containerHeight" :key="config.rec_id">
      <div slot="header" class="clearfix">
    <!-- <h1>{{config}}</h1> -->
    <!-- <p>{{tableData.length}}/{{numberOfItems}}/{{allData.length}}</p> -->
        <el-row style="height:28px;" flex>
          <el-col :span="16">            
            <el-breadcrumb  separator-class="el-icon-arrow-right" style="font-size:18px; margin-top: 8px;">
              <el-breadcrumb-item class="noselect" :to="{ path: rootRouterPath }">{{config.config.foldername}}</el-breadcrumb-item>
              <el-breadcrumb-item
                class="noselect"
                v-for="item in breadcrumbArr"
                :key="item.path"
                :to="{  query: { path: item.path } }"
              >
              <span v-if="item.name.length>15">{{item.name.substring(0,15)}}...</span>
              <span v-else>{{item.name}}</span>
              
              </el-breadcrumb-item>
            </el-breadcrumb>
          </el-col>
          <el-col :span="8" style="align:right;">
            <el-row style="margin-bottom:0px !important; text-align:right;">
              <el-tooltip class="item" effect="dark" content="Download" placement="bottom" v-if="multipleSelection.length>0" >
                <el-button size="small" style="font-weight:bold;" @click="downloadBtnClick()" circle plain icon="el-icon-download"></el-button>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" content="Refresh" placement="bottom">
                <el-button size="small" style="font-weight:bold;" @click="listDir(refresh=true)"  plain circle icon="el-icon-refresh"></el-button>
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

        style="width: 100%;overflow-y: auto/scroll;" 
        empty-text="This folder is empty">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="Name" sortable>
          <template slot-scope="scope" style="font-weight:bold;">
            <span class="icon-items">
              <v-icon v-if="scope.row.type=='dir'" name="regular/folder" scale="1.3" />
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
        <el-table-column label="Last modified" sortable prop="modification_time" width="150">
          <template slot-scope="scope"><span class="noselect" >{{scope.row.modification_time | formatTS}}</span> </template>
        </el-table-column>
        <el-table-column prop="size" sortable label="File size" width="150">
          <template slot-scope="scope"><span  class="noselect" v-if="scope.row.type=='file'">{{scope.row.size | prettyBytes}}</span></template>
        </el-table-column>

         <infinite-loading
         :identifier="infiniteId"
          slot="append"
          @infinite="loadMore"
          spinner="spiral"
          force-use-infinite-wrapper=".el-table__body-wrapper">
            <div slot="no-more"></div>

        </infinite-loading>
        
      </el-table>
      
    </el-card>
  </div>
</template>


<script>

import axios from "axios";

const req = require.context("../components/fileEditor/", true, /\.vue$/);

const dynamicComponents = {};
req.keys().forEach(filename => {
  const name = `${filename.split(".")[1].split("/")[1]}`;
  const component = req(filename).default;
  dynamicComponents[name] = component;
});

console.log(dynamicComponents)

export default {
  name: "FileSystem",
  components: {
    ...dynamicComponents
  },
  data: () => ({
    sortProperty:{prop: 'extension', order: 'descending'},
    curPath: "",
    rootRouterPath: null,
    numberOfItems:0,
    allData: [],
    tableData: [],
    breadcrumbArr: [],
    multipleSelection: [],
    scrollSize: 30,
    infiniteId: +new Date(),
    pagination:0,
    selectedFile: null,
    selectedFileName: null,
    dialogFileEditor:false,
    editorComponent:null,
  }),
  props: {
    config: {
      type: Object
    }
  },
  watch: {
    $route(to, from) {
      if(from.path===to.path && to.params.recid === this.config.rec_id) {
        console.log('Navigation into the same file system '+this.config.rec_id)
        console.log(from)
        console.log(to)
        if (this.$route.query.path != undefined)
          this.curPath = this.$route.query.path;
        else
          this.curPath = ""


        this.generateBreadcrumbObj();

        this.listDir();
        this.rootRouterPath = this.$route.path;
      }

    }
  },
  computed: {
    containerHeight: function() {
      var headerheight = 0;
      if (this.$store.getters.currentSubCategory.apps.length > 1) {
        headerheight += 50;
      }
      return (
        this.$store.getters.containerSize.height - 104 - headerheight + "px"
      );
    },
    tableHeight: function() {
      var headerheight = 0;
      if (this.$store.getters.currentSubCategory.apps.length > 1) {
        headerheight += 50;
      }
      return (
        this.$store.getters.containerSize.height - 157 - headerheight + "px"
      );
    }
  },
  methods: {
    loadMore($state) {
      console.log('load asked')
      setTimeout(()=>{
        if(this.numberOfItems == 0) {
          $state.complete()
        }
        else if(this.allData == 0) {
          $state.loaded()
          $state.complete()
        }
        else {
          this.pagination += 1;
          this.tableData=this.tableData.concat(this.allData.splice(0, this.scrollSize))
          $state.loaded()
        }
      }, 50)
    },
    downloadBtnClick() {
      let files = this.multipleSelection.map(a => a.name)
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
        this.$router.push({ query: { path: this.curPath } });

      } else if (row.type == "file") {
        this.selectedFileName = row.name

        if(this.config.config.editors != null) {
          for (const editorConf of this.config.config.editors) {
            let extension = ('.'+editorConf.extension).replace('..','.')
            if(row.name.indexOf(extension)>0) {
              console.log('open the file with this editor : '+editorConf.editorName)
              this.editorComponent = editorConf.editorName
              this.downloadFiles([row.name], true)
              return
            }
          }
        }

        console.log("download file");
        console.log(row)
        this.downloadFiles([row.name], false)
      }
    },
    pushFile:function(fileObj) {
      
      let tmp_file = fileObj.data

      let base64file = btoa(fileObj.data)
      fileObj.data = base64file
      
      var url =
        this.$store.getters.apiurl +
        "files?token=" +
        this.$store.getters.creds.token;

      url += '&rec_id='+this.config.rec_id
      url += '&path='+this.curPath
      
      var query = {
        files: [fileObj]
      };

      axios
        .post(url, query)
        .then(response => {
          if(response.status == 200 && response.data.error == '') {
            console.log('file saved')
            this.selectedFile = tmp_file  
            this.$notify({
              title: "File saved",
              type: "success",
              duration: 1000,
              position: "bottom-right"
            });
          }
          else {
            console.log(response);
            this.$notify({
              title: "Error",
              message: "Failed to save file",
              type: "error",
              position: "bottom-right"
            });
          }
          

        })
        .catch(error => {
          console.log(error);
          this.$notify({
            title: "Error",
            message: "Failed to save file",
            type: "error",
            position: "bottom-right"
          });
        });
    },
    downloadFiles: function(files, specificEditor=null) {
      var url =
        this.$store.getters.apiurl +
        "files?token=" +
        this.$store.getters.creds.token;

      url += '&rec_id='+this.config.rec_id
      url += '&path='+this.curPath
      url += '&files='+files.join(',')
      url += '&rand='+Math.random(100000)

      console.log('downloadFiles')
      console.log(url)
      

      axios
        .get(url, {responseType: 'blob'})
        .then(response => {
          console.log(response);

          if(specificEditor) {
            
            this.selectedFile = null;
            this.dialogFileEditor = true;
            
            let reader = new FileReader();

            reader.addEventListener('loadend', (e) => {
              const text = e.srcElement.result;
              // console.log(text);
              this.selectedFile = text
            }, false);


            reader.readAsText(new Blob([response.data], {type: "text/plain"}))
          }
          else {
            let file_name = 'download.zip'
            if((files.length == 1) && (response.headers['content-type'] != "zipfile"))
              file_name = files
  
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', file_name) //or any other extension
            document.body.appendChild(link)
  
            console.log(link)
  
            link.click()
          }

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
    listDir: function(refresh=false) {
      let url =
        this.$store.getters.apiurl +
        "listdir?token=" +
        this.$store.getters.creds.token;

      let query = {
        rec_id: this.config.rec_id,
        path: this.curPath
      };

      axios
        .post(url, query)
        .then(response => {
          console.log(response);
          if (response.data.error == "") {
            this.tableData = []

            this.allData = response.data.data.sort((a, b) => (a.extension > b.extension) ? 1 : -1)
            this.numberOfItems = response.data.data.length
            // this.tableData = this.allData.slice(0, this.scrollSize);
            this.tableData=this.tableData.concat(this.allData.splice(0, this.scrollSize))
            this.infiniteId += 1;

            if(refresh) {

              this.$notify({
                title: "Refresh",
                duration: 500,
                // message: response.data.error,
                type: "success",
                position: "bottom-right"
              });
            }
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
      let path = this.curPath.split("/");

      let tmp = "";
      let arr = [];

      for (var i = 0; i < path.length; i++) {
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
    console.log('FILE SYSTEM '+this.config.rec_id+ ' MOUNTED')

    if (this.$route.query.path != undefined)
      this.curPath = this.$route.query.path;
    else
      this.curPath = ""

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

.file-system-card td {
  font-weight: bold;
}
</style>

