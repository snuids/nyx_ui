<template>
  <el-dialog width="80%" :title="title" :visible.sync="visible" :before-close="closeDialog">
    <el-form v-if="visible" v-model="newRec" :rules="rules" ref="reportForm">
      <el-tabs v-model="activeName">
        <el-tab-pane label="Main" name="main">
          <el-row>
            <el-col :span="14">
              <el-form-item label="Title" :label-width="formLabelWidth" prop="title">
                <el-input size="mini" v-model="newRec.title" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Icon" :label-width="formLabelWidth">
                <el-input size="mini" v-model="newRec.icon" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-form-item>
                <v-icon :name="newRec.icon" scale="2.2" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="22">
              <el-form-item label="Description" :label-width="formLabelWidth">
                <el-input size="mini" v-model="newRec.description" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="8">
              <el-form-item label="Output" :label-width="formLabelWidth">
                <!--<el-input size="mini" v-model="newRec.output" autocomplete="off"></el-input>-->
                <div style="display:">
                  <el-tag
                    :key="tag"
                    v-for="tag in newRec.output"
                    closable
                    :disable-transitions="false"
                    @close="handleClose(tag)"
                  >{{tag}}</el-tag>
                  <el-input
                    class="input-new-tag"
                    v-if="inputVisible"
                    v-model="inputValue"
                    ref="saveTagInput"
                    size="mini"
                    @keyup.enter.native="handleInputConfirm"
                    @blur="handleInputConfirm"
                  ></el-input>
                  <el-button v-else class="button-new-tag" size="small" @click="showInput">+ Output</el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8" style="text-align:left">
              <el-form-item label="Generate PDF" label-width="160px">
                <el-checkbox v-model="newRec.generatePDF"></el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Type" :label-width="formLabelWidth">
                <el-select
                  size="mini"
                  v-model="newRec.reportType"
                  placeholder="Please select a type"
                >
                  <el-option label="Python" value="python"></el-option>
                  <el-option label="Jasper" value="jasper"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="22">
              <el-form-item
                label="Exec"
                :label-width="formLabelWidth"
                v-show="newRec.reportType==undefined || newRec.reportType=='python'"
              >
                <el-input size="mini" v-model="newRec.exec" autocomplete="off"></el-input>
              </el-form-item>
              <el-form-item
                label="Jasper Path"
                :label-width="formLabelWidth"
                v-show="newRec.reportType=='jasper'"
              >
                <el-input size="mini" v-model="newRec.jasper" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="Parameters" name="parameters">
          <el-row v-for="(param, index) in newRec.parameters" :key="index">
            <el-col :span="5">
              <el-form-item :label="'Parameter '+(index+1)" :label-width="formLabelWidth">
                <el-input size="mini" v-model="param.title" placeholder="Title" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="Type" :label-width="formLabelWidth">
                <el-select
                  v-model="param.type"
                  @change="param.value=null"
                  placeholder="Select"
                  size="mini"
                >
                  <el-option
                    v-for="item in options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Default" :label-width="formLabelWidth">
                <el-input
                  v-if="param.type=='number'"
                  type="number"
                  size="mini"
                  v-model="param.value"
                  placeholder="0"
                  autocomplete="off"
                ></el-input>
                <el-input
                  v-if="param.type=='text'"
                  type="text"
                  size="mini"
                  v-model="param.value"
                  placeholder="text"
                  autocomplete="off"
                ></el-input>
                <el-input
                  v-if="param.type=='date'"
                  type="text"
                  size="mini"
                  v-model="param.value"
                  placeholder="now-1d"
                  autocomplete="off"
                ></el-input>
                <el-input
                  v-if="param.type=='combo'"
                  type="text"
                  size="mini"
                  v-model="param.value"
                  placeholder="default"
                  autocomplete="off"
                ></el-input>
                <el-input
                  v-if="param.type=='combo'"
                  type="text"
                  size="mini"
                  v-model="param.combos"
                  placeholder="items separated by a comma"
                  autocomplete="off"
                ></el-input>

                <el-input
                  v-if="param.type=='interval'"
                  type="text"
                  size="mini"
                  v-model="param.value"
                  placeholder="now-1d:now"
                  autocomplete="off"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="Hidden" :label-width="formLabelWidth">
                <el-switch size="mini" v-model="param.hidden"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-form-item label :label-width="'30px'">
                <el-button
                  size="mini"
                  @click="deleteParameter(param)"
                  type="danger"
                  icon="el-icon-delete"
                  circle
                  plain
                ></el-button>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row type="flex" justify="space-around" style="margin-bottom:30px">
            <el-col :span="12">
              <el-button round @click="addParameter()" type="primary" size="mini">Add Parameter</el-button>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="Privileges" name="privileges">
          <div>
            <div style="display: table;margin: 0 auto;">
              <el-transfer
                style="text-align:left;"
                filterable
                v-model="newRec.privileges"
                :props="{
            key: 'value',
            label: 'desc'
          }"
                :data="allPrivileges"
                :titles="['Available', 'Assigned']"
              ></el-transfer>
            </div>
          </div>
          <br />
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <el-button
        type="primary"
        :disabled="!recchanged"
        @click="submitForm('newRec')"
      >{{this.$t("buttons.confirm")}}</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "ReportEditor",
  data: () => ({
    orgRec: null,
    newRec: { title: "NA" },
    formLabelWidth: "100px",
    changed: false,
    activeName: "main",
    inputVisible: false,
    inputValue: "",
    allPrivileges: [],
    visible: true,
    reportForm: {
      title: ""
    },
    rules: {
      title: [
        { required: true, message: "Please input a Title", trigger: "blur" }
      ]
    },
    options: [
      {
        value: "text",
        label: "Text"
      },
      {
        value: "date",
        label: "Date"
      },
      {
        value: "combo",
        label: "Combo Box"
      },
      {
        value: "interval",
        label: "Interval"
      },
      {
        value: "number",
        label: "Number"
      }
    ]
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
    recchanged: function() {
      return JSON.stringify(this.recordin) != JSON.stringify(this.newRec);
    }
  },
  props: {
    record: { type: Object },
    id: { type: String },
    index: { type: String },
    title: { type: String }
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
  methods: {
    valueChanged: function(item) {
      // eslint-disable-line
      this.changed = true;
    },
    loadPrivileges: function() {
      var data = [];
      for (var i in this.$store.getters.privileges) {
        var priv = this.$store.getters.privileges[i];
        data.push({
          value: priv._source.value,
          desc: priv._source.name
        });
      }
      this.allPrivileges = data;
    },
    prepareData: function() {
      this.newRec = JSON.parse(JSON.stringify(this.record));
      this.activeName = "main";
      this.changed = false;
      this.inputVisible = false;
      this.inputValue = "";
      this.loadPrivileges();
    },
    submitForm(formName) {
      // eslint-disable-line
      //this.$refs[formName].validate((valid) => {
      // if (valid) {
      this.saveRecord();
      /*} else {
          console.log('error submit!!');
          return false;
        }
      });*/
    },
    saveRecord: function() {
      var obj = {
        _id: this.id,
        _index: this.index,
        _source: this.newRec
      };

      this.$store.commit({
        type: "updateRecord",
        data: obj
      });
      this.$notify({
        title: "Record saved.",
        type: "success",
        message: "Record updated.",
        position: "bottom-right"
      });
      this.closeDialog();
    },
    addParameter: function() {
      if (this.newRec.parameters === undefined) this.newRec.parameters = [];
      var obj = {
        name: "param" + (this.newRec.parameters.length + 1),
        title: "",
        type: "text",
        value: ""
      };

      this.newRec.parameters.push(obj);
    },
    deleteParameter: function(param) {
      for (var i in this.newRec.parameters) {
        if (this.newRec.parameters[i].name == param.name) {
          this.newRec.parameters.splice(i, 1);
        }
      }
    },
    handleClose: function(tag) {
      this.newRec.output.splice(this.newRec.output.indexOf(tag), 1);
    },
    showInput: function() {
      this.inputVisible = true;
      this.$nextTick(_ => {
        // eslint-disable-line
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },
    handleInputConfirm: function() {
      let inputValue = this.inputValue;
      if (this.newRec.output == undefined) this.newRec.output = [];
      if (inputValue) {
        this.newRec.output.push(inputValue);
      }
      this.inputVisible = false;
      this.inputValue = "";
    },
    closeDialog: function() {
      this.$emit("dialogclose");
    }
  }
};
</script>


<style>
.el-tag + .el-tag {
  margin-left: 10px;
}
.button-new-tag {
  margin-left: 10px !important;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}
.input-new-tag {
  width: 90px !important;
  margin-left: 10px;
  vertical-align: bottom;
}
</style>