<template>
  <div id="file-system-editor">
    <el-card>
      <!-- <h1>{{fieldList}}</h1> -->
      <el-form>
          <el-row>
                <el-col :span="24">
                <el-form-item label="Reg Ex" :label-width="formLabelWidth">
                  <el-input size="mini" v-model="currentConfig.config.regexNO" autocomplete="off"></el-input>
                </el-form-item>
                </el-col>
                
              </el-row>

              <el-row>
              <el-form-item label="Root Path" :label-width="formLabelWidth">
                  <el-input size="mini" v-model="currentConfig.config.rootpath" autocomplete="off"></el-input>
                </el-form-item>
              </el-row>        
      </el-form>
      <div></div>
    </el-card>
  </div>
</template>
<script>
import Vue from "vue";
import axios from "axios";
// import _ from "lodash";

import filesystemeditor from "@/components/appConfigEditor/FileSystemEditor";
Vue.component("FileSystemEditor", filesystemeditor);

export default {
  field: "FileSystemEditor",
  data() {
    return (
      window.__FORM__ || {
        formLabelWidth: "120px",
        formFielfEditorVisible: false
        
      }
    );
  },
  computed: {
    curConfigIn: function() {
      return this.currentConfig;
    }
  },
  watch: {},
  props: {
    currentConfig: { type: Object }
  },
  created: function() {
    //this.prepareData();
  },
  methods: {
    
  }
};
</script>
<style>
#form-editor .padding-right {
  padding-right: 10px;
}
</style>