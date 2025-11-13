<template>
  <el-dialog width="80%" :title="$t('scheduler.edit_scheduler')" :visible.sync="visible" :before-close="closeDialog">
    <el-tabs v-model="activeName">
      <el-tab-pane :label="$t('scheduler.scheduler')" name="scheduler">
        <el-form :model="record._source" v-if="visible" :rules="rules" ref="record">
          <el-row>
            <el-col :span="24">
              <el-form-item :label="$t('scheduler.title')" :label-width="formLabelWidth" prop="title">
                <el-input size="mini" v-model="record._source.title" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item :label="$t('report.report')" :label-width="formLabelWidth" align="left">
                <el-select
                  size="mini"
                  @change="reportChange"
                  v-model="record._source.report"
                  placeholder="Select"
                >
                  <el-option
                    v-for="report in reports"
                    :key="report._id"
                    :value="report._id"
                    :label="computeTranslatedText(report._source.title,$store.getters.creds.user.language)"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('scheduler.type')" :label-width="formLabelWidth" align="left">
                <el-select
                  size="mini"
                  v-model="record._source.trigger.type"
                  placeholder="Select"
                  @change="typeChanged"
                >
                  <el-option :label="$t('scheduler.daily')" value="daily"></el-option>
                  <el-option :label="$t('scheduler.monthly')" value="monthly"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item :label="$t('scheduler.time')" :label-width="formLabelWidth" align="left">
                <el-time-select
                  size="mini"
                  v-model="record._source.trigger.time"
                  :picker-options="{
                    start: '00:00',
                    step: '00:15',
                    end: '23:45'
                  }"
                  placeholder="Select time"
                ></el-time-select>
              </el-form-item>
            </el-col>
            <!-- <el-col :span="10">
              <el-form-item label="Icon" :label-width="formLabelWidth">
                <el-input size="mini" v-model="record._source.icon" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>-->
            <el-col :span="2">
              <v-icon v-if="record._source.icon" :name="record._source.icon" scale="2" />
            </el-col>
            
            
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-form-item :label="$t('scheduler.path')" :label-width="formLabelWidth">
                <el-input size="mini" placeholder="The path + filename  on the server used to save the report. Empty by default." v-model="record._source.path" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="6">&nbsp;</el-col>
            <el-col :span="18">
              <template v-if="record._source.trigger.type == 'daily'">
                <el-transfer
                  style="text-align:left;"
                  :titles="[$t('scheduler.excluded_days'), $t('scheduler.included_days')]"
                  filterable
                  :filter-placeholder="$t('scheduler.select_days')"
                  v-model="record._source.trigger.days"
                  :data="days"
                ></el-transfer>
              </template>
              <template v-if="record._source.trigger.type == 'monthly'">
                <el-transfer
                  style="text-align:left;"
                  :titles="[$t('scheduler.excluded_days'), $t('scheduler.included_days')]"
                  filterable
                  :filter-placeholder="$t('scheduler.select_days')"
                  v-model="record._source.trigger.days"
                  :data="months"
                ></el-transfer>
              </template>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>
      <el-tab-pane :label="$t('scheduler.parameters')" name="parameters">
        <el-form>
          <el-row v-for="param in report.parameters" :key="param.name">
            <el-col :span="16" v-if="param.type == 'text'">
              <el-form-item :label="param.title" :label-width="formLabelWidth">
                <el-input size="mini" v-model="param.value" autocomplete="off" @change="paramsChanged()"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="16" v-if="param.type == 'number'">
              <el-form-item :label="param.title" :label-width="formLabelWidth">
                <el-input-number size="mini" v-model="param.value" autocomplete="off" @change="paramsChanged()"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="param.type == 'combo'">
              <el-form-item :label="param.title" :label-width="formLabelWidth">
                <el-select size="mini" v-model="param.value" placeholder="Please select a type" @change="paramsChanged()">
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
                <el-select size="mini" v-model="param.value" placeholder="Please select a type" @change="paramsChanged()">
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
                 <el-input size="mini" v-model="param.value" autocomplete="off" @change="paramsChanged()"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="param.type == 'interval'">
              <el-form-item :label="param.title" :label-width="formLabelWidth">
                 <el-input size="mini" v-model="param.value" autocomplete="off" @change="paramsChanged()"></el-input>
              </el-form-item>
            </el-col>



          </el-row>
        </el-form>
      </el-tab-pane>
      <el-tab-pane :label="$t('scheduler.reset_task')" name="reset task">
        <el-form>
          <el-row>
            <el-col :span="6">
              <el-form-item :label="$t('scheduler.number_of_days')" :label-width="formLabelWidth">
                <el-input-number :min="1" size="mini" v-model="resetdays" autocomplete="off"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="8" align="left">
              <el-form-item label="" :label-width="formLabelWidth">
                <el-button size="mini" type="danger" plain @click="resetTask(record)">Reset</el-button>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>            
            <el-col :span="12">
              <el-form-item :label="$t('scheduler.next_run')" :label-width="formLabelWidth" align="left">
                <el-date-picker siez="mini"
                  v-model="record._source.nextRun"
                  type="datetime"
                  placeholder="Select date and time">
                </el-date-picker>
                <!-- <el-input size="mini" v-model="record._source.nextRun" autocomplete="off"></el-input> -->
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>
      <el-tab-pane :label="$t('scheduler.mailing_list')" name="mailing list">
        <el-form>
        <div>
          <div style="display: table;margin: 0 auto;">
            <!--el-transfer
              style="text-align:left;"
              filterable
              v-model="record._source.mailingList"
              :props="{
                  key: '_id',
                  label: '_id'
                }"
              :data="users"
              :titles="[$t('scheduler.excluded'), $t('scheduler.included'), 'Cc', 'Cci']"
            ></el-transfer-->
            <el-row style="text-align:left;">
              <el-button @click="setFocus('maillingListTo')" type="text">To : </el-button>
            </el-row>
            <el-row>
              <el-col :span="24" style="text-align:left;">
                <el-select
                  v-model="maillingListTo"
                  multiple
                  filterable
                  @change="usersMailListToChanged"
                  ref="maillingListTo"
                  placeholder="Choose Users"
                  size="mini"
                  style="width:100%;"
                >
                  <el-option
                    v-for="item in users"
                    :key="item._id"
                    :label="item._id"
                    :value="item._id"
                  ></el-option>
                </el-select>
              </el-col>
            </el-row>
            <el-row style="text-align:left;">
              <el-button @click="setFocus('maillingListCc')" type="text">Cc : </el-button>
            </el-row>
            <el-row>
              <el-col :span="24" style="text-align:left;">
                <el-select
                  v-model="maillingListCc"
                  multiple
                  filterable
                  @change="usersMailListCcChanged"
                  ref="maillingListCc"
                  placeholder="Choose Users"
                  size="mini"
                  style="width:100%;"
                >
                  <el-option
                    v-for="item in users"
                    :key="item._id"
                    :label="item._id"
                    :value="item._id"
                  ></el-option>
                </el-select>
              </el-col>
            </el-row>
            <el-row style="text-align:left;">
              <el-button @click="setFocus('maillingListCc')" type="text">Cci : </el-button>
            </el-row>
            <el-row>
              <el-col :span="24" style="text-align:left;">
                <el-select
                  v-model="maillingListCci"
                  multiple
                  filterable
                  @change="usersMailListCciChanged"
                  ref="maillingListCci"
                  placeholder="Choose Users"
                  size="mini"
                  style="width:100%;"
                >
                  <el-option
                    v-for="item in users"
                    :key="item._id"
                    :label="item._id"
                    :value="item._id"
                  ></el-option>
                </el-select>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="16">
                <el-form-item label="Add Mail : " :label-width="formLabelWidth">
                  <el-input size="mini" v-model="mailToAdd" autocomplete="off"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6" style="text-align:right;">
                <el-button
                  :disabled="!mailToAdd.includes(['@'])"
                  plain
                  @click="addMail()"
                  size="mini"
                >Add</el-button>
              </el-col>
            </el-row>
          </div>
        </div>
        </el-form>
      </el-tab-pane>

      <el-tab-pane :label="$t('scheduler.mail_content')" name="mailing content">
        <el-form>
          <el-row>
            <el-form-item :label="$t('scheduler.subject')" :label-width="formLabelWidth">
              <el-input size="mini" v-model="record._source.mailSubject" autocomplete="off"></el-input>
            </el-form-item>
          </el-row>

          <el-row>
            <el-form-item :label="$t('scheduler.attachment')" :label-width="formLabelWidth">
              <el-input
                placeholder="MyFile-${DATE:%d%B%Y}"
                size="mini"
                v-model="record._source.attachmentName"
                autocomplete="off"
              ></el-input>
            </el-form-item>
          </el-row>

          <el-row>
            <el-form-item :label="$t('scheduler.content')" :label-width="formLabelWidth">
              <el-input
                type="textarea"
                :rows="10"
                placeholder="Mail Template"
                v-model="record._source.mailTemplate"
              ></el-input>
            </el-form-item>
          </el-row>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <span slot="footer" class="dialog-footer">
      <!--<v-icon :name="record.icon" scale="1"/>-->
      <el-button @click="closeDialog()">{{$t('buttons.cancel')}}</el-button>
      <el-button type="primary" @click="updatePeriodicReport()" :disabled="!modified && !paramValueChanged">{{$t('buttons.update')}}</el-button>
    </span>
  </el-dialog>
