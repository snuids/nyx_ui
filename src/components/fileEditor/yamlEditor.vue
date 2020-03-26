<template>
  <el-dialog
    close-on-press-escape	
    width="80%"
    top="5vh"
    :title="fileName"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    :show-close="false"
    class="lambda-editor"
    id="yamlEditor"
  >
    <span slot="title" class="dialog-header">
      <el-row type="flex" class="row-bg" justify="space-between">
        <el-col :span="12" style="text-align:left;">
          <h1 style=" color:white;">{{fileName}}</h1></el-col>
        <el-col :span="12" style="text-align:right;">
          <el-button :disabled="loading || !fileHasChanged" type="primary" size="mini" @click="save">{{this.$t("buttons.save")}}</el-button>
          <el-button plain size="mini" @click="closeDialog">{{this.$t("buttons.quit")}}</el-button>
        </el-col>
      </el-row>
    </span>
      <editor
        v-loading="loading"
        v-model="localFile"
        id="test"
        @init="editorInit"
        lang="yaml"
        theme="chrome"
        width="99%"
        :height="($store.getters.containerSize.height-160)"
        style="border: solid 1px #c0c4cc;"
      ></editor>
      <div>
      </div>
  </el-dialog>
</template>

<script>
import YAML from "js-yaml";
import axios from "axios";

export default {
  name: "yamlEditor",
  data: () => ({
    dialogFormVisible: false,
    title: "yaml editor",
    localFileName: null,
    localFile: '',
    loading: true,
    _keyListener: null,
  }),
  components: {
    editor: require("vue2-ace-editor")
  },
  computed: {
    fileHasChanged: function() {
      return this.file!=this.localFile;
    },
  },
  props: {
    file: {
      type: String
    },
    fileName: {
      type: String
    },
    editMode: {
      type: String
    }
  },
  watch: {
    file: {
      handler: function() {
        this.prepareData();
      },
      deep: true
    }
  },
  created: function() {
    console.log("created event");
    this.localFile = ''
    this.dialogFormVisible = true;
  },
  mounted: function() {
    this._keyListener = e => {
        if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault(); // present "Save Page" from getting triggered.
            console.log(e)
            if(!this.loading && this.fileHasChanged)
              this.save();
        }
    };

    document.addEventListener('keydown', this._keyListener);
  },
  beforeDestroy: function() {
    console.log('beforeDestroy')
    document.removeEventListener('keydown', this._keyListener)
  },
  methods: {
    prepareData() {
      setTimeout(() => {
        this.localFile = this.file
        this.loading = false;
      }, 500);
    },
    save: function() {
      this.$emit("dialogsave", {
        file_name:this.fileName,
        data:this.localFile
      });
    },
    closeDialog: function() {
      this.$emit("dialogclose");
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

<style >
#yamlEditor .el-dialog__body{
  padding:0px 0px;
}

</style>