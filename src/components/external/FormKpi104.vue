<template>
  <el-row class="kpi104-container" :span="24" type="flex" justify="center">  
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span style="font-weight:bold">KPI104 - Twee rondiers op de site</span>
        </div>
        <div class="card-body">
          <el-row class="first-row" :span="24">
              <el-col  :span="12" style="text-align:left;">
                <el-row>
                  <el-date-picker
                    v-model="weekSelected"
                    type="week"
                    size="mini"
                    format="Week WW"
                    :picker-options={firstDayOfWeek:1}
                    placeholder="Pick a week"
                    @change="dateSelected()">
                  </el-date-picker>
                </el-row>
                <el-row style="margin-left:5px; font-weight:bold;">
                  {{strPeriod}}
                </el-row>

              </el-col>
          </el-row>
          <el-row class="second-row" :span="24">
            
          </el-row>
          <span v-if="weekSelected">

            <el-row class="header1" :span="24">
              
              <el-col :offset="6" :span="6" style="font-weight:bold">6u - 14u</el-col>
              <el-col             :span="6" style="font-weight:bold">14u - 22u</el-col>
              <el-col             :span="6" style="font-weight:bold">22u - 6u</el-col>
            </el-row>
            <el-row class="header2" :span="24">
              <el-col  :span="6" style="text-align:left;">
                <el-checkbox 
                  :indeterminate="isIndeterminate" 
                  v-model="checkAll" 
                  :disabled="disable"
                  @change="handleCheckAllChange">Check all</el-checkbox>
  


              </el-col>
              <el-col :span="3" >rondier1</el-col>
              <el-col :span="3" >rondier2</el-col>
              
              <el-col :span="3" >rondier1</el-col>
              <el-col :span="3" >rondier2</el-col>
              
              <el-col :span="3" >rondier1</el-col>
              <el-col :span="3" >rondier2</el-col>
              
            </el-row>
            <!--<el-row v-for="(item, day) in switchModel" :key="day" :span="24">-->
            
            <el-row v-for="(item, day) in switchModel" :key="day" :span="24" class="row-day">
              <el-col :span="6" style="text-align:left">{{dayConversion[day]}}</el-col>

              <el-col :span="3" v-for="shift in item" :key="shift.key">
                <el-switch 
                  @change="clickSwitchChange" 
                  v-model="shift.model"
                  :disabled="disable"></el-switch>
                
              </el-col> 
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
import formkpi104 from "@/components/external/FormKpi104";
Vue.component("FormKpi104", formkpi104);

