<template>
  <el-dialog 
      width="80%" 
      :title="$t('generictable.modifyrecord')" 
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

  <!-- <draggable
        id="first"
        data-source="juju"
        :list="viewList"
        class="list-group"
        draggable=".item"
        group="a"
      >
        <div
          class="list-group-item item"
          v-for="element in viewList"
          :key="element.id"
        >
          {{ element.type }} -- {{ element.description }} -- {{ element.duration }}
        </div>

      </draggable> -->
<!-- 
<draggable
        class="list-group"
        tag="ul"
        v-model="viewList"
        v-bind="dragOptions"
        @start="drag = true"
        @end="drag = false"
      >
        <transition-group type="transition" :name="!drag ? 'flip-list' : null">
          <li
            class="list-group-item"
            v-for="element in viewList"
            :key="element.id"
          >
            <i
              :class="
                element.fixed ? 'fa fa-anchor' : 'glyphicon glyphicon-pushpin'
              "
              @click="element.fixed = !element.fixed"
              aria-hidden="true"
            ></i>
            {{element.description}}
            <el-button
                  size="mini"
                  round
                  @click="handleEditView(element)"
                  icon="el-icon-edit"
                >Edit</el-button>
          </li>
        </transition-group>
      </draggable>
    
 -->






          <el-button 
            round
            type="primary"
            @click="addView"
            class="add-view-button">
            Add a view
          </el-button>





<div v-for="(list, index) in viewListGroup" :key="index" class="group-car">
    

    <!-- <rawDisplayer class="col-3" :value="list" :title="index" :name="index" /> -->
      <h3>Group {{index}}</h3>

      <draggable
        :id="index"
        :list="list"
        class="list-group"
        draggable=".item"
        group="a"
      >
        <div
          class="list-group-item item"
          v-for="element in list"
          :key="element.id"
        >
           {{element.description}}
        </div>

     
      </draggable>
    </div>


<!-- 
{{orgRec}}
---------------------{{recchanged}}--------------------------------------------------------
{{newcar}} -->

    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <el-button v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
        type="primary"
        :disabled="!recchanged"
        @click="saveRecord()"
      >{{this.$t("buttons.confirm")}}</el-button>
      <!-- <el-button v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
        type="primary"
        :disabled="!newrecgroupchanged && !namechanged"
        @click="saveRecord()"
      >{{this.$t("buttons.confirm")}}</el-button> -->
    </span>
 
  </el-dialog>
</template>

<script>
import Vue from "vue";

import vieweditor from "@/components/tableEditor/ViewEditor";

import axios from "axios";

import draggable from "vuedraggable";
let id = 1;

Vue.component("ViewEditor", vieweditor);
Vue.component("draggable", draggable);


const message = [
  "vue.draggable",
  "draggable",
  "component",
  "for",
  "vue.js 2.0",
  "based",
  "on",
  "Sortablejs"
];

