<template>
  <div style="position:relative;overflow: hidden;">
    <el-dialog :title="$t('processlist.title_process')+' '+detailsName+' ('+detailsVersion+')'" :visible.sync="dialogVisible" width="65%">
      <el-tabs v-model="tabName" @tab-click="handleClick">
        <el-tab-pane :label="$t('processlist.tab_general')" name="first">
          <el-table
            size="small"
            max-height="400"
            border
            :data="procWindowDetails">
            <el-table-column prop="0"
                            :label="$t('processlist.col_field')"
                            min-width="150"
                            sortable
                            show-overflow-tooltip/>
            <el-table-column prop="1"
                            :label="$t('processlist.col_value')"
                            min-width="424"
                            sortable
                            show-overflow-tooltip/>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="$t('processlist.tab_messages_in')" name="second" v-if="inMessages.length > 0">
          <el-table
            size="small"
            max-height="400"
            border
            :data="inMessages">
            <el-table-column prop="0"
                            :label="$t('processlist.col_topic')"
                            min-width="150"
                            sortable
                            show-overflow-tooltip/>
            <el-table-column prop="1"
                            :label="$t('processlist.col_number_messages')"
                            min-width="424"
                            sortable
                            show-overflow-tooltip/>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="$t('processlist.tab_messages_out')" name="third" v-if="outMessages.length > 0">
          <el-table
            size="small"
            max-height="400"
            border
            :data="outMessages">
            <el-table-column prop="0"
                            :label="$t('processlist.col_topic')"
                            min-width="150"
                            sortable
                            show-overflow-tooltip/>
            <el-table-column prop="1"
                            :label="$t('processlist.col_number_messages')"
                            min-width="424"
                            sortable
                            show-overflow-tooltip/>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogVisible = false">{{ $t('processlist.close') }}</el-button>
      </span>
    </el-dialog>

    <div>
      <el-form>
        <el-row :gutter="10">
          <el-col :span="6"> 
            <el-form-item :label="$t('processlist.filter')" :label-width="formLabelWidth">
              <el-input size="mini" v-model="filter" autocomplete="off"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('processlist.lifesign_timeframe')">
              <el-select
              v-model="selectedTimeframe"
              size="small">
              <el-option
                v-for="(value, key) in timeframes"
                :key="key"
                :label="value['value']"
                :value="value['key']">
              </el-option>
            </el-select>
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
              <v-icon
                :name="Array.isArray(dat.icon) ? dat.icon[0] : dat.icon"
                scale="3"
                :style="'height:60px;color:'+((dat.color!=null)?dat.color:'rgb(102, 177, 255);')"
              />
            </div>              
            <div style="position:absolute;left:60px;">
              <b>{{ $t('processlist.version') }}</b>
              :{{dat.version}}
              <br />
              <b>{{ $t('processlist.lifesigns') }}</b>
              :{{dat.count}}
              <br />
              <b>{{ $t('processlist.messages') }}</b>
              :{{dat.messages}}
              <br />
              <b>{{ $t('processlist.last_lifesign') }}</b>
              :{{dat.lifesigntime}}
              <br />
              <b>{{ $t('processlist.start_time') }}</b>
              :{{dat.starttime}}
              <br />
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

export default {
  name: "ProcessList",
  watch: {
    selectedTimeframe: function (val) {
      this.loadData();
    }
  },
  data: () => ({
    selectedTimeframe: '5m',
    tabName: "first",
    timeframes: [],
    data: [],
    dialogVisible: false,
    formLabelWidth: "120px",
    filter: "",
    procWindowDetails: [],  
    inMessages :[],
    outMessages :[],
    detailsName: "",
    detailsVersion: ""
  }
),
  props: {
    config: {
      type: Object
    }
  },
  computed: {
    filteredData: function() {
      var vm = this;
      if (vm.filter == "") return this.data;
      return this.data.filter(function(x) {
        return x.name.toLowerCase().indexOf(vm.filter.toLowerCase()) >= 0;
      });
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
            this.tabName = "first";
            let source = response.data.data._source;
            let data = [];
            let keyArray = Object.keys(source);
            for (let i in keyArray) {
              if (keyArray[i] !== "received" && keyArray[i] !== "sent" && keyArray[i] !== "version" && keyArray[i] !== "module")
                if (typeof source[keyArray[i]] === 'object')
                  data.push([keyArray[i], JSON.stringify(source[keyArray[i]])]);
                else
                  data.push([keyArray[i], source[keyArray[i]]]);
              if (keyArray[i] === "received") {
                if (typeof source[keyArray[i]] === 'object') {
                  this.inMessages = Object.entries(source[keyArray[i]]);
                } else {
                  this.inMessages = [];
                }
              }
              if (keyArray[i] === "module") {
                this.detailsName = source[keyArray[i]];
              }
              if (keyArray[i] === "version") {
                this.detailsVersion = source[keyArray[i]];
              }

              if (keyArray[i] === "sent") {
                if (typeof source[keyArray[i]] === 'object') {
                  this.outMessages = Object.entries(source[keyArray[i]]);
                } else {
                  this.outMessages = [];
                }
              }
            }
            console.log(response.data.data._source);
            this.procWindowDetails = data;
            
            this.dialogVisible = true;
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
        "color": {
          "top_hits": {
            "docvalue_fields": [
              {
                "field": "color.keyword"
              }
            ],
            "_source": "color.keyword",
            "size": 1,
            "sort": [
              {
                "@timestamp": {
                  "order": "desc"
                }
              }
            ]
          }
        },
              icon: {
                top_hits: {
                  docvalue_fields: [
                    {
                      field: "icon.keyword"
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
                      field: "version"
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
                    gte: "now-" + this.selectedTimeframe,
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
              if (record.color["hits"]["hits"][0]["fields"] != undefined) {
                entry.color =
                  record.color["hits"]["hits"][0]["fields"]["color.keyword"];
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
              } else if (
                entry.name.toLowerCase().indexOf("reportrunner") >= 0
              ) {
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
    this.timeframes = [
      {key:"7d", value: this.$t('processlist.timeframe_7d')},
      {key:"1d", value: this.$t('processlist.timeframe_1d')},
      {key:"1h", value: this.$t('processlist.timeframe_1h')},
      {key:"5m", value: this.$t('processlist.timeframe_5m')}
    ];
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

