<template>
  <div>
{{blockEventEmission}}
{{currentConfig}}

    <el-card>
            <!-- GENERIC TABLE -->
            <el-form :model="curConfig">
              <el-row>
                <el-col :span="6">
                  <el-form-item label="Index/Table" :label-width="formLabelWidth">
                    <el-input size="mini" v-model="currentConfig.config.index" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Time Field" :label-width="formLabelWidth">
                    <el-input size="mini" v-model="currentConfig.config.timefield" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    label="Doc Type"
                    :label-width="formLabelWidth"
                    v-if="(currentConfig.type === 'generic-table')"
                  >
                    <el-input size="mini" v-model="currentConfig.config.doc_type" autocomplete="off"></el-input>
                  </el-form-item>
                  <el-form-item
                    label="PKey"
                    :label-width="formLabelWidth"
                    v-if="(currentConfig.type === 'pgsql-generic-table')"
                  >
                    <el-input size="mini" v-model="currentConfig.config.pkey" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    label="Map Field"
                    :label-width="formLabelWidth"
                    v-if="currentConfig.mapChecked"
                  >
                    <el-input size="mini" v-model="currentConfig.config.mapfield" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-if="(currentConfig.type === 'pgsql-generic-table')">
                <el-col :span="24">
                  <el-form-item label="SQL" :label-width="formLabelWidth">
                    <el-input
                      placeholder="SQL: select * from my_table"
                      size="mini"
                      v-model="currentConfig.config.sql"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12">
                  <el-form-item label="Editor" :label-width="formLabelWidth">
                    <el-input
                      placeholder="Your specific component url. Eg. specificComponent"
                      size="mini"
                      v-model="currentConfig.config.editorComponent"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    label="Default Order"
                    :label-width="formLabelWidth"
                    v-if="(currentConfig.type === 'generic-table')"
                  >
                    <el-input size="mini" v-model="currentConfig.config.orderField" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    label
                    :label-width="formLabelWidth"
                    v-if="(currentConfig.type === 'generic-table')"
                  >
                    <el-checkbox v-model="currentConfig.config.orderDirection">Descending</el-checkbox>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12">
                  <el-form-item label="Export" :label-width="formLabelWidth">
                    <el-input
                      placeholder="Columns to export"
                      size="mini"
                      v-model="currentConfig.config.exportColumns"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Write Privilege" :label-width="formLabelWidth">
                    <el-input
                      size="mini"
                      v-model="currentConfig.config.writeprivileges"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-button size="mini" @click="handleAddField()">Add Field</el-button>
                </el-col>
                <el-col :span="20">
                  <!-- Header dialog -->
                  <el-dialog
                    title="Columns"
                    :visible.sync="dialogHeaderVisible"
                    width="30%"
                    append-to-body
                  >
                    <el-form v-if="currentHeader" :model="currentHeader">
                      <el-row :gutter="20">
                        <el-col :span="20">
                          <el-form-item label="Field" :label-width="formLabelWidth">
                            <el-input size="mini" v-model="currentHeader.field" autocomplete="off"></el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="20">
                        <el-col :span="20">
                          <el-form-item label="Title" :label-width="formLabelWidth">
                            <el-input size="mini" v-model="currentHeader.title" autocomplete="off"></el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="20">
                        <el-col :span="20">
                          <el-form-item label="Type" :label-width="formLabelWidth">
                            <el-select
                              size="mini"
                              v-model="currentHeader.type"
                              placeholder="Please select a type"
                            >
                              <el-option label="Generic" value="generic"></el-option>
                              <el-option label="Date" value="date"></el-option>
                              <el-option label="Timestamp" value="timestamp"></el-option>
                              <el-option label="Boolean" value="boolean"></el-option>
                            </el-select>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row
                        :gutter="20"
                        v-if="currentHeader.type=='date' || currentHeader.type=='timestamp'"
                      >
                        <el-col :span="20">
                          <el-form-item label="Format" :label-width="formLabelWidth">
                            <el-input size="mini" v-model="currentHeader.format" autocomplete="off"></el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                    </el-form>
                    <span slot="footer" class="dialog-footer">
                      <el-button type="primary" @click="dialogHeaderVisible = false">Close</el-button>
                    </span>
                  </el-dialog>

                  <el-table
                    class="headertable"
                    :data="currentConfig.config.headercolumns"
                    @current-change="handleCurrentHeaderChange"
                    border
                    style="width: 100%"
                  >
                    <el-table-column prop="field" label="Field"></el-table-column>
                    <el-table-column prop="title" label="Title"></el-table-column>
                    <el-table-column prop="type" label="Type"></el-table-column>
                    <el-table-column prop="format" label="Format"></el-table-column>
                    <el-table-column prop="title" label="Action">
                      <template slot-scope="scope2">
                        <el-button
                          size="mini"
                          circle
                          @click="handleEditHeader(scope2.$index, scope2.row)"
                          icon="el-icon-edit"
                        ></el-button>
                        <el-button
                          size="mini"
                          circle
                          type="danger"
                          @click="handleDeleteHeader(scope2.$index, scope2.row)"
                          icon="el-icon-delete"
                        ></el-button>

                        <el-button
                          size="mini"
                          circle
                          type="primary"
                          @click="handleMoveHeader(scope2.$index, scope2.row,false)"
                          icon="el-icon-arrow-down"
                          v-if="scope2.$index<currentConfig.config.headercolumns.length-1"
                        ></el-button>
                        <el-button
                          size="mini"
                          circle
                          type="primary"
                          @click="handleMoveHeader(scope2.$index, scope2.row,true)"
                          icon="el-icon-arrow-up"
                          v-if="scope2.$index>0"
                        ></el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-col>
              </el-row>
            </el-form>
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
    currentConfigIn: function() {
      return this.currentConfig;
    },
    indexPattern: function() {
      return this.model.config.index;
    }
  },
  watch: {
    currentConfigIn: {
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