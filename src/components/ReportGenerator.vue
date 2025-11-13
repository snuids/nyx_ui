<template>
  <el-dialog width="60%" :title="computeTranslatedText(record.title,$store.getters.creds.user.language)" :visible.sync="visible" :before-close="closeDialog">
    <el-form :model="record" v-if="visible">
      <el-row v-for="param in filteredParameters" :key="param.name">
        <el-col :span="24" v-if="param.type == 'text'">
          <el-form-item :label="param.title" :label-width="formLabelWidth">
            <el-input size="mini" v-model="param.value" autocomplete="off"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="param.type == 'number'">
          <el-form-item :label="param.title" :label-width="formLabelWidth">
            <el-input-number size="mini" v-model="param.value" autocomplete="off"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="param.type == 'combo'">
          <el-form-item :label="param.title" :label-width="formLabelWidth">
            <el-select size="mini" v-model="param.value" placeholder="Please select a type">
              <el-option
                v-for="item in param.combos.split(',')"
                :key="item"
                :label="item"
                :value="item"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="param.type == 'escombo'">
          <el-form-item :label="param.title" :label-width="formLabelWidth">
            <el-select size="mini" v-model="param.value" placeholder="Please select a type">
              <el-option
                v-for="item in param.valuelist"
                :key="item"
                :label="item"
                :value="item"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="param.type == 'date'">
          <el-form-item :label="param.title" :label-width="formLabelWidth">
            <el-date-picker size="mini" v-model="param.value" type="date" placeholder="Pick a day"></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="param.type == 'interval'">
          <el-form-item :label="param.title" :label-width="formLabelWidth">
            <el-date-picker
              size="mini"
              :picker-options="rangePickerOptions"
              v-model="param.value"
              type="daterange"
              start-placeholder="Start date"
              end-placeholder="End date"
              :default-time="['00:00:00', '23:59:59']"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <!--<v-icon :name="record.icon" scale="1"/>-->
      <el-button @click="closeDialog()">Cancel</el-button>
      <el-button type="primary" @click="generateReport()">Generate</el-button>
    </span>
  </el-dialog>
</template>


<script>
import axios from "axios";
import moment from "moment";
import {computeTranslatedText} from '../globalfunctions'

