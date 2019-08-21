<template>
  <div>
{{blockEventEmission}}
{{currentConfig}}

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
            v-model="model.config.index"
          />
        </el-col>
        <el-col :offset="6" :span="6" style="text-align:right;">
          <el-button
            :disabled="!succesIndexPatternDefinition || model.config.index==''"
            plain
            :type="succesIndexPatternDefinition && model.config.index!=''?'primary': ''"
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
        <span>You've defined <b>{{model.config.index}}</b> as your index pattern. Now you can specify some settings before we create it.</span>
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
              v-model="timeFieldSelected" 
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
            :disabled="!succesIndexPatternDefinition || model.config.index==''"
            plain
            :type="succesIndexPatternDefinition && model.config.index!=''?'primary': ''"
            icon="el-icon-arrow-left"
            @click="goToStep(1)"
            size="mini"
          >Back</el-button>
        </el-col>
      </el-row>
      <el-row style="text-align:left;">
        <el-switch
          v-if="timeFieldSelected && timeFieldSelected!='I don\'t want to use the Time Filter'"
          v-model="graphicChecked"
          active-text="Graphic"
          >
        </el-switch>
      </el-row>
      <el-row style="text-align:left;">
        <!-- <el-col :span="6" style="text-align:left;"> -->
        <el-switch
          v-if="timeFieldSelected && timeFieldSelected!='I don\'t want to use the Time Filter'"
          v-model="timeSelectorChecked"
          active-text="Time selector"
          >
        </el-switch>
        <!-- </el-col>
        <el-col :span="6" style="text-align:left;"> -->
          <el-select
            v-if="timeSelectorChecked"
            style="margin-left:20px;"
            size="mini"
            v-model="timeSelectorType"
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
        <el-col :span="16" >
          <el-card shadow="never" v-if="tableFieldsToDisplay.length>0">
            <el-table
              :data="tableFieldsToDisplay"
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
            v-model="hiddenQuery"
          >
          </el-input>
        </el-col>
      </el-row>
      <el-row style="text-align:left;">
        <el-switch
          v-model="queryBarChecked"
          active-text="Query bar"
          >
        </el-switch>
      </el-row>
      <el-row style="text-align:left;">
        <el-switch
          v-model="queryFilterChecked"
          active-text="Query filter"
          >
        </el-switch>
      </el-row>
      <el-row style="text-align:left;">
        <el-switch
          v-model="mapChecked"
          active-text="Map"
          >
        </el-switch>
      </el-row>
      <el-row style="text-align:left;" v-if="mapChecked">
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
      <el-row style="text-align:left;" v-if="mapChecked">
        <el-col :span="4">
          <el-select 
              v-model="geoFieldSelected" 
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
            v-model="mapzoom"
            autocomplete="off"
          ></el-input-number>
        </el-col>
        <el-col :span="3">
          <el-input-number size="mini" ref="long" v-model="maplong" autocomplete="off"></el-input-number>
        </el-col>
        <el-col :span="3">
          <el-input-number size="mini" ref="lat" v-model="maplat" autocomplete="off"></el-input-number>
        </el-col>
        
      </el-row>
      <el-row style="text-align:left;">
        <el-switch
          v-model="downloadChecked"
          active-text="Download"
          >
        </el-switch>
      </el-row>
      <el-row style="text-align:left;" v-if="downloadChecked">
        <el-button
            @click="setFocus('fieldsToDownload')" 
            type="text">Fields to download</el-button>
      </el-row>
       <el-row v-if="downloadChecked">
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
       <el-row>
        <el-col :span="16" >
          <el-card shadow="never" v-if="tableFieldsToDownload.length>0">
            <el-table
              :data="tableFieldsToDownload"
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
                      v-model="scope.row.format"></el-input>
                    
                </template>
              </el-table-column>
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
            v-model="specificEditor"
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
              ref="writePrivileges"
              placeholder="write privileges"
              size="mini"
              style="width:100%;">
            <el-option
              v-for="item in allPrivileges"
              :key="item"
              :label="item"
              :value="item">
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

        blockEventEmission: true,
        model: {
          config: {
            index: ''
          }
        },

        esMapping: null,
        allesMapping: null,
        timeFieldSelected: null,
        geoFieldSelected: null,
        timeSelectorType: 'classic',
        timeFields: {},
        geoFields: {},
        allFields: {},
        writePrivileges: [],
        fieldsToDownload: [],
        fieldsToDisplay: [],
        tableFieldsToDisplay: [],
        tableFieldsToDownload: [],
        // indexPattern: "",
        helpMessage: "",
        succesIndexPatternDefinition: false,
        noTimeField: true,
        timeSelectorChecked: false,
        step: 1,
        hiddenQuery: null,
        queryBarChecked: false,
        queryFilterChecked: false,
        graphicChecked: false,
        mapChecked: false,
        downloadChecked: false,
        mapzoom: null,
        maplong: null,
        maplat: null,
        specificEditor: null,
      }
    );
  },
  computed: {
    curConfigIn: function() {
      return this.currentConfig;
    },
    indexPattern: function() {
      return this.model.config.index;
    }
  },
  watch: {
    curConfigIn: {
      handler: function() {
        this.prepareData();
      },
      deep: true
    },
    indexPattern: {
      handler: function() {
        this.indexPatternChanged();
      }
    },
    model: {
      handler: function() {
        if(this.blockEventEmission) {
          console.log('block emit config changed')
          return
        }

        this.emitConfigChanged()
      },
      deep: true
    },
  },
  props: {
    currentConfig: { type: Object },
    allPrivileges: { type: Array }
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    emitConfigChanged : _.debounce(function() {
      this.$emit("configchanged", this.model)
    }, 1000),
    prepareData() {
      console.log('prepareData')
      console.log(this.currentConfig)

      this.blockEventEmission = true
      this.model = JSON.parse(JSON.stringify(this.currentConfig))
      
      this.$nextTick(() => this.blockEventEmission = false);

      this.loadEsMapping()
    },
    indexPatternChanged: function() {
      this.timeSelectorType= 'classic'
      this.timeFieldSelected = null
      this.geoFieldSelected = null
      this.timeFields = {}
      this.geoFields = {}
      this.allFields = {}
      this.fieldsToDisplay = []
      this.tableFieldsToDisplay = []
      this.tableFieldsToDownload = []
      this.fieldsToDownload = []
      this.loadEsMapping();
    },
    loadEsMapping: _.debounce(function() {
      var indexToSearch = this.model.config.index;

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
            if (this.model.config.index == "") {
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
      if (this.model.config.index == "") {
        this.model.config.index = "*";
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
      this.tableFieldsToDisplay = []
      for(var i in this.fieldsToDisplay) {
        this.tableFieldsToDisplay.push(this.allFields[this.fieldsToDisplay[i]])
      }
    },
    selectFieldsToDownloadChanged: function() {
      console.log('selectFieldsToDisplayChanged')
      this.tableFieldsToDownload = []
      for(var i in this.fieldsToDownload) {
        this.tableFieldsToDownload.push(this.allFields[this.fieldsToDownload[i]])
      }
    },
    resetTest: function() {
      this.fieldsToDisplay = [];
    },
    timeFieldChanged: function() {
      if(this.timeFieldSelected == '_____________________') {
        this.timeFieldSelected = ''
      }
    },
    goToStep: function(step) {
      if(step == 2) {
        this.timeFields={}
        this.allFields={}
        for(var idx in this.esMapping) {
          var indexMapping = this.esMapping[idx]
          for(var _type in indexMapping.obj.mappings) {
            var typeMapping = indexMapping.obj.mappings[_type]
            // console.log(typeMapping.properties)

            for(var prop in typeMapping.properties) {
              // console.log(prop)

              if(typeMapping.properties[prop].type=='date') {
                // this.timeFields.push(prop)
                this.timeFields[prop] = {
                  'field': prop,
                  'type': typeMapping.properties[prop].type
                }
              }
              else if(typeMapping.properties[prop].type=='geo-point') {
                // this.timeFields.push(prop)
                this.geoFields[prop] = {
                  'field': prop,
                  'type': typeMapping.properties[prop].type
                }
              }

              this.allFields[prop] = {
                'field': prop,
                'type': typeMapping.properties[prop].type
              }
            }
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
      }

      this.step = step
    },
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