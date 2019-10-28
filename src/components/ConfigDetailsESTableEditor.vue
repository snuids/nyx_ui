<template>
  <div>
    <el-card v-if="step==1">
      <h1 style="text-align:left;">Step 1 of 2: Define index pattern</h1>

      <el-row style="text-align:left;">
        <el-button
            @click="setFocus('indexPattern')" 
            type="text">Index pattern</el-button>
      </el-row>
      <el-row>
        <el-col :span="12">
          <input
            placeholder="index-field-*"
            @focus="focusInput"
            ref="indexPattern"
            id="indexPattern"
            type="text"
            autocomplete="off"
            v-model="currentConfig.config.index"
          />
        </el-col>
        <el-col :offset="6" :span="6" style="text-align:right;">
          <el-button
            :disabled="!succesIndexPatternDefinition || currentConfig.config.index==''"
            plain
            :type="succesIndexPatternDefinition && currentConfig.config.index!=''?'primary': ''"
            icon="el-icon-arrow-right"
            @click="goToStep(2)"
            size="mini"
          >Next step</el-button>
        </el-col>
      </el-row>
      <el-row style="text-align:left;">
        <span>
          You can use a * as a wildcard in your index pattern.
          <br />You can't use spaces or the characters \, /, ?, &quot;, &lt;, &gt;, |.
        </span>
      </el-row>

      <el-row>
        <el-table :data="esMapping" size="mini" style="width: 100%">
          <el-table-column label="id" prop="id">
            <template slot="header" slot-scope="scope">
              <p
                v-bind:class="{ 'text-success': succesIndexPatternDefinition }"
                v-html="helpMessage"
              ></p>
            </template>
          </el-table-column>
        </el-table>
      </el-row>
    </el-card>
    <el-card v-if="step==2">
      <h1 style="text-align:left;">Step 2 of 2: Configure settings</h1>

      <el-row style="text-align:left;" v-if="!noTimeField">
        <span>You've defined <b>{{currentConfig.config.index}}</b> as your index pattern. Now you can specify some settings before we create it.</span>
      </el-row>
      <el-row style="text-align:left;" v-if="!noTimeField">
        <el-button
            @click="setFocus('timeField')" 
            type="text">Time Filter field field</el-button>
      </el-row>
      <el-row >
        <el-col :span="12" style="text-align:left;">
          <span v-if="noTimeField">
            The indices which match this index pattern don't contain any time fields.
          </span>
          <el-select 
              v-else
              v-model="currentConfig.config.timefield" 
              placeholder="Select"
              size="mini"
              ref="timeField"
              @change="timeFieldChanged()"
              style="width:100%;">
            <el-option
              v-for="item in timeFields"
              :key="item.field"
              :label="item.field"
              :value="item.field">
            </el-option>
          </el-select>
        </el-col>
        <el-col :offset="6" :span="6" style="text-align:right;">
          <el-button
            :disabled="!succesIndexPatternDefinition || currentConfig.config.index==''"
            plain
            :type="succesIndexPatternDefinition && currentConfig.config.index!=''?'primary': ''"
            icon="el-icon-arrow-left"
            @click="goToStep(1)"
            size="mini"
          >Back</el-button>
        </el-col>
      </el-row>
      <el-row style="text-align:left;">
        <el-switch
          v-if="currentConfig.config.timefield && currentConfig.config.timefield!='I don\'t want to use the Time Filter'"
          v-model="currentConfig.graphicChecked"
          active-text="Graphic"
          >
        </el-switch>
      </el-row>
      <el-row style="text-align:left;">
        <!-- <el-col :span="6" style="text-align:left;"> -->
        <el-switch
          v-if="currentConfig.config.timefield && currentConfig.config.timefield!='I don\'t want to use the Time Filter'"
          v-model="currentConfig.timeSelectorChecked"
          active-text="Time selector"
          >
        </el-switch>
        <!-- </el-col>
        <el-col :span="6" style="text-align:left;"> -->
          <el-select
            v-if="currentConfig.timeSelectorChecked"
            style="margin-left:20px;"
            size="mini"
            v-model="currentConfig.timeSelectorType"
            placeholder="Please select a type"
          >
            <el-option label="Free" value="classic"></el-option>
            <el-option label="Month" value="month"></el-option>
            <el-option label="Week" value="week"></el-option>
            <el-option label="Year" value="year"></el-option>
          </el-select>
        <!-- </el-col> -->
      </el-row>
      <el-row style="text-align:left;">
        <el-button
            @click="setFocus('fieldsToDisplay')" 
            type="text">Fields to display</el-button>
      </el-row>
       <el-row>
        <el-col :span="12" style="text-align:left;">
          <el-select 
              v-model="fieldsToDisplay" 
              multiple
              filterable
              @change="selectFieldsToDisplayChanged()"
              ref="fieldsToDisplay"
              placeholder="Field to display"
              size="mini"
              style="width:100%;">
            <el-option
              v-for="item in allFields"
              :key="item.field"
              :label="item.field"
              :value="item.field">
            </el-option>
          </el-select>
        </el-col>
      </el-row>
       <el-row>
      </el-row>
       <el-row>
        <el-col :span="16" >
          <el-card shadow="never" v-if="currentConfig.config.headercolumns.length>0">
            <el-table
              :data="currentConfig.config.headercolumns"
              size="mini"
              style="width: 100%">
              <el-table-column
                prop="field"
                label="Field"
                width="180">
              </el-table-column>
              <el-table-column
                label="Label">
                <template slot-scope="scope">
                  <el-input 
                      size="mini"
                      v-model="scope.row.title"></el-input>
                    
                </template>
              </el-table-column>
              <el-table-column
                prop="type"
                label="Type"
                width="180">
              </el-table-column>
              <el-table-column
                label="Format">
                <template slot-scope="scope">
                  <el-input 
                      v-if="scope.row.type=='date'"
                      size="mini"
                      placeholder="eg. DD/MM/YYYY HH:mm"
                      v-model="scope.row.format"></el-input>
                    
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
       
      </el-row>
      <el-row style="text-align:left;">
        <el-button
            @click="setFocus('hiddenQuery')" 
            type="text">Hidden query</el-button>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-input
            placeholder="hidden query"
            ref="hiddenQuery"
            type="text"
            size="mini"
            autocomplete="off"
            v-model="currentConfig.config.hiddenQuery"
          >
          </el-input>
        </el-col>
      </el-row>
      <el-row style="text-align:left;">
        <el-switch
          v-model="currentConfig.queryBarChecked"
          active-text="Query bar"
          >
        </el-switch>
      </el-row>
      <el-row style="text-align:left;">
        <el-switch
          v-model="currentConfig.queryFilterChecked"
          active-text="Query filter"
          >
        </el-switch>
      </el-row>
      <el-row style="text-align:left;" >
        <el-switch
          :disabled="isEmpty(geoFields)"
          v-model="currentConfig.mapChecked"
          active-text="Map"
          >
        </el-switch>
      </el-row>
      <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
        <el-col :span="4">
          <el-button
            @click="setFocus('geoField')" 
            type="text">Geo field</el-button>
        </el-col>
        <el-col :span="3">
          <el-button
            @click="setFocus('zoom')" 
            type="text">Zoom</el-button>
        </el-col>
        <el-col :span="3">
          <el-button
            @click="setFocus('long')" 
            type="text">Lon.</el-button>
        </el-col>
        <el-col :span="3">
          <el-button
            @click="setFocus('lat')" 
            type="text">Lat.</el-button>
        </el-col>
      </el-row>
      <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
        <el-col :span="4">
          <el-select 
              v-model="currentConfig.config.mapfield" 
              placeholder="Select"
              size="mini"
              ref="geoField"
              style="width:90%;">
            <el-option
              v-for="item in geoFields"
              :key="item.field"
              :label="item.field"
              :value="item.field">
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-input-number
            :min="1"
            :max="20"
            size="mini"
            ref="zoom"
            v-model="currentConfig.config.mapzoom"
            autocomplete="off"
          ></el-input-number>
        </el-col>
        <el-col :span="3">
          <el-input-number size="mini" ref="long" v-model="currentConfig.config.maplong" autocomplete="off"></el-input-number>
        </el-col>
        <el-col :span="3">
          <el-input-number size="mini" ref="lat" v-model="currentConfig.config.maplat" autocomplete="off"></el-input-number>
        </el-col>
        
      </el-row>
      <el-row style="text-align:left;">
        <el-switch
          v-model="currentConfig.downloadChecked"
          active-text="Download"
          >
        </el-switch>
      </el-row>
      <el-row style="text-align:left;" v-if="currentConfig.downloadChecked">
        <el-button
            @click="setFocus('fieldsToDownload')" 
            type="text">Fields to download</el-button>
      </el-row>
       <el-row v-if="currentConfig.downloadChecked">
        <el-col :span="12" style="text-align:left;">
          <el-select 
              v-model="fieldsToDownload" 
              multiple
              filterable
              @change="selectFieldsToDownloadChanged()"
              ref="fieldsToDownload"
              placeholder="Field to download"
              size="mini"
              style="width:100%;">
            <el-option
              v-for="item in allFields"
              :key="item.field"
              :label="item.field"
              :value="item.field">
            </el-option>
          </el-select>
        </el-col>
      </el-row>
       <el-row  v-if="currentConfig.downloadChecked">
        <el-col :span="16" >
          <el-card shadow="never" v-if="currentConfig.config.tableFieldsToDownload && currentConfig.config.tableFieldsToDownload.length>0">
            <el-table
              :data="currentConfig.config.tableFieldsToDownload"
              size="mini"
              style="width: 100%">
              <el-table-column
                prop="field"
                label="Field"
                width="180">
              </el-table-column>
              <el-table-column
                label="Label">
                <template slot-scope="scope">
                  <el-input 
                      size="mini"
                      v-model="scope.row.title"></el-input>
                    
                </template>
              </el-table-column>
              <!-- <el-table-column
                prop="type"
                label="Type"
                width="180">
              </el-table-column>
              <el-table-column
                label="Format">
                <template slot-scope="scope">
                  <el-input 
                      v-if="scope.row.type=='date'"
                      size="mini"
                      v-model="scope.row.format"></el-input>
                    
                </template>
              </el-table-column> -->
            </el-table>
          </el-card>
        </el-col>
       
      </el-row>
      <el-row style="text-align:left;">
        <el-button
            @click="setFocus('specificEditor')" 
            type="text">Specific editor</el-button>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-input
            placeholder="your specific component url. Eg. specificComponent"
            ref="specificEditor"
            type="text"
            size="mini"
            autocomplete="off"
            v-model="currentConfig.config.editorComponent"
          >
          </el-input>
        </el-col>
      </el-row>
      <el-row style="text-align:left;">
        <el-button
            @click="setFocus('writePrivileges')" 
            type="text">Write privileges</el-button>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-select 
              v-model="writePrivileges" 
              multiple
              filterable
              allow-create
              ref="writePrivileges"
              placeholder="write privileges"
              size="mini"
              style="width:100%;">
            <el-option
              v-for="item in allPrivileges"
              :key="item.value"
              :label="item.value"
              :value="item.value">
            </el-option>
          </el-select>
        </el-col>
      </el-row>
      
    </el-card>
  </div>
