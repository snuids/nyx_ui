<template>
  <el-dialog
    width="80%"
    :title="$t('generictable.modifyrecord')"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeName" @tab-click="refresh">
      <el-tab-pane :label="$t('generictable.fields')" name="first">
        <el-form>
          <el-row>
            <el-col :span="12">
              <el-form-item label="ID" :label-width="formLabelWidth">
                <el-input :disabled="true" size="mini" v-model="record._id" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Index" :label-width="formLabelWidth">
                <el-input :disabled="true" size="mini" v-model="record._index" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-for="(line,index) in fields" :key="index">
            <el-col :span="24/modulo" v-for="(field,index2) in line" :key="index2">
              <el-form-item :label="field.key" :label-width="formLabelWidth">
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="field.value"
                  placement="right"
                  v-if="typeof field.value == 'string'"
                >
                  <el-input
                    size="mini"
                    v-model="field.value"
                    autocomplete="off"
                    @blur="valueChanged(field)"
                  ></el-input>
                </el-tooltip>
                <el-input-number
                  v-if="typeof field.value == 'number'"
                  @change="valueChanged(field)"
                  size="mini"
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
          v-model="strOrgRec"
          id="test"
          @init="editorInitRO"
          lang="yaml"
          theme="chrome"
          width="99%"
          style="border: solid 1px #c0c4cc;"
          height="600"
        ></editor>
        <div>&nbsp;</div>
      </el-tab-pane>

      <el-tab-pane
        :label="$t('generictable.new')"
        name="fifth"
        v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
      >
        <editor
          v-model="strNewRec"
          id="test"
          @init="editorInit"
          lang="yaml"
          theme="chrome"
          width="99%"
          style="border: solid 1px #c0c4cc;"
          height="600"
        ></editor>
        <div>&nbsp;</div>
      </el-tab-pane>
    </el-tabs>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <el-button
        v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
        type="primary"
        :disabled="!recchanged"
        @click="saveRecord()"
      >{{this.$t("buttons.confirm")}}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import YAML from "js-yaml";

export default {
  name: "GenericTableDetails",
  data: () => ({
    dialogFormVisible: false,
    activeName: "first",
    orgRec: null,
    newRec: null,
    strOrgRec: "",
    strNewRec: "",
    formLabelWidth: "120px",
    fields: [],
    changed: false,
    modulo: 3
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
  components: {
    editor: require("vue2-ace-editor")
  },
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
      require("brace/ext/language_tools"); //language extension prerequsite...
      require("brace/mode/html");
      require("brace/mode/yaml");
      require("brace/mode/javascript"); //language
      require("brace/mode/less");
      require("brace/theme/chrome");
      require("brace/snippets/javascript"); //snippet

      editor.setReadOnly(true);
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
        title: "Record saved.",
        type: "success",
        message: "Record updated.",
        position: "bottom-right"
      });
    }
  }
};
</script>