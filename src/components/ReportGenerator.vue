<template>
  <el-dialog width="60%" :title="computeTranslatedText(record.title,$store.getters.creds.user.language)" v-model="visible" :before-close="closeDialog">
    <el-form :model="record" v-if="visible">
      <el-row v-for="param in filteredParameters" :key="param.name">
        <el-col :span="24" v-if="param.type == 'text'">
          <el-form-item :label="param.title" :label-width="formLabelWidth">
            <el-input size="small" v-model="param.value" autocomplete="off"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="param.type == 'number'">
          <el-form-item :label="param.title" :label-width="formLabelWidth">
            <el-input-number size="small" v-model="param.value" autocomplete="off"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="param.type == 'combo'">
          <el-form-item :label="param.title" :label-width="formLabelWidth">
            <el-select size="small" v-model="param.value" :placeholder="$t('reportgenerator.select_type')">
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
            <el-select size="small" v-model="param.value" :placeholder="$t('reportgenerator.select_type')">
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
            <el-date-picker size="small" v-model="param.value" type="date" :placeholder="$t('reportgenerator.pick_day')"></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="param.type == 'interval'">
          <el-form-item :label="param.title" :label-width="formLabelWidth">
            <el-date-picker
              size="small"
              :picker-options="rangePickerOptions"
              v-model="param.value"
              type="daterange"
              :start-placeholder="$t('reportgenerator.start_date')"
              :end-placeholder="$t('reportgenerator.end_date')"
              :default-time="['00:00:00', '23:59:59']"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-divider></el-divider>

    <el-checkbox v-model="sendByEmail" style="margin-bottom: 15px;">{{ $t('reportgenerator.send_report_email') }}</el-checkbox>

    <el-form v-if="sendByEmail">
      <el-row style="text-align:left;">
        <el-button @click="setFocus('maillingListTo')" type="text">{{ $t('reportgenerator.to') }} </el-button>
      </el-row>
      <el-row>
        <el-col :span="24" style="text-align:left;">
          <el-select
            v-model="maillingListTo"
            multiple
            filterable
            ref="maillingListTo"
            :placeholder="$t('reportgenerator.choose_users')"
            size="small"
            style="width:100%;"
          >
            <el-option
              v-for="item in users"
              :key="'to-'+item._id"
              :label="item._id"
              :value="item._id"
            ></el-option>
          </el-select>
        </el-col>
      </el-row>
      <el-row style="text-align:left;">
        <el-button @click="setFocus('maillingListCc')" type="text">{{ $t('reportgenerator.cc') }} </el-button>
      </el-row>
      <el-row>
        <el-col :span="24" style="text-align:left;">
          <el-select
            v-model="maillingListCc"
            multiple
            filterable
            ref="maillingListCc"
            :placeholder="$t('reportgenerator.choose_users')"
            size="small"
            style="width:100%;"
          >
            <el-option
              v-for="item in users"
              :key="'cc-'+item._id"
              :label="item._id"
              :value="item._id"
            ></el-option>
          </el-select>
        </el-col>
      </el-row>
      <el-row style="text-align:left;">
        <el-button @click="setFocus('maillingListCci')" type="text">{{ $t('reportgenerator.cci') }} </el-button>
      </el-row>
      <el-row>
        <el-col :span="24" style="text-align:left;">
          <el-select
            v-model="maillingListCci"
            multiple
            filterable
            ref="maillingListCci"
            :placeholder="$t('reportgenerator.choose_users')"
            size="small"
            style="width:100%;"
          >
            <el-option
              v-for="item in users"
              :key="'cci-'+item._id"
              :label="item._id"
              :value="item._id"
            ></el-option>
          </el-select>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="16">
          <el-form-item :label="$t('reportgenerator.add_mail')" :label-width="formLabelWidth">
            <el-input size="small" v-model="mailToAdd" autocomplete="off"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="6" style="text-align:right;">
          <el-button
            :disabled="!mailToAdd.includes('@')"
            plain
            @click="addMail()"
            size="small"
          >{{ $t('reportgenerator.add') }}</el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item :label="$t('reportgenerator.subject')" :label-width="formLabelWidth">
            <el-input size="small" v-model="emailSubject"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item :label="$t('reportgenerator.body')" :label-width="formLabelWidth">
            <el-input size="small" type="textarea" :rows="4" v-model="emailBody"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer><span class="dialog-footer">
      <!--<v-icon :name="record.icon" scale="1"/>-->
      <el-button @click="closeDialog()">{{ $t('reportgenerator.cancel') }}</el-button>
      <el-button type="primary" @click="generateReport()">{{ $t('reportgenerator.generate') }}</el-button>
    </span></template>
  </el-dialog>
