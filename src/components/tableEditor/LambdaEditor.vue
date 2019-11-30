<template>
  <el-dialog
    width="80%"
    :title="title"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    class="bhd-tech-editor"
  >
    <el-form v-model="newRec._source">
      <el-card shadow="hover" :body-style="{ padding: '10px' }">
        <el-form-item label="File" :label-width="formLabelWidth">
          <el-input :disabled="true" size="mini" v-model="newRec._source.file" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="Function" :label-width="formLabelWidth">
          <el-input :disabled="true" size="mini" v-model="newRec._source.function" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="Return" :label-width="formLabelWidth">
          <el-input :disabled="true" size="mini" v-model="newRec._source.return" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="Topics" :label-width="formLabelWidth">
          <el-input :disabled="true" size="mini" v-model="newRec._source.topics" autocomplete="off"></el-input>
        </el-form-item>
        <el-row>
            <el-col :span="6">
              <el-form-item label="Duration" :label-width="formLabelWidth">
                {{newRec._source.duration}} ms
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Runs" :label-width="formLabelWidth">
                {{newRec._source.runs}}
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Errors" :label-width="formLabelWidth">
                {{newRec._source.errors}}
              </el-form-item>
            </el-col>
        </el-row>
        <el-table
          size="mini"
          :data="logs"
          height="250"
          style="width: 100%">
          <el-table-column
            prop="line"
            label="Logs">
          </el-table-column>
          
        </el-table>
      </el-card>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <!--el-button
        v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
        type="primary"
        :disabled="!recchanged"
        @click="saveRecord()"
      >{{this.$t("buttons.confirm")}}</el-button-->
    </span>
  </el-dialog>
</template>

<script>
import Vue from "vue";

import YAML from "js-yaml";
import axios from "axios";

export default {
  name: "lambdaEditor",
  data: () => ({
    orgRec: null,
    newRec: null,
    strOrgRec: "",
    strNewRec: "",
    orgName: "",
    newName: "",
    logs:[],
    formLabelWidth: "120px",
    changed: false,
    dialogFormVisible: false,
    title: "Lambda Status",
    
  }),
  computed: {
    recordin: function() {
      return this.record;
    },
    recordstr: function() {
      return JSON.stringify(this.record);
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
    },
    editMode: {
      type: String
    }
  },
  watch: {
    recordin: {
      handler: function() {
        this.prepareData();
      },
      deep: true
    }
  },
  created: function() {
    console.log("created event");
    this.prepareData();
  },
  components: {},
  methods: {
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    prepareData: function() {
      console.log("prepare data");
      this.dialogFormVisible = true;
      this.newRec = JSON.parse(JSON.stringify(this.record));
      this.orgRec = JSON.parse(JSON.stringify(this.record));
      this.logs=JSON.parse(this.record._source.logs);
      console.log(this.logs);
      var logs2=[]
      for(var i=0;i<this.logs.length;i++)
      {
        logs2.push({"line":this.logs[i]})
      }
      this.logs=logs2;
    },
    saveRecord: function() {
      if (!this.weatherActivated && this.newRec._source.weather != null) {
        delete this.newRec._source.weather;
      }

      /*this.$store.commit({
        type: "updateRecord",
        data: this.newRec
      });*/
      this.$notify({
        title: "Record saved.",
        type: "success",
        message: "The lambda has been succesfuly saved.",
        position: "bottom-right"
      });
      this.$emit("dialogcloseupdated");
    }
  }
};
</script>

<style >
.bhd-tech-editor .view-table {
  margin-bottom: 30px;
}
.bhd-tech-editor .screen-name-input {
  margin-bottom: 10px;
}

.bhd-tech-editor .add-view-button {
  margin-bottom: 30px;
}
</style>