<template>
  <el-col
    id="user-queries-editor"
    :span="fieldsToFilterEmpty ? 12 : 24"
    :class="fieldsToFilterEmpty ? 'padding-right' : ''"
  >
    <el-card shadow="never">
      <el-row>
        <el-col :span="fieldsToFilterEmpty ? 12 : 6">
          <el-switch
            v-model="currentConfig.queryBarChecked"
            active-text="Query bar"
            @change="query_bar_changed"
          ></el-switch>
        </el-col>
        <el-col :span="fieldsToFilterEmpty ? 12 : 6">
          <el-switch
            v-model="currentConfig.queryFilterChecked"
            active-text="Query filter"
            @change="query_filter_changed"
          ></el-switch>
        </el-col>
      </el-row>

      <el-row v-if="currentConfig.queryFilterChecked">
        <el-button @click="setFocus('fieldsToFilter')" type="text">Fields to filter</el-button>
      </el-row>
      <el-row v-if="currentConfig.queryFilterChecked">
        <el-col
          :span="fieldsToFilterEmpty ? 24 : 12"
          :class="fieldsToFilterEmpty ? '' : 'padding-right'"
        >
            <!-- allow-create -->
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
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <draggable
                @change="draggableChanged('filter')"
                v-bind="dragOptionsFilters"
                v-model="currentConfig.config.queryfilters"
                tag="tbody"
                handle=".handle"
              >
                <tr v-for="(item, index) in currentConfig.config.queryfilters" :key="index">
                  <td>{{item.field}}</td>
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
        <el-col :span="12" v-if="filterFieldToConfigure">
          <el-card shadow="never">
            <el-row>

              <el-col :span="12" class="padding-right">
                <el-row>
                  <el-button @click="setFocus('label')" type="text">Label</el-button>
                </el-row>
                <el-row>
                  <el-input
                    ref="label"
                    placeholder="Label displayed"
                    v-model="filterFieldToConfigure.title"
                    size="mini"
                  ></el-input>
                </el-row>
              </el-col>
              <el-col :span="12">
                <el-row>
                  <el-button @click="setFocus('default')" type="text">Default</el-button>
                </el-row>
                <el-row>
                  <el-input
                    ref="default"
                    placeholder="Default value"
                    v-model="filterFieldToConfigure.default"
                    size="mini"
                  ></el-input>
                </el-row>
                
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-row>
                  <el-button @click="setFocus('type')" type="text">Type</el-button>
                </el-row>
                <el-row>
                  <el-select
                    size="mini"
                    v-model="filterFieldToConfigure.type"
                    placeholder="Please select a type"
                  >
                    <el-option
                      v-for="(type, index) in queryFilterOptions"
                      :label="type.label"
                      :value="type.value"
                      :key="index"
                    ></el-option>
                  </el-select>
                </el-row>
              </el-col>
            </el-row>
            <el-row v-if="filterFieldToConfigure.type == 'selecter'">
              <el-col :span="12">
                <el-row>
                  <el-button type="text">Options</el-button>
                      <el-popover
                        placement="left-end"
                        title="Format Options"
                        width="250"
                        trigger="hover">
                        <el-row>Each line represents an <b>Option</b></el-row>
                        <el-row>There are 2 ways to create an <b>Option</b></el-row>
                        <el-row> <i class="el-icon-caret-right" style="margin-left:5px; margin-right:5px"></i> <i>value=label </i></el-row>
                        <el-row> <i class="el-icon-caret-right" style="margin-left:5px; margin-right:5px"></i> <i>value </i></el-row>
                        
                        
                        <el-button slot="reference" type="text" icon="el-icon-info" style="margin-left:15px;"></el-button>
                      </el-popover>
                </el-row>
              </el-col>
            </el-row>
            <el-row v-if="filterFieldToConfigure.type == 'selecter'">
               <editor
                v-model="selecterOptions"
                @init="editorInit"
                lang="text"
                theme="chrome"
                width="99%"
                style="border: solid 1px #c0c4cc;"
                height="200"
              ></editor>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </el-col>
</template>
<script>
import Vue from "vue";
import axios from "axios";
import YAML from "js-yaml";
import _ from "lodash";

