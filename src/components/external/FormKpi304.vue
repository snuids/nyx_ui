<template>
  <el-row class="kpi304-container" :span="24" type="flex" justify="center">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span style="font-weight:bold">KPI304 - Aanwezigheid van de minimale bemanning</span>
      </div>
      <div class="card-body">
        <el-row>
          <el-col :span="12" style="text-align:left;">
            <el-row class="first-row" :span="24">
              <el-row>
                <el-date-picker
                  v-model="monthSelected"
                  type="month"
                  size="mini"
                  placeholder="Pick a month"
                  :clearable="false"
                  @change="dateSelected()"
                ></el-date-picker>
              </el-row>
            </el-row>

            <span v-if="monthSelected">
              <el-row :span="24" class="parameters-selection">
                <el-row>
                  <el-select
                    v-model="selectedLot"
                    size="mini"
                    @change="lotChanged()"
                    placeholder="Select"
                  >
                    <el-option
                      v-for="item in lotArray"
                      :key="item"
                      :label="'lot '+item"
                      :value="item"
                    ></el-option>
                  </el-select>
                </el-row>
                <el-row>
                  <el-select  v-if="selectedLot == 2"
                    v-model="selectedTec"
                    :disabled="selectedLot == null"
                    @change="tecChanged()"
                    size="mini"
                    placeholder="Select"
                  >
                    <el-option
                      v-for="item in entityModel[selectedLot]"
                      :key="item"
                      :label="item"
                      :value="item"
                    ></el-option>
                  </el-select>
                </el-row>
              </el-row>
            </span>
          </el-col>
          <el-col :span="12" style="text-align:right;">
            <el-row><b>Titularis verantwoordelijke</b></el-row>
            <el-row v-for="ppl in kpi304DataModel[selectedLot][selectedTec].ppl.titu" :key="ppl">{{ppl}}</el-row>
            <el-row><b>Back up verantwoordelijke</b></el-row>
            <el-row v-for="ppl in kpi304DataModel[selectedLot][selectedTec].ppl.backup" :key="ppl">{{ppl}}</el-row>
          </el-col>
        </el-row>
        <el-row class="row-subtitle">
          <h3 style="text-align:center; width:100%;">Lot {{selectedLot}}{{selectedLot == 2?(" - " +selectedTec):""}}</h3>
        </el-row>
        <el-row :span="24" class="kpi304-switches">
          <el-form style="text-align:left" :model="kpi304Model" ref="formKPI304">
            <el-row>
              <el-col
                :offset="6"
                :span="8"
                v-if="kpi304DataModel[selectedLot][selectedTec].tech == 1"
              >
                <h4>
                  <b>Technieker</b>
                </h4>
              </el-col>
              <el-col
                :offset="6"
                :span="4"
                v-if="kpi304DataModel[selectedLot][selectedTec].tech == 2"
              >
                <h4>
                  <b>Technieker 1</b>
                </h4>
              </el-col>
              <el-col :span="4" v-if="kpi304DataModel[selectedLot][selectedTec].tech == 2">
                <h4>
                  <b>Technieker 2</b>
                </h4>
              </el-col>
              <el-col :span="6">
                <h4>
                  <b>Verantwoordelijke</b>
                </h4>
              </el-col>
              <el-col :span="4" style="text-align:right">
                <h4>
                  <b>Off</b>
                </h4>
              </el-col>
            </el-row>

            <el-row v-for="item in kpi304Model" :key="item['@timestamp']">
              <el-col :span="6">
                <div style="margin:10px 0px;">
                  <b>{{formatDate(item['date'], 'dd DD MMM YYYY')}}</b>
                </div>
              </el-col>
              <el-col
                :span="8"
                v-if="!isWeekEnd(item.date) && kpi304DataModel[selectedLot][selectedTec].tech == 1"
              >
                <el-switch
                  v-if="!item.off"
                  :disabled="!writeAccess || disable"
                  v-model="item.tech"
                  :active-value="1"
                  :inactive-value="0"
                  @change="itemModified(item)"
                ></el-switch>
                <div v-else style="opacity:0">else</div>
              </el-col>
              <el-col
                :span="4"
                v-if="!isWeekEnd(item.date) && kpi304DataModel[selectedLot][selectedTec].tech == 2"
              >
                <el-switch
                  v-if="!item.off"
                  :disabled="!writeAccess || disable"
                  v-model="item.tech1"
                  :active-value="1"
                  :inactive-value="0"
                  @change="itemModified(item)"
                ></el-switch>
                <div v-else style="opacity:0">else</div>
              </el-col>
              <el-col
                :span="4"
                v-if="!isWeekEnd(item.date) && kpi304DataModel[selectedLot][selectedTec].tech == 2"
              >
                <el-switch
                  v-if="!item.off"
                  :disabled="!writeAccess || disable"
                  v-model="item.tech2"
                  :active-value="1"
                  :inactive-value="0"
                  @change="itemModified(item)"
                ></el-switch>
                <div v-else style="opacity:0">else</div>
              </el-col>

              <el-col :span="6" v-if="!isWeekEnd(item.date)">
                <el-switch
                  v-if="!item.off"
                  :disabled="!writeAccess || disable"
                  v-model="item.hoofd"
                  :active-value="1"
                  :inactive-value="0"
                  @change="itemModified(item)"
                ></el-switch>
                <div v-else style="opacity:0">else</div>
              </el-col>
              <el-col :span="4" v-if="!isWeekEnd(item.date)" style="text-align:right">
                <el-switch
                  :disabled="!writeAccess || disable"
                  v-model="item.off"
                  :active-value="1"
                  :inactive-value="0"
                  @change="itemModified(item)"
                ></el-switch>
              </el-col>
            </el-row>
          </el-form>
        </el-row>
      </div>
    </el-card>
  </el-row>