export default {
  name: "FormKpi104",
  data() {
    return {
      weekSelected: null,
      checkAll: false,
      isIndeterminate: false,
      flagFalse: false,
      flagTrue: false,
      disable:true,
      strPeriod: '',
      switchModel: null,
      dayList: ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'],
      dayConversion: {'Maandag':'', 'Dinsdag':'', 'Woensdag':'', 'Donderdag':'', 'Vrijdag':'', 'Zaterdag':'', 'Zondag':''},
      shiftList: [1, 2, 3, 4, 5, 6],
    };
  },
  computed: {
    
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    handleCheckAllChange(val) {
      for(var i in this.switchModel) {
        for(var j in this.switchModel[i]) {
          this.switchModel[i][j].model = val
        }
      }
      
      this.isIndeterminate = false;

      this.switchChange()
    },
    prepareData() {
      console.log('prepare data')
      this.weekSelected = moment()
      this.dateSelected()
    },
    setDefaultModel() {
      this.flagFalse = true
      this.flagTrue = false
      this.switchModel = {}
      for(var i in this.dayList) {

        this.switchModel[this.dayList[i]] = []

        for(var j in this.shiftList) {
          var obj = {
                      model: false, 
                      key:i+''+j
                    }

          this.switchModel[this.dayList[i]].push(obj)
        }
      }

      this.determineIsIndeterminated()
      
    },
    dateSelected() {
      var count = 0
      for(var i in this.dayConversion) {
        var date = moment(this.weekSelected).day("Monday").startOf('Day').add(count, 'days').format('DD MMM YYYY')
        this.dayConversion[i] = i+' - '+moment(this.weekSelected).day("Monday").startOf('Day').add(count, 'days').format('DD/MM/YY')
        count++
      }



      if(moment().format('D') > 14) 
        this.disable = (moment() > moment(this.weekSelected).endOf('Week').endOf('Month'))
      else
        this.disable = (moment().subtract(1, 'months') > moment(this.weekSelected).endOf('Week').endOf('Month'))

      console.log(this.disable)

      this.setDefaultModel()
      this.strPeriod = moment(this.weekSelected).day("Monday").startOf('Day').format('DD MMM YYYY')+' to '+moment(this.weekSelected).day("Sunday").add(1, 'Week').startOf('Day').format('DD MMM YYYY')
      this.getData()
    },
    getData() {
      console.log('get data')

      var url =
      this.$store.getters.apiurl +
      "generic_search/biac_kpi104_check*?token=" +
      this.$store.getters.creds.token;

      var query = {
        size: 2000,
        query: {
          bool: {
            must: [
              {
                match_all: {}
              }
            ]
          }
        }
      };

      var weekNumber = moment(this.weekSelected).week()


      var start = moment().day("Monday").week(weekNumber).startOf('day');
      var end   = moment().day("Sunday").week(weekNumber+1).endOf('day');


      var range = {
        "@timestamp": {
          gte: start.valueOf(),
          lte: end.valueOf(),
          format: "epoch_millis"
        }
      };
      query.query.bool.must.push({
        range: range
      });

      axios
      .post(url, query)
      .then((response) => {
        if(response.data.error!="")
          console.log("KPI104 get data error...");
        else {
          this.flagFalse = false
          this.flagTrue = false

          for(var i in response.data.records) {
            var rec = response.data.records[i]._source

            this.switchModel[rec.day][rec.shift].model = rec.value

            if(rec.value)
              this.flagTrue = true
            else
              this.flagFalse = true
          }

          this.determineIsIndeterminated()

          var tmp = JSON.parse(JSON.stringify(this.switchModel))
          this.switchModel = null
          this.switchModel = JSON.parse(JSON.stringify(tmp))
        }
      })
      .catch((error)=> {
        console.log(error);
        var tmp = JSON.parse(JSON.stringify(this.switchModel))
        this.switchModel = null
        this.switchModel = JSON.parse(JSON.stringify(tmp))
      });
    },
    determineIsIndeterminated: function() {
      if(this.flagFalse && this.flagTrue) {
        console.log('is indeterminated true')
        this.isIndeterminate = true
        this.checkAll = false
      }
      else {
        console.log('is indeterminated false')
        this.isIndeterminate = false
        if(this.flagFalse) 
          this.checkAll = false
        else
          this.checkAll = true
      }

    },
    clickSwitchChange: function() {
      this.flagTrue  = false
      this.flagFalse = false
      for(var i in this.switchModel) {
        for(var j in this.switchModel[i]) {
            var model = this.switchModel[i][j].model
            if(model) 
              this.flagTrue = true
            else
              this.flagFalse = true
        }
      }
      this.determineIsIndeterminated()
      this.switchChange()
    },
    switchChange : _.debounce(function() {
      console.log('switchChange-')
      
      var count = 0
      var startDate = moment(this.weekSelected).day("Monday").startOf('Day').add(count, 'days')
      var lastDate  = moment(this.weekSelected).day("Monday").startOf('Day').add(count, 'days')

      //this.flagTrue = false
      //this.flagFalse = false

      for(var i in this.switchModel) {
        var date = moment(this.weekSelected).day("Monday").startOf('Day').add(count, 'days')
        console.log(i + ' '+ date.format('DD MMM YYYY hh:mm:ss'))


        count++
        for(var j in this.switchModel[i]) {
          var model = this.switchModel[i][j].model

          if(model) 
            lastDate = date
        
          var obj = {
            '@timestamp': date.valueOf(),
            'value': model
          }

          if(j%2 == 0)
            obj.ronde = 'rondier1'
          else 
            obj.ronde = 'rondier2'

          if(j < 2)
            obj.time = '6u - 14u'
          else if(j < 4)
            obj.time = '14u - 22u'
          else
            obj.time = '22u - 6u'

          obj.day = i
          obj.shift = j


          obj.key= 'Lot2 ELEC (BACELE)'
          obj.lot= '2'
          obj.contract= 'BACELE'

          var newRec = {
            _id: obj['@timestamp']+'_'+j,
          _index: "biac_kpi104_check",
          isadd:false,
          _type: "doc",

          _source: obj
        }
          
        this.$store.commit({
          type: "updateRecord",
          data: newRec
        });

        }
      }


      console.log(lastDate.format('YYYY-MM-DD'))

      setTimeout(() => {
        axios.post(
          this.$store.getters.apiurl + "biac/kpi104_monthly?token="+this.$store.getters.creds.token,
            { 'last_update_time': lastDate.format('YYYY-MM-DD') }
          ).then((response) => {
            if(response.data.error!="")
              console.log("KPI104 update monthly error");
            else
              console.log("KPI104 update monthly success");
        })
        .catch((error)=> {
          console.log(error);
          
        });
      }, 3500)




      this.$notify({
        title: "Data Saved",
        message: "",
        type: "success",
        position: "bottom-right"
      });
    }, 2000),
  }
};
</script>
<style>
.kpi104-container{
  width: 100%;
  margin: 30px 0px; 
}
.box-card {
  width: 800px !important;
}

.first-row{
  margin: 10px;
}
.second-row{
  margin: 20px 10px;
}
.third-row{
  margin: 20px 10px;
}

.row-day {
  padding-top:10px;
  padding-bottom:10px;
  border-top: solid 1px lightgrey;
}
</style>