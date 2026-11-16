<template>
  <el-dialog
    width="80%"
    :title="$t('generictable.modifyrecord')"
    v-model="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    class="table-details"
  >
    <el-alert
      v-if="conflict"
      type="warning"
      :closable="false"
      show-icon
      class="table-conflict"
    >
      <p class="table-conflict-text">{{ $t("generictable.conflict_body") }}</p>
      <p class="table-conflict-fields" v-if="conflict.keys.length">
        {{ $t("generictable.conflict_fields", { fields: conflict.keys.join(", ") }) }}
      </p>
      <div class="table-conflict-actions">
        <el-button size="small" type="primary" @click="reloadConflict()">
          {{ $t("generictable.conflict_reload") }}
        </el-button>
        <el-button size="small" @click="forceSave()">
          {{ $t("generictable.conflict_overwrite") }}
        </el-button>
      </div>
    </el-alert>
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
import "@/utils/aceModules";
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
    saving: false,
    conflict: null,
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

      editor.setReadOnly(true);
    },
    editorInit: function() {
      // eslint-disable-line
    },
    valueChanged: function(item) {
      this.newRec._source[item.key] = item.value;
      this.changed = true;
    },
    prepareData: function() {
      this.dialogFormVisible = true;
      this.conflict = null;
      this.openRecord(this.record);
    },
    openRecord: function(record) {
      // The editor works on a copy: `orgRec` is what the record held when it was opened, and the
      // dialog only allows a save when the two differ. `_seq_no`/`_primary_term` travel with the
      // record and are what the write asserts.
      this.strNewRec = "";
      this.strOrgRec = "";

      this.newRec = JSON.parse(JSON.stringify(record));
      this.orgRec = JSON.parse(JSON.stringify(record));

      this.strNewRec = YAML.safeDump(this.newRec, 10);
      this.strOrgRec = YAML.safeDump(this.orgRec, 10);

      this.changed = false;
      this.buildFields(this.newRec);
    },
    buildFields: function(record) {
      var source = (record && record._source) || {};
      var lines = [];
      var curline = [];

      for (var i in source) {
        var rec = source[i];
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
      }
      this.fields = lines;
    },
    saveRecord: function() {
      this.conflict = null;
      this.saving = true;
      // The action, not the mutation: it hands back the promise, so a refused write is told
      // apart from a saved one instead of closing the dialog on a lie.
      return this.$store
        .dispatch("saveRecord", this.newRec)
        .then(() => this.saved())
        .catch(error => this.saveFailed(error))
        .finally(() => {
          this.saving = false;
        });
    },
    saved: function() {
      this.$emit("dialogcloseupdated");
      this.$notify({
        title: this.$t("rep.record_saved"),
        type: "success",
        message: this.$t("rep.record_updated"),
        position: "bottom-right"
      });
    },
    saveFailed: function(error) {
      var response = error && error.response;
      if (response && response.status === 409) {
        // Someone saved between the read and this write: nothing was stored. Show the fields
        // that changed meanwhile and let the operator choose — the dialog stays open.
        this.conflict = this.describeConflict((response.data || {}).data);
        return;
      }
      this.$notify({
        title: this.$t("rep.record_error"),
        message: (response && response.data && response.data.error) || this.$t("ui.query_failed"),
        type: "error",
        position: "bottom-right"
      });
    },
    describeConflict: function(current) {
      var mine = (this.newRec && this.newRec._source) || {};
      var theirs = (current && current._source) || {};
      var keys = [];
      Object.keys(theirs).forEach(key => {
        if (JSON.stringify(mine[key]) !== JSON.stringify(theirs[key])) keys.push(key);
      });
      return { record: current, keys: keys };
    },
    reloadConflict: function() {
      // Take the stored version: the dialog then edits what the index actually holds, and the
      // next save asserts its version.
      var current = (this.conflict || {}).record;
      this.conflict = null;
      if (!current) return;
      this.openRecord(current);
    },
    forceSave: function() {
      // An explicit overwrite, asked for by the operator who just read the warning. The version
      // is dropped so the API accepts it as the last write — the same thing the console did
      // silently before this change, now a decision.
      var forced = JSON.parse(JSON.stringify(this.newRec));
      delete forced._seq_no;
      delete forced._primary_term;
      this.newRec = forced;
      return this.saveRecord();
    }
  }
};
</script>
<style>
.table-details .el-form-item__label{
  /* `#464646` was the light theme's grey, written in hard: on a dark surface (#1f2430) the
     contrast fell to 1.6:1 and the field names of the record editor were unreadable. The
     Element variable switches with the theme (#606266 in light, #cfd3dc in dark, i.e. 10.4:1
     here). */
  color: var(--el-text-color-regular);
  font-weight:600;
}
.table-details .el-form-item__content{
  text-align: left;
}

</style>