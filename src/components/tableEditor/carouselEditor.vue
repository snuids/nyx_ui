<template>
  <el-dialog 
      width="80%" 
      title="Carousel editor" 
      :visible.sync="dialogFormVisible"
      :before-close="closeDialog"
      :close-on-click-modal="false"
      class="carousel-editor">    

    <el-dialog
        width="30%"
        title="Select a view"
        :visible.sync="dialogAddViewVisible"
        append-to-body>

      <el-select v-model="newView" filterable placeholder="Select" @change="viewSelected()">
          <el-option
            v-for="item in viewListAll"
            :key="item.id"
            :label="item.type + ' - ' + item.description + ' ('+item.duration/1000+'s)'"
            :value="item">
          </el-option>
        </el-select>
    </el-dialog>
    <ViewEditor
        v-if="dialogViewVisible"
        :record="viewToModify"
        :config="config"
        v-on:dialogcloseupdated="viewUpdated()"
        v-on:dialogclose="dialogViewVisible=false;"
    ></ViewEditor>

  

   
       
          <el-input 
            class="carousel-name-input"
            placeholder="carousel name" 
            v-model="newName"
            size="mini">
          </el-input>



          <table class="table-carousel">
            <thead class="thead-carousel">
              <tr>
                <th scope="col">Type</th>
                <th style="text-align:left;" scope="col">Desc.</th>
                <th style="text-align:left;" scope="col">Duration</th>
                <th scope="col">Action</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <draggable v-bind="dragOptions" v-model="viewList" tag="tbody" handle=".handle">
              <tr v-for="(item, index) in viewList" :key="index">
                <td scope="row">{{ item.type }}</td>
                <td style="text-align:left;">{{ item.description }}</td>
                <td style="text-align:left;" >{{ item.duration }}</td>
                <td style="text-align:left; width:400px;">
                  <el-button
                    size="mini"
                    circle
                    plain
                    type="danger"
                    @click="handleDeleteView(index)"
                    icon="el-icon-close"
                  ></el-button>
                  
                  <el-button
                    size="mini"
                    round
                    
                    @click="handlePreviewView(index)"
                    icon="el-icon-view"
                  >Preview</el-button>
                  <el-button
                    size="mini"
                    round
                    @click="clickModifyView(item)"
                    icon="el-icon-setting"
                  >Modify</el-button>
                  <el-button
                    v-if="item.type=='kibana'"
                    size="mini"
                    round
                    type="danger"
                    plain
                    @click="handleOpenInKibana(index)"
                    icon="el-icon-news"
                  >Open in Kibana</el-button>

                 
                </td>
                <td><i class="el-icon-d-caret handle"></i></td>
              </tr>
            </draggable>
          </table>





          <el-button 
            round
            type="primary"
            @click="addView"
            class="add-view-button">
            Add a view
          </el-button>





    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <el-button v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
        type="primary"
        :disabled="!viewlistchanged && !namechanged"
        @click="saveRecord()"
      >{{this.$t("buttons.confirm")}}</el-button>
    </span>
 
  </el-dialog>
</template>

<script>
import Vue from "vue";

import vieweditor from "@/components/tableEditor/ViewEditor";
import YAML from "js-yaml";
import axios from "axios";



Vue.component("ViewEditor", vieweditor);

