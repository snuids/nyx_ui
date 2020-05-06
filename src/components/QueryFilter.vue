<template>
  <!--MAIN DIALOG -->
  <el-row class="query-filter">
    <div class="select-bar-container">
      <el-col
        :span="parseInt(24/queryFilterCopy.length)"
        :key="queryfilter.key"
        v-for="(queryfilter,mainindex) in queryFilterCopy"
        style="text-align:left"
      >
        {{computeTranslatedText(queryfilter.title,$store.getters.creds.user.language)}}
        <el-select
          v-if="queryfilter.type == 'selecter'"
          filterable
          size="mini"
          v-model="queryfilter.selected"
          placeholder="Please select a type"
          :clearable="queryfilter.selected != '*'"
          @change="refresh()"
        >        
          <el-option
            v-for="(qf, index) in queryfilter.options"
            :label="qf.title"
            :value="qf.value"
            :key="index"
          ></el-option>
        </el-select>

        <el-select
          v-if="queryfilter.type == 'queryselecter'"
          filterable
          size="mini"
          v-model="queryfilter.selected"
          placeholder="Please select a type"
          :clearable="queryfilter.selected != '*'"
          @change="refreshLinkedCombo(mainindex)"
        >        
          <el-option
            v-for="(qf, index) in queryfilter.buckets"
            :label="qf.key"
            :value="qf.key"
            :key="index"
          ></el-option>
        </el-select>

        <el-input
          @change="refresh()"
          size="mini"
          style="width:170px"
          v-if="queryfilter.type == 'text' || queryfilter.type == 'text_strict'"
          :placeholder="$t('generic.pleaseinput')"
          v-model="queryfilter.selected"
        ></el-input>
      </el-col>
    </div>
    <div class="refresh-button" v-if="config.type != 'kibana'">
      <!-- <el-button @click="refresh()" style="width:90%;" size="mini" type="primary">refresh</el-button> -->
      <el-tooltip                  
                  class="item"
                  effect="light"
                  content="Refresh"
                  placement="bottom-start"
                  :open-delay="1000"
                >
      <el-button
                circle
                size="mini"
                @click="refresh()"
                class="regreshbutton"
                plain
                icon="el-icon-refresh"
              ></el-button>
      </el-tooltip>
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
        <el-button slot="reference" round type="default" icon="el-icon-download" size="mini"></el-button>
      </el-popover>
    </div>
  </el-row>
</template>

<script>

import axios from "axios";
import { computeTranslatedText } from "../globalfunctions";

