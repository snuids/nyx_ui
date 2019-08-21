<template>
  <!--MAIN DIALOG -->
  <el-row class="query-filter">
    <div class="select-bar-container" >            
      <el-col 
        :span="parseInt(24/queryFilterCopy.config.queryfilters.length)" 
        :key="queryfilter.key" 
        v-for="queryfilter in queryFilterCopy.config.queryfilters"
        style="text-align:left">
        {{queryfilter.title}}   
             
        <el-select
          size="mini"
          v-model="queryfilter.default"
          placeholder="Please select a type"
          @change="prepareData(queryfilter.title)"
        >
          <el-option
            v-for="(qf, index) in queryfilter.options"
            :label="qf.title"
            :value="qf.value"
            :key="index"
          ></el-option>
        </el-select>
      </el-col>
    </div>
    <div class="refresh-button">
      <el-button 
        @click="refresh()" 
        
        style="width:90%;" 
        size="mini" 
        type="primary">refresh</el-button>
    </div>
    <div class="download-button" v-if="config && config.downloadChecked">
      <el-popover placement="bottom-start" width="150" trigger="hover">
          <el-col>
            <el-row class="popover-title">
              <span>Download the selection</span>
            </el-row>
            <el-row class="button-dl">
              <el-button
                v-for="format in exportFormats"
                :type="format.type"
                :key="format.value"
                round
                size="mini"
                @click="downloadSelection(format.value)"
              >{{format.label}}</el-button>
            </el-row>
          </el-col>
           <el-button
           slot="reference"
            round
            type="default"
            icon="el-icon-download"
            size="mini"
          ></el-button>
      </el-popover>
     
    </div>
  </el-row>
</template>

<script>
export default {
  name: "QueryFilter",
  data: () => ({ 
    queryfilter: "" ,
    queryFilterCopy:undefined,
    exportFormats: [
      {
        label: ".xlsx",
        value: "xlsx",
        type: "success"
      },
      {
        label: ".csv",
        value: "csv",
        type: "success"
      }
    ],
  }),
  props: {
    config: {
      type: Object
    }
  },
  computed: {
    configin: function() {
      this.queryFilterCopy=JSON.parse(JSON.stringify(this.config));
      return this.config;
    },
    query: function() {
      var querya = [];
      for (var queryind in this.config.config.queryfilters) {
        querya.push(
          this.config.config.queryfilters[queryind].field +
            ':"' +
            this.config.config.queryfilters[queryind].default +
            '"'
        );
      }
      return querya.join(" AND ");
    }
  },
  watch: {
    configin: {
      handler: function() {
        //alert('CONFIG UPDATED')
        this.prepareData(); //??????????????????????????? AMA 28 Mars 2019
      },
      deep: true
    }
    
  },
  methods: {
    refresh: function() {
      console.log("refresh");
      this.$emit("queryfilterchanged", this.queryfilter);
    },
    downloadSelection: function(format) {
      this.$emit("downloadasked", format);
    },


    prepareData: function(e) {
      
      if (this.queryFilterCopy.config.queryfilters != undefined) {
        
        for (let queryind in this.queryFilterCopy.config.queryfilters) {
          var queryf = this.queryFilterCopy.config.queryfilters[queryind];
          if (queryf.type == "selecter") {            
            queryf.options = [];
            for (var opt in queryf.selectOptions) {
              var selectopt = queryf.selectOptions[opt];

              
                queryf.options.push({
                  title: selectopt.split("=")[1],
                  value: selectopt.split("=")[0]
                });
            }
          }
        }
      }
      var querya = [];
      for (let queryind in this.queryFilterCopy.config.queryfilters) {

        if(this.queryFilterCopy.config.queryfilters[queryind].default!="*")
          querya.push(
            this.queryFilterCopy.config.queryfilters[queryind].field +
              ':"' +
              this.queryFilterCopy.config.queryfilters[queryind].default +
              '"'
          );
      }
      this.queryfilter = querya.join(" AND ");


      this.refresh()
    }
  },
  created: function() {
    this.prepareData();
  }
};
</script>

<style>

.query-filter .select-bar-container {
  width: -webkit-calc(100% - 205px);
  width: -moz-calc(100% - 205px);
  width: calc(100% - 205px);
  float: left;
  font-weight: bold;

}
.query-filter .refresh-button {
  width: 130px;
  float: right;
}
.query-filter .download-button {
  width: 70px;
  float: right;
}
</style>