</template>
<script>
import Vue from "vue";
import moment from "moment";
import axios from "axios";
import formkpi304 from "@/components/external/FormKpi304";
Vue.component("FormKpi304", formkpi304);

export default {
  name: "FormKpi304",
  data() {
    return {
      monthSelected: null,
      lotArray: [],
      entityModel: { "1": [], "2": [], "3": [] },
      selectedLot: null,
      selectedTec: null,
      disable: true,
      currentKPI304MonthlyObj: null,
      strPeriod1: "",
      strPeriod2: "",
      formLabelWidth: "200px",
      writeAccess: false,
      dataToSave: [],
      kpi304Model: {},
      kpi304DataModel: {
        1: {
          BACHEA: {
            tech: 2,
            tech1: 1,
            tech2: 1,
            hoofd: 1,
            ppl: {
              titu: ["Sébastien Docquier", "Patrick Lenaertz"],
              backup: ["Michiel Villé", "Dirk Van Leemput"]
            }
          }
        },
        2: {
          SANI: {
            tech: 2,
            tech1: 1,
            tech2: 1,
            hoofd: 1,
            ppl: {
              titu: ["Xavier Vos", "Bart Hiel"],
              backup: ["Gil Van Driessche", "Dirk Van Leemput"]
            }
          },
          HVAC: {
            tech: 2,
            tech1: 1,
            tech2: 1,
            hoofd: 1,
            ppl: {
              titu: ["Nour Ajana", "Gil Van Driessche"],
              backup: ["Bart Hiel", "Dirk Van Leemput"]
            }
          },
          ELEC: {
            tech: 2,
            tech1: 1,
            tech2: 1,
            hoofd: 1,
            ppl: {
              titu: ["Philippe Gonze", "Stefaan Pletinckx"],
              backup: ["Dirk Van Leemput"]
            }
          },
          FIRE: {
            tech: 2,
            tech1: 1,
            tech2: 1,
            hoofd: 1,
            ppl: {
              titu: ["Luc Schoeters", "Sven Bols"],
              backup: ["Dirk Van Leemput"]
            }
          }
        },
        3: {
          BACEXT: {
            tech: 1,
            hoofd: 1,
            ppl: {
              titu: ["Samir Boutil", "Michiel Villé"],
              backup: ["Patrick Lenaertzs", "Dirk Van Leemput"]
            }
          }
        },
        4: {
          BACDNB: {
            tech: 1,
            hoofd: 1,
            ppl: {
              titu: ["Wim Sintubin", "Stefaan Pletinckx"],
              backup: ["Dirk Van Leemput"]
            }
          }
        }
      }
    };
  },
  computed: {},
  created: function() {
    this.prepareData();
  },
  methods: {
    formatDate(date, format = "DD/MM/YYYY") {
      return moment(date).format(format);
    },
    isWeekEnd(date) {
      if (moment(date).weekday() == 0 || moment(date).weekday() == 6)
        return true;

      return false;
    },
    prepareData() {
      console.log("prepare data");
      this.getEntitiesModel();

      this.monthSelected = moment();
      this.dateSelected();
    },
    itemModified(item) {
      console.log(item);
      item.total = item.tech + item.hoofd;
      this.dataToSave.push(item);
      this.commitToDB();
    },
    commitToDB: _.debounce(function() {
      console.log("commit to database");
      console.log(this.dataToSave);

      for (var i in this.dataToSave) {
        var rec = {
          _id: this.dataToSave[i]._id,
          _index: this.dataToSave[i]._index,
          isadd: false,
          _type: "doc",

          _source: {}
        };
        rec._source = JSON.parse(JSON.stringify(this.dataToSave[i]));
        delete rec._source.date;
        delete rec._source._id;
        delete rec._source._index;

        rec._source["@timestamp"] =
          moment(rec._source["@timestamp"]).unix() * 1000;

        this.$store.commit({
          type: "updateRecord",
          data: rec
        });

        this.updateComputedData(this.selectedLot, this.selectedTec, this.monthSelected)

      }

      this.dataToSave = [];
      this.$notify({
        title: "Data Saved",
        message: "",
        type: "success",
        position: "bottom-right"
      });


    }, 1000),
    dateSelected() {
      if (this.monthSelected == null) this.monthSelected = moment();

      if (moment().format("D") > 14) {
        //console.log('report already done')
        this.disable = moment() > moment(this.monthSelected).endOf("Month");
      } else {
        this.disable =
          moment().subtract(1, "months") >
          moment(this.monthSelected).endOf("Month");
      }

      this.getData();
    },
    getData() {
      console.log("get data");

      if (this.selectedLot == null) return;

      if (this.selectedTec == null) return;

      if (this.monthSelected == null) return;

      var strDate = moment(this.monthSelected).format("YYYY-MM-DD");

      var strTec = this.selectedTec.replace(/ /g, "").replace(/\//g, "");

      console.log(strDate);

      axios
        .get(
          this.$store.getters.apiurl +
            "biac/kpi304_monthly/" +
            this.selectedLot +
            "/" +
            strTec +
            "/" +
            strDate +
            "?token=" +
            this.$store.getters.creds.token
        )
        .then(response => {
          if (response.data.error != "")
            console.log("get KPI304 monthly error");
          else {
            console.log("get KPI304 monthly success");

            var tmp = JSON.parse(response.data.data);
            var obj = {};

            for (var i in tmp) {
              obj[tmp[i]._id] = tmp[i];
              obj[tmp[i]._id].date = moment(tmp[i]["@timestamp"]);
            }

            this.kpi304Model = JSON.parse(JSON.stringify(obj));
          }
        })
        .catch(error => {
          console.log(error);
        });
    },
    lotChanged() {
      console.log("lot changed");
      console.log(this.selectedLot);

      this.selectedTec = this.entityModel[this.selectedLot][0];

      this.getData();
    },
    tecChanged() {
      console.log("tec changed");
      console.log(this.selectedTec);

      this.getData();
    },
    getEntitiesModel() {
      console.log(JSON.stringify(this.$store.getters.creds.user.privileges));

      for (var i in this.$store.getters.creds.user.privileges) {
        var priv = this.$store.getters.creds.user.privileges[i];
        if (priv == "admin" || priv == "kpi304-ihm-write") {
          this.writeAccess = true;
        }
      }

      axios
        .get(
          this.$store.getters.apiurl +
            "biac/kpi_model/304?token=" +
            this.$store.getters.creds.token
        )
        .then(response => {
          if (response.data.error != "")
            console.log("retrieve KPI304 model entities error");
          else {
            console.log("retrieve KPI304 model entities  success");
            console.log(response.data.data);
            console.log(typeof response.data.data);
            this.entityModel = JSON.parse(response.data.data);

            for (var i in this.entityModel) {
              console.log(i);
              this.lotArray.push(i);
            }

            this.selectedLot = Object.keys(this.entityModel)[0];
            this.selectedTec = this.entityModel[this.selectedLot][0];

            this.getData();
          }
        })
        .catch(error => {
          console.log(error);
        });
    },

    updateComputedData: _.debounce(function(lot, tec, date) {
      console.log("update computed data");
      console.log("lot " + lot);
      console.log("tec " + tec);
      var strDate = moment.unix(date/1000).format()
      console.log("date " + strDate);

      axios
        .post(
          this.$store.getters.apiurl +
            "biac/kpi304_monthly/" +
            lot +
            "/" +
            tec +
            "/" +
            strDate +
            "?token=" +
            this.$store.getters.creds.token
        )
        .then(response => {
          if (response.data.error != "")
            console.error("post KPI304 monthly ERROR");
          else {
            console.log("post KPI304 monthly success");

          }
          console.log(response.data)
        })
        .catch(error => {
          console.log(error);
        });

    }, 1500)
  }
};
</script>
<style>
.kpi304-container {
  width: 100%;
  margin: 30px 0px;
}
.box-card {
  width: 800px !important;
}

.kpi304-container .parameters-selection {
  margin: 10px;
}


.row-day {
  padding-top: 10px;
  padding-bottom: 10px;
  border-top: solid 1px lightgrey;
}

.kpi304-switches-text {
  margin-left: 20px;
  font-size: 11px;
}

.kpi304-container .row-subtitle {
  border-top: solid 1px #eee;
  margin-top: 15px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-bottom: 15px;
  border-bottom: solid 1px #eee;
}

.slider-tech {
  width: 60px;
}

.el-switch {
  margin: 9px 0px;
}
</style>