<template>
  <el-row class="kpi101-container" :span="24" type="flex" justify="center">
      <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="40%">
        <el-form style="text-align:left" :model="dialogObj" v-if="dialogVisible" :rules="rulesForm" ref="formCall">
        
              <el-form-item
                  label="CM/EQ Nummer "
                  :label-width="formLabelWidth">
                <el-input-number 
                  style="max-width:220px;"
                  v-model="dialogObj.number" 
                  :controls="false"
                  size="mini"></el-input-number>
              </el-form-item>
        
              <el-form-item
                  label="Datum uur "
                  :label-width="formLabelWidth">
                <el-date-picker
                  v-model="dialogObj.datetime"
                  :picker-options={firstDayOfWeek:1}
                  type="datetime"
                  size="mini"
                  placeholder="Select date and time">
                </el-date-picker>
              </el-form-item>

              <!-- <el-form-item
                  label="Oproep "
                  :label-width="formLabelWidth">
                  <el-select 
                    v-model="dialogObj.lot" 
                    size="mini"
                    placeholder="Select">
                    <el-option
                      v-for="item in lotModel"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value">
                    </el-option>
                  </el-select>
              </el-form-item> -->
              <el-form-item
                  label="Group "
                  :label-width="formLabelWidth">
                  <div>
                    <el-radio-group v-model="dialogObj.lot" size="mini">
                      <el-radio-button v-for="item in lotModel"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value" ></el-radio-button>
                    </el-radio-group>
                  </div>
              </el-form-item>
        
              <!--<el-form-item
                  label="Aangemaakt door "
                  :label-width="formLabelWidth">
                <el-input 
                  style="max-width:220px;"
                  v-model="dialogObj.madeBy" 
                  autocomplete="off"
                  size="mini"></el-input>
              </el-form-item>
            
              <el-form-item
                  label="Telefoonnummer "
                  :label-width="formLabelWidth">
                <el-input 
                  style="max-width:220px;"
                  v-model="dialogObj.phoneNumber" 
                  autocomplete="off"
                  size="mini"></el-input>
              </el-form-item>-->
            
        </el-form>
        
        <span slot="footer" class="dialog-footer">
          <el-button 
            v-if="dialogType == 'modif'"
            type="danger" 
            size="small" 
            :loading="deleteLoading"
            @click="clickDialogDelete">Delete</el-button>
          <el-button 
            type="default" 
            plain 
            size="small" 
            @click="dialogVisible = false">Cancel</el-button>
          <el-button 
            v-if="dialogType=='modif'"
            type="primary"
            :disabled="!callHasBeenModified" 
            plain 
            size="small" 
            :loading="loading"
            @click="clickDialogModify">Modify</el-button>
          <el-button 
            v-else
            type="primary"
            plain 
            size="small" 
            :disabled="dialogObj==null || dialogObj.lot==null || dialogObj.datetime==null" 
            :loading="loading"
            @click="clickDialogCreate">Create</el-button>
        </span>
      </el-dialog>



    
      
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span style="font-weight:bold">KPI101 - Bereikbaarheid door HIF</span>
        </div>
        <div class="card-body">
          <el-row class="first-row" :span="24">
              <el-col  :span="8" style="text-align:left;">
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
                  {{strPeriod}}
                </el-row>                
              </el-col>
          </el-row>
          <el-row class="second-row" :span="24">
              <el-col  :span="24"  style="text-align:right;" type="flex">
                <el-row>
                    
                    <el-col 
                      :span="6" 
                      style="text-align:center; font-weight:bold;" 
                      v-for="(item, index) in lotModel"
                      :offset="index === 0 ? 6 : 0"
                      :key="index">{{item.label}}</el-col>
                 
                </el-row>
                <el-row>
                  <el-col :span="6" style="text-align:right;">Total oproepen  </el-col>
                  <el-col 
                    :span="6" 
                    style="text-align:center;"
                    v-for="(item, index) in lotModel"
                    :key="index">
                    <el-input-number
                      v-model="item.numberOfCall"
                      :disabled="!monthSelected || disable" 
                      size="mini"
                      @change="handleChangeNumberCall" 
                      
                      :min="0" >
                    </el-input-number>
                  </el-col>
                </el-row>
                  
                <el-row>
                  <el-col :span="6" style="text-align:right;">Niet tijdige antwoorden   </el-col>
                  <el-col 
                    :span="6" 
                    style="text-align:center;"
                    v-for="(item, index) in lotModel"
                    :key="index">
                    <el-input-number 
                      v-model="item.notTimelyAnswered"
                      :disabled="true"
                      :controls="false"
                      size="mini"
                      :min="0" >
                    </el-input-number>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="6" style="text-align:right;">Percentage   </el-col>

                  <el-col 
                    :span="6" 
                    style="text-align:center;"
                    v-for="(item, index) in lotModel"
                    :key="index">
                    <el-input-number 
                      v-model="item.percentage"
                      :disabled="true"
                      :controls="false"
                      size="mini"
                      :min="0" >
                    </el-input-number>
                  </el-col>


                  
                </el-row>
              </el-col>
  
          </el-row>
          <el-row class="third-row" :span="24">
            <el-button
              :disabled="!monthSelected || disable"
              type="primary"
              icon="el-icon-plus"
              @click="addCall"
              round
            >Geen tijdig antwoord</el-button>

          </el-row>
          <el-row class="fourth-row" :span="24">
            <el-table
              :data="callData"
              :default-sort = "{prop: 'datetime', order: 'descending'}"
              ref="callTable"
              border
              size="mini"
              style="width: 100%"
              highlight-current-row
              @current-change="handleTableSelect"
              v-bind:class="{ 'table-disable': disable }"
              height="300">
              <el-table-column
                sortable
                prop="number"
                label="CM/EQ Nummer"
                width="299">
              </el-table-column>
              <!--<el-table-column
                sortable
                prop="madeBy"
                label="Aangemaakt door"
                width="190">
              </el-table-column>-->
              <el-table-column
                sortable
                prop="lot"
                label="Lot"
                width="100">
              </el-table-column>
              <el-table-column
                sortable
                prop="date"
                label="Datum"
                width="170">
              </el-table-column>
              <el-table-column
                sortable
                prop="hour"
                label="Uur"
                width="170">
              </el-table-column>
              <!--<el-table-column
                sortable
                prop="phoneNumber"
                label="Telefoonnummer"
                width="180">
              </el-table-column>-->
            </el-table>
          </el-row>
        </div>
      </el-card>
  </el-row>
