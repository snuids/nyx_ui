<template>
  <el-dialog width="80%" :title="title" :visible.sync="visible" :before-close="closeDialog">
    <el-form v-if="visible" :model="newRec" :rules="rules" ref="newRec">
      <el-tabs v-model="activeName">
        <el-tab-pane label="Main" name="main">
          <el-row>
            <el-col :span="14">
              
              <el-form-item label="Title" :label-width="formLabelWidth" prop="title">
                <el-input size="mini" v-model="newRec.title" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Icon" :label-width="formLabelWidth"  prop="icon">
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
              <el-form-item label="Description" :label-width="formLabelWidth"  prop="description">
                <el-input size="mini" v-model="newRec.description" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>            
            <el-col :span="22">
              <el-form-item label="Report Type" :label-width="formLabelWidth" style="text-align:left">
                <el-radio-group v-model="newRec.reportType" @change="reportTypeChanged">
                  <el-radio label="notebook_doc">Notebook + Word</el-radio>
                  <el-radio label="notebook">Notebook</el-radio>
                  <el-radio label="python">Python</el-radio>
                  <el-radio label="jasper">Jasper</el-radio>
                  <el-radio label="jasper_jdbc">Jasper JDBC</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>            
           </el-row >

            <el-row v-if="newRec.reportType=='python'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="code" scale="2.2" />
              </el-col>
              <el-col :span="20">
                A simple report based on a python source code that will generate the output. 
                <br/> 
                The source code will be saved in the pythondef sub directory.<br/> 
                <br/> 
              </el-col>
              </el-card>
            </el-row>
          <el-row v-if="newRec.reportType=='notebook_doc'" class="transition-box" style="text-align:left">     
            <el-card shadow="never"  style="height:70px;background-color:rgb(236, 245, 255);">       
            <el-col :span="4" style="text-align:right;padding-right:20px">
              <v-icon name="regular/file-word" scale="2.2" />
            </el-col>
            <el-col :span="20">
              A report that uses a word template with tags and a python notebook to replace the tags by the approriate values.
               <br/>
               <br/> 
            </el-col>
            </el-card>
          </el-row>
          
          <el-row v-if="newRec.reportType=='notebook'" style="text-align:left">     
            <el-card shadow="never"  style="height:70px;background-color:rgb(236, 245, 255);">       
            <el-col :span="4" style="text-align:right;padding-right:20px">
              <v-icon name="regular/file-excel" scale="2.2" />
            </el-col>
            <el-col :span="20">
              A report that uses a python notebook to generate the output. Ideal to generate Excel files.
               <br/> 
            </el-col>
            </el-card>
          </el-row>
          <el-row v-if="newRec.reportType=='jasper'" style="text-align:left">     
            <el-card shadow="never"  style="height:70px;background-color:rgb(236, 245, 255);">       
            <el-col :span="4" style="text-align:right;padding-right:20px">
              <v-icon name="regular/file-pdf" scale="2.2" />
            </el-col>
            <el-col :span="20">
              A report that uses Jasper report and Elastic Search. In most cases, the output will be a PDF file. <br/>
              Download Jasper iReport application from the internet in order to create your report.<br/>
               <br/> 
            </el-col>
            </el-card>
          </el-row>
          <el-row v-if="newRec.reportType=='jasper_jdbc'" style="text-align:left">     
            <el-card shadow="never"  style="height:90px;background-color:rgb(236, 245, 255);">       
            <el-col :span="4" style="text-align:right;padding-right:20px">
              <v-icon name="regular/file-pdf" scale="2.2" />
            </el-col>
            <el-col :span="20">
              A report that uses Jasper report and a JDBC compliant database such as SQL server or PostgreSQL. <br/>
              In most cases, the output will be a PDF file. <br/>
              Download Jasper iReport application from the internet in order to create your report.<br/>
               <br/> 
            </el-col>
            </el-card>
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
            <el-col :span="6" style="text-align:left">
              <el-form-item label="Generate PDF" label-width="160px">
                <el-checkbox v-model="newRec.generatePDF"></el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <!-- <el-form-item label="Type" :label-width="formLabelWidth">
                <el-select
                  size="mini"
                  v-model="newRec.reportType"
                  placeholder="Please select a type"
                >
                  <el-option label="Python" value="python"></el-option>
                  <el-option label="Notebook + Word" value="notebook_doc"></el-option>
                  <el-option label="Notebook" value="notebook"></el-option>
                  <el-option label="Jasper" value="jasper"></el-option>
                </el-select>
              </el-form-item> -->
            </el-col>
          </el-row>
          <el-row :span="24" v-show="newRec.reportType=='jasper_jdbc'">
            <el-col :span="12">
              <el-form-item
                label="JDBC Driver"
                :label-width="formLabelWidth"                
              >
                <el-input size="mini" v-model="newRec.jdbc_driver" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                label="JDBC URL"
                :label-width="formLabelWidth"                
              >
                <el-input size="mini" v-model="newRec.jdbc_url" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :span="24" v-show="newRec.reportType=='jasper_jdbc'">
            <el-col :span="12">
              <el-form-item
                label="Login"
                :label-width="formLabelWidth"                
              >
                <el-input size="mini" v-model="newRec.jdbc_login" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                label="Password"
                :label-width="formLabelWidth"                
              >
                <el-input type="password" size="mini" v-model="newRec.jdbc_password" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="12">
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
                v-show="newRec.reportType=='jasper' || newRec.reportType=='jasper_jdbc'"
              >
                <el-input size="mini" v-model="newRec.jasper" autocomplete="off"></el-input>
              </el-form-item>
              <el-form-item
                label="Notebook Path"
                :label-width="formLabelWidth"
                v-show="newRec.reportType=='notebook' || newRec.reportType=='notebook_doc'"
              >
                <el-input size="mini" v-model="newRec.notebook" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-show="newRec.reportType=='jasper' || newRec.reportType=='jasper_jdbc'">
            <el-upload
                class="jasper-upload upload-box"
                drag
                :action="uploadurl"
                :auto-upload="true"                
                :on-success="successUpload"
                
                accept=".jrxml"
                size="mini"
                style="height:30px"
              >              
                <div class="el-upload__text">
                  Drop you jrxml file here.<br/>
                  <em>Click to upload</em>
                </div>
                
              </el-upload> 
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
      <el-row type="flex" class="row-bg" justify="space-between">
      <el-col>
        <el-button
                  style="min-width: 112px;"
                  icon="el-icon-notebook-2"
                  @click="openTabCode()"
                  size="mini"
                  v-if="!isAdd && (newRec.reportType=='notebook' || newRec.reportType=='notebook_doc')"
                >{{$t('generic.edit_code')}}</el-button>

      </el-col>
      <el-col>
        <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
        <el-button  v-if="!isAdd"
          type="primary"
          :disabled="!recchanged"
          @click="submitForm('newRec')"
        >{{this.$t("buttons.confirm")}}</el-button>
        <el-button  v-if="isAdd"
          type="primary"        
          @click="createNewReport()"
        >{{this.$t("generic.create")}}</el-button>      
      </el-col>
      </el-row>
    </span>
  </el-dialog>
