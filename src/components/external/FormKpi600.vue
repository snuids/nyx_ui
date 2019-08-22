<template>
  <el-row class="kpi600-container" :span="24" type="flex" justify="center">  
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span style="font-weight:bold">KPI600 - Administratieve Vergaderingen</span>
        </div>
        <div class="card-body">
          <el-row class="first-row" :span="24">
              <el-col  :span="12" style="text-align:left;">
                <el-row>
                  <el-date-picker
                    v-model="monthSelected"
                    type="month"
                    size="mini"
                    placeholder="Pick a month"
                    :clearable="false"
                    @change="dateSelected()">
                  </el-date-picker>
                </el-row>
                <el-row style="margin-left:5px; font-weight:bold;">
                  {{strPeriod1}}<br/>
                  {{strPeriod2}}
                </el-row>

              </el-col>
              <!--<el-col  :span="12" style="text-align:right;">
                <el-button
                  size="mini">
                  Refresh
                </el-button>
              </el-col>-->
          </el-row>
          
          <span v-if="monthSelected" >

            <el-row  :span="24" class="parameters-selection">
              <el-col  :span="12" style="text-align:left;">
              
                <el-row>
                  <el-select 
                    v-model="selectedLot" 
                    size="mini"
                    @change="lotChanged()"
                    placeholder="Select">
                      <el-option
                        v-for="item in lotArray"
                        :key="item"
                        :label="'lot '+item"
                        :value="item">
                      </el-option>
                    </el-select>
                </el-row>
                <el-row>
                  <el-select 
                    v-model="selectedTec" 
                    :disabled="selectedLot == null"
                    @change="tecChanged()"
                    size="mini"
                    placeholder="Select">
                      <el-option
                        v-for="item in entityModel[selectedLot]"
                        :key="item"
                        :label="item"
                        :value="item">
                      </el-option>
                    </el-select>
                </el-row>
                
              </el-col>

            </el-row>
            <el-row class="row-subtitle">
              <h3 style="text-align:center; width:100%;"> Lot {{selectedLot}} - {{selectedTec}} </h3>
            </el-row>
            <el-row  :span="24" class="kpi600-switches">
              <el-form style="text-align:left" :model="kpi600Model"  ref="formKPI600">
                <el-form-item
                  :label="kpi600Model.kpi601.label"
                  :label-width="formLabelWidth">
                  <el-switch 
                    :disabled="!writeAccess || disable"
                    v-model="kpi600Model.kpi601.value" 
                    @change="kpiChanged();"></el-switch>
                  <span class="kpi600-switches-text">{{kpi600Model.kpi601.text}}</span>
                </el-form-item>
                <el-form-item
                  :label="kpi600Model.kpi602.label"
                  :label-width="formLabelWidth">
                  <el-switch 
                    :disabled="!writeAccess || disable"
                    v-model="kpi600Model.kpi602.value" 
                    @change="kpiChanged();"></el-switch>
                  <span class="kpi600-switches-text">{{kpi600Model.kpi602.text}}</span>
                </el-form-item>
                <el-form-item
                  :label="kpi600Model.kpi603.label"
                  :label-width="formLabelWidth">
                  <el-switch
                    :disabled="!writeAccess || disable" 
                    v-model="kpi600Model.kpi603.value" 
                    @change="kpiChanged();"></el-switch>
                  <span class="kpi600-switches-text">{{kpi600Model.kpi603.text}}</span>
                </el-form-item>
                <el-form-item
                  :label="kpi600Model.cancelByCustomer.label"
                  :label-width="formLabelWidth">
                  <el-switch
                    :disabled="!writeAccess || disable" 
                    v-model="kpi600Model.cancelByCustomer.value" 
                    @change="cancelByCustomerChanged()"></el-switch>
                  <span class="kpi600-switches-text">{{kpi600Model.cancelByCustomer.text}}</span>
                </el-form-item>
            
            
              </el-form>
            </el-row>
            
          </span>
        </div>
      </el-card>
  </el-row>
</template>
<script>
import Vue from "vue";
import moment from "moment";
import axios from "axios";
import formkpi600 from "@/components/external/FormKpi600";
Vue.component("FormKpi600", formkpi600);

