<template>
  <el-dialog
    width="80%"
    :title="$t('generictable.modifyrecord')"
    v-model="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    class="table-details"
  >
    <el-tabs v-model="activeName" @tab-click="refresh">
      <el-tab-pane :label="$t('generictable.fields')" name="first">
        <el-form >
          <el-row v-for="(line,index) in fields" :key="index">
            <el-col :span="24/modulo" v-for="(field,index2) in line" :key="index2">
              <el-form-item :label="field.key" :label-width="formLabelWidth">
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="field.value"
                  placement="right"
                  :open-delay="1000"
                  v-if="typeof field.value == 'string'"
                >
                  <el-input
                    size="small"
                    v-model="field.value"
                    autocomplete="off"
                    @blur="valueChanged(field)"
                  ></el-input>
                </el-tooltip>
                <el-input-number
                  v-if="typeof field.value == 'number'"
                  @change="valueChanged(field)"
                  size="small"
                  v-model="field.value"
                  autocomplete="off"
                >{{field.key}}</el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <el-tab-pane
        :label="$t('generictable.original')"
        name="Second"
        v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
      >
        <editor
          v-model:value="strOrgRec"
          id="test"
          @init="editorInitRO"
          lang="yaml"
          :theme="aceTheme"
          style="border: solid 1px #c0c4cc; height: 600px; width: 99%;"
        ></editor>
        <div>&nbsp;</div>
      </el-tab-pane>

      <el-tab-pane
        :label="$t('generictable.new')"
        name="fifth"
        v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
      >
        <editor
          v-model:value="strNewRec"
          id="test"
          @init="editorInit"
          lang="yaml"
          :theme="aceTheme"
          style="border: solid 1px #c0c4cc; height: 600px; width: 99%;"
        ></editor>
        <div>&nbsp;</div>
      </el-tab-pane>
    </el-tabs>
    <template #footer><span class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <el-button
        v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
        type="primary"
        :disabled="!recchanged"
        @click="saveRecord()"
      >{{this.$t("buttons.confirm")}}</el-button>
    </span></template>
  </el-dialog>
</template>

<script>
import { VAceEditor } from "vue3-ace-editor";
import YAML from "js-yaml";
import aceThemeMixin from "@/mixins/aceTheme";

export default {
  mixins: [aceThemeMixin],
  name: "GenericTableDetails",
  data: () => ({
    dialogFormVisible: false,
    activeName: "first",
    orgRec: null,
    newRec: null,
    strOrgRec: "",
    strNewRec: "",
    formLabelWidth: "180px",
    fields: [],
    changed: false,
    modulo: 2
  }),
  computed: {
    recordin: function() {
      return this.record;
    },
    recordstr: function() {
      return JSON.stringify(this.record);
    },
    newrecordstr: function() {
      return JSON.stringify(this.newRec);
    },
    newrecordstryaml: function() {
      return this.strNewRec;
    },
    recchanged: function() {
      return JSON.stringify(this.recordin) != JSON.stringify(this.newRec);
    }
  },
  props: {
    record: {
      type: Object
    },
    config: {
      type: Object
    }
  },
  watch: {
    recordin: {
      handler: function() {
        this.prepareData();
      },
      deep: true
    },
    /*,
    newrecordstr: {
      handler: function() {
        console.log('1')
        //this.strNewRec = YAML.safeDump(this.newRec,10)
      },
      deep: true
    }
     */
    newrecordstryaml: {
      handler: function() {
        //console.log('2')
        this.newRec = YAML.safeLoad(this.strNewRec);
      },
      deep: true
    }
  },
  mounted: function() {
    this.prepareData();
  },
  components: { editor: VAceEditor },
  methods: {
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    refresh: function() {
      this.strNewRec = "";
      this.strOrgRec = "";

      this.$nextTick(() => {
        this.refresh2();
      });
    },
    refresh2: function() {
      this.newRec = JSON.parse(JSON.stringify(this.record));
      this.orgRec = JSON.parse(JSON.stringify(this.record));

      this.strNewRec = YAML.safeDump(this.newRec, 10);
      this.strOrgRec = YAML.safeDump(this.orgRec, 10);
    },
    editorInitRO: function(editor) {
      require("ace-builds/src-noconflict/ext-language_tools"); //language extension prerequsite...
      require("ace-builds/src-noconflict/mode-html");
      require("ace-builds/src-noconflict/mode-yaml");
      require("ace-builds/src-noconflict/mode-javascript"); //language
      require("ace-builds/src-noconflict/mode-less");
      require("ace-builds/src-noconflict/theme-chrome");
      require("ace-builds/src-noconflict/theme-tomorrow_night");
      require("ace-builds/src-noconflict/snippets/javascript"); //snippet

      editor.setReadOnly(true);
    },
    editorInit: function() {
      // eslint-disable-line
      require("ace-builds/src-noconflict/ext-language_tools"); //language extension prerequsite...
      require("ace-builds/src-noconflict/mode-html");
      require("ace-builds/src-noconflict/mode-yaml");
      require("ace-builds/src-noconflict/mode-javascript"); //language
      require("ace-builds/src-noconflict/mode-less");
      require("ace-builds/src-noconflict/theme-chrome");
      require("ace-builds/src-noconflict/theme-tomorrow_night");
      require("ace-builds/src-noconflict/snippets/javascript"); //snippet
    },
    valueChanged: function(item) {
      this.newRec._source[item.key] = item.value;
      this.changed = true;
    },
    prepareData: function() {
      this.dialogFormVisible = true;
      console.log("prepare data");
      console.log(this.record._id);
      this.strNewRec = "";
      this.strOrgRec = "";

      this.newRec = JSON.parse(JSON.stringify(this.record));
      this.orgRec = JSON.parse(JSON.stringify(this.record));

      this.strNewRec = YAML.safeDump(this.newRec, 10);
      this.strOrgRec = YAML.safeDump(this.orgRec, 10);

      console.log(this.newRec._id);
      console.log(this.orgRec._id);

      this.changed = false;
      var lines = [];
      var curline = [];

      for (var i in this.record._source) {
        var rec = this.record._source[i];
        if (typeof rec == "string" || typeof rec == "number") {
          curline.push({ key: i, value: rec });
          if (curline.length >= this.modulo) {
            lines.push(curline);
            curline = [];
          }
        }
      }
      if (curline.length > 0) {
        lines.push(curline);
        curline = [];
      }
      this.fields = lines;
      //alert(JSON.stringify(lines));
    },
    saveRecord: function() {
      this.$store.commit({
        type: "updateRecord",
        data: this.newRec
      });
      this.$emit("dialogcloseupdated");
      this.$notify({
        title: this.$t("rep.record_saved"),
        type: "success",
        message: this.$t("rep.record_updated"),
        position: "bottom-right"
      });
    }
  }
};
</script>
<style>
.table-details .el-form-item__label{
  color: #464646;
  font-weight:600;
}
.table-details .el-form-item__content{
  text-align: left;
}

</style>