export default {
  name: "carouselEditorDev",
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
    viewListGroup: [[],[]],
    viewListAll: [],
    currentView: null,
    newView: null,
    dialogAddViewVisible: false,
    dialogFormVisible: false,
    dialogViewVisible: false,
    viewToModify: null,
    drag: false,
  }),
  components: {
    draggable,
    
  },
  computed: {
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost"
      };
    },
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
    recchanged:function() {
      return JSON.stringify(this.recordin)!=JSON.stringify(this.newcar);
    },
    newrecgroupchanged:function() {
      return JSON.stringify(this.recordin)!=JSON.stringify(this.newrecfromgroup);
    },
    viewlistchanged:function() {
      return JSON.stringify(this.viewList)!=JSON.stringify(this.viewListOrg);
    },
    namechanged:function() {
      return this.newName!=this.orgName;
    },
    newrecfromgroup:function(){
      var ret = []
      for(var group in this.viewListGroup) {
        for(var i in this.viewListGroup[group]) {    
          var obj = this.viewListGroup[group][i]
          obj.group = group
          ret.push(obj)
        }
      }
      return ret
    },
    newcar:function() {
      try {
        var ret = {
          "_id": this.recordin._id, 
          "_index": this.recordin._index, 
          "_score": this.recordin._score, 
          "_source": {
            "id_array":[],
            "name": this.newName
          },
          "_type": this.recordin._type
        }
  
        for(var group in this.viewListGroup) {
          for(var i in this.viewListGroup[group]) { 
            var obj = {
              'group':parseInt(group),
              'id':this.viewListGroup[group][i].id
            }
            ret._source.id_array.push(obj)
          }
        }
        
        return ret
      }
      catch(error) {
        console.error(error)
        return null
      }
      

    }
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
    viewListGroup: {
      handler: function() {
        console.log('------------->watcher viewListGroup')
        console.log(this.viewListGroup)
        for(var group in this.viewListGroup) {
          if(this.viewListGroup[group].length==0) {
            console.log('delete group: '+group)
            // delete this.viewListGroup[group]
          }
        }
        // var tmp = JSON.parse(JSON.stringify(this.viewListGroup))
        // this.viewListGroup = null
        // this.viewListGroup = tmp
      },
      deep:true
    }
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
      
      
    },
    valueChanged:function(item){
      this.newRec._source[item.key]=item.value;
      this.changed=true;

    },
    prepareData: function() {
      this.dialogFormVisible=true
      this.strNewRec = ''
      this.strOrgRec = ''
      
      this.newRec = JSON.parse(JSON.stringify(this.record));
      this.orgRec = JSON.parse(JSON.stringify(this.record));
      
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
    handleDeleteView(index) {
      this.currentView = null;
      this.viewList.splice(index, 1);
    },
    handleMoveView(index, row, down) {
      this.viewList.splice(index, 1);
      if (down) this.viewList.splice(index - 1, 0, row);
      else this.viewList.splice(index + 1, 0, row);
    },
    // handlePreviewView(index, row, down) {
    //   window.open(this.viewList[index].target)
    // },
    handlePreviewView(view) {
      window.open(view.target)
    },
    addView() {
      this.newView = null
      this.dialogAddViewVisible = true;
    },
    viewSelected() {
      
      this.viewList.push(JSON.parse(JSON.stringify(this.newView)))
      this.dialogAddViewVisible = false;
    },
    viewUpdated() {
      
      this.viewToModify = null
      this.dialogViewVisible=false

      setTimeout(() => {
        this.getViews()
      }, 1500)
    },
    handleEditView(view) {
      
      var url =
                this.$store.getters.apiurl +
                "generic/nyx_view_carousel/" +
                view.id +
                "?token=" +
                this.$store.getters.creds.token;
      
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
      for(var i in this.newrecfromgroup) {
        var obj = {
          'id': this.newrecfromgroup[i].id
        }
        if(this.newrecfromgroup[i].group==null)
          obj.group=0
        else
          obj.group=parseInt(this.newrecfromgroup[i].group)

        id_array.push(obj)
      }


      this.newRec._source.name = this.newName
      this.newRec._source.id_array = id_array


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


          
                  if(this.orgRec._source.id_array[i].group != undefined)
                    viewRec.group = this.orgRec._source.id_array[i].group
                  else
                    viewRec.group = 0

                  this.viewList.push(JSON.parse(JSON.stringify(viewRec)))

       
                  if(this.viewListGroup[viewRec.group] === undefined)
                    this.viewListGroup[viewRec.group] = []
                    
                  this.viewListGroup[viewRec.group].push(JSON.parse(JSON.stringify(viewRec)))
                   

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








.button {
  margin-top: 35px;
}
.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
/* .sortable-ghost {
  opacity: 0.5;
  background-color: red !important;
} */
.list-group {
  min-height: 20px;
}
.list-group-item {
  cursor: move;
}
.list-group-item i {
  cursor: move;
}


.list-group-item {
    position: relative;
    display: block;
    padding: .25rem .75rem;
    margin-bottom: -1px;
    background-color: #fff;
    border: 1px solid rgba(0,0,0,.125);
}

.group-car {
  border: solid 2px black;
  margin-top:10px;
  padding:10px;
}
  
</style>