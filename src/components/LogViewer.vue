<template>
  <el-card v-loading="loading" shadow="never">
    <div v-if="error">
      Unable to retrieve logs <br/>
      {{error}}
    </div>
    <div v-else>
      <el-table
          class="table-logs"
          size="mini"
          :data="tableLogs"
          style="width: 100%"
        >
          <el-table-column
            width="90"
            label="Date"
            prop="date"
            sortable
          >
          </el-table-column>
          <el-table-column
            width="90"
            label="Severity"
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
            prop="message">
          </el-table-column>
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
    loading: true,
    tableLogs: null,
    error: '',
    
  }),
  computed: {
    
  },
  props: {
    logObj: { type: Object },
  
  },
  mounted: function() {
    console.log('created')
    // setTimeout(() => {
    //   this.prepareData()
    //   }, 3000);
    this.prepareData()
  },
  methods: {
    prepareData: function() {
      console.log('prepareData')
      this.loading = true
      var indice = this.logObj.indice
      var id     = this.logObj.id
      this.tableLogs = []

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
            for(var i=0; i < response.data.data._source.logs.length; i++) {
              var log = response.data.data._source.logs[i].split('\t')
              var obj = {
                date : moment(log[0], 'DDMMMYYYY HH:mm:ss:SSS').format('HH:mm:ss'),
                severity : log[1],
                message : log[2],
              }
              this.tableLogs.push(obj)
            }
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