</template>

<script>
import axios from "axios";

export default {
  name: "ReportEditor",
  data: () => ({
    orgRec: null,
    newRec: { title: "NA" },
    formLabelWidth: "120px",
    changed: false,
    activeName: "main",
    inputVisible: false,
    inputValue: "",
    allPrivileges: [],
    visible: true,
    uploadurl:"",    
    rules: {
      title: [
        { required: true, message: "Please input a Title", trigger: "change" }
      ],
      description: [        
        ,{ required: true, message: "Please input a Description", trigger: "change" }
      ],
      icon: [
        { required: true, message: "Please pick an icon ex:bug", trigger: "change" }
        
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
    title: { type: String },
    isAdd: { type: Boolean }
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
    this.uploadurl =
        this.$store.getters.apiurl +
        "upload?token=" +
        this.$store.getters.creds.token +
        "&queue=JASPER_UPLOAD";
    this.prepareData();
  },
  methods: {
    reportTypeChanged(){
      if (this.isAdd)
      {
      if (this.newRec.reportType=="python")
      {
        this.newRec.output = [
            "txt"
        ]
      }
      if (this.newRec.reportType=="notebook_doc")
      {
        this.newRec.output = [
            "docx"
        ]
      }
      if (this.newRec.reportType=="notebook")
      {
        this.newRec.output = [
            "xlsx"
        ]
      }
      if (this.newRec.reportType=="jasper")
      {
        this.newRec.output = [
            "pdf"
        ]
      }
      }
    },
    successUpload: function(response, file, fileList) {
      console.log("emit event on-success");
      this.newRec.jasper="./reports/jasper/"+file.raw.name;
      this.$notify({
        title: "Jasper uploaded.",
        type: "success",
        message: "The file has been uploaded",
        position: "bottom-right",
        duration: 3000
      });
    },
    valueChanged: function(item) {
      // eslint-disable-line
      this.changed = true;
    },
    openTabCode: function() {
      
      // window.open(
      //   "./ipython/notebooks/reports/notebooks/" +this.newRec.notebook .replace("./","")+".ipynb"        
      // );
      window.open(
        "./ipython/edit/reports/notebooks/" +this.newRec.notebook .replace("./","")+".ipynb"        
      );
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
      //this.reportForm.newRec=this.newRec;

      this.activeName = "main";
      this.changed = false;
      this.inputVisible = false;
      this.inputValue = "";
      this.loadPrivileges();
    },
    submitForm(formName) {

      this.$refs[formName].validate((valid) => {
          if (valid) {
            this.saveRecord();
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      // eslint-disable-line
      //this.$refs[formName].validate((valid) => {
      // if (valid) {
      
      /*} else {
          console.log('error submit!!');
          return false;
        }
      });*/
    }
    ,
    createNewReport: function()
    {
      this.$refs["newRec"].validate((valid) => {
          if (valid) {
            this.createNewReportAfterValid();
          } else {
            console.log('error submit!!');
            return false;
          }
        });
    }
    ,
    createNewReportAfterValid: function()
    {
      var obj = {
        _id: this.id,
        _index: this.index,
        _source: this.newRec
      };

      if(this.newRec.reportType=="python")
      {

      }

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

      let url =
        this.$store.getters.apiurl +
        "sendmessage?token=" +
        this.$store.getters.creds.token;

      let message = {
        destination: "/topic/NYX_REPORTRUNNER_COMMAND",
        body: JSON.stringify(this.newRec)
      };

      axios
        .post(url, message)
        .then(response => {
          if (response.data.error != "") {
            console.log("Unable to send message...");
            this.$notify({
              title: "Failed",
              type: "danger",
              message: "Unable to send message.",
              position: "bottom-right"
            });
          } else {
          }
        })
        .catch(error => {
          console.log(error);
        });

      this.closeDialog();
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


.jasper-upload .el-upload-dragger{
  height:40px !important;
}
</style>