<template>
  <el-card v-loading="loading" shadow="never">
    <div v-if="error">
      Unable to retrieve logs <br/>
      {{error}} <br/>
    </div>
    <div v-else>
      <el-table
          class="table-logs"
          size="mini"
          v-if="tableLogs"
          :data="tableLogs.filter(data => !search || JSON.stringify(data).toLowerCase().includes(search.toLowerCase()))"
          style="width: 100%"
        >
          <el-table-column
            width="90"
            :label="$t('generic.date')"
            prop="date"
            sortable
          >
          </el-table-column>
          <el-table-column
            width="90"
            :label="$t('generic.severity')"
            prop="severity" 
          >
            <template slot-scope="scope">
              
              <el-tag size="mini" v-if="scope.row.severity.toLowerCase()=='error'" type="danger" effect="dark">{{scope.row.severity}}</el-tag>
              <el-tag size="mini" v-else-if="scope.row.severity.toLowerCase()=='warning'" type="warning" effect="dark">{{scope.row.severity}}</el-tag>
              <el-tag size="mini" v-else-if="scope.row.severity.toLowerCase()=='info'" type="" effect="plain">{{scope.row.severity}}</el-tag>
              <el-tag size="mini" v-else type="info" effect="dark">{{scope.row.severity}}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column
            label="Message"
            prop="message"
            >
            <template slot-scope="scope">              
              <span style="{ color:black;white-space: pre-wrap !important;}">{{scope.row.message}}</span>
            </template>   
                      
          </el-table-column>

          <el-table-column            
            label=""
            prop=""
            align="right"
            v-if="logObj.search"
            width="170"
            >
            
             <template slot="header" slot-scope="scope" style="text-align:right">
              <el-input
                v-model="search"                
                size="mini"
                :placeholder="$t('generic.type_to_search')"/>

            </template>
          </el-table-column>

            <!-- v-if="logObj.search" -->
          <!--el-table-column
            label="Message"
            prop="message"
            header-align="right">
            <template slot="header" slot-scope="scope" style="text-align:right">
              <el-input
                v-model="search"
                style="width:50%"
                size="mini"
                :placeholder="$t('generic.type_to_search')"/>

            </template>
          </el-table-column-->
          <!-- <el-table-column v-if="logObj"  align="right">
            <template slot="header" slot-scope="scope">
              <el-input
                v-model="search"
                size="mini"
                placeholder="Type to search"/>
            </template>
      
          </el-table-column> -->
      </el-table>
      
    </div>

  </el-card>
</template>

<script>
import axios from "axios";
import moment from "moment";
import Vue from "vue";


export default {
  name: "LogViewer",
  data: () => ({
    search:'',
    loading: true,
    tableLogs: null,
    error: '',
    
  }),
  props: {
    logObj: { type: Object },
  
  },
  computed: {
    logObjIn: function() {
      return this.logObj;
    },
  },
  watch: {
    logObjIn: {
      handler: function() {
        console.log("Log viewer config changed.....");
        this.prepareData();
      },
      deep: true
    }
  },
  mounted: function() {
    console.log('created')
    this.prepareData()
  },
  methods: {
    prepareData: function() {
      console.log('prepareData')
      this.loading = true
      var indice = this.logObj.indice
      var id     = this.logObj.id

      var url =
        this.$store.getters.apiurl +
        "generic/"+indice+"/"+id+"?token=" +
        this.$store.getters.creds.token;
      axios
        .get(url)
        .then(response => {
          if (response.data.error != "") {
            this.loading = false
            console.log("fail to retrieve log");
            this.error = response.data.error
          } 
          else {
            var tmp = []
            for(var i=0; i < response.data.data._source.logs.length; i++) {
              var log = response.data.data._source.logs[i].split('\t')
              var obj = {
                date : moment(log[0], 'DDMMMYYYY HH:mm:ss:SSS').format('HH:mm:ss'),
                severity : log[1],
                message : log[2]//.replace(/ /g,"&nbsp;"),
              }
              tmp.push(obj)
            }

            this.tableLogs = tmp
            this.loading = false
            this.error = ''
          }
        })
        .catch(error => {
          console.log(error);
          this.loading = false
          this.error = error
        });


    },
  }
};
</script>


<style>

.table-logs tr td {
  padding:0px !important;
}
</style>