</template>
<script>
import Vue from "vue";
import moment,{ months } from "moment";
import axios from "axios";

export default {
  name: "FormKpi101",
  data() {
    var validateMadeBy = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('Please input the field made by'));
      } 
      else {
        callback();
      }
    };
    var validatePhoneNumber = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('Please input the phone number'));
      } 
      else {
        callback();
      }
    };
    var validateNumber = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('Please input the number'));
        } 
        else {
          callback();
        }
    };

    return {
      numberOfCall: 0,
      strPeriod: '',
      notTimelyAnswered: 0,
      formLabelWidth: "150px",
      daySelected:  null,
      monthSelected: null,
      dialogType: 'creation',
      dialogVisible: false,
      dialogObj: null,
      dialogTitle: 'New aantal niet tijdige antwoorden',
      loading: false,
      deleteLoading: false,
      callData: null,
      disable: false,
      targetMonth: null,
      lotModel: [
        {
          label: 'Stookplaatsen',
          value: 1,
          numberOfCall: 0,
          notTimelyAnswered: 0,
          percentage: 0,
        },
        {
          label: 'Andere Gebouwen',
          value: 3,
          numberOfCall: 0,
          notTimelyAnswered: 0,
          percentage: 0,
        },
        {
          label: 'Rondiers',
          value: 2,
          numberOfCall: 0,
          notTimelyAnswered: 0,
          percentage: 0,
        },
      ],
      rulesForm: { 
          number: [
            { validator: validateNumber, trigger: 'blur' }
          ]
      },
      
    };
  },
  computed: {
    callHasBeenModified: function() {
      return JSON.stringify(this.currentRow) != JSON.stringify(this.dialogObj)
    }
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    prepareData() {
      console.log('prepare data')
      this.monthSelected = moment()
      this.dateSelected()
    },
    dateSelected() {
      
      if(this.monthSelected == null)
        this.monthSelected = moment()

      if(moment().format('D') > 14) {
        this.disable = (moment() > moment(this.monthSelected).endOf('Month'))
      }
      else {
        this.disable = (moment().subtract(1, 'months') > moment(this.monthSelected).endOf('Month'))
      }
        
      this.strPeriod = moment(this.monthSelected).startOf('Month').format('DD MMM YYYY')+' to '+moment(this.monthSelected).endOf('Month').format('DD MMM YYYY')
      this.getData()
    },
    getData() {
      var url =
      this.$store.getters.apiurl +
      "generic_search/biac_kpi101_call*?token=" +
      this.$store.getters.creds.token;

      var query = {
        size: 2000,
        sort : [{ 
            datetime : {order : "desc"}
          }
        ],
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

      var start = moment(this.monthSelected).startOf('Month');
      var end   = moment(this.monthSelected).endOf('Month');

      var range = {
        "datetime": {
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
            console.log("KPI101 Calls list error...");
          else
          {
            this.callData=[]
            for(var i in response.data.records) {
              response.data.records[i]._source._id = response.data.records[i]._id 
              response.data.records[i]._source.date = moment(response.data.records[i]._source.datetime).format('DD/MM/YY')
              response.data.records[i]._source.hour = moment(response.data.records[i]._source.datetime).format('hh:mm')

              for(var j in this.lotModel) {
                if(this.lotModel[j].value == response.data.records[i]._source.lot)
                  response.data.records[i]._source.label = this.lotModel[j].label
              }

              this.callData.push(response.data.records[i]._source)
            }

            for(var i in this.lotModel) {
              var lotModel = this.lotModel[i]
              console.log(lotModel.value)

              try {
                lotModel.notTimelyAnswered = _.filter(this.callData, { 'lot': lotModel.value }).length
              }
              catch {
                lotModel.notTimelyAnswered = 0
              }  
            }
           
            var url =
            this.$store.getters.apiurl +
            "generic_search/biac_kpi101_monthly*?token=" +
            this.$store.getters.creds.token;
      
            var query = {
              "size": 2000,
              "query": {
                "bool": {
                  "must": [
                    {
                      "match": {
                        "_id": start.valueOf()
                      }
                    }
                  ]
                }
              }
            };
      
            axios
              .post(url, query)
              .then((response) => {
                if(response.data.error!="")
                  console.log("KPI101 Monthly error...");
                else
                {
                  console.log(response.data.records)
                  try {
                    var res = response.data.records[0]

                    for(var i in this.lotModel) {
                      this.lotModel[i].percentage = res._source['percentage_'+this.lotModel[i].value]
                      
                      if (res._source['number_of_call_'+this.lotModel[i].value] != null) {
                        this.lotModel[i].numberOfCall = res._source['number_of_call_'+this.lotModel[i].value]
                      }
                      else {
                        this.lotModel[i].numberOfCall = 0
                      }
                    }
                  } 
                  catch(error){
                    console.log(error)
                    for(var i in this.lotModel) {
                      this.lotModel[i].notTimelyAnswered = 0
                      this.lotModel[i].percentage = 0
                      this.lotModel[i].numberOfCall = 0
                    }
                  }
                }
                try {
                  for(var i in this.lotModel) {
                    var lotModel = this.lotModel[i]
                    if(lotModel.numberOfCall == 0)
                      lotModel.percentage = 0
                    else {
                      var percent = 100*((lotModel.numberOfCall-lotModel.notTimelyAnswered)/lotModel.numberOfCall)
                      lotModel.percentage = Math.round(percent*100)/100
                    }
                  }
                }
                catch(error) {
                  console.log(error)
                  for(var i in this.lotModel) {
                    this.lotModel[i].percentage = 0
                  }
                }
                var tmp = JSON.parse(JSON.stringify(this.callData))
                this.callData = null
                this.callData = JSON.parse(JSON.stringify(tmp))
              })
              .catch((error)=> {
                console.log(error);
              });
          }
        })
        .catch((error)=> {
          console.log(error);
        });

    },
    handleChangeNumberCall : _.debounce(function() {
          var obj = { 
            'month_to_update': moment(this.monthSelected).format('YYYY-MM-DD'),
          }
          
          for(var i in this.lotModel) {
            obj['number_of_call_'+this.lotModel[i].value] = this.lotModel[i].numberOfCall
          }
          
          console.log(obj)

          axios.post(
            this.$store.getters.apiurl + "biac/kpi101_monthly?token="+this.$store.getters.creds.token, obj)
            .then((response) => {
              if(response.data.error!="")
                console.log("KPI101 update monthly error");
              else {
                console.log("KPI101 update monthly success");
                console.log(response.data.data)


                var res = JSON.parse(response.data.data)

                try {
                  for(var i in this.lotModel) {
                    var lotModel = this.lotModel[i]
                    lotModel.numberOfCall = res['number_of_call_'+lotModel.value]
                    lotModel.notTimelyAnswered = res['not_timely_answer_'+lotModel.value]
                    
                    if(lotModel.numberOfCall == 0)
                      lotModel.percentage = 0
                    else {
                      var percent = 100*((lotModel.numberOfCall-lotModel.notTimelyAnswered)/lotModel.numberOfCall)
                      lotModel.percentage = Math.round(percent*100)/100
                    }
                  }
                }
                catch(error) {
                  console.log(error)
                  for(var i in this.lotModel) {
                    this.lotModel[i].percentage = 0
                  }
                }

                this.$notify({
                  title: "Success",
                  message: "Data Saved",
                  type: "success",
                  position: "bottom-right"
                });
              }
          })
          .catch((error)=> {
            console.log(error);
          });
        
      }, 500),
    setTableCurrent(row) {
      this.$refs.callTable.setCurrentRow(row);
    },
    handleTableSelect(val) {
      if(this.disable)
        return

      if(val == null)
        return

      this.dialogVisible = true
      this.dialogType = 'modif'
      this.currentRow = val;
      this.dialogTitle   = 'Ticket '+val.number

      this.dialogObj = JSON.parse(JSON.stringify(this.currentRow))

      for(var j in this.lotModel) {
        if(this.lotModel[j].value == this.dialogObj.lot)
          this.dialogObj.lot = this.lotModel[j].label
      }

      this.setTableCurrent()
    },
    addCall() {
      this.dialogObj = {
        datetime: moment(),
        number: '',
      }
      this.dialogType = 'creation'
      this.dialogTitle   = 'Nieuwe oproep'
      this.dialogVisible = true

    },
    clickDialogDelete() {

      this.$confirm(
        "This will permanently delete the call. Continue?",
        "Warning",
        {
          confirmButtonText: "OK",
          cancelButtonText: "Cancel",
          type: "warning"
        })
        .then(() => {
          this.deleteLoading = true
          var delRec = {
            _id: this.currentRow._id,
            _index: 'biac_kpi101_call',
            _doc: 'doc'
          }
    
          this.$store.commit({
            type: "deleteRecord",
            data: delRec
          });
    
    
          setTimeout(() => { 
            this.getData()
            this.dialogVisible = false   
            this.deleteLoading = false
            
            this.$notify({
              title: "Success",
              message: "call "+this.currentRow.number+" has been deleted",
              type: "success",
              position: "bottom-right"
            });
    
          }, 500);
    
          setTimeout(() => this.getData(), 1500)

          setTimeout(() => {
            console.log('**************************************')
            console.log(moment(this.monthSelected).format('YYYY-MM-DD'))
            
            axios.post(
              this.$store.getters.apiurl + "biac/kpi101_monthly?token="+this.$store.getters.creds.token,
                { 'month_to_update': moment(this.monthSelected).format('YYYY-MM-DD') }
              ).then((response) => {
                if(response.data.error!="")
                  console.log("KPI104 update monthly error");
                else {
                  console.log("KPI104 update monthly success");
                  console.log(response)
                }
            })
            .catch((error)=> {
              console.log(error);
            });
          }, 2500)
        })
    },
    clickDialogModify() {
      this.loading = true
      this.$refs['formCall'].validate((valid) => {
        if (valid) {
          var id = this.dialogObj._id
          delete this.dialogObj._id
          delete this.dialogObj.hour
          delete this.dialogObj.date

          try {
            delete this.dialogObj.madeBy
            delete this.dialogObj.phoneNumber
          }
          catch {

          }
          
          for(var j in this.lotModel) {
            if(this.lotModel[j].label == this.dialogObj.lot)
              this.dialogObj.lot = this.lotModel[j].value
          }

          var newRec = {
            _id: id,
            _index: "biac_kpi101_call",
            isadd:false,
            _type: "doc",

            _source: this.dialogObj
          }

          this.$store.commit({
            type: "updateRecord",
            data: newRec
          });

          this.currentMonth = moment(this.monthSelected)
          this.targetMonth  = moment(newRec._source.datetime)

          console.log('currentMonth: ' + this.currentMonth.format('YYYY-MM-DD'))
          console.log(' targetMonth: ' + this.targetMonth.format('YYYY-MM-DD'))

          setTimeout(() => { 
            this.getData()
            this.dialogVisible = false
            this.loading = false
            this.$notify({
              title: "Success",
              message: "call "+newRec._source.number+" has been modified",
              type: "success",
              position: "bottom-right"
            });
            this.currentRow = null

          }, 500);

          setTimeout( () => this.getData(), 1500)

          
          setTimeout(() => {
            console.log('******************target month********************')
            console.log(this.targetMonth.format('YYYY-MM-DD'))
            
            axios.post(
              this.$store.getters.apiurl + "biac/kpi101_monthly?token="+this.$store.getters.creds.token,
                { 'month_to_update': this.targetMonth.format('YYYY-MM-DD') }
              ).then((response) => {
                if(response.data.error!="")
                  console.log("KPI104 update monthly error");
                else {
                  console.log("KPI104 update monthly success");
                  console.log(response)
                }
            })
            .catch((error)=> {
              console.log(error);
              
            });
          }, 2500)


          if(this.targetMonth != this.currentMonth) {
            setTimeout(() => {
              console.log('***************current month***********************')
              console.log(this.currentMonth.format('YYYY-MM-DD'))
              
              axios.post(
                this.$store.getters.apiurl + "biac/kpi101_monthly?token="+this.$store.getters.creds.token,
                  { 'month_to_update': this.currentMonth.format('YYYY-MM-DD') }
                ).then((response) => {
                  if(response.data.error!="")
                    console.log("KPI104 update monthly error");
                  else {
                    console.log("KPI104 update monthly success");
                    console.log(response)
                  }
              })
              .catch((error)=> {
                console.log(error);
                
              });
            }, 2500)
          }
        } 
        else {
          this.loading = false
          console.log('error submit!!');
          return false;
        }
      });
    },
    clickDialogCreate() {
      this.loading = true
      this.$refs['formCall'].validate((valid) => {
        if (valid) {
          
          for(var j in this.lotModel) {
            if(this.lotModel[j].label == this.dialogObj.lot)
              this.dialogObj.lot = this.lotModel[j].value
          }

          var newRec = {
            _id: "id_" + Math.floor((1 + Math.random()) * 0x1000000),
            _index: "biac_kpi101_call",
            isadd:true,
            _type: "doc",

            _source: this.dialogObj
          }

          console.log(newRec)

          this.$store.commit({
            type: "updateRecord",
            data: newRec
          });


          this.currentMonth = moment(this.monthSelected)
          this.targetMonth  = moment(newRec._source.datetime)

          console.log('currentMonth: ' + this.currentMonth.format('YYYY-MM-DD'))
          console.log(' targetMonth: ' + this.targetMonth.format('YYYY-MM-DD'))

          setTimeout(function() { 
            this.getData()
            this.dialogVisible = false
            this.loading = false
            this.$notify({
              title: "Success",
              message: "call "+newRec._source.number+" has been CREATED",
              type: "success",
              position: "bottom-right"
            });
            this.currentRow = null

          }.bind(this), 500);

          setTimeout( () => this.getData(), 1500)


          this.targetMonth = moment(newRec._source.datetime)
          
          
          setTimeout(() => {
            console.log('******************target month********************')
            console.log(this.targetMonth.format('YYYY-MM-DD'))
            
            axios.post(
              this.$store.getters.apiurl + "biac/kpi101_monthly?token="+this.$store.getters.creds.token,
                { 'month_to_update': this.targetMonth.format('YYYY-MM-DD') }
              ).then((response) => {
                if(response.data.error!="")
                  console.log("KPI104 update monthly error");
                else {
                  console.log("KPI104 update monthly success");
                  console.log(response)
                }
            })
            .catch((error)=> {
              console.log(error);
            });
          }, 2500)

          if(this.targetMonth != this.currentMonth) {
            setTimeout(() => {
              console.log('***************current month***********************')
              console.log(this.currentMonth.format('YYYY-MM-DD'))
              
              axios.post(
                this.$store.getters.apiurl + "biac/kpi101_monthly?token="+this.$store.getters.creds.token,
                  { 'month_to_update': this.currentMonth.format('YYYY-MM-DD') }
                ).then((response) => {
                  if(response.data.error!="")
                    console.log("KPI104 update monthly error");
                  else {
                    console.log("KPI104 update monthly success");
                    console.log(response)
                  }
              })
              .catch((error)=> {
                console.log(error);
              });
            }, 2500)
          }
        } 
        else {
          console.log('error submit!!');
          return false;
        }
      });
    }
  }
};

</script>
<style>
.kpi101-container{
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
.forth-row{
  margin: 20px 10px;
}

.table-disable {
  cursor: not-allowed;
}
</style>