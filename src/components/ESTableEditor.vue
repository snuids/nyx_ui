<template>
  <div id="config-table-editor">
    <el-card v-if="step==1">
      <h1 style="text-align:left;">Step 1 of 2: Define index pattern</h1>

      <el-row style="text-align:left;">
        <el-button @click="setFocus('indexPattern')" type="text">Index pattern</el-button>
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
            @input="indexPatternChanged()"
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
            <template slot-scope="scope">
              <el-button
                style="padding: 0px;color: #606266;"
                @click="setIndex(scope.row.id)"
                type="text"
              >{{scope.row.id}}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-row>
    </el-card>
    <el-card v-if="step==2">
      <el-row>
        <el-col :span="18" style="text-align:left;">
          <h1 style="text-align:left;">Step 2 of 2: Configure settings</h1>
        </el-col>
        <el-col :span="6" style="text-align:right;">
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

      <el-row style="text-align:left;" v-if="!noTimeField">
        <span>
          You've defined
          <b>{{currentConfig.config.index}}</b> as your index pattern. Now you can specify some settings before we create it.
        </span>
      </el-row>
      <el-row style="text-align:left;" v-if="noTimeField">
        <span>The indices which match this index pattern don't contain any time fields.</span>
      </el-row>
      <el-row style="text-align:left;">
        <el-col :span="12" style="text-align:left;" v-if="!noTimeField">
          <el-button @click="setFocus('timeField')" type="text">Time Filter field field</el-button>
        </el-col>
        <el-col :span="12" style="text-align:left;">
          <el-button @click="setFocus('docType')" type="text">Document type</el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" v-if="!noTimeField" class="padding-right">
          <!-- v-model="currentConfig.config.timefield"  -->
          <el-select
            v-model="timefieldSelected"
            placeholder="Select"
            size="mini"
            ref="timeField"
            @change="timeFieldChanged()"
            style="width:100%;"
          >
            <el-option
              v-for="item in timeFields"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-input
            placeholder="Default doc"
            ref="docType"
            type="text"
            size="mini"
            autocomplete="off"
            v-model="currentConfig.config.doc_type"
          ></el-input>
        </el-col>
      </el-row>

      <el-row v-if="!noTimeField && hasSelectedTimeField">
        <el-col :span="12" class="padding-right">
          <el-card shadow="never">
            <el-row>
              <el-switch v-model="currentConfig.graphicChecked" active-text="Time line"></el-switch>
            </el-row>
            <el-row>
              <el-col style="width:150px; margin-top:4px;">
                <el-switch v-model="currentConfig.timeSelectorChecked" active-text="Time selector"></el-switch>
              </el-col>
              <el-col style="width:200px">
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
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>

      <el-row style="text-align:left;">
        <el-button @click="setFocus('fieldsToDisplay')" type="text">Fields to display</el-button>
      </el-row>
      <el-row>
        <el-col :span="24" style="text-align:left;">
          <el-select
            v-model="fieldsToDisplay"
            multiple
            filterable
            @change="selectFieldsToDisplayChanged"
            ref="fieldsToDisplay"
            placeholder="Field to display"
            size="mini"
            style="width:100%;"
          >
            <el-option
              v-for="item in allFields"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            ></el-option>
          </el-select>
        </el-col>
      </el-row>

      <el-row v-if="currentConfig.config.headercolumns">
        <el-col :span="24">
          <el-card shadow="never" v-if="currentConfig.config.headercolumns.length>0">
            <table class="table-display">
              <thead class="thead-display">
                <tr>
                  <th>Field</th>
                  <th>Label</th>

                  <th>Type</th>
                  <th>Format</th>
                  <th></th>
                </tr>
              </thead>
              <draggable
                @change="zoom('display')"
                v-bind="dragOptionsDisplay"
                v-model="currentConfig.config.headercolumns"
                tag="tbody"
                handle=".handle"
              >
                <tr v-for="(item, index) in currentConfig.config.headercolumns" :key="index">
                  <td>{{item.field}}</td>
                  <td>
                    <el-input
                      class="display-name-input"
                      ref="author"
                      placeholder="Name"
                      v-model="item.title"
                      size="mini"
                    ></el-input>
                  </td>
                  <td>{{item.type}}</td>
                  <td style="width:200px;">
                    <el-input
                      v-if="item.type=='date' || item.type=='timestamp'"
                      class="display-name-input"
                      ref="author"
                      placeholder="eg. DD/MM/YYYY HH:mm"
                      v-model="item.format"
                      size="mini"
                    ></el-input>
                    <el-input
                      v-else-if="item.type=='long' || item.type=='double'"
                      class="display-name-input"
                      ref="author"
                      placeholder="Numeral.js format"
                      v-model="item.format"
                      size="mini"
                    ></el-input>
                    <el-select
                      v-else-if="item.type=='keyword' || item.type=='text'"
                      v-model="item.format"
                      filterable
                      placeholder="Default"
                      size="mini"
                      style="width:100%;"
                    >
                      <el-option label="Default" value="default"></el-option>
                      <el-option label="Icon" value="icon"></el-option>
                    </el-select>
                  </td>
                  <td>
                    <i class="el-icon-d-caret handle"></i>
                  </td>
                </tr>
              </draggable>
            </table>
          </el-card>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-button @click="setFocus('order')" type="text">Sort</el-button>
        </el-col>
        <el-col :span="12">
          <el-button @click="setFocus('hiddenQuery')" type="text">Hidden query</el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="padding-right">
          <el-select
            v-model="currentConfig.config.orderField"
            filterable
            clearable
            ref="order"
            placeholder="Field to sort on"
            size="mini"
            style="width:100%;"
          >
            <el-option
              v-for="item in allFields"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-input
            placeholder="Records in the table will be filtered by this query"
            ref="hiddenQuery"
            type="text"
            size="mini"
            autocomplete="off"
            v-model="currentConfig.config.hiddenQuery"
          ></el-input>
        </el-col>
      </el-row>
      <el-row v-if="currentConfig.config.orderField">
        <el-col :span="12" class="padding-right">
          <el-card shadow="never">
            <el-switch
              v-model="currentConfig.config.orderDirection"
              active-text="Descending"
              inactive-text="Ascending"
            ></el-switch>
          </el-card>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-button @click="setFocus('')" type="text">User queries</el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="fieldsToFilterEmpty ? 12 : 24" class="padding-right">
          <el-card shadow="never">
            <el-row>
              <el-col :span="fieldsToFilterEmpty ? 12 : 6">
                <el-switch v-model="currentConfig.queryBarChecked" active-text="Query bar" @change="query_bar_changed"></el-switch>
              </el-col>
              <el-col :span="fieldsToFilterEmpty ? 12 : 6">
                <el-switch v-model="currentConfig.queryFilterChecked" active-text="Query filter"  @change="query_filter_changed"></el-switch>
              </el-col>
            </el-row>
            
            <el-row v-if="currentConfig.queryFilterChecked">
              <el-button @click="setFocus('fieldsToFilter')" type="text">Fields to filter</el-button>
            </el-row>
            <el-row v-if="currentConfig.queryFilterChecked">
              <el-col :span="fieldsToFilterEmpty ? 24 : 12" :class="fieldsToFilterEmpty ? '' : 'padding-right'">
                <el-select
                  v-model="fieldsToFilter"
                  multiple
                  filterable
                  @change="selectFieldsToFilterChanged"
                  ref="fieldsToFilter"
                  placeholder="Field to filter"
                  size="mini"
                  style="width:100%;"
                >
                  <el-option
                    v-for="item in allFields"
                    :key="item.field"
                    :label="item.field"
                    :value="item.field"
                  ></el-option>
                </el-select>
              </el-col>
            </el-row>


            <el-row v-if="!fieldsToFilterEmpty">
              <el-col :span="12" class="padding-right">
                <el-card shadow="never">
                  <table class="table-display">
                    <thead class="thead-display">
                      <tr>
                        <th>Field</th>
                        <th>Label</th>
                        <th></th>
                        <th></th>
                      </tr>
                    </thead>
                    <draggable
                      @change="zoom('filter')"
                      v-bind="dragOptionsFilters"
                      v-model="currentConfig.config.queryfilters"
                      tag="tbody"
                      handle=".handle"
                    >
                      <tr v-for="(item, index) in currentConfig.config.queryfilters" :key="index">
                        <td>{{item.field}}</td>
                        <td>
                          <el-input
                            class="display-name-input"
                            ref="author"
                            placeholder="Name"
                            v-model="item.title"
                            size="mini"
                          ></el-input>
                        </td>
                        <td>
                          <el-button @click="configureQueryFilter(item)" size="mini">Configure</el-button>
                        </td>

                        <td>
                          <i class="el-icon-d-caret handle"></i>
                        </td>
                      </tr>
                    </draggable>
                  </table>
                </el-card>
              </el-col>
              <el-col :span="12" v-if="!fieldsToFilterEmpty">
                <el-card shadow="never">{{filterFieldToConfigure}}</el-card>
              </el-col>
            </el-row>






          </el-card>
        </el-col>
      </el-row>



      <el-row>
        <el-col :span="12">
          <el-button @click="setFocus('download')" type="text">Download records</el-button>
        </el-col>
        <el-col :span="12">
          <el-button @click="setFocus('geofields')" type="text">Geo fields</el-button>
        </el-col>
      </el-row>

      <el-row style="text-align:left;">
        <el-col :span="12" class="padding-right">
          <el-card shadow="never">
            <el-row>
                <el-switch v-model="currentConfig.downloadChecked" active-text="Download button"></el-switch>
            </el-row>
            <el-row v-if="currentConfig.downloadChecked">
              
                <el-button
                  @click="copyFieldsToDisplayToDownload()"
                  type="text"
                  size="mini"
                  style="color: #606266;"
                >Copy from fields to display</el-button>
              
            </el-row>
            <el-row v-if="currentConfig.downloadChecked">
              <el-select
                v-model="fieldsToDownload"
                multiple
                filterable
                @change="selectFieldsToDownloadChanged"
                ref="fieldsToDownload"
                placeholder="Field to download, if empty, all fields are dowloaded"
                size="mini"
                style="width:100%;"
              >
                <el-option
                  v-for="item in allFields"
                  :key="item.field"
                  :label="item.field"
                  :value="item.field"
                ></el-option>
              </el-select>
            </el-row>
            <el-row v-if="currentConfig.downloadChecked && currentConfig.config.tableFieldsToDownload">
              <el-card shadow="never" v-if="currentConfig.config.tableFieldsToDownload.length>0">
                <table class="table-display">
                  <thead class="thead-display">
                    <tr>
                      <th>Field</th>
                      <th>Label</th>
                      <th></th>
                    </tr>
                  </thead>
                  <draggable
                    @change="zoom('download')"
                    v-bind="dragOptionsDownload"
                    v-model="currentConfig.config.tableFieldsToDownload"
                    tag="tbody"
                    handle=".handle"
                  >
                    <tr
                      v-for="(item, index) in currentConfig.config.tableFieldsToDownload"
                      :key="index"
                    >
                      <td>{{item.field}}</td>
                      <td>
                        <el-input
                          class="display-name-input"
                          ref="author2"
                          placeholder="Name"
                          v-model="item.title"
                          size="mini"
                        ></el-input>
                      </td>
                      <td>
                        <i class="el-icon-d-caret handle"></i>
                      </td>
                    </tr>
                  </draggable>
                </table>
              </el-card>
            </el-row>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never">
            <el-row>
              <el-switch 
              :disabled="isEmpty(geoFields)"
              v-model="currentConfig.mapChecked" active-text="Map"></el-switch>
            </el-row>
            <el-row v-if="currentConfig.mapChecked" style="margin-top: 15px;">
              <el-col :span="12">
                <el-button @click="setFocus('geoField')" type="text">Geo field</el-button>
              </el-col>
              <el-col :span="12">
                <el-button @click="setFocus('zoom')" type="text">Zoom</el-button>
              </el-col>
            </el-row>
            <el-row  v-if="currentConfig.mapChecked">
              <el-col :span="12">
                <el-select
                  v-model="currentConfig.config.mapfield"
                  placeholder="Select"
                  size="mini"
                  ref="geoField"
                  style="width:90%;"
                >
                  <el-option
                    v-for="item in geoFields"
                    :key="item.field"
                    :label="item.field"
                    :value="item.field"
                  ></el-option>
                </el-select>
              </el-col>
              <el-col :span="12">
                <el-input-number
                  :min="1"
                  :max="20"
                  size="mini"
                  ref="zoom"
                  v-model="currentConfig.config.mapzoom"
                  autocomplete="off"
                ></el-input-number>
              </el-col>
            </el-row>
            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="12">
                <el-button @click="setFocus('long')" type="text">Lon.</el-button>
              </el-col>
              <el-col :span="12">
                <el-button @click="setFocus('lat')" type="text">Lat.</el-button>
              </el-col>
            </el-row>
            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="12">
                <el-input-number
                  size="mini"
                  ref="long"
                  v-model="currentConfig.config.maplong"
                  autocomplete="off"
                ></el-input-number>
              </el-col>
              <el-col :span="12">
                <el-input-number
                  size="mini"
                  ref="lat"
                  v-model="currentConfig.config.maplat"
                  autocomplete="off"
                ></el-input-number>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
      
     
      <el-row style="text-align:left;">
        <el-col :span="12">
          <el-button @click="setFocus('specificEditor')" type="text">Specific editor</el-button>
        </el-col>
        <el-col :span="12">
          <el-button @click="setFocus('writePrivileges')" type="text">Write privileges</el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="padding-right">
          <el-input
            placeholder="your specific component url. Eg. specificComponent"
            ref="specificEditor"
            type="text"
            size="mini"
            autocomplete="off"
            v-model="currentConfig.config.editorComponent"
          ></el-input>
        </el-col>
        <el-col :span="12">
          <el-select
            v-model="writePrivileges"
            multiple
            filterable
            allow-create
            ref="writePrivileges"
            placeholder="write privileges"
            size="mini"
            style="width:100%;"
          >
            <el-option
              v-for="item in allPrivileges"
              :key="item.value"
              :label="item.value"
              :value="item.value"
            ></el-option>
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
  field: "ESTableEditor",
  data() {
    return (
      window.__FORM__ || {
        dragging: false,
        activeName: "first",
        esMapping: null,
        allesMapping: null,
        geoFieldSelected: null,
        timeFields: {},
        timefieldSelected: null,
        geoFields: {},
        allFields: {},
        writePrivileges: [],
        fieldsToDownload: [],
        fieldsToDisplay: [],
        fieldsToFilter: [],
        helpMessage: "",
        succesIndexPatternDefinition: false,
        noTimeField: true,
        step: 1,
        filterFieldToConfigure: null
      }
    );
  },
  computed: {
    hasSelectedTimeField: function() {
      return (
        this.timefieldSelected &&
        this.timefieldSelected != "I don't want to use the Time Filter"
      );
    },
    fieldsToFilterEmpty: function() {
      return !(this.currentConfig.queryFilterChecked && this.currentConfig.config.queryfilters && this.currentConfig.config.queryfilters.length > 0)
    },
    curConfigIn: function() {
      return this.currentConfig;
    },
    indexPattern: function() {
      return this.currentConfig.config.index;
    },
    tableFieldsToDownload: function() {
      return this.currentConfig.config.tableFieldsToDownload;
    },
    dragOptionsDisplay() {
      return {
        animation: 0,
        group: "display",
        disabled: false,
        ghostClass: "ghost"
      };
    },
    dragOptionsFilters() {
      return {
        animation: 0,
        group: "filters",
        disabled: false,
        ghostClass: "ghost"
      };
    },
    dragOptionsDownload() {
      return {
        animation: 0,
        group: "download",
        disabled: false,
        ghostClass: "ghost"
      };
    }
  },
  watch: {
    indexPattern: {
      handler: function() {
        this.indexPatternChanged();
      }
    },
    tableFieldsToDownload: {
      handler: function() {
        this.tableFieldsToDownloadToExportColumns();
      },
      deep: true
    },
    timefieldSelected: {
      handler: function() {
        if (this.timefieldSelected == "_____________________") {
          this.timefieldSelected = null;
          this.currentConfig.config.timefield = null;
          return;
        }

        if (
          !this.timefieldSelected ||
          this.timefieldSelected == "I don't want to use the Time Filter"
        ) {
          this.currentConfig.config.timefield = null;
          this.currentConfig.graphicChecked = false;
          this.currentConfig.timeSelectorChecked = false;
          return;
        }

        this.currentConfig.config.timefield = this.timefieldSelected;
      }
    }
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
    query_filter_changed:function() {
        if(this.currentConfig.queryFilterChecked)
          this.currentConfig.queryBarChecked=false;

    },
    query_bar_changed:function() {
        if(this.currentConfig.queryBarChecked)
          this.currentConfig.queryFilterChecked=false;

    },
    configureQueryFilter: function(item) {
      this.filterFieldToConfigure = item;
    },
    tableFieldsToDownloadToExportColumns: _.debounce(function() {
      // this function is here to transform this.currentConfig.config.tableFieldsToDownload to this.currentConfig.exportColumns
      console.log("WATCHER TABLE FIELDS DL");
      if (
        this.currentConfig.config.tableFieldsToDownload == null ||
        this.currentConfig.config.tableFieldsToDownload.length == 0
      ) {
        delete this.currentConfig.config.exportColumns;
        return;
      }

      this.currentConfig.config.exportColumns = this.currentConfig.config.tableFieldsToDownload
        .map(element => element.field + "->" + element.title)
        .join();
    }, 500),
    setIndex(indexPattern) {
      console.log("setindex");
      console.log(indexPattern);

      this.currentConfig.config.index = "";
      this.$nextTick(() => (this.currentConfig.config.index = indexPattern));
      this.indexPatternChanged();
    },
    copyFieldsToDisplayToDownload() {
      this.fieldsToDownload = JSON.parse(JSON.stringify(this.fieldsToDisplay));
      this.selectFieldsToDownloadChanged();
    },
    draggableChanged(type) {
      let tmp = [];
      let field1 = "";
      let field2 = "";

      if (type == "display") {
        field1 = "headercolumns";
        field2 = "fieldsToDisplay";
      } else if (type == "download") {
        field1 = "tableFieldsToDownload";
        field2 = "fieldsToDownload";
      } else if (type == "filter") {
        field1 = "queryfilters";
        field2 = "fieldsToFilter";
      }

      for (var i = 0; i < this.currentConfig.config[field1].length; i++) {
        tmp.push(this.currentConfig.config[field1][i].field);
      }
      this[field2] = tmp;
    },
    prepareData() {
      console.log("prepareData ESTableEditor");
      console.log(this.currentConfig);

      this.loadEsMapping();

      // instanciate the timefieldSelected field
      if (this.currentConfig.config && this.currentConfig.config.timefield)
        this.timefieldSelected = this.currentConfig.config.timefield;
      else this.timefieldSelected = null;

      // initialize fieldsToDisplay and fieldsToDownload
      if (this.currentConfig.config.headercolumns != null) {
        for (
          var i = 0;
          i < this.currentConfig.config.headercolumns.length;
          i++
        ) {
          this.fieldsToDisplay.push(
            this.currentConfig.config.headercolumns[i].field
          );
        }
      }
      if (this.currentConfig.config.queryFilters != null) {
        for (
          var i = 0;
          i < this.currentConfig.config.queryfilters.length;
          i++
        ) {
          this.fieldsToFilter.push(
            this.currentConfig.config.queryfilters[i].field
          );
        }
      }
      if (this.currentConfig.config.exportColumns != null) {
        this.currentConfig.config.tableFieldsToDownload = [];
        var tmp = this.currentConfig.config.exportColumns.split(",");

        console.log(tmp);

        for (var i = 0; i < tmp.length; i++) {
          var obj = {
            field: tmp[i].split("->")[0],
            title: tmp[i].split("->")[1]
          };
          this.currentConfig.config.tableFieldsToDownload.push(obj);
          this.fieldsToDownload.push(tmp[i].split("->")[0]);
        }
      }

      // this.$nextTick(() => {this.step = this.forcestep;});
      this.step = this.forcestep;
    },
    isEmpty: function(obj) {
      return _.isEmpty(obj);
    },
    indexPatternChanged: function() {
      this.timeFields = {};
      this.geoFields = {};
      this.allFields = {};

      this.loadEsMapping();
    },
    loadEsMapping: _.debounce(function() {
      var indexToSearch = this.currentConfig.config.index;

      if (indexToSearch == null || indexToSearch == "") indexToSearch = "*";

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
          console.log(response.data);
          if (response.data.data != null && response.data.data.length > 0) {
            this.esMapping = response.data.data;

            console.log(this.currentConfig.config.index);
            console.log(indexToSearch);

            if (indexToSearch == "*") {
              console.log("ALL ES MAPPING");
              this.allesMapping = response.data.data;
              console.log(this.allesMapping);
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
              this.computeFields();
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
      console.log(input);
      this.$nextTick(() => input.focus());
    },
    setFocusSelect: function() {
      let select = this.$refs.timeField;
      console.log(select);
      this.$nextTick(() => select.focus());
    },
    selectFieldsToDisplayChanged: function(val) {
      console.log("selectFieldsToDisplayChanged");

      this.currentConfig.config.headercolumns = [];
      this.currentConfig.config.headercolumns = JSON.parse(
        JSON.stringify(
          this.modifyTableAssociateToSelect(
            this.fieldsToDisplay,
            this.currentConfig.config.headercolumns
          )
        )
      );
    },
    selectFieldsToDownloadChanged: function(val) {
      console.log("selectFieldsToDownloadChanged");

      this.currentConfig.config.tableFieldsToDownload = [];
      this.currentConfig.config.tableFieldsToDownload = JSON.parse(
        JSON.stringify(
          this.modifyTableAssociateToSelect(
            this.fieldsToDownload,
            this.currentConfig.config.tableFieldsToDownload
          )
        )
      );
    },
    selectFieldsToFilterChanged: function(val) {
      console.log("selectFieldsToFilterChanged");
      this.currentConfig.config.queryfilters = [];
      this.currentConfig.config.queryfilters = JSON.parse(
        JSON.stringify(
          this.modifyTableAssociateToSelect(
            this.fieldsToFilter,
            this.currentConfig.config.queryfilters
          )
        )
      );
    },
    modifyTableAssociateToSelect: function(selectModel, tableModel) {
      var tmp = [];
      var flag = false;
      for (var i = 0; i < selectModel.length; i++) {
        flag = false;
        for (var j = 0; i < tableModel.length; j++) {
          if (tableModel[j].field == selectModel[i]) {
            tmp.push(tableModel[j]);
            console.log(tableModel[j].field + " == " + selectModel[i]);
            flag = true;
            break;
          }
        }

        if (!flag) {
          tmp.push(this.allFields[selectModel[i]]);
        }
      }

      console.log(tmp);

      return tmp;
    },
    resetTest: function() {
      this.fieldsToDisplay = [];
    },
    timeFieldChanged: function() {
      if (this.currentConfig.config.timefield == "_____________________") {
        this.currentConfig.config.timefield = "";
      }

      if (
        !this.currentConfig.config.timefield ||
        this.currentConfig.config.timefield ==
          "I don't want to use the Time Filter"
      ) {
        // this.currentConfig.graphicChecked = false;
        // this.currentConfig.timeSelectorChecked = false;
      }
    },
    goToStep: function(step) {
      console.log("go to step" + step);
      if (step == 2) {
      }

      this.step = step;
    },
    computeFields: function() {
      this.timeFields = {};
      this.geoFields = {};
      this.allFields = {
        _id: {
          field: "_id",
          type: "_id",
          title: "_id"
        },
        _index: {
          field: "_index",
          type: "_index",
          title: "_index"
        }
      };

      for (var idx in this.esMapping) {
        var indexMapping = this.esMapping[idx];
        if (indexMapping.obj != null) {
          if (indexMapping.obj.mappings.properties != null) {
            this.getRecMappings("", indexMapping.obj.mappings);
          } else {
            for (var _type in indexMapping.obj.mappings) {
              this.getRecMappings("", indexMapping.obj.mappings[_type]);
            }
          }
        } else {
        }
      }

      if (Object.keys(this.timeFields).length > 0) {
        this.timeFields["_____________________"] = {
          field: "_____________________"
        };
        this.timeFields["none"] = {
          field: "I don't want to use the Time Filter"
        };
        this.noTimeField = false;
      } else {
        this.noTimeField = true;
      }
    },
    getRecMappings: function(curpath, curstruct) {
      for (var i in curstruct.properties) {
        var curobj = curstruct.properties[i];
        if (curobj.properties != null)
          this.getRecMappings(curpath + i + ".", curobj);
        else {
          var obj = {
            field: curpath + i,
            type: curobj.type,
            title: curpath + i
          };

          this.allFields[curpath + i] = obj;

          if (obj.type == "date") this.timeFields[curpath + i] = obj;

          if (obj.type == "geo_point") this.geoFields[curpath + i] = obj;
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

.table-display {
  width: 100%;
  border-spacing: 0px !important;
  font-size: 12px;
}

.thead-display th {
  padding-bottom: 10px;
  text-align: left;
}

.table-display tr {
}

.table-display td {
  padding: 5px 18px 5px 0px;
  border-top: solid 1px #ebeef5;
  color: #606266;
}

.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.handle {
  cursor: move;
}

.ghost {
  opacity: 0.2;
  /* background-color: #409eff !important; */
}

.sortable-chosen {
  color: white !important;
  background-color: #1070ff !important;
}

#config-table-editor .padding-right {
  padding-right: 10px;
}
</style>