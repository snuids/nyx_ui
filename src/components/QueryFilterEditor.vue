<template>
  <el-dialog
    width="75%"
    :title="title"
    :visible.sync="visible"
    :before-close="closeDialog"
    append-to-body
  >
    <el-form v-if="curField" :model="curField">
      <el-row :gutter="20">
        <el-col :span="20">
          <el-form-item label="Field" :label-width="formLabelWidth">
            <el-input size="mini" v-model="curField.field" autocomplete="off"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="20">
          <el-form-item label="Title" :label-width="formLabelWidth">
            <el-input size="mini" v-model="curField.title" autocomplete="off"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="20">
          <el-form-item label="Default" :label-width="formLabelWidth">
            <el-input size="mini" v-model="curField.default" autocomplete="off"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="10">
          <el-form-item label="Type" :label-width="formLabelWidth">
            <el-select
              size="mini"
              v-model="curField.type"
              placeholder="Please select a type"
              @change="changeType"
            >
              <el-option
                v-for="(type, index) in types"
                :label="type.label"
                :value="type.value"
                :key="index"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="curField.type=='string' || curField.type=='number'">
        <el-col :span="20">
          <el-form-item label="Default" :label-width="formLabelWidth">
            <el-input size="mini" v-model="curField.default" autocomplete="off"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="selectedType && selectedType.clearable">
        <el-col :span="9">
          <el-form-item label="Clearable" :label-width="formLabelWidth">
            <el-switch v-model="curField.clearable"></el-switch>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="curField.type && curField.type == 'selecter'">
        <el-col :span="20">
          <el-form-item label="Options" :label-width="formLabelWidth">
            <el-tag
              :key="tag"
              v-for="tag in curField.selectOptions"
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
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button type="primary" @click="closeDialog()">Close</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "QueryFilterEditor",
  data: () => ({
    visible: false,
    formLabelWidth: "120px",
    selectedType: null,
    inputVisible: false,
    curField: {},
    inputValue: "",
    types: [
      {
        value: "selecter",
        label: "Selecter"
      }
      ,{
        value: "text",
        label: "Free Text"
      }
    ]
  }),
  computed: {
    currentfieldin: function() {
      return this.currentField;
    },
    currentfield: function() {
      return JSON.stringify(this.currentField);
    }
  },
  props: {
    currentField: { type: Object },
    title: { type: String }
  },
  watch: {
    currentfieldin: {
      handler: function() {
        //this.prepareData();
      },
      deep: true
    }
  },
  created: function() {},
  mounted: function() {
    this.prepareData();
    this.visible = true;
  },
  methods: {
    prepareData: function() {
      console.log("creating curField");
      this.curField = this.currentField;
      console.log(this.curField);
      this.changeType();
    },
    changeType: function() {
      console.log("changeType -> " + this.curField.type);

      for (var i in this.types) {
        //console.log(this.types[i].value)
        if (this.types[i].value == this.curField.type) {
          this.selectedType = this.types[i];

          if (
            this.curField.type == "selecter" &&
            this.curField.selectOptions == undefined
          ) {
            console.log("reset Selected options !!!!");
            this.curField.selectOptions = [];
          }

          return;
        }
      }

      this.selectedType = null;
    },
    closeDialog: function() {
      this.$emit("dialogclose", this.curField);
    },
    handleClose: function(tag) {
      console.log("close tag -> " + tag);
      console.log(this.curField.selectOptions.indexOf(tag));
      this.curField.selectOptions.splice(
        this.curField.selectOptions.indexOf(tag),
        1
      );
      var tmp = JSON.parse(JSON.stringify(this.curField));
      this.curField = {};
      this.curField = tmp;
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
      if (this.curField.selectOptions == undefined)
        this.curField.selectOptions = [];
      if (inputValue) {
        this.curField.selectOptions.push(inputValue);
      }
      this.inputVisible = false;
      this.inputValue = "";
    }
  }
};
</script>


<style>
</style>