</template>
<script>
//import axios from "axios";
import Vue from "vue";
import axios from "axios";
import _ from "lodash";

export default {
  field: "ConfigDetailsESTableEditor",
  data() {
    return (
      window.__FORM__ || {

        // blockEventEmission: true,
        esMapping: null,
        allesMapping: null,
        geoFieldSelected: null,
        timeFields: {},
        geoFields: {},
        allFields: {},
        writePrivileges: [],
        fieldsToDownload: [],
        fieldsToDisplay: [],
        helpMessage: "",
        succesIndexPatternDefinition: false,
        noTimeField: true,
        step: 1,

      }
    );
  },
  computed: {
    curConfigIn: function() {
      return this.currentConfig;
    },
    indexPattern: function() {
      return this.currentConfig.config.index;
    }
  },
  watch: {
    curConfigIn: {
      handler: function() {
        // this.prepareData();
      },
      deep: true
    },
    indexPattern: {
      handler: function() {
        this.indexPatternChanged();
      }
    },
  },
  props: {
    forcestep: { type: Number },
    currentConfig: { type: Object },
    allPrivileges: { type: Array }
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    prepareData() {
      console.log('prepareData')
      console.log(this.currentConfig)

      this.loadEsMapping()

      if(this.currentConfig.config.headercolumns != null) {        
        for(var i=0; i<this.currentConfig.config.headercolumns.length; i++) {
          
          this.fieldsToDisplay.push(this.currentConfig.config.headercolumns[i].field)
        }
      }
      if(this.currentConfig.config.exportColumns != null) {      
        
        this.currentConfig.config.tableFieldsToDownload = []
        var tmp = this.currentConfig.config.exportColumns.split(',')
        
        console.log(tmp)

        for(var i=0; i<tmp.length; i++) {
          var obj={
            'field': tmp[i].split('->')[0],
            'title': tmp[i].split('->')[1],
          }
          this.currentConfig.config.tableFieldsToDownload.push(obj)
          this.fieldsToDownload.push(tmp[i].split('->')[0])
        }
      }

      this.step = this.forcestep
    },
    isEmpty: function(obj) {
      return _.isEmpty(obj)
    },
    indexPatternChanged: function() {
      this.timeFields = {}
      this.geoFields = {}
      this.allFields = {}
      
      this.loadEsMapping();
    },
    loadEsMapping: _.debounce(function() {
      var indexToSearch = this.currentConfig.config.index;

      if (indexToSearch == "") indexToSearch = "*";

      console.log("load es mapping. filter: " + indexToSearch);

      var url =
        this.$store.getters.apiurl +
        "esmapping/" +
        indexToSearch +
        "?token=" +
        this.$store.getters.creds.token;
      // await axios
      axios
        .get(url)
        .then(response => {
          console.log("get mapping success");
          // console.log(response.data.data);
          if (response.data.data.length > 0) {
            this.esMapping = response.data.data;
            if (this.currentConfig.config.index == "") {
              this.allesMapping = response.data.data;
              this.helpMessage =
                "Your index pattern can match any of your " +
                this.esMapping.length +
                " indices, below.";
              this.succesIndexPatternDefinition = false;
            } else {
              this.helpMessage =
                "Success! Your index pattern matches " +
                this.esMapping.length +
                " indices.";
              this.succesIndexPatternDefinition = true;
              this.computeFields()
            }
          } else {
            this.esMapping = JSON.parse(JSON.stringify(this.allesMapping));
            this.helpMessage =
              "The index pattern you've entered doesn't match any indices. You can match any of your " +
              this.esMapping.length +
              " indices, below.";
            this.succesIndexPatternDefinition = false;
          }
        })
        .catch(error => {
          console.log(error);
          this.succesIndexPatternDefinition = false;
        });
    }, 500),
    focusInput: _.debounce(function() {
      console.log("focus");
      if (this.currentConfig.config.index == "") {
        this.currentConfig.config.index = "*";
        let input = this.$refs.indexPattern;
        this.$nextTick(() => this.setCursorPosition(input, 0));
      }
    }, 50),
   
    setCursorPosition(el, pos) {
      el.focus();
      el.setSelectionRange(pos, pos);
    },
    setFocus: function(el) {
      this.$nextTick(() => this.$refs[el].focus());
    },
    setFocusInput: function() {
      let input = this.$refs.indexPattern;
      console.log(input)
      this.$nextTick(() => input.focus());
    },
    setFocusSelect: function() {
      let select = this.$refs.timeField;
      console.log(select)
      this.$nextTick(() => select.focus());
    },
    selectFieldsToDisplayChanged: function() {
      console.log('selectFieldsToDisplayChanged')
      this.currentConfig.config.headercolumns = []
      for(var i in this.fieldsToDisplay) {
        this.currentConfig.config.headercolumns.push(this.allFields[this.fieldsToDisplay[i]])
      }
    },
    selectFieldsToDownloadChanged: function() {
      console.log('selectFieldsToDisplayChanged')
      this.currentConfig.config.tableFieldsToDownload = []
      for(var i in this.fieldsToDownload) {
        this.currentConfig.config.tableFieldsToDownload.push(this.allFields[this.fieldsToDownload[i]])
      }

      this.currentConfig.config.exportColumns = ''
      for(var i = 0; i< this.currentConfig.config.tableFieldsToDownload.length; i++){
        this.currentConfig.config.exportColumns += this.currentConfig.config.tableFieldsToDownload[i].field 
        
        if(this.currentConfig.config.tableFieldsToDownload[i].title)
          this.currentConfig.config.exportColumns += '->' + this.currentConfig.config.tableFieldsToDownload[i].title
        
        this.currentConfig.config.exportColumns += ','
      }

      if(this.currentConfig.config.exportColumns.length>0) {
        this.currentConfig.config.exportColumns=this.currentConfig.config.exportColumns.slice(0, -1)
      }
    },
    resetTest: function() {
      this.fieldsToDisplay = [];
    },
    timeFieldChanged: function() {
      if(this.currentConfig.config.timefield == '_____________________') {
        this.currentConfig.config.timefield = ''
      }
    },
    goToStep: function(step) {
      console.log('go to step'+step)
      if(step == 2) {
        
      }

      this.step = step
    },
    computeFields: function(){
        this.timeFields={}
        this.geoFields={}
        this.allFields={
          '_id': {
            'field':'_id',
            'type':'_id',
          },
          '_index': {
            'field':'_index',
            'type':'_index',
          },
        }

        for(var idx in this.esMapping) {
          var indexMapping = this.esMapping[idx]
          if(indexMapping.obj != null) {
            
            if(indexMapping.obj.mappings.properties!=null) {
              this.getRecMappings('', indexMapping.obj.mappings)
            }
            else {
              for(var _type in indexMapping.obj.mappings) {
                this.getRecMappings('', indexMapping.obj.mappings[_type])
              }
            }
          }
          else {

          }
        }

        if(Object.keys(this.timeFields).length > 0) {
          this.timeFields['_____________________'] = {field:'_____________________'}
          this.timeFields['none'] = {field:'I don\'t want to use the Time Filter'}
          this.noTimeField = false
        }
        else {
          this.noTimeField = true
        }
        
    },
    getRecMappings: function(curpath,curstruct)
    {
      for (var i in curstruct.properties)
      {
        var curobj=curstruct.properties[i]
        if (curobj.properties !=null)
          this.getRecMappings(curpath+i+".",curobj)
        else {

          var obj = {"field":curpath+i,"type":curobj.type}

          this.allFields[curpath+i] = obj

          if(obj.type == 'date')
            this.timeFields[curpath+i] = obj
          
          if(obj.type == 'geo_point')
            this.geoFields[curpath+i] = obj
        }
      }
    }
  }
};
</script>
<style>
.text-success {
  color: green;
}

#indexPattern {
  height: 28px;
  line-height: 28px;
  -webkit-writing-mode: horizontal-tb !important;
  text-rendering: auto;
  color: initial;
  letter-spacing: normal;
  word-spacing: normal;
  text-transform: none;
  text-indent: 0px;
  text-shadow: none;
  display: inline-block;
  text-align: start;
  -webkit-appearance: textfield;
  background-color: white;
  -webkit-rtl-ordering: logical;
  cursor: text;
  margin: 0em;
  font: 400 11px system-ui;
  padding: 1px;
  border-width: 2px;
  border-style: inset;
  border-color: initial;
  border-image: initial;
  -webkit-appearance: none;
  background-color: #ffffff;
  background-image: none;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  box-sizing: border-box;
  color: #606266;
  display: inline-block;
  font-size: inherit;
  outline: none;
  padding: 0 15px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  width: 100%;
}

#indexPattern:focus {
  outline: none;
  border-color: #409eff;
}
</style>