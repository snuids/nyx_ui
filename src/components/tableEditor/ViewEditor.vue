<template>
  <el-dialog 
      width="80%" 
      title="View editor" 
      :visible.sync="dialogFormVisible"
      :before-close="closeDialog"
      :close-on-click-modal="false"
      class="view-editor"
      append-to-body>    


       <el-form 
        :model="newRec._source"
        ref="ruleForm" 
        :rules="rules">

          <el-form-item label="Title" :label-width="formLabelWidth" prop="title">
            <el-input 
              size="mini" 
              v-model="newRec._source.title" 
              autocomplete="off"
              ></el-input>
          </el-form-item>
          <el-form-item label="Summary" :label-width="formLabelWidth">
            <el-input size="mini" v-model="newRec._source.summary" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item label="Description" :label-width="formLabelWidth">
            <el-input size="mini" v-model="newRec._source.description" autocomplete="off"></el-input>
          </el-form-item>
          <el-row>
            <el-col :span="8"  style="text-align: left;">
              <el-form-item label="Type" :label-width="formLabelWidth"  prop="type">
                <el-select
                    size="mini"
                    
                    v-model="newRec._source.type"
                    placeholder="Please select a type"
                  >              
                  <el-option label="Kibana" value="kibana"></el-option>
                  <el-option label="Picture" value="picture"></el-option>
                  <el-option label="URL" value="url"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8"  style="text-align: left;">
              <el-form-item label="Duration" :label-width="formLabelWidth">
                <el-input-number :min="1000" size="mini" v-model="newRec._source.duration" autocomplete="off"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
          <span v-if="newRec._source.type === 'picture'">
              <el-form-item label="Picture" :label-width="formLabelWidth">
                <Upload 
                  :config="configUploadPicture"
                  @on-success="uploadPictureSuccess"></Upload>
                
              </el-form-item>
           
          </span>
          <span v-if="newRec._source.type === 'kibana'">
            <el-row >
              <el-col :span="8"  style="text-align: left;">
                <el-form-item label="" :label-width="formLabelWidth">
                  <el-button
                    :loading="listLoading"
                    size="mini"
                    type="primary"
                    @click="loadKibanaDashboards()"
                  >Load List</el-button>
                </el-form-item>
              </el-col>
              <el-col :span="8"  style="text-align: left;">
                <el-form-item :label-width="formLabelWidth">

                  <el-button  
                    :disabled="newRec._source.kibanaId==null||dashboards.length==0"              
                    size="mini"
                    type="danger"
                    @click="kibanaDashboardSelected()"
                  >Refresh Dashboard</el-button>
                </el-form-item>
              </el-col>
              <el-col :span="8"  style="text-align: left;">
                <el-form-item :label-width="formLabelWidth">

                  <el-button  
                    :disabled="newRec._source.kibanaId==null||dashboards.length==0"              
                    size="mini"
                    type="danger"
                    @click="openInKibana()"
                  >Open in Kibana</el-button>
                </el-form-item>
              </el-col>

            </el-row>

            <el-row >
              
              <el-col :span="8" style="text-align: left;">
                <el-form-item label="Dashboard" :label-width="formLabelWidth">
                <el-select                
                  size="mini"
                  @change="kibanaDashboardSelected"
                  v-model="newRec._source.kibanaId"
                  placeholder="Select"
                >
                  <el-option
                    v-for="dash in dashboards"
                    :key="dash.id"
                    :label="dash.space+'-'+dash.attributes.title"
                    :value="dash.id"
                  ></el-option>
                </el-select>            
                </el-form-item>
              </el-col>

              
              
              <el-col :span="8">
                <el-form-item label="ID" :label-width="formLabelWidth">
                  <el-input size="mini" disabled v-model="newRec._source.kibanaId" autocomplete="off"></el-input>
                </el-form-item>
              </el-col>
              
              <el-col :span="8">
                <el-form-item label="Kibana Time" :label-width="formLabelWidth">
                  <el-input size="mini" 
                    v-model="newRec._source.kibanaTime"
                    @change="kibanaTimeChange" 
                    autocomplete="off">
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row
              
              style="text-align:left"
            >
              <el-col :span="8" >
                <el-form-item label="" :label-width="formLabelWidth">
                      <el-switch
                        v-model="newRec._source.hideFilter"
                        active-text="Hide Filter">
                      </el-switch>
                
                  
                </el-form-item>
              </el-col>
              <el-col :span="8" >
                <el-form-item label="" :label-width="formLabelWidth">
                      <el-switch
                        v-model="newRec._source.timeRefresh"
                        @change="timeRefreshSwitchChange"
                        active-text="Time Refresh">
                      </el-switch>
                  
                </el-form-item>
              </el-col>
              <el-col :span="8" v-if="(newRec._source.type === 'kibana')">
                <el-form-item label="" :label-width="formLabelWidth">
                      <el-select
                          size="mini"
                          v-model="newRec._source.timeRefreshValue"
                          placeholder="Refresh Interval"
                          @change="timeRefreshSelectChange"
                        >
                          <el-option label="5 seconds" value="refreshInterval:(pause:!f,value:5000)"></el-option>
                          <el-option label="10 seconds" value="refreshInterval:(pause:!f,value:10000)"></el-option>
                          <el-option label="30 seconds" value="refreshInterval:(pause:!f,value:30000)"></el-option>
                          <el-option label="45 seconds" value="refreshInterval:(pause:!f,value:45000)"></el-option>
                          <el-option label="1 minute" value="refreshInterval:(pause:!f,value:60000)"></el-option>
                          <el-option label="5 minutes" value="refreshInterval:(pause:!f,value:300000)"></el-option>
                          <el-option label="15 minutes" value="refreshInterval:(pause:!f,value:900000)"></el-option>
                          <el-option label="30 minutes" value="refreshInterval:(pause:!f,value:1800000)"></el-option>
                          <el-option label="1 hour" value="refreshInterval:(pause:!f,value:3600000)"></el-option>
                          <el-option label="2 hours" value="refreshInterval:(pause:!f,value:7200000)"></el-option>
                          <el-option label="12 hours" value="refreshInterval:(pause:!f,value:43200000)"></el-option>
                          <el-option label="1 day" value="refreshInterval:(pause:!f,value:86400000)"></el-option>
                          
                      </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </span>
          <el-form-item label="URL" :label-width="formLabelWidth"  prop="target">
            <el-input size="mini" v-model="newRec._source.target" autocomplete="off"></el-input>
          </el-form-item>
      </el-form> 

    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <el-button v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
        type="primary"
        :disabled="!recchanged"
        @click="submitForm('ruleForm')"
      >{{this.$t("buttons.confirm")}}</el-button>
    </span>
 
  </el-dialog>
