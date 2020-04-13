<template>
  <div id="upload-editor">
    <el-card>
      <!-- <h1>{{fieldList}}</h1> -->
      <el-form>
          <el-row>
                <el-col span="12">
                <el-form-item label="Queue" :label-width="formLabelWidth">
                  <el-input size="mini" v-model="currentConfig.config.queue" autocomplete="off"></el-input>
                </el-form-item>
                </el-col>
                <el-col span="12">                  
                <el-form-item label="File Types" :label-width="formLabelWidth">
                  <el-input size="mini" placeholder=".docx,.doc or nothing for all types" v-model="currentConfig.config.filetypes" autocomplete="off"></el-input>
                </el-form-item>                              
                </el-col>
              </el-row>

              <el-row>
              <el-form-item label="Tip" :label-width="formLabelWidth">
                  <el-input size="mini" v-model="currentConfig.config.tip" autocomplete="off"></el-input>
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

import uploadeditor from "@/components/appConfigEditor/UploadEditor";
Vue.component("UploadEditor", uploadeditor);

export default {
  field: "UploadEditor",
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
    this.prepareData();
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