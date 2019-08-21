<template>
  
  
  <el-dialog 
      width="80%" 
      :title="'Create Application'"
      :visible.sync="dialogFormVisible"
      :before-close="closeDialog"
      :close-on-click-modal="false"
      append-to-body>  

      {{curConfig}}

    
  </el-dialog>
</template>
<script>
//import axios from "axios";
import freetextdetails from "@/components/FreeTextDetails";
import formfieldeditor from "@/components/FormFieldEditor";
import queryfiltereditor from "@/components/QueryFilterEditor";
import estableeditor from "@/components/ConfigDetailsESTableEditor";
import Vue from "vue";
import axios from "axios";
import rison from "rison";
import YAML from "js-yaml";

Vue.component("FreeTextDetails", freetextdetails);
Vue.component("FormFieldEditor", formfieldeditor);
Vue.component("QueryFilterEditor", queryfiltereditor);
Vue.component("ESTableEditor", estableeditor);

function transformObject(obj) {
  return rison.encode(obj);
}

export default {
  name: "ConfigDetails",
  data() {
    return (
      window.__FORM__ || {
        // curConfig: {},
        dialogFormVisible: false,
        
      }
    );
  },
  components: {
    editor: require("vue2-ace-editor")
  },
  computed: {
    curConfig: {
      get () {
        return this.$store.getters.appConfigObj
      },
      set (value) {
        this.$store.commit('setAppConfigObj', value)
      }
    }
  },
  watch: {
    
  },
  props: {
    
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    
    prepareData() {
      this.dialogFormVisible = true
    },
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    
  }
};
</script>
<style>
.el-form-item {
  margin-bottom: 5px !important;
}
.searchfield {
  width: 150px !important;
}
.addbutton {
}
</style>