</template>

<script>
import axios from "axios";
import rison from "rison";

import Vue from "vue";

import upload from "@/components/Upload";
Vue.component("Upload", upload);

function transformObject(obj){
  return rison.encode(obj);
}

export default {
  name: "viewEditor",
  data: () => ({
    orgRec: null,
    newRec: null,
    rules: {
      title: [
        { required: true, message: 'Please input title', trigger: 'blur' }, 
      ],
      type: [
        { required: true, message: 'Please select a type', trigger: 'blur' }, 
      ],
      target: [
        { required: true, message: 'URL cannot be empty', trigger: 'blur' }, 
        { required: true, message: 'URL cannot be empty', trigger: 'change' }, 
      ],
    },
    formLabelWidth: "120px",
    dialogFormVisible: false,
    dashboards: [],
    listLoading: false,
    configUploadPicture:{
      config: {
        queryfilters: [],
        queue: '/queue/VIEW_PICTURE_IMPORT',
        tip: 'Drop your picture here',
      }
    },
  }),
  computed: {
    recordin: function() {
      return this.record;
    },
    recordstr:function(){
      return JSON.stringify(this.record);
    },
    newrecordstr:function(){
      return JSON.stringify(this.newRec);
    },
    recchanged:function() {
      return JSON.stringify(this.recordin)!=JSON.stringify(this.newRec);
    },
  },
  props: {
    record: {
      type: Object
    }
    ,config: {
      type: Object
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
  created:function() {
    console.log('created event')
    this.prepareData();
  },
  components: {
      
  },
  methods: {

    openInKibana() {
      console.log(this.newRec)
      window.open(this.newRec._source.target.replace('kibananyx','kibana').replace('embed=true','').replace(',title:Test','').replace('title:Test,',''))
    },
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    prepareData: function() {
      this.newRec = JSON.parse(JSON.stringify(this.record));
      this.orgRec = JSON.parse(JSON.stringify(this.record));
      
      this.dialogFormVisible=true
    },
    saveRecord() {
      
      this.$store.commit({
        type: "updateRecord",
        data: this.newRec
      });
      this.$notify({
        title: "Record saved.",
        type: "success",
        message: "The view has been succesfuly saved.",
        position: "bottom-right"
      });
      this.$emit("dialogcloseupdated");
    },
    timeRefreshSelectChange() {
      if(this.newRec._source.timeRefreshValue != null)
        this.newRec._source.timeRefresh = true

      var tmp = JSON.parse(JSON.stringify(this.newRec._source))
      this.newRec._source = null 
      this.newRec._source = tmp

      this.computeUrlFromKibana()
    },
    kibanaTimeChange() {
      this.computeUrlFromKibana()
    },
    timeRefreshSwitchChange() {
      this.computeUrlFromKibana()
    },
    computeUrlFromKibana() {
      console.log('computeUrlFromKibana')
      if(this.selectedDash != null) {
        var dash = this.computeKibanaUrl(this.selectedDash);
        var space = "";
        if (this.selectedDash.space != "default") {
          space = "s/" + this.selectedDash.space; //.toLowerCase();
        }
        this.newRec._source.target =
          "." +
          this.$store.getters.kibanaurl.replace("kibana", "kibananyx") +
          space +
          "/app/kibana#" +
          dash;
      }
    },
    kibanaDashboardSelected() {
      console.log(this.dashboards)
      for (var i in this.dashboards) {
        if (this.dashboards[i].id==this.newRec._source.kibanaId)
        {
          console.log("FOUND");
          this.selectedDash = this.dashboards[i];
          console.log(this.dashboards[i]);
        }
      }

      var dash = this.computeKibanaUrl(this.selectedDash);
      var space = "";
      if (this.selectedDash.space != "default") {
        space = "s/" + this.selectedDash.space; //.toLowerCase();
      }
      this.newRec._source.target =
        "." +
        this.$store.getters.kibanaurl.replace("kibana", "kibananyx") +
        space +
        "/app/kibana#" +
        dash;
    },
    computeKibanaUrl(dashdata) {
      var url = "";
      url += "/dashboard/" + dashdata.id + "";
      var timek = "from:now-7d,mode:quick,to:now";
      if (
        this.newRec._source != undefined &&
        this.newRec._source.kibanaTime != undefined
      )
        timek = this.newRec._source.kibanaTime;
      else this.newRec._source.kibanaTime = timek;


      var strRefresh = "refreshInterval:(pause:!t,value:0)"

      if(this.newRec._source.timeRefresh && this.newRec._source.timeRefreshValue != null)
        strRefresh = this.newRec._source.timeRefreshValue

      url +=
        //"?embed=true&_g=(refreshInterval:(pause:!t,value:0),time:(" +
        "?embed=true&_g=("+strRefresh+",time:(" +
        timek +
        "))";
      url += "&_a=(description:'" + dashdata.attributes.description + "'";
      url += ",filters:!(),fullScreenMode:!f";
      console.log(url);
      if (dashdata.attributes.optionsJSON != undefined) {
        var options = JSON.parse(dashdata.attributes.optionsJSON);
        var urloptions = Object.entries(options)
          .map(e => e.join(":"))
          .join(",");
        urloptions = urloptions.replace(/true/g, "!t").replace(/false/g, "!f");

        url += ",options:(" + urloptions + ")";
      } else url += ",options:()";
      var panels = [];
      var panelsJSON = JSON.parse(dashdata.attributes.panelsJSON);
      console.log(url);
      console.log(panelsJSON);
      for (var p in panelsJSON) {
        console.log("==========+>");
        console.log(panelsJSON[p]);

        if(dashdata.migrationVersion != null && dashdata.migrationVersion.dashboard != null && dashdata.migrationVersion.dashboard == '7.0.0') {
          
          for(var j in dashdata.references) {
            if(dashdata.references[j].name==panelsJSON[p].panelRefName) {
              panelsJSON[p].id=dashdata.references[p].id  
              panelsJSON[p].type=dashdata.references[p].type  
            }
          }
        }


        var panel = transformObject(panelsJSON[p]);

        panels.push("" + panel + "");
      }

      panels = panels.join(",").replace(/#/g, "%23").replace(/&/g, "%26");
      url += ",panels:!(" + panels + ")";

      var querybag = "query:(language:lucene,query:'*')";
      if (
        dashdata.attributes.kibanaSavedObjectMeta != undefined &&
        dashdata.attributes.kibanaSavedObjectMeta.searchSourceJSON != undefined
      ) {
        var querybag2 = JSON.parse(
          dashdata.attributes.kibanaSavedObjectMeta.searchSourceJSON
        );
        if (querybag2.query != undefined) {
          querybag = transformObject(querybag2.query);
          querybag = "query:" + querybag;
        }
      }

      url += "," + querybag + ",timeRestore:!f,title:Test,viewMode:view)";

      console.log('********************compute kibana url***********************')
      console.log(url)


      var tmp = JSON.parse(JSON.stringify(this.newRec))
      this.newRec = null
      this.newRec = tmp

      return url;
    },
    loadKibanaDashboards: function() {
      this.listLoading = true;
      this.dashboards = [];

      this.addDashboards(
        {"page":1,"per_page":1000,"total":3,"saved_objects":[{"type":"dashboard","id":"0c8aea00-174a-11e9-8fa5-c79677d29cc9","attributes":{"title":"Nyx API","hits":0,"description":"","panelsJSON":"[{\"embeddableConfig\":{},\"gridData\":{\"x\":0,\"y\":12,\"w\":18,\"h\":27,\"i\":\"1\"},\"id\":\"235bc8e0-1749-11e9-8fa5-c79677d29cc9\",\"panelIndex\":\"1\",\"type\":\"visualization\",\"version\":\"6.5.4\"},{\"embeddableConfig\":{},\"gridData\":{\"x\":0,\"y\":0,\"w\":48,\"h\":12,\"i\":\"2\"},\"id\":\"6aaced00-1749-11e9-8fa5-c79677d29cc9\",\"panelIndex\":\"2\",\"type\":\"visualization\",\"version\":\"6.5.4\"},{\"embeddableConfig\":{},\"gridData\":{\"x\":18,\"y\":25,\"w\":15,\"h\":14,\"i\":\"3\"},\"id\":\"cdba9780-1749-11e9-8fa5-c79677d29cc9\",\"panelIndex\":\"3\",\"type\":\"visualization\",\"version\":\"6.5.4\"},{\"embeddableConfig\":{},\"gridData\":{\"x\":33,\"y\":25,\"w\":15,\"h\":14,\"i\":\"4\"},\"id\":\"ddc92830-1749-11e9-8fa5-c79677d29cc9\",\"panelIndex\":\"4\",\"type\":\"visualization\",\"version\":\"6.5.4\"},{\"gridData\":{\"x\":18,\"y\":12,\"w\":30,\"h\":13,\"i\":\"5\"},\"version\":\"6.5.4\",\"panelIndex\":\"5\",\"type\":\"visualization\",\"id\":\"a863c3c0-174a-11e9-8fa5-c79677d29cc9\",\"embeddableConfig\":{}}]","optionsJSON":"{\"darkTheme\":false,\"hidePanelTitles\":true,\"useMargins\":true}","version":1,"timeRestore":false,"kibanaSavedObjectMeta":{"searchSourceJSON":"{\"query\":{\"language\":\"lucene\",\"query\":\"\"},\"filter\":[]}"}},"updated_at":"2019-01-13T15:54:24.567Z","version":4},{"type":"dashboard","id":"c0beaa00-1e18-11e9-8fa5-c79677d29cc9","attributes":{"title":"Nyx User Statistics","hits":0,"description":"","panelsJSON":"[{\"embeddableConfig\":{},\"gridData\":{\"x\":0,\"y\":0,\"w\":48,\"h\":13,\"i\":\"1\"},\"id\":\"30d22e80-1e18-11e9-8fa5-c79677d29cc9\",\"panelIndex\":\"1\",\"type\":\"visualization\",\"version\":\"6.5.4\",\"title\":\"Statistics\"},{\"embeddableConfig\":{},\"gridData\":{\"x\":0,\"y\":13,\"w\":24,\"h\":15,\"i\":\"2\"},\"id\":\"5cb9ce40-1e18-11e9-8fa5-c79677d29cc9\",\"panelIndex\":\"2\",\"title\":\"Users\",\"type\":\"visualization\",\"version\":\"6.5.4\"},{\"embeddableConfig\":{},\"gridData\":{\"x\":24,\"y\":13,\"w\":24,\"h\":15,\"i\":\"3\"},\"id\":\"cdba9780-1749-11e9-8fa5-c79677d29cc9\",\"panelIndex\":\"3\",\"title\":\"Platforms\",\"type\":\"visualization\",\"version\":\"6.5.4\"}]","optionsJSON":"{\"darkTheme\":false,\"hidePanelTitles\":false,\"useMargins\":true}","version":1,"timeRestore":false,"kibanaSavedObjectMeta":{"searchSourceJSON":"{\"query\":{\"language\":\"lucene\",\"query\":\"\"},\"filter\":[]}"}},"updated_at":"2019-01-22T07:38:47.328Z","version":1},{"type":"dashboard","id":"7bbb3390-2243-11e9-9a68-772c982ed0ab","attributes":{"title":"Docker","hits":0,"description":"","panelsJSON":"[{\"gridData\":{\"x\":0,\"y\":15,\"w\":48,\"h\":22,\"i\":\"1\"},\"version\":\"6.5.4\",\"panelIndex\":\"1\",\"type\":\"visualization\",\"id\":\"9b91cb80-2242-11e9-9a68-772c982ed0ab\",\"embeddableConfig\":{}},{\"gridData\":{\"x\":0,\"y\":0,\"w\":48,\"h\":15,\"i\":\"2\"},\"version\":\"6.5.4\",\"panelIndex\":\"2\",\"type\":\"visualization\",\"id\":\"195fc210-2243-11e9-9a68-772c982ed0ab\",\"embeddableConfig\":{}}]","optionsJSON":"{\"darkTheme\":false,\"useMargins\":true,\"hidePanelTitles\":false}","version":1,"timeRestore":false,"kibanaSavedObjectMeta":{"searchSourceJSON":"{\"query\":{\"query\":\"\",\"language\":\"lucene\"},\"filter\":[]}"}},"updated_at":"2019-01-27T14:54:44.552Z","version":1}]}
        ,
        "nyx"
      );

      var url = this.$store.getters.kibanaurl + "api/spaces/space";
      axios
        .get(url)
        .then(response => {
          console.log("Space success...");
          this.loadKibanaDashboards2(response.data);
        })
        .catch(error => {
          console.log(error);
        });
    },
    loadKibanaDashboards2: async function(spaces) {
      console.log(spaces);
      this.dashboards = [];
      for (var i in spaces) {
        var space = spaces[i];
        
        var spaceurl = "";
        
        if (space.id != "default") spaceurl = "s/" + space.id + "/";
        var url =
          this.$store.getters.kibanaurl +
          spaceurl +
          "api/saved_objects/_find?type=dashboard&per_page=1000&page=1";

        const response = await axios.get(url, {});

        this.addDashboards(response.data, space.id);
      }

      var tmp = JSON.parse(JSON.stringify(this.newRec))
      this.newRec = null
      this.newRec = tmp

      this.listLoading = false;
      
    },
    addDashboards: function(newdashs, space) {
      console.log("Adding Space:" + space);
      for (var i in newdashs.saved_objects) {
        var dash = newdashs.saved_objects[i];
        dash.space = space;
        this.dashboards.push(dash);
      }
    },
    uploadPictureSuccess: function(response, file, fileList) {
      this.newRec._source.target = this.$store.getters.apiurl.replace('api/v1/', '') 
      this.newRec._source.target += 'public/pictures/singleimage.html?image=' + file.name

      var tmp = JSON.parse(JSON.stringify(this.newRec))
      this.newRec = null
      this.newRec = JSON.parse(JSON.stringify(tmp))
    },

    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.saveRecord()
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    }
  
    
    
  },
  created:function() {
    console.log('created event')
    this.prepareData();
  },
};
</script>

<style >
  .view-editor .upload {
    border-radius: 4px;
    border: 1px solid #DCDFE6;
    padding: 10px;
  }
</style>