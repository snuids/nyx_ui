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
        <el-col :span="10">
          <el-form-item
            label="Subtype"
            :label-width="formLabelWidth"
            v-if="selectedType && selectedType.subTypes"
          >
            <el-select size="mini" v-model="curField.subType" placeholder="Please select a subtype">
              <el-option
                v-for="(subType, index) in selectedType.subTypes"
                :label="subType.label"
                :value="subType.value"
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
      <el-row :gutter="20" v-if="curField.type && curField.type == 'selecter'">
        <el-col :span="20">
          <el-form-item label="Multiple" :label-width="formLabelWidth">
            <el-switch v-model="curField.multiple"></el-switch>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="20">
          <el-form-item label="Color" :label-width="formLabelWidth">
            <el-input size="mini" v-model="curField.color" autocomplete="off"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="20">
          <el-form-item label="Inverted" :label-width="formLabelWidth">
            <el-switch v-model="curField.inverted"></el-switch>
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
  name: "FormFieldEditor",
  data: () => ({
    visible: false,
    formLabelWidth: "120px",
    selectedType: null,
    inputVisible: false,
    curField: {},
    inputValue: "",
    types: [
      {
        value: "string",
        label: "String",
        clearable: true,
        hasDefault: true,
        subTypes: [
          {
            value: "text",
            label: "Text"
          },
          {
            value: "textarea",
            label: "Textarea"
          },
          {
            value: "email",
            label: "Email"
          },
          {
            value: "tel",
            label: "Tel"
          },
          {
            value: "password",
            label: "Password"
          },
          {
            value: "url",
            label: "URL"
          }
        ]
      },
      {
        value: "number",
        label: "Number"
      },
      {
        value: "datetime",
        label: "DateTime",
        subTypes: [
          {
            value: "datetime",
            label: "Date and Time"
          },
          {
            value: "date",
            label: "Date"
          },
          {
            value: "time",
            label: "Time"
          }
        ]
      },
      {
        value: "boolean",
        label: "Boolean"
      },
      {
        value: "chips",
        label: "Chips (tags)",
        clearable: true
      },
      {
        value: "selecter",
        label: "Selecter",
        subTypes: [
          {
            value: "radiogroup",
            label: "Radio Group"
          },
          {
            value: "select",
            label: "Select"
          }
        ]
      },
      {
        value: "rating",
        label: "Ratings"
      },
      {
        value: "uploader",
        label: "Uploader",
        subTypes: [
          {
            value: "picture",
            label: "Picture"
          },
          {
            value: "file",
            label: "File"
          }
        ]
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
  mounted: function() {
    this.prepareData();
  },
  methods: {
    prepareData: function() {
      this.visible = true;
      console.log("creating curField");
      this.curField = this.currentField;
      this.changeType();
    },
    changeType: function() {
      this.curField.subType = null;

      console.log("changeType -> " + this.curField.type);

      for (var i in this.types) {
        //console.log(this.types[i].value)
        if (this.types[i].value == this.curField.type) {
          this.selectedType = this.types[i];

          if (this.types[i].subTypes != null)
            this.curField.subType = this.types[i].subTypes[0].value;

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

      this.curField.subType = null;
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