export default {
  name: "ReportEditor",
  data: () => ({
    visible: true,
    firstTime: true,
    formLabelWidth: "200px",
    formLabelWidth2: "100px",
    rangePickerOptions: {
      shortcuts: [
        {
          text: "Last day",
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 1);
            picker.$emit("pick", [start, end]);
          }
        },
        {
          text: "Last week",
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
            picker.$emit("pick", [start, end]);
          }
        },
        {
          text: "Last month",
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
            picker.$emit("pick", [start, end]);
          }
        },
        {
          text: "Last 3 months",
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
            picker.$emit("pick", [start, end]);
          }
        },
        {
          text: "Today",
          onClick(picker) {
            const end = moment()
              .startOf("day")
              .add(1, "d")
              .toDate();
            const start = moment()
              .startOf("day")
              .toDate();

            start.setTime(start.getTime());
            picker.$emit("pick", [start, end]);
          }
        }
      ]
    }
  }),
  computed: {
    recordin: function() {
      return this.record;
    },
    recordstr: function() {
      return JSON.stringify(this.record);
    },
    filteredParameters() {
      var results = [];
      for (var i in this.record.parameters) {
        if (!this.record.parameters[i].hidden)
          results.push(this.record.parameters[i]);
      }
      return results;
    }
  },
  props: {
    record: {
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
  mounted: function() {
    this.prepareData();
  },
  methods: {
    computeTranslatedText: function(inText,inLocale){      
      return computeTranslatedText(inText,inLocale);
    },
    resolveDate: function(inVal) {
      inVal = inVal.replace(
        /now/g,
        moment()
          .startOf("day")
          .unix()
      );
      inVal = inVal.replace(/d/g, "*(3600*24)");
      return new Date(eval(inVal) * 1000);
    },
    dateChange: function() {
      console.log("Date Change")
      this.prepareData();
    },
    prepareData: function() {
      console.log(this.recordin)
      let interval = false
      let fixdate = false
      var intervalValue = {"start": "", "end": ""}
      var fixdateValue = ""

      this.visible = true;
      for (var i in this.recordin.parameters) {
        var par = this.recordin.parameters[i];

        console.log(par.value)
        console.log(typeof(par.value))

        if (
          par.type == "interval" &&
          par.value != undefined &&
          par.value != "" &&
          !(par.value instanceof Array)
        ) {
          interval = true
          if(this.firstTime){
          par.value = [
            this.resolveDate(par.value.split(":")[0]),
            this.resolveDate(par.value.split(":")[1])
          ];
          this.firstTime = false
          }
          intervalValue.start = par.value[0]
          intervalValue.end = par.value[1]
        } else if (
          par.type == "date" &&
          par.value != undefined &&
          par.value != "" &&
          !(par.value instanceof Array)
        ) {
          fixdate = true
          console.log("Fix Date")
          console.log(par.value)
          
          if(this.firstTime){
          par.value = this.resolveDate(par.value);
          this.firstTime = false
          }
          console.log(par.value)
          fixdateValue = par.value;
        }
        else if(par.type == "escombo" &&
          par.escomboindex != undefined &&
          par.escomboindex != ""&&
          par.escombokey != undefined &&
          par.escombokey != ""  ) {
          console.log("getList")
          this.getESValues(par, interval, fixdate, intervalValue, fixdateValue)
          console.log("LIST OK")
          console.log(par)

        }
        
      }
      console.log(this.recordin.parameters)
    },

    getESValues(par, interval, fixdate, intervalValue, fixdateValue){
      var index = par.escomboindex
      var key = par.escombokey
      var query = {
        "size": 0,
        "aggs": {
          "values_uniques": {
            "terms": {
              "field": key,
              "size": 10000
            }
          }
        }
      }

      if(par.usetimestamp && interval){
        var timestampfield = par.timestampfield
        var start = intervalValue.start.toISOString()
        var end = intervalValue.end.setHours(23,59,59,999).toISOString()
        query["query"]= {
                "bool": {
                  "must": [
                    {
                      "range": {
                        timestampfield: {   
                          "gte": start,   
                          "lte": end      
                        }
                      }
                    }
                  ]
                }
              }
            
      }

      if(par.usetimestamp && fixdate){
        var timestampfield = par.timestampfield
        var start = fixdateValue.toISOString()
        var enddt = new Date(fixdateValue.setHours(23,59,59,999))
        var end = enddt.toISOString()
        query["query"]= {
                "bool": {
                  "must": [
                    {
                      "range": {
                        [timestampfield]: {   
                          "gte": start,   
                          "lte": end      
                        }
                      }
                    }
                  ]
                }
              }
            
      }

      if(par.useboolean)
      {
        var booleanfield = par.booleanfield
        if(par.usetimestamp){
          query["query"]["bool"]["must"][1] = {"term": {[booleanfield]: true }}
        }
        else{
          console.log(query)
         query["query"]= {
              "bool":{
                "must":[
                  {"term": {[booleanfield]: true}}
                ]
                
              }
            }
        }
        }
      


      console.log(query)

      let url =
        this.$store.getters.apiurl +
        "generic_search/"+index+"?token=" +
        this.$store.getters.creds.token;

      console.log(url)

      var valuelist = []

      axios
        .post(url, query)
        .then(response => {
          if (response.data.error != "") {
            console.log("Unable to search...");
            this.$notify({
              title: "Failed",
              type: "danger",
              message: "Unable to send message.",
              position: "bottom-right"
            });
          } else {
              for(var i in response.data.aggs.values_uniques.buckets)
              {
                var rec = response.data.aggs.values_uniques.buckets[i]
                //console.log(rec.key)
                valuelist[i] = rec.key
              }
              console.log(valuelist)
              this.$forceUpdate();
             par.valuelist = valuelist.sort();
          }
        })
        .catch(error => {
          console.log(error);
        });


    },

    closeDialog: function() {
      this.$emit("dialogclose");
    },
    generateReport() {

      console.log('generate report')
      console.log(this.record)

      var url =
        this.$store.getters.apiurl +
        "sendmessage?token=" +
        this.$store.getters.creds.token;

      var randomID =
        Math.floor((1 + Math.random()) * 0x1000000) +
        "_" +
        Math.floor((1 + Math.random()) * 0x1000000);

      var message = {
        destination: "/queue/NYX_REPORT_STEP1",
        body: JSON.stringify({
          id: "id_" + randomID,
          creds: this.$store.getters.creds,
          report: this.record,
          privileges: this.$store.getters.creds.user.privileges
        })
      };

      axios
        .post(url, message)
        .then(response => {
          if (response.data.error != "") console.log("Report list error...");
          else {
            console.log(this);
            this.$globalbus.$emit("reportgenerated");
          }
        })
        .catch(error => {
          console.log(error);
        });
      this.closeDialog();
    }
  }
};
</script>