</template>


<script>
import axios from "axios";
import moment from "moment";
import {computeTranslatedText} from '../globalfunctions'
import {
  buildParameterValuesQuery,
  parameterValuesUrl,
  rangeShortcut,
  valuesFromBuckets,
  visibleParameters,
} from "@/utils/reportParameters";

export default {
  name: "ReportEditor",
  data: () => ({
    visible: true,
    firstTime: true,
    sendByEmail: false,
    users: [],
    maillingListTo: [],
    maillingListCc: [],
    maillingListCci: [],
    mailToAdd: "",
    emailSubject: "",
    emailBody: "",
    formLabelWidth: "200px",
    formLabelWidth2: "100px"
  }),
  computed: {
    rangePickerOptions() {
      // Les cinq raccourcis ne different que par leur duree : les bornes sont calculees par
      // `rangeShortcut`, testable sans horloge simulee.
      const shortcut = (text, key) => ({
        text,
        onClick: (picker) => picker.$emit("pick", rangeShortcut(key)),
      });

      return {
        shortcuts: [
          shortcut(this.$t("reportgenerator.last_day"), "1d"),
          shortcut(this.$t("reportgenerator.last_week"), "7d"),
          shortcut(this.$t("reportgenerator.last_month"), "30d"),
          shortcut(this.$t("reportgenerator.last_3_months"), "90d"),
          shortcut(this.$t("reportgenerator.today"), "today"),
        ],
      };
    },
    recordin: function() {
      return this.record;
    },
    recordstr: function() {
      return JSON.stringify(this.record);
    },
    filteredParameters() {
      return visibleParameters(this.record.parameters);
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
    this.loadUsers();
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

    getESValues(par, interval, fixdate, intervalValue, fixdateValue) {
      // La requete et l'URL viennent de `utils/reportParameters.js` : ici on envoie, et on remplit
      // la liste des valeurs du parametre.
      const query = buildParameterValuesQuery({
        par,
        interval,
        fixdate,
        intervalValue,
        fixdateValue,
      });

      const url = parameterValuesUrl({
        apiurl: this.$store.getters.apiurl,
        token: this.$store.getters.creds.token,
        index: par.escomboindex,
      });

      axios
        .post(url, query)
        .then(response => {
          if (response.data.error != "") {
            this.$notify({
              title: "Failed",
              type: "danger",
              message: this.$t("rep.unable_send"),
              position: "bottom-right"
            });
            return;
          }

          par.valuelist = valuesFromBuckets(response.data);
          this.$forceUpdate();
        })
        .catch(() => {});
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
            this.users = response.data.records;
          }
        })
        .catch(error => {
          console.log(error);
        });
    },
    checkUser: function(mail) {
      var notInlist = true;
      for (var userid in this.users) {
        if (this.users[userid]._id == mail) {
          notInlist = false;
        }
      }
      if (notInlist) {
        var newUser = { "_id": mail };
        this.users.push(newUser);
      }
    },
    addMail: function() {
      let newUser = { "_id": this.mailToAdd };
      this.users.push(newUser);
      this.mailToAdd = '';
    },
    setFocus: function(refName) {
      this.$refs[refName].focus();
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

      var task = {
        "mailingList": this.maillingListTo,
        "mailingListCc": this.maillingListCc,
        "mailingListCci": this.maillingListCci,
        "mailSubject": this.emailSubject,
        "mailTemplate": this.emailBody
      }

      var message = {
        destination: "/queue/NYX_REPORT_STEP1",
        body: JSON.stringify({
          id: "id_" + randomID,
          creds: this.$store.getters.creds,
          report: this.record,
          privileges: this.$store.getters.creds.user.privileges,
          task: task
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
