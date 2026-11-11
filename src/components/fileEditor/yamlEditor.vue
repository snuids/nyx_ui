<template>
  <el-dialog
    close-on-press-escape	
    width="80%"
    top="5vh"
    :title="fileName"
    v-model="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    :show-close="false"
    class="lambda-editor"
    id="yamlEditor"
  >
    <template #title><span class="dialog-header">
      <el-row type="flex" class="row-bg" justify="space-between">
        <el-col :span="12" style="text-align:left;">
          <h1 style=" color:white;">{{fileName}}</h1></el-col>
        <el-col :span="12" style="text-align:right;">
          <el-button :disabled="loading || !fileHasChanged" type="primary" size="small" @click="save">{{this.$t("buttons.save")}}</el-button>
          <el-button plain size="small" @click="closeDialog">{{this.$t("buttons.quit")}}</el-button>
        </el-col>
      </el-row>
    </span></template>
      <editor
        v-loading="loading"
        v-model:value="localFile"
        id="test"
        @init="editorInit"
        lang="yaml"
        :theme="aceTheme"
        :style="'border: solid 1px #c0c4cc; width: 99%; height: ' + ($store.getters.containerSize.height - 160) + 'px;'"
      ></editor>
      <div>
      </div>
  </el-dialog>
</template>

<script>
import "@/utils/aceModules";
import { VAceEditor } from "vue3-ace-editor";
import { i18n } from "../../i18n-setup";
import aceThemeMixin from "@/mixins/aceTheme";

export default {
  mixins: [aceThemeMixin],
  name: "yamlEditor",
  data: () => ({
    dialogFormVisible: false,
    title: i18n.global.t("ui.yaml_editor"),
    localFileName: null,
    localFile: '',
    loading: true,
    keyListener: null,
  }),
  components: {
    editor: VAceEditor
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
    this.keyListener = e => {
        if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault(); // present "Save Page" from getting triggered.
            console.log(e)
            if(!this.loading && this.fileHasChanged)
              this.save();
        }
    };

    document.addEventListener('keydown', this.keyListener);
  },
  beforeUnmount: function() {
    console.log('beforeUnmount')
    document.removeEventListener('keydown', this.keyListener)
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
    editorInit: function() {
      // eslint-disable-line
    },
  }
};
</script>

<style >
#yamlEditor .el-dialog__body{
  padding:0px 0px;
}

</style>