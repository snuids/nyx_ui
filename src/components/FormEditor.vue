<template>
  <div id="form-editor">
    <el-card>
      <!-- <h1>{{fieldList}}</h1> -->
      <div>
        <el-row style="text-align:left;">
          <el-col :span="7">
            <el-row>
              <el-button @click="setFocus('formtitle')" type="text">Form title</el-button>
            </el-row>
            <el-row>
              <el-input
                size="mini"
                v-model="currentConfig.config.formtitle"
                ref="formtitle"
                autocomplete="off"
              ></el-input>
            </el-row>
          </el-col>
          <el-col :offset="3" :span="6">
            <el-row>
              <el-button type="text">Mode</el-button>
            </el-row>
            <el-row>
              <el-radio-group v-model="currentConfig.config.formmode" size="mini" ref="mode">
                <el-radio-button label="table">Table</el-radio-button>
                <el-radio-button label="message">Message</el-radio-button>
              </el-radio-group>
            </el-row>
          </el-col>
          <el-col :offset="1" :span="7" v-if="currentConfig.config.formmode=='table'">
            <el-row>
              <el-button @click="setFocus('index')" type="text">Index</el-button>
            </el-row>
            <el-row>
              <el-input
                size="mini"
                v-model="currentConfig.config.index"
                ref="index"
                autocomplete="off"
              ></el-input>
            </el-row>
          </el-col>
          <el-col :offset="1" :span="7" v-else>
            <el-row>
              <el-button @click="setFocus('index')" type="text">Destination</el-button>
            </el-row>
            <el-row>
              <el-input
                size="mini"
                placeholder="/queue/QUEUE_NAME or /topic/TOPIC_NAME"
                v-model="currentConfig.config.destination"
                ref="index"
                autocomplete="off"
              ></el-input>
            </el-row>
          </el-col>
        </el-row>

        <el-row>
              <el-button type="text">Fields</el-button>
        </el-row>
        <el-row>
          <el-card shadow="never" style="padding-bottom: 20px;">

          <el-col :span="4">
            <el-button size="mini" @click="handleAddField()">Add Field</el-button>
          </el-col>
          <el-col :span="20">
            <FormFieldEditor
              :currentField="currentField"
              :title="'Form Field Edition'"
              v-if="formFielfEditorVisible"
              v-on:dialogclose="formFieldEditorClosed"
            ></FormFieldEditor>
            <el-table
              class="headertable"
              :data="currentConfig.config.headercolumns"
              border
              style="width: 100%"
            >
              <el-table-column prop="field" label="Field"></el-table-column>
              <el-table-column prop="title" label="Title"></el-table-column>
              <el-table-column prop="type" label="Type"></el-table-column>
              <el-table-column prop="default" label="Default"></el-table-column>
              <el-table-column prop="title" label="Action">
                <template slot-scope="scope2">
                  <el-button
                    size="mini"
                    circle
                    @click="handleEditField(scope2.$index, scope2.row)"
                    icon="el-icon-edit"
                  ></el-button>
                  <el-button
                    size="mini"
                    circle
                    type="danger"
                    @click="handleDeleteField(scope2.$index, scope2.row)"
                    icon="el-icon-delete"
                  ></el-button>

                  <el-button
                    size="mini"
                    circle
                    type="primary"
                    @click="handleMoveField(scope2.$index, scope2.row,false)"
                    icon="el-icon-arrow-down"
                    v-if="scope2.$index<currentConfig.config.headercolumns.length-1"
                  ></el-button>
                  <el-button
                    size="mini"
                    circle
                    type="primary"
                    @click="handleMoveField(scope2.$index, scope2.row,true)"
                    icon="el-icon-arrow-up"
                    v-if="scope2.$index>0"
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
          </el-card>
        </el-row>
      </div>
    </el-card>
  </div>
</template>
<script>
import Vue from "vue";
import axios from "axios";
// import _ from "lodash";

import formfieldeditor from "@/components/FormFieldEditor";
Vue.component("FormFieldEditor", formfieldeditor);

export default {
  field: "FormEditor",
  data() {
    return (
      window.__FORM__ || {
        formLabelWidth: "120px",
        formFielfEditorVisible: false,
        currentField: {}
      }
    );
  },
  computed: {
    curConfigIn: function() {
      return this.currentConfig;
    },
    fieldList: function() {
      return this.currentConfig.config.headercolumns.map(x => x.field);
    }
  },
  watch: {},
  props: {
    currentConfig: { type: Object }
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    prepareData() {
      if (this.currentConfig.config.formmode == null)
        this.currentConfig.config.formmode = "table";

      let tmp = JSON.parse(JSON.stringify(this.currentConfig.config));
      this.currentConfig.config = null;
      this.currentConfig.config = JSON.parse(JSON.stringify(tmp));
    },
    handleAddField() {
      if (this.currentConfig.config.headercolumns == undefined) {
        this.currentConfig.config.headercolumns = [];
      }

      this.currentField = {
        title: "title",
        field: "field"
      };
      this.formFielfEditorVisible = true;
    },
    handleEditField(index, row) {
      this.currentField = row;
      this.formFielfEditorVisible = true;
    },
    formFieldEditorClosed(field) {
      console.log(field);
      this.formFielfEditorVisible = false;

      let flag = false;

      for (var i in this.currentConfig.config.headercolumns) {
        if (this.currentConfig.config.headercolumns[i].field == field.field) {
          console.log("overwriting current header");
          flag = true;
        }
      }

      if (!flag) this.currentConfig.config.headercolumns.push(field);
    },
    handleMoveField(index, row, down) {
      this.currentConfig.config.headercolumns.splice(index, 1);
      if (down)
        this.currentConfig.config.headercolumns.splice(index - 1, 0, row);
      else this.currentConfig.config.headercolumns.splice(index + 1, 0, row);
    },
    handleDeleteField(index) {
      this.currentField = {};
      this.currentConfig.config.headercolumns.splice(index, 1);
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
    }
  }
};
</script>
<style>
#form-editor .padding-right {
  padding-right: 10px;
}
</style>