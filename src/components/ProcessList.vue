<template>
  <div style="position:relative;">
    <el-dialog title="Process Details" :visible.sync="dialogVisible" width="40%">
      <div style="text-align:left" v-html="processDetailsData"></div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogVisible = false">Close</el-button>
      </span>
    </el-dialog>

    <div>

      <el-form>
        <el-row>
          <el-col :span="8">
          <el-form-item label="Filter" :label-width="formLabelWidth">
            <el-input size="mini" v-model="filter" autocomplete="off"></el-input>
          </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div
        style="padding:5px; float:left;"
        v-for="(dat) in filteredData"
        :key="dat.module"
        :label="dat.module"
      >
        <div @click="processDetails(dat)" :class="'process_'+dat.css_class">
          <div :class="'process_title_'+dat.css_class">
            <!-- <h1 style="color:#f44;">{{dat.name}}</h1> -->
            {{dat.name}}
          </div>
          <div style="text-align:left;padding:2px;">
            <div style="position:absolute;width:65px;padding:2px;height:65px;">
              <v-icon :name="Array.isArray(dat.icon) ? dat.icon[0] : dat.icon" scale="3" style="height:60px;color:#555"/>
            </div>
            <div style="position:absolute;left:60px;">
              <b>Version</b>
              :{{dat.version}}
              <br>
              <b>LifeSigns</b>
              :{{dat.count}}
              <br>
              <b>Messages</b>
              :{{dat.messages}}
              <br>
              <b>Last Life Sign</b>
              :{{dat.lifesigntime}}
              <br>
              <b>Start Time</b>
              :{{dat.starttime}}
              <br>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";
import _ from "lodash";
import YAML from "yamljs";

export default {
  name: "ProcessList",
  data: () => ({
    data: [],
    dialogVisible: false,
    processDetailsData: "",
    formLabelWidth: "120px",
    filter:""
  }),
  props: {
    config: {
      type: Object
    }
  },
  computed: {
    filteredData: function() {
      var vm = this;
      if (vm.filter=="")
        return this.data;
      return this.data.filter(function(x) {
        
        return x.name.toLowerCase().indexOf(vm.filter.toLowerCase()) >= 0;
      });
      //+return this.data.filter(function (x) {(x)=>x.name.toLowerCase().indexOf("kizeo")>0});
    }
  },
  methods: {
    processDetails(proc) {
      var url =
        this.$store.getters.apiurl +
        "generic/" +
        proc.rec_id._index +
        "/" +
        proc.rec_id._id +
        "?token=" +
        this.$store.getters.creds.token;
      axios
        .get(url)
        .then(response => {
          if (response.data.error != "") console.log("Process list error...");
          else {
            this.processDetailsData = YAML.stringify(
              response.data.data._source
            ).replace(/\n/g, "<br/>");
            /*this.$alert(YAML.stringify(response.data.data._source).replace(/\n/g,"<br/>")
            , 'Process Details', {
          confirmButtonText: 'OK',
          dangerouslyUseHTMLString: true
        });*/
            this.dialogVisible = true;
            //alert(YAML.stringify(response.data.data._source));
          }
        })
        .catch(error => {
          console.log(error);
        });
    },
    loadData() {
      var body = {
        aggs: {
          module: {
            terms: {
              field: "module",
              size: 50,
              order: { lifesigntime: "desc" }
            },
            aggs: {
              lifesigntime: { max: { field: "@timestamp" } },
              starttime: { max: { field: "starttimets" } },
              messages: { max: { field: "messages" } },
              icon: {
                top_hits: {
                  docvalue_fields: [
                    {
                      field: "icon.keyword",
                      format: "use_field_mapping"
                    }
                  ],
                  _source: "icon.keyword",
                  size: 1,
                  sort: [
                    {
                      "@timestamp": {
                        order: "desc"
                      }
                    }
                  ]
                }
              },
              version: {
                top_hits: {
                  docvalue_fields: [
                    {
                      field: "version",
                      format: "use_field_mapping"
                    }
                  ],
                  _source: "version",
                  size: 1,
                  sort: [
                    {
                      "@timestamp": {
                        order: "desc"
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        size: 0,
        query: {
          bool: {
            must: [
              { match_all: {} },
              {
                range: {
                  "@timestamp": {
                    gte: "now-7d",
                    lte: "now",
                    format: "epoch_millis"
                  }
                }
              }
            ]
          }
        }
      };

      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_module_info-*?token=" +
        this.$store.getters.creds.token;

      axios
        .post(url, body)
        .then(response => {
          if (response.data.error != "") console.log("Report list error...");
          else {
            var entries = [];
            for (var i in response.data.aggs["module"]["buckets"]) {
              var record = response.data.aggs["module"]["buckets"][i];

              var entry = {
                count: record.doc_count,
                name: record.key,
                lifesigntime: record.lifesigntime.value,
                messages: record.messages.value,
                starttime: record.starttime.value,
                version: record.version["hits"]["hits"][0]["_source"].version,

                rec_id: record.version["hits"]["hits"][0]
              };
              if (record.icon["hits"]["hits"][0]["fields"] != undefined) {
                entry.icon =
                  record.icon["hits"]["hits"][0]["fields"]["icon.keyword"];
              }

              entry.css_class = "ok";

              if (entry.lifesigntime != undefined) {
                var ts = entry.lifesigntime;
                entry.lifesigntime = moment(ts).format("MM/DD HH:mm:ss");
                entry.seconds = moment().unix() - moment(ts).unix();
                if (entry.seconds > 80) {
                  entry.css_class = "ko";
                }
              }
              if (entry.starttime != undefined) {
                entry.starttime = moment(entry.starttime * 1000).format(
                  "MM/DD HH:mm:ss"
                );
              }
              if (entry.name.toLowerCase().indexOf("activemq") >= 0) {
                entry.icon = "envelope";
              } else if (entry.name.toLowerCase().indexOf("reportrunner") >= 0) {
                entry.icon = "chart-bar";
              } else if (entry.name.toLowerCase().indexOf("rest") >= 0) {
                entry.icon = "code";
              } else if (entry.name.toLowerCase().indexOf("camel") >= 0) {
                entry.icon = "exchange-alt";
              } else {
                if (entry.icon == undefined || entry.icon.length == 0)
                  entry.icon = "cogs";
              }

              entries.push(entry);
            }
            entries = _.orderBy(entries, ["name"], ["asc"]);
            this.data = entries;
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
  },
  created: function() {
    this.loadData();
    this.timer = setInterval(this.loadData, 5000);
  },

  mounted: function() {},
  beforeDestroy: function() {
    clearInterval(this.timer);
  }
};
</script>

<style>
.process_ok {
  width: 280px;
  height: 120px;
  background-color: #fff;
  border: solid 2px #aaa;
  position: relative;
  color: black;
}

.process_ok:hover { 
  background-color: #eee;
}
.process_ko {
  width: 280px;
  height: 120px;
  background-color: #fee;
  border: solid 2px red;
  position: relative;
  color: black;
}

.process_ko:hover { 
  background-color: #fcc;
}

.process_title_ok {
  background-color: #fff;
  color: #444;
  font-size: 14px;
  border-bottom: solid 1px #ccc;
  text-overflow: ellipsis;
}
.process_title_ko {
  background-color: red;
  color: white;
  font-size: 14px;
}
</style>