export default {
  name: "QueryFilter",
  data: () => ({
    mustloadqueryfilters:false,
    alreadymounted:false,
    queryfilter: "",
    queryFilterCopy: undefined,
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
    ]
  }),
  props: {
    config: {
      type: Object
    }
  },
  methods: {
    computeTranslatedText: function(inText, inLocale) {
      return computeTranslatedText(inText, inLocale);
    },
    clean_field: function(field)
    {
      console.log("===>"+field);
      if (" ".indexOf(field)>=0)    
        console.log("2==>"+field);
        return field.replace(/ /g,"\\ ");
      return field;
    },
    refreshLinkedCombo: function(filterchangedindex)
    {
      for (let queryind in this.queryFilterCopy) {
        // cache the last search
        var cacheKey =
          this.config.rec_id + "-" + this.queryFilterCopy[queryind].title;
        this.$store.getters.searchCache[cacheKey] = this.queryFilterCopy[
          queryind
        ].selected;
      }
      this.loadQueryFilter(filterchangedindex);
      //this.refresh();
    },
    refresh: _.throttle(function() {
      var querya = [];
      for (let queryind in this.queryFilterCopy) {
        // cache the last search
        var cacheKey =
          this.config.rec_id + "-" + this.queryFilterCopy[queryind].title;
        this.$store.getters.searchCache[cacheKey] = this.queryFilterCopy[
          queryind
        ].selected;

        var valq = this.queryFilterCopy[queryind].selected;

        if (this.queryFilterCopy[queryind].type == "text") {
          if (valq == undefined || valq == "") valq = "*";
          else if (valq.indexOf("*") == -1) {
            valq = "*" + valq + "*";
          }
        } else if (this.queryFilterCopy[queryind].type == "selecter") {
          if (valq == undefined) {
            if (
              this.queryFilterCopy[queryind].selectOptions != null &&
              this.queryFilterCopy[queryind].selectOptions.length > 0
            ) {
              valq = this.queryFilterCopy[queryind].selectOptions[0].split(
                "="
              )[0];
            } else {
              console.error(
                "no default value and no options for: " +
                  this.queryFilterCopy[queryind].field
              );
            }
          }
        }
        

        if ((valq!=undefined)&&(valq!='')&&(valq != "*")) {

          var inverted=false;
          if (!Number.isInteger(valq))
            inverted=(valq.indexOf("-")==0);


          if ((!Number.isInteger(valq))
          &&(
            valq.indexOf("*") >= 0 ||
            valq.indexOf("[") >= 0 ||
            valq.indexOf("{") >= 0)
          ) {
            if (inverted)
              querya.push("-"+this.clean_field(this.queryFilterCopy[queryind].field) + ":" + valq.substring(1) + "");
            else
              querya.push(this.clean_field(this.queryFilterCopy[queryind].field) + ":" + valq + "");

          } else {
            if (inverted)
                querya.push(
                this.clean_field("-"+this.queryFilterCopy[queryind].field) + ':"' + valq.substring(1) + '"'
              );
            else  
              querya.push(
                this.clean_field(this.queryFilterCopy[queryind].field) + ':"' + valq + '"'
              );

          }
        }
      }
      this.queryfilter = querya.join(" AND ");
      console.log("QUERY FILTER - Sending query: " + querya.join(" AND "));
      this.$emit("queryfilterchanged", this.queryfilter);
    }, 1000),
    downloadSelection: function(format) {
      this.$emit("downloadasked", format);
    },

    prepareData: function(newqueryf) {
      //alert(newqueryf);
      if(newqueryf==undefined)
        this.queryFilterCopy = JSON.parse(
          JSON.stringify(this.config.config.queryfilters)
        );
      else
        this.queryFilterCopy=newqueryf;

      if (this.queryFilterCopy != undefined) {
        for (let queryind in this.queryFilterCopy) {
          var queryf = this.queryFilterCopy[queryind];

          if (queryf.default != null) queryf.selected = queryf.default;

          // try to retrieve a past search in the cache
          var cacheKey = this.config.rec_id + "-" + queryf.title;
          if (this.$store.getters.searchCache[cacheKey] != null)
            queryf.selected = this.$store.getters.searchCache[cacheKey];

          if (queryf.type == "queryselecter")
          {
            console.log("======>");
            console.log("SEL="+queryf.selected );
            console.log(queryf );
            if(!_.isObject(_.find(queryf.buckets, ["key",queryf.selected])))
            {
              queryf.selected=queryf.buckets[0]["key"];
            }
          }


          if (queryf.type == "selecter") {
            queryf.options = [];
            for (var opt in queryf.selectOptions) {
              var selectopt = queryf.selectOptions[opt];

              let [first, ...second] = selectopt.split("=")
              second = second.join("=")


              queryf.options.push({
                title: this.computeTranslatedText(second,this.$store.getters.creds.user.language),
                value: first
              });
            }
          }
        }
      }

      var tmp = JSON.parse(JSON.stringify(this.queryFilterCopy));
      this.queryFilterCopy = null;
      this.queryFilterCopy = tmp;
    },
    loadQueryFilter: function(filterchangedindex) {
      console.log("Load Query Filter:"+filterchangedindex);
      var url =
        this.$store.getters.apiurl +
        "queryFilter/"+this.config.rec_id +
        "?token=" +
        this.$store.getters.creds.token;
      
      var postbody={}

      if (this.queryFilterCopy !=undefined)
      {
        postbody.selected=[];
        for (var i=0;i<this.queryFilterCopy.length;i++)
        {
          if( this.queryFilterCopy[i].selected!=null)
          {
            if (filterchangedindex==undefined || i<=filterchangedindex)
              postbody.selected.push(this.queryFilterCopy[i].selected); 
            else
              postbody.selected.push(""); 
          }
          else
            postbody.selected.push(""); 
        }
      }
      
      console.log(postbody);


      axios.post(url, postbody).then(response => {
        for (let queryind in response.data.queryfilters) {
          var qf=response.data.queryfilters[queryind];
          if(qf.type=="queryselecter")
          {
            qf.buckets.splice(0,0,{"key":"*"})
          }
        }
        this.prepareData(response.data.queryfilters);        
        this.refresh();
      });
    }
  },
  created: function() {
    this.mustloadqueryfilters=false;

    console.log("========================>")
    //console.log(this.config)
    
    for (let queryind in this.config.config.queryfilters) {
      var qf=this.config.config.queryfilters[queryind];
      if(qf.type=="queryselecter")
      {
        this.mustloadqueryfilters=true;
        break;
      }
    }
    if(this.mustloadqueryfilters)
    {
      
    }
    else    
      this.prepareData();
  },
  mounted: function() {
    this.alreadymounted=true;    
    if(this.mustloadqueryfilters)
    {
      //alert('toto');
      this.loadQueryFilter();
    }
    else
      this.refresh();
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
  width: 50px;
  float: right;
}
.query-filter .download-button {
  width: 50px;
  float: right;
}
</style>

