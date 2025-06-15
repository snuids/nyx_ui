<template>
  <el-dialog
    width="90%"
    :title="$t('generictable.modifyrecord')"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeName" @tab-click="refresh">
      <el-tab-pane :label="$t('generictable.fields')" name="first">        
        <el-form>
          <el-row v-if="editMode!='add' && editMode!='duplicate'">
            <el-col :span="12">              
              <el-form-item label="ID" :label-width="formLabelWidth"  >
                <el-input :disabled="true" size="mini" v-model="record._id" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row v-for="(line,index) in fields" :key="index">
            <el-col :span="24/modulo" v-for="(field,index2) in line" :key="index2">
              <el-form-item :label="field.key" :label-width="formLabelWidth" :style="{
        'white-space': 'nowrap',
        'overflow': 'hidden',
        'text-overflow': 'ellipsis',
        'max-width': '400px',
        'display': 'block'
      }">
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="field.value"
                  placement="right"
                  v-if="field.type == '1043'"
                >
                  <el-input
                    size="mini"
                    v-model="field.value"
                    autocomplete="off"
                    @blur="valueChanged(field)"
                  ></el-input>
                </el-tooltip>
                <el-input-number
                  v-else-if="field.type == '23' || field.type == '700'"
                  @change="valueChanged(field)"
                  size="mini"
                  v-model="field.value"
                  autocomplete="off"
                >{{field.key}}</el-input-number>
                <el-date-picker
                  v-else-if="field.type == '1082' || field.type == '1184' || field.type == '1114'"
                  v-model="field.value"
                  type="datetime"
                  size="mini"
                  placeholder="Select date and time"
                  default-time="12:00:00"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
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
import axios from "axios";
import moment from "moment";

export default {
  name: "PGGenericTableDetails",
  data: () => ({
    dialogFormVisible: false,
    loadedrecord: {},
    activeName: "first",
    formLabelWidth: "130px",
    fields: [],
    changed: false,
    modulo: 3,
    orgStringifiedRecord: ""
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
      return this.orgStringifiedRecord != JSON.stringify(this.fields);
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
    },
    tableSchema: {
      type: Array
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
  mounted: function() {
    this.prepareData();
  },
  components: {},
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
    refresh2: function() {},
    valueChanged: function(item) {},
    prepareData: function() {
      this.dialogFormVisible = true;
      console.log("prepare data");

      var url =
        this.$store.getters.apiurl +
        "pg_generic/" +
        this.config.config.index +
        "/" +
        this.config.config.pkey +
        "/" +
        this.record._id +
        "?token=" +
        this.$store.getters.creds.token+
        "&app="+this.config.rec_id;

      console.log("URL=" + url);
      console.log("MODE=" + this.editMode);

      if (this.editMode == "add") {
        var newobject = {};
        for (var rec in this.tableSchema) {
          var field = this.tableSchema[rec];
          if (this.config.config.pkey == field.col) continue;
          if (
            field.type == "1082" ||
            field.type == "1184" ||
            field.type == "1114"
          )
            newobject[field.col] = moment().toISOString();
          //new Date();
          else newobject[field.col] = "";
          newobject[field.col + "_$type"] = field.type;
        }
        this.record._id = "NEW";
        this.loadedrecord = newobject;
        this.prepareFields();
        return;
      }
      if (this.editMode == "duplicate") {
        this.loadedrecord = this.record;
        for (var rec in this.tableSchema) {
          var field = this.tableSchema[rec];
          if (this.config.config.pkey == field.col) continue;
          this.loadedrecord[field.col + "_$type"] = field.type;
        }

        this.record._id = "NEW";
        this.prepareFields();
        return;
      }      
      axios.get(url).then(response => {
        console.log("GET DONE");

        if (response.data.error == "") {
          this.loadedrecord = response.data.data;
          this.prepareFields();
        }
      });
    },
    prepareFields: function() {
      var lines = [];
      var curline = [];

      for (var i in this.loadedrecord) {
        var rec = this.loadedrecord[i];
        if (i.indexOf("_$type") >= 0) continue;
        if (i == this.config.config.pkey) continue;
        if (i == "_id") continue;

        if (typeof rec == "string" || typeof rec == "number") {
          var newobj = {
            key: i,
            value: rec,
            type: this.loadedrecord[i + "_$type"]
          };

          curline.push(newobj);
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
      console.log(this.fields);
      this.orgStringifiedRecord = JSON.stringify(this.fields);
    },
    saveRecord: function() {
      // this.$store.commit({
      //   type: "updatePGRecord",
      //   data: {"record":this.fields,"config":this.config.config}
      // });
      // this.$emit("dialogcloseupdated")
      // this.$notify({
      //   title: "Record saved.",
      //   type: "success",
      //   message: "Record updated.",
      //   position: "bottom-right"
      // });

      var record = [];
      for (var i = 0; i < this.fields.length; i++) {
        for (var j = 0; j < this.fields[i].length; j++)
          record.push(this.fields[i][j]);
      }

      console.log(record);

      var id = this.record._id;

      var url =
        this.$store.getters.apiurl +
        "pg_generic/" +
        this.config.config.index +
        "/" +
        this.config.config.pkey +
        "/" +
        this.record._id +
        "?token=" +
        this.$store.getters.creds.token;

      console.log("URL=" + url);
      console.log("MODE=" + this.editMode);

      axios
        .post(url, { record: record, mode: this.editMode })
        .then(response => {
          console.log("POST DONE");

          if (response.data.error == "") {
            this.$emit("dialogcloseupdated");
            this.$notify({
              title: "Record saved.",
              type: "success",
              message: "Record updated.",
              position: "bottom-right"
            });
          }
        });
    }
  }
};
</script>