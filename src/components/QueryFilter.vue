<template>
  <!--MAIN DIALOG -->
  <el-row class="query-filter">
    <div class="select-bar-container">
      <el-col
        :span="parseInt(24/queryFilterCopy.length)"
        :key="queryfilter.key"
        v-for="queryfilter in queryFilterCopy"
        style="text-align:left"
      >
        {{queryfilter.title}}
        <el-select
          v-if="queryfilter.type == 'selecter'"
          filterable
          size="mini"
          v-model="queryfilter.selected"
          placeholder="Please select a type"
          @change="refresh()"
        >
          <el-option
            v-for="(qf, index) in queryfilter.options"
            :label="qf.title"
            :value="qf.value"
            :key="index"
          ></el-option>
        </el-select>

        <el-input
          @change="refresh()"
          size="mini"
          style="width:170px"
          v-if="queryfilter.type == 'text' || queryfilter.type == 'text_strict'"
          placeholder="Please input"
          v-model="queryfilter.selected"
        ></el-input>
      </el-col>
    </div>
    <div class="refresh-button" v-if="config.type != 'kibana'">
      <el-button @click="refresh()" style="width:90%;" size="mini" type="primary">refresh</el-button>
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
export default {
  name: "QueryFilter",
  data: () => ({
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
    clean_field: function(field)
    {
      console.log("===>"+field);
      if (" ".indexOf(field)>=0)    
        console.log("2==>"+field);
        return field.replace(/ /g,"\\ ");
      return field;
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
          if (
            valq.indexOf("*") >= 0 ||
            valq.indexOf("[") >= 0 ||
            valq.indexOf("{") >= 0
          ) {
            querya.push(this.clean_field(this.queryFilterCopy[queryind].field) + ":" + valq + "");
          } else {
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

    prepareData: function(e) {
      this.queryFilterCopy = JSON.parse(
        JSON.stringify(this.config.config.queryfilters)
      );

      if (this.queryFilterCopy != undefined) {
        for (let queryind in this.queryFilterCopy) {
          var queryf = this.queryFilterCopy[queryind];

          if (queryf.default != null) queryf.selected = queryf.default;

          // try to retrieve a past search in the cache
          var cacheKey = this.config.rec_id + "-" + queryf.title;
          if (this.$store.getters.searchCache[cacheKey] != null)
            queryf.selected = this.$store.getters.searchCache[cacheKey];

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

      var tmp = JSON.parse(JSON.stringify(this.queryFilterCopy));
      this.queryFilterCopy = null;
      this.queryFilterCopy = tmp;
    }
  },
  created: function() {
    this.prepareData();
  },
  mounted: function() {
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
  width: 130px;
  float: right;
}
.query-filter .download-button {
  width: 70px;
  float: right;
}
</style>