</template>


<script>
import axios from "axios";
import moment from "moment";
import {computeTranslatedText} from '../globalfunctions'

export default {
  name: "ReportPeriodicEditor",
  data: () => ({
        
    rules: {
      title: [
        { required: true, message: "Please input a Title", trigger: "change" }
      ]
    },
    activeName: "scheduler",
    orgRecord: "",
    visible: false,
    resetdays: 1,
    paramValueChanged: false,
    reports: [],
    report: {},
    users: [],
    maillingListTo: [],
    maillingListCc: [],
    maillingListCci: [],
    mailToAdd: '',
    days: [
      { key: 0, label: "Monday" },
      { key: 1, label: "Tuesday" },
      { key: 2, label: "Wednesday" },
      { key: 3, label: "Tuesday" },
      { key: 4, label: "Friday" },
      { key: 5, label: "Saturday" },
      { key: 6, label: "Sunday" }
    ],
    months: [],
    formLabelWidth: "150px",
    formLabelWidth2: "200px",
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
    modified: function() {
      return JSON.stringify(this.record) != this.orgRecord;
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
  created: function() {
    this.orgRecord = JSON.stringify(this.record);

    console.log(this.record);

    if (this.record._source.nextRun == undefined) {
      this.record._source.nextRun = moment();
    }
  },
  mounted: function() {
    this.loadUsers();
    this.prepareData();
    this.prepareMonth();
    this.loadReports();
    this.visible = true;
  },
  methods: {
    addMail: function() {
      let newUser = {
        "_id": this.mailToAdd
      }
      this.users.push(newUser);
      this.mailToAdd = '';

    },
    usersMailListToChanged: function(val) {
      console.log("usersMailListToChanged");
      console.log(val)
      this.record._source.mailingList = val
      
    },
    usersMailListCcChanged: function(val) {
      console.log("usersMailListCcChanged");
      console.log(val)
      this.record._source.mailingListCc = val
      
    },
    usersMailListCciChanged: function(val) {
      console.log("usersMailListCciChanged");
      console.log(val)
      this.record._source.mailingListCci = val
      
    },
    computeTranslatedText: function(inText,inLocale){      
      return computeTranslatedText(inText,inLocale);
    },
    typeChanged: function(inVal) {
      //alert(inVal);
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
    paramsChanged: function(){
      this.record._source.parameters = this.report.parameters;
      this.paramValueChanged == true;
    },
    loadReports: function() {
      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_reportdef?token=" +
        this.$store.getters.creds.token;

      axios
        .post(url, { size: 1000 })
        .then(response => {
          if (response.data.error != "") console.log("Report list error...");
          else {
            this.reports = response.data.records;
            
            for (var i in this.reports) {
              console.log(this.reports[i]._id);
              if (this.reports[i]._id == this.record._source.report) {
                this.report = this.reports[i]._source;
                this.prepareData();
                break;
              }
            }
            console.log(this.reports);
          }
        })
        .catch(error => {
          console.log(error);
        });
    },

    prepareMonth: function() {
      this.days= [
          { key: 0, label: this.$t('scheduler.monday') },
          { key: 1, label: this.$t('scheduler.tuesday') },
          { key: 2, label: this.$t('scheduler.wednesday') },
          { key: 3, label: this.$t('scheduler.thursday') },
          { key: 4, label: this.$t('scheduler.friday')},
          { key: 5, label: this.$t('scheduler.saturday') },
          { key: 6, label: this.$t('scheduler.sunday') }
        ]

      this.months = [];
      for (var i = 1; i < 32; i++) this.months.push({ key: i, label: "" + i });
    },
    prepareData: function() {
      console.log("PREPARE DATA")
      console.log(this.report.parameters)
      let interval = false
      let fixdate = false
      var intervalValue = {"start": "", "end": ""}
      var fixdateValue = ""
      this.visible = true;
      for (var i in this.report.parameters) {
        var par = this.report.parameters[i];

        /*if (
          par.type == "interval" &&
          par.value != undefined &&
          par.value != "" &&
          !(par.value instanceof Array)
        ) {
          par.value = [
            this.resolveDate(par.value.split(":")[0]),
            this.resolveDate(par.value.split(":")[1])
          ];
        }
        else */if(par.type == "escombo" &&
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
    reportChange: function() {
      console.log(this.record._source.report);

      for (var i in this.reports) {
        console.log(this.reports[i]._id);
        if (this.reports[i]._id == this.record._source.report) {
          this.record._source.icon = this.reports[i]._source.icon;
          this.report = this.reports[i]._source;
          break;
        }
      }
    },
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    resetTask: function(record) {
      var newrun = moment(record._source.nextRun).subtract(
        this.resetdays,
        "days"
      );

      record._source.nextRun = newrun.format();
    },
    updatePeriodicReport: function() {
      //this.orgConfig._source = this.curConfig;
      this.$store.commit({
        type: "updateRecord",
        data: this.record
      });
      this.$notify({
        title: "Record saved.",
        type: "success",
        message: "Saved.",
        position: "bottom-right"
      });
      this.closeDialog();
    },
    loadUsers: function() {
      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_user*?token=" +
        this.$store.getters.creds.token;

      axios
        .post(url, { size: 1000 })
        .then(response => {
          if (response.data.error != "") console.log("User list error...");
          else {
            //console.log(response.data.records);
           // console.log(this);
            this.users = response.data.records;
            this.maillingListTo = this.record._source.mailingList
            this.maillingListCc = this.record._source.mailingListCc
            this.maillingListCci = this.record._source.mailingListCci
            for(var mail in  this.record._source.mailingList)
            {
              this.checkUser(this.record._source.mailingList[mail])
              
            }
            for(var mail in  this.record._source.mailingListCc)
            {
              this.checkUser(this.record._source.mailingListCc[mail])
              
            }
            for(var mail in  this.record._source.mailingListCci)
            {
              this.checkUser(this.record._source.mailingListCci[mail])
              
            }
          }
        })
        .catch(error => {
          console.log(error);
        });

      
    },

    checkUser: function(mail){
      console.log("Check User: "+ mail)
      var notInlist = true;
        for(var userid in this.users)
        {
          console.log(userid)
          if(this.users[userid]._id == mail)
          {
            
            notInlist = false;

          }
        }
        if(notInlist)
        {
          var newUser = {
            "_id": mail
          } 
          this.users.push(newUser)
        }
    }

      

  }
};
</script>