export default {
  name: "carouselEditor",
  data: () => ({
    activeName: "first",
    orgRec: null,
    newRec: null,
    strOrgRec: '',
    strNewRec: '',
    orgName: '',
    newName: '',
    formLabelWidth: "120px",
    changed:false,
    viewList: [],
    viewListAll: [],
    currentView: null,
    newView: null,
    dialogAddViewVisible: false,
    dialogFormVisible: false,
    dialogViewVisible: false,
    viewToModify: null,
    dragging: false,
  }),
  computed: {
    recordin: function() {
      return this.record;
    },
    recordstr:function(){
      return JSON.stringify(this.record);
    },
    newrecordstr:function(){
      return JSON.stringify(this.newRec);
    },
    viewliststr:function(){
      return JSON.stringify(this.viewList);
    },
    viewlistorgstr:function(){
      return JSON.stringify(this.viewListOrg);
    },
    newrecordstryaml:function(){
      return this.strNewRec;
    },
    recchanged:function() {
      return JSON.stringify(this.recordin)!=JSON.stringify(this.newRec);
    },
    viewlistchanged:function() {
      return JSON.stringify(this.viewList)!=JSON.stringify(this.viewListOrg);
    },
    namechanged:function() {
      return this.newName!=this.orgName;
    },
    dragOptions() {
      return {
        animation: 0,
        group: "description",
        disabled: false,
        ghostClass: "ghost"
      };
    },
  },
  props: {
    record: {
      type: Object
    }
    ,config: {
      type: Object
    }
  },
  watch: {
    recordin: {
      handler: function() {
        this.prepareData();
      },
      deep: true
    }
    ,
    newrecordstryaml: {
      handler: function() {
        this.newRec = YAML.safeLoad(this.strNewRec)
      },
      deep: true
    },
  },
  mounted:function() {
    console.log('mounted event')
    this.prepareData();
  },
  components: {
      editor:require('vue2-ace-editor')
  },
  methods: {
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    refresh: function() {
      this.strNewRec = ''
      this.strOrgRec = ''

      this.$nextTick(() => {
          this.refresh2()
      })
    },
    refresh2: function() {


      this.newRec = JSON.parse(JSON.stringify(this.record));
      this.orgRec = JSON.parse(JSON.stringify(this.record));
      
      this.strNewRec = YAML.safeDump(this.newRec,10)
      this.strOrgRec = YAML.safeDump(this.orgRec,10)
      
    },
    editorInitRO: function (editor) {
        require('brace/ext/language_tools') //language extension prerequsite...
        require('brace/mode/html')                
        require('brace/mode/yaml')                
        require('brace/mode/javascript')    //language
        require('brace/mode/less')
        require('brace/theme/chrome')
        require('brace/snippets/javascript') //snippet

        editor.setReadOnly(true)
    },
    editorInit: function (editor) { // eslint-disable-line
        require('brace/ext/language_tools') //language extension prerequsite...
        require('brace/mode/html')                
        require('brace/mode/yaml')                
        require('brace/mode/javascript')    //language
        require('brace/mode/less')
        require('brace/theme/chrome')
        require('brace/snippets/javascript') //snippet

    },
    valueChanged:function(item){
      this.newRec._source[item.key]=item.value;
      this.changed=true;

    },
    prepareData: function() {
      console.log('prepare data')
      console.log(this.record._id)
      this.dialogFormVisible=true
      this.strNewRec = ''
      this.strOrgRec = ''
      
      this.newRec = JSON.parse(JSON.stringify(this.record));
      this.orgRec = JSON.parse(JSON.stringify(this.record));
      
      this.strNewRec = YAML.safeDump(this.newRec,10)
      this.strOrgRec = YAML.safeDump(this.orgRec,10)

      console.log(this.newRec._id)
      console.log(this.orgRec._id)

      if(this.orgRec._source.id_array == null) {
        this.orgRec._source.id_array = []
      }

      if(this.orgRec._source.name!=null) {
        this.newName = this.orgRec._source.name
        this.orgName = this.orgRec._source.name
      }

      this.getViews()

      this.changed=false;
      
    },
    handleCurrentViewChange(val) {
      this.currentView = val;
    },
    handleEditView(index, row) { // eslint-disable-line
      //this.dialogHeaderVisible = true; -> coming soon
    },
    handleDeleteView(index) {
      this.currentView = null;
      this.viewList.splice(index, 1);
    },
    handleMoveView(index, row, down) {
      this.viewList.splice(index, 1);
      if (down) this.viewList.splice(index - 1, 0, row);
      else this.viewList.splice(index + 1, 0, row);
    },
    handleOpenInKibana(index) {
      console.log('index')
      console.log(index)
      console.log(this.viewList[index])
      window.open(this.viewList[index].target.replace('kibananyx','kibana').replace('embed=true','').replace(',title:Test','').replace('title:Test,',''))
    },
    handlePreviewView(index) {
      window.open(this.viewList[index].target)
    },
    addView() {
      this.newView = null
      this.dialogAddViewVisible = true;
    },
    viewSelected() {
      console.log(this.newView)
      this.viewList.push(JSON.parse(JSON.stringify(this.newView)))
      this.dialogAddViewVisible = false;
    },
    viewUpdated() {
      console.log('view updated')
      this.viewToModify = null
      this.dialogViewVisible=false

      setTimeout(() => {
        this.getViews()
      }, 1500)
    },
    clickModifyView(view) {
      console.log(view)
      var url =
                this.$store.getters.apiurl +
                "generic/nyx_view_carousel/" +
                view.id +
                "?token=" +
                this.$store.getters.creds.token;
      console.log(url)
      axios
        .get(url)
        .then(response => {
          if (response.data.error != "") console.log("GET VIEW ERROR...");
          else {
            console.log('response')
            console.log(response)
            this.viewToModify = response.data.data
            this.dialogViewVisible=true
          }
        })
        .catch(error => {
          console.log(error);
        });




    },
    saveRecord:function()
    {  
      var id_array = []
      for(var i in this.viewList) {
        var obj = {
          'id': this.viewList[i].id
        }
        id_array.push(obj)
      }


      this.newRec._source.name = this.newName
      this.newRec._source.id_array = id_array


      console.log(this.orgRec._source.id_array)
      console.log(this.newRec._source.id_array)

      this.$store.commit({
        type: "updateRecord",
        data: this.newRec
      });
      this.$emit("dialogcloseupdated")
      this.$notify({
        title: "Record saved.",
        type: "success",
        message: "Record updated.",
        position: "bottom-right"
      });
    },
    getViews() {
      this.viewList = []
      this.viewListAll = []
      var url =
      this.$store.getters.apiurl +
      "generic_search/nyx_view_carousel*?token=" +
      this.$store.getters.creds.token;

      var query = {
        size: 2000,
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

      axios
        .post(url, query)
        .then((response) => {
          if(response.data.error!="")
            console.log("generic search view carousel error...");
          else
          {
            console.log(response.data.records) 
            for(var i in response.data.records) {
              var viewRec = response.data.records[i]

              var viewObj = {
                'id': viewRec._id,
                'type': viewRec._source.type,
                'description': viewRec._source.description,
                'duration': viewRec._source.duration,
                'target': viewRec._source.target,
              }

              this.viewListAll.push(viewObj)
            }

            // really important for ordering to not integrate this double iteration into the one above !
            for(var i in this.orgRec._source.id_array) {                
              for(var j in this.viewListAll) {
                var viewRec = this.viewListAll[j]
                if(this.orgRec._source.id_array[i].id == viewRec.id) {
                  this.viewList.push(JSON.parse(JSON.stringify(viewRec)))
                }
              }
            }

            var tmp = JSON.parse(JSON.stringify(this.viewList))
            this.viewList = null
            this.viewList = JSON.parse(JSON.stringify(tmp))

            this.viewListOrg = JSON.parse(JSON.stringify(tmp))

            //console.log(this.viewList)
          }
        })
        .catch((error)=> {
          console.log(error);
        });

    },
  }
};
</script>

<style >
.carousel-editor .view-table {
  margin-bottom:30px;
}
.carousel-editor .carousel-name-input {
  margin-bottom:10px;
}

.carousel-editor .add-view-button {
  margin-bottom:30px;
}


.carousel-editor .table-carousel {
  width: 100%;
  border-spacing: 0px !important;
}

.carousel-editor .thead-carousel th{
  padding-bottom: 10px;
}

.carousel-editor .table-carousel tr{
}
.carousel-editor .table-carousel td{
  padding:5px;
  border-top: solid 1px #ebeef5;

  
}

.carousel-editor .flip-list-move {
  transition: transform 0.5s;
}
.carousel-editor .no-move {
  transition: transform 0s;
}
.carousel-editor .handle {
  cursor: move;
}

.carousel-editor .ghost {
  opacity: 0.2;
  /* background-color: #409eff !important; */
}

.carousel-editor .sortable-chosen {
  color: white;
  background-color: #409eff !important;
}
  
</style>