export default {
  name: "FormKpi600",
  data() {
    return {
      monthSelected: null,
      lotArray: [],
      entityModel: {"1":[],"2":[],"3":[]},
      selectedLot: null,
      selectedTec: null,
      disable: true,
      currentKPI600MonthlyObj: null,
      strPeriod1: '',
      strPeriod2: '',
      formLabelWidth: '200px',
      writeAccess:false,
      kpi600Model: {
        kpi601: {
          value: false,
          text: 'De agenda van de meeting  was ten laatste 5 werkdagen voor de meeting gestuurd',
          label: 'Agenda ',
        },
        kpi602: {
          value: false,
          text: 'Op voorhand overeengekomen personen waren aanwezig op vergadering op afgesproken tijd en uur',
          label: 'Aanwezighed '
        },
        kpi603: {
          value: false,
          text: 'Het verslag van de meeting was ten laatste 5 werkdagen  na de meeting gestuurd',
          label: 'Verslag '
        },
        cancelByCustomer: {
          value: false,
          text: 'De vergadering was door BAC geannuleerd',
          label: 'Vergadering geannuleerd '
        },

      }
      
    };
  },
  computed: {
    
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    prepareData() {
      console.log('prepare data')
      this.getEntitiesModel()
      
      
      this.monthSelected = moment()
      this.dateSelected()

    },
    
    dateSelected() {


      if(this.monthSelected == null)
        this.monthSelected = moment()


      if(moment().format('D') > 14) {
        //console.log('report already done')
        this.disable = (moment() > moment(this.monthSelected).endOf('Month'))
      }
      else {
        this.disable = (moment().subtract(1, 'months') > moment(this.monthSelected).endOf('Month'))
      }
        
      this.strPeriod1 = 'Vergadering van '+moment(this.monthSelected).subtract(1, 'months').format('21 MMM YYYY') + ' to ' + moment(this.monthSelected).format('14 MMM YYYY')
      this.strPeriod2 = 'Overleg KPI van '+moment(this.monthSelected).startOf('Month').subtract(2, 'months').format('MMM YYYY')
      this.getData()
    },
    getData() {
      console.log('get data')

      if(this.selectedLot == null)
        return

      if(this.selectedTec == null)
        return

      if(this.monthSelected == null)
        return

      var strDate = moment(this.monthSelected).format('YYYY-MM-DD')

      var strTec = this.selectedTec.replace(/ /g, '').replace(/\//g, '')

      console.log(strDate)

      axios.get(
        this.$store.getters.apiurl + "biac/kpi600_monthly/"+this.selectedLot+"/"+strTec+"/"+strDate+"?token="+this.$store.getters.creds.token
        ).then((response) => {
          if(response.data.error!="")
            console.log("get KPI600 monthly error");
          else {
            console.log("get KPI600 monthly success");
            console.log(response.data.data)
            console.log(typeof(response.data.data))
            
            this.currentKPI600MonthlyObj = response.data.data


            this.kpi600Model.kpi601.value = this.currentKPI600MonthlyObj.kpi601
            this.kpi600Model.kpi602.value = this.currentKPI600MonthlyObj.kpi602
            this.kpi600Model.kpi603.value = this.currentKPI600MonthlyObj.kpi603
            this.kpi600Model.cancelByCustomer.value = this.currentKPI600MonthlyObj.cancel_by_customer



          }
      })
      .catch((error)=> {
        console.log(error);
      });

      
    },
    lotChanged() {
      console.log('lot changed')
      console.log(this.selectedLot)

      this.selectedTec = this.entityModel[this.selectedLot][0]

      this.getData()
    },
    tecChanged() {
      console.log('tec changed')
      console.log(this.selectedTec)

    
      this.getData()
    },
    kpiChanged() {
      if(!this.kpi600Model.kpi602.value)
        this.kpi600Model.cancelByCustomer.value = false

      this.currentKPI600MonthlyObj.kpi601 = this.kpi600Model.kpi601.value
      this.currentKPI600MonthlyObj.kpi602 = this.kpi600Model.kpi602.value
      this.currentKPI600MonthlyObj.kpi603 = this.kpi600Model.kpi603.value
      this.currentKPI600MonthlyObj.cancel_by_customer = this.kpi600Model.cancelByCustomer.value


      this.updateData(this.selectedLot, this.selectedTec, this.monthSelected, this.currentKPI600MonthlyObj)
      
    },
    cancelByCustomerChanged() {
      if(this.kpi600Model.cancelByCustomer.value) {
        this.kpi600Model.kpi601.value = true
        this.kpi600Model.kpi602.value = true
        this.kpi600Model.kpi603.value = true
      }

      this.kpiChanged()
    },
    getEntitiesModel() {
      console.log(JSON.stringify(this.$store.getters.creds.user.privileges))

      for(var i in this.$store.getters.creds.user.privileges) {
        var priv = this.$store.getters.creds.user.privileges[i]
        if(priv =='admin' || priv=='kpi600-ihm-write') {
          this.writeAccess = true
        }
      }


      axios.get(
        this.$store.getters.apiurl + "biac/kpi_model/600?token="+this.$store.getters.creds.token
        ).then((response) => {
          if(response.data.error!="")
            console.log("retrieve KPI600 model entities error");
          else {
            console.log("retrieve KPI600 model entities  success");
            console.log(response.data.data)
            console.log(typeof(response.data.data))
            this.entityModel = JSON.parse(response.data.data)

            for(var i in this.entityModel) {
              console.log(i)
              this.lotArray.push(i)
            }

            this.selectedLot = Object.keys(this.entityModel)[0]
            this.selectedTec = this.entityModel[this.selectedLot][0]

            this.getData()
          }
      })
      .catch((error)=> {
        console.log(error);
      });
    },

    updateData : _.debounce(function(lot, tec, date, obj) {
      console.log('update date')
      console.log('lot '+lot)
      console.log('tec '+tec)
      console.log('date '+date)
      console.log(obj)
      

      var rec = {
        _id: obj._id,
        _index: "biac_kpi600_monthly",
        isadd:false,
        _type: "doc",

        _source: {
        }
      }

        
      rec._source = JSON.parse(JSON.stringify(obj))
      delete rec._source._id
      rec._source['@timestamp'] = moment(rec._source['@timestamp']).format()

      console.log(rec)

      this.$store.commit({
        type: "updateRecord",
        data: rec
      });




      this.$notify({
        title: "Data Saved",
        message: "",
        type: "success",
        position: "bottom-right"
      });
    }, 1500),



  }
};
</script>
<style>
.kpi600-container{
  width: 100%;
  margin: 30px 0px; 
  
}
.box-card {
  width: 800px !important;
}

.kpi600-container  .parameters-selection{
  margin: 10px;

}

.first-row{
  /*margin: 10px;*/
}
.second-row{
  /*margin: 20px 10px;*/
}
.third-row{
  /*margin: 20px 10px;*/
}

.row-day {
  padding-top:10px;
  padding-bottom:10px;
  border-top: solid 1px lightgrey;
}

.kpi600-switches-text {
  margin-left: 20px; 
  font-size: 11px;
}

.kpi600-container .row-subtitle {
  border-top: solid 1px #eee;
  margin-top: 15px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-bottom: 15px;
  border-bottom: solid 1px #eee;
}
</style>