export default {
  field: "UserQueries",
  data() {
    return (
      window.__FORM__ || {
        formLabelWidth: "120px",
        fieldsToFilter: [],
        filterFieldToConfigure: null,
        queryFilterOptions: [
          {
            value: "selecter",
            label: "Selecter"
          },
          {
            value: "text",
            label: "Free Text"
          }
        ],
        selecterOptions: '',
        inputValue: "",
        inputVisible: false,
      }
    );
  },
  components: {
    editor: require("vue2-ace-editor")
  },
  computed: {
    curConfigIn: function() {
      return this.currentConfig;
    },
    fieldList: function() {
      return this.currentConfig.config.headercolumns.map(x => x.field);
    },
    fieldsToFilterEmpty: function() {
      return !(
        this.currentConfig.queryFilterChecked &&
        this.currentConfig.config.queryfilters &&
        this.currentConfig.config.queryfilters.length > 0
      );
    },
    filterFieldToConfigureID() {
      if (this.filterFieldToConfigure == null)
        return null
      return this.filterFieldToConfigure.field
    },
    dragOptionsFilters() {
      return {
        animation: 0,
        group: "filters",
        disabled: false,
        ghostClass: "ghost"
      };
    }
  },
  watch: {
    filterFieldToConfigureID: {
      handler: function() {
        if(this.filterFieldToConfigure.selectOptions != null)
          this.selecterOptions = this.filterFieldToConfigure.selectOptions.join('\r\n')
        else
          this.selecterOptions = ''
      },
    },
    selecterOptions: {
      handler: function() {
        if(this.filterFieldToConfigure.selectOptions == null) 
          this.filterFieldToConfigure.selectOptions = []
        if(this.selecterOptions.trim() != this.filterFieldToConfigure.selectOptions.join('\r\n')) {
          this.selecterOptionsToConfig()
        }
      }
    }
  },
  props: {
    currentConfig: { type: Object },
    allFields: { type: Object }
  },
  mounted: function() {
    this.prepareData();
  },
  methods: {
    prepareData() {
      console.log('prepare data')
      console.log(this.currentConfig.config.queryfilters)
      if (this.currentConfig.config.queryfilters != null) {
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
    },
    selecterOptionsToConfig: _.debounce(function() {
      this.filterFieldToConfigure.selectOptions = this.selecterOptions.trim().split('\r\n')
    }, 500),
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
    query_filter_changed: function() {
      if (this.currentConfig.queryFilterChecked)
        this.currentConfig.queryBarChecked = false;
    },
    query_bar_changed: function() {
      if (this.currentConfig.queryBarChecked)
        this.currentConfig.queryFilterChecked = false;
    },
    configureQueryFilter: function(item) {
      this.filterFieldToConfigure = item;
    },
    selectFieldsToFilterChanged: function(val) {
      let tmp = JSON.parse(JSON.stringify(this.currentConfig.config.queryfilters));
      this.currentConfig.config.queryfilters = [];

      if(val.length == 0) 
        return

      for(var i = 0; i < val.length; i++) {
        let flag = false;
        for(var j = 0; j < tmp.length; j++) {
          if(val[i] == tmp[j].field) {
            this.currentConfig.config.queryfilters.push(tmp[j])
            flag = true
            break
          }
        }

        if(!flag) {
          this.currentConfig.config.queryfilters.push(this.allFields[val[i]])
        }
      }
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
    handleClose: function(tag) {
      this.selecterOptions.splice(
        this.selecterOptions.indexOf(tag),
        1
      );
    },
    handleInputConfirm: function() {
      let inputValue = this.inputValue;
      if (this.selecterOptions == undefined)
        this.selecterOptions = [];
      if (inputValue) {
        this.selecterOptions.push(inputValue);
      }
      this.inputVisible = false;
      this.inputValue = "";
    },
    editorInit: function(editor) {
      // eslint-disable-line
      require("brace/ext/language_tools"); //language extension prerequsite...
      require("brace/mode/html");
      require("brace/mode/yaml");
      require("brace/mode/javascript"); //language
      require("brace/mode/less");
      require("brace/theme/chrome");
      require("brace/snippets/javascript"); //snippet
    },
  }
};
</script>
<style>
#user-queries-editor .padding-right {
  padding-right: 10px;
}
</style>