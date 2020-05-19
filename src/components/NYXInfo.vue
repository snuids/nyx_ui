<template>
  <!--LANDING PAGE -->
  <div style="text-align:left;" id="nyx-info">
    <el-row>
      <el-col :span="12">
        <el-row>
          <el-card shadow="never" v-if="activeMQ && activeMQ[0] && activeMQ[0]._source">
            <div slot="header" class="clearfix">
              <b>Active MQ</b>
              -
              Version:
              <b>{{activeMQ[0]._source.version}}</b>
              -
              Connections:
              <b>{{activeMQ[0]._source.currentconnectionscount}}</b>
            </div>
            <el-row>
              <el-col :span="8" style="text-align:center">
                <el-progress
                  type="dashboard"
                  :status="compute_status(activeMQ[0]._source.memorypercentusage, 10, 40)"
                  :percentage="activeMQ[0]._source.memorypercentusage"
                ></el-progress>
                <div>
                  <h3>
                    <b>Memory: {{activeMQ[0]._source.memorypercentusage}}%</b>
                  </h3>
                </div>
              </el-col>
              <el-col :span="8" style="text-align:center">
                <el-progress
                  type="dashboard"
                  :status="compute_status(activeMQ[0]._source.storepercentusage, 10, 40)"
                  :percentage="activeMQ[0]._source.storepercentusage"
                ></el-progress>
                <div>
                  <h3>
                    <b>Store: {{activeMQ[0]._source.storepercentusage}}%</b>
                  </h3>
                </div>
              </el-col>
              <el-col :span="8" style="text-align:center">
                <el-progress
                  type="dashboard"
                  :status="compute_status(activeMQ[0]._source.temppercentusage, 10, 40)"
                  :percentage="activeMQ[0]._source.temppercentusage"
                ></el-progress>
                <div>
                  <h3>
                    <b>Temp: {{activeMQ[0]._source.temppercentusage}}%</b>
                  </h3>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-row>
        <el-row>
          <el-card shadow="never" v-if="loads && loads[0] && loads[0]._source">
            <div slot="header" class="clearfix">
              <b>Load</b>
            </div>
            <el-row>
              <el-col :span="8" style="text-align:center">
                <el-progress
                  type="dashboard"
                  :status="compute_status(loads[0]._source.load_1m, 3, 7)"
                  :percentage="loads[0]._source.load_1m*10"
                ></el-progress>
                <div>
                  <h3>
                    <b>Load 1m: {{loads[0]._source.load_1m}}</b>
                  </h3>
                </div>
              </el-col>
              <el-col :span="8" style="text-align:center">
                <el-progress
                  type="dashboard"
                  :status="compute_status(loads[0]._source.load_5m, 3, 7)"
                  :percentage="loads[0]._source.load_5m*10"
                ></el-progress>
                <div>
                  <h3>
                    <b>Load 5m: {{loads[0]._source.load_5m}}</b>
                  </h3>
                </div>
              </el-col>
              <el-col :span="8" style="text-align:center">
                <el-progress
                  type="dashboard"
                  :status="compute_status(loads[0]._source.load_15m, 3, 7)"
                  :percentage="loads[0]._source.load_15m*10"
                ></el-progress>
                <div>
                  <h3>
                    <b>Load 15m: {{loads[0]._source.load_15m}}</b>
                  </h3>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-row>
      </el-col>

      <el-col :span="6">
        <el-row>
          <el-card shadow="never" v-if="elastalert">
            <div slot="header" class="clearfix" v-on:click="switch_to('elastalert')">
              <b>Elast Alert 24H</b>
            </div>
            <div
              class="background-alert"
              :style="'background-color:'+(elastalert.total==0?'#13CE66':'#FF4949')"
              v-on:click="switch_to('elastalert')"
            >
              <div class="alert-number">
                <b>{{elastalert.total}}</b>
              </div>
            </div>
          </el-card>
        </el-row>
        <el-row>
          <el-card shadow="never" v-if="logstash">
            <div slot="header" class="clearfix" v-on:click="switch_to('logstash')">
              <b>Logstash 24H</b>
            </div>
            <div
              class="background-alert"
              :style="'background-color:'+(logstash.total==0?'#13CE66':'#FF4949')"
              v-on:click="switch_to('logstash')"
            >
              <div class="alert-number">
                <b>{{logstash.total}}</b>
              </div>
            </div>
          </el-card>
        </el-row>
      </el-col>

      <el-col :span="6">
        <el-row>
          <el-card shadow="never" v-if="docker_status && docker_status.records">
            <div slot="header" class="clearfix" v-on:click="switch_to('containers')">
              <b>Containers Stopped</b>
            </div>

            <div
              class="background-alert"
              :style="'background-color:'+((docker_status.records.filter(rec=> rec._source.status!='running').length)==0?'#13CE66':'#FF4949')"
              v-on:click="switch_to('containers')"
            >
              <div class="alert-number">
                <b>{{docker_status.records.filter(rec=> rec._source.status!="running").length}}</b>
              </div>
            </div>
          </el-card>
        </el-row>
        <el-row>
          <el-card shadow="never" v-if="lambdas && lambdas.aggs">
            <div slot="header" class="clearfix" v-on:click="switch_to('lambdas')">
              <b>Lambdas 24H</b>
            </div>
            <div
              class="background-alert"
              :style="'background-color:'+(lambdas.aggs['1'].value==0?'#13CE66':'#FF4949')"
              v-on:click="switch_to('lambdas')"
            >
              <div class="alert-number">
                <b>{{lambdas.aggs["1"].value}}</b>
              </div>
            </div>
          </el-card>
        </el-row>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="12">
        <el-card
          shadow="never"
          v-if="WebSocketServer && WebSocketServer[0] && WebSocketServer[0]._source"
        >
          <div slot="header" class="clearfix" v-on:click="switch_to('users config')">
            <b>Users</b> - Connected:
            <b>{{WebSocketServer[0]._source.clients[0].clients}}</b>
            - Uniques:
            <b>{{Array.from(new Set(WebSocketServer[0]._source.clients[0].logins)).length}}</b>
          </div>
          <div class="text item" v-on:click="switch_to('users config')">
            <div
              v-for="(item, index) in Array.from(new Set(WebSocketServer[0]._source.clients[0].logins))"
              :key="index"
            >&nbsp;- {{item}}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" v-if="nodes">
          <div slot="header" class="clearfix">
            <b>ES NODES</b>
          </div>
          <el-table :data="nodes" style="width: 100%">
            <el-table-column prop="node" label="Node"></el-table-column>
            <el-table-column prop="disk_indices" label="Indices"></el-table-column>
            <el-table-column prop="disk_percent" label="Percent"></el-table-column>
            <el-table-column prop="disk_total" label="Total"></el-table-column>
            <el-table-column prop="shards" label="Shards"></el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "NYXInfo",
  data: () => ({
    data: [],
    activeMQ: [],
    WebSocketServer: [],
    loads: [],
    nodes: [],
    docker_status: [],
    lambdas: [],
    logstash: {},
    elastalert: {},
    refAutoRefresh: null,
  }),
  props: {},
  methods: {
    switch_to: function(newpath) {
      this.$store.dispatch("switchToApp", newpath).then(
        response => {
          if (response != undefined) this.$router.push("/main/" + response);

          console.log(response);
        },
        error => {
          console.error(
            "Got nothing from server. Prompt user to check internet connection and try again"
          );
        }
      );
    },
    compute_status: function(value, thresh1, thresh2) {
      if (value <= thresh1) return "success";
      if (value <= thresh2) return "warning";

      return "exception";
    },
    loadData: function() {
      console.log('load data')
      var querymodules = {
        version: true,
        size: 500,
        sort: [
          {
            "@timestamp": {
              order: "desc",
              unmapped_type: "boolean"
            }
          }
        ],
        query: {
          bool: {
            must: [
              {
                query_string: {
                  query:
                    "@timestamp: [now-5m TO now] AND (module: WebSocketServer OR module: ActiveMQ)",
                  analyze_wildcard: true,
                  time_zone: "Europe/Brussels"
                }
              }
            ]
          }
        }
      };

      let queryload = {
        version: true,
        size: 500,
        sort: [
          {
            "@timestamp": {
              order: "desc",
              unmapped_type: "boolean"
            }
          }
        ],
        query: {
          bool: {
            must: [
              {
                query_string: {
                  query: "@timestamp: [now-5m TO now] ",
                  analyze_wildcard: true,
                  time_zone: "Europe/Brussels"
                }
              }
            ]
          }
        }
      };

      let querynodes = {
        version: true,
        size: 500,
        sort: [
          {
            "@timestamp": {
              order: "desc",
              unmapped_type: "boolean"
            }
          }
        ],
        query: {
          bool: {
            must: [
              {
                query_string: {
                  query: "@timestamp: [now-60m TO now] ",
                  analyze_wildcard: true,
                  time_zone: "Europe/Brussels"
                }
              }
            ]
          }
        }
      };

      let querylogstash = {
        aggs: {},
        size: 0,
        docvalue_fields: [
          {
            field: "@timestamp",
            format: "date_time"
          }
        ],
        query: {
          bool: {
            must: [
              {
                match_all: {}
              }
            ],
            filter: [
              {
                range: {
                  "@timestamp": {
                    format: "strict_date_optional_time",
                    gte: "now-1d",
                    lte: "now"
                  }
                }
              }
            ],
            should: [],
            must_not: []
          }
        }
      };

      let queryelastalert = {
        aggs: {},
        size: 0,
        docvalue_fields: [
          {
            field: "@timestamp",
            format: "date_time"
          }
        ],
        query: {
          bool: {
            must: [
              {
                match_all: {}
              }
            ],
            filter: [
              {
                range: {
                  "@timestamp": {
                    format: "strict_date_optional_time",
                    gte: "now-1d",
                    lte: "now"
                  }
                }
              }
            ],
            should: [],
            must_not: []
          }
        }
      };

      let querycontainers = {
        version: true,
        size: 500
      };

      let querylambdas = {
        aggs: {
          "1": {
            sum: {
              field: "crashed"
            }
          }
        },
        size: 0,
        _source: {
          excludes: []
        },
        stored_fields: ["*"],
        script_fields: {},
        docvalue_fields: [
          {
            field: "@timestamp",
            format: "date_time"
          }
        ],
        query: {
          bool: {
            must: [
              {
                match_all: {}
              },
              {
                range: {
                  "@timestamp": {
                    gte: "now-1d",
                    lte: "now",
                    format: "epoch_millis"
                  }
                }
              }
            ],
            filter: [],
            should: [],
            must_not: []
          }
        }
      };

      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_module_info-*?token=" +
        this.$store.getters.creds.token;

      axios.post(url, querymodules).then(response => {
        if (response.data.error != "") console.log("Report list error...");
        else {
          this.data = response.data.records;
          this.activeMQ = response.data.records.filter(
            item => item._source.module == "ActiveMQ"
          );
          this.WebSocketServer = response.data.records.filter(
            item => item._source.module == "WebSocketServer"
          );
        }
      });

      // LOAD

      url =
        this.$store.getters.apiurl +
        "generic_search/nyx_infra_load-*?token=" +
        this.$store.getters.creds.token;

      axios.post(url, queryload).then(response => {
        if (response.data.error != "") console.log("Report list error...");
        else {
          this.loads = response.data.records;
        }
      });

      // NODES

      url =
        this.$store.getters.apiurl +
        "generic_search/nyx_infra_disk-*?token=" +
        this.$store.getters.creds.token;

      axios.post(url, querynodes).then(response => {
        if (response.data.error != "") console.log("Report list error...");
        else {
          var nodes = response.data.records;
          //alert(this.nodes);
          var uniquesnodes = new Set();
          for (var i = 0; i < nodes.length; i++)
            uniquesnodes.add(nodes[i]._source.node);
          //this.nodes=Array.from(uniquesnodes);
          nodes = nodes.slice(0, uniquesnodes.size);

          this.nodes = [];
          for (var i = 0; i < nodes.length; i++) {
            nodes[i]._source["disk_avail"] = nodes[i]._source["disk.avail"];
            nodes[i]._source["disk_indices"] = nodes[i]._source["disk.indices"];
            nodes[i]._source["disk_percent"] =
              nodes[i]._source["disk.percent"] + " %";
            nodes[i]._source["disk_total"] = nodes[i]._source["disk.total"];
            this.nodes.push(nodes[i]._source);
          }
        }
      });

      // LOGSTASH

      url =
        this.$store.getters.apiurl +
        "generic_search/logstash*?token=" +
        this.$store.getters.creds.token;

      axios.post(url, querylogstash).then(response => {
        if (response.data.error != "") console.log("Report list error...");
        else {
          this.logstash = response.data;
        }
      });

      // ELASTALERT

      url =
        this.$store.getters.apiurl +
        "generic_search/elastalert?token=" +
        this.$store.getters.creds.token;

      if (this.$store.getters.elasticVersion == 6)
        url += "&doc_type=elastalert";

      axios.post(url, queryelastalert).then(response => {
        if (response.data.error != "") console.log("Report list error...");
        else {
          this.elastalert = response.data;
        }
      });

      // CONTAINERS

      url =
        this.$store.getters.apiurl +
        "generic_search/docker_status?token=" +
        this.$store.getters.creds.token +
        "&doc_type=_doc";

      axios.post(url, querycontainers).then(response => {
        if (response.data.error != "") console.log("Report list error...");
        else {
          this.docker_status = response.data;
        }
      });

      // LAMBDAS

      // CONTAINERS

      url =
        this.$store.getters.apiurl +
        "generic_search/nyx_lambdalog?token=" +
        this.$store.getters.creds.token;

      axios.post(url, querylambdas).then(response => {
        if (response.data.error != "") console.log("Report list error...");
        else {
          this.lambdas = response.data;
        }
      });
    },
    setAutoRefresh: function() {
      if(this.refAutoRefresh != null)
        clearInterval(this.refAutoRefresh)

      this.refAutoRefresh =  setInterval(() => {
        this.loadData()
      }, 10000)

    },
  },
  created: function() {
    this.loadData()
    this.setAutoRefresh();


  },

  mounted: function() {},
  beforeDestroy: function() {
    if(this.refAutoRefresh != null)
      clearInterval(this.refAutoRefresh)
  }
};
</script>

<style>
#nyx-info .el-card {
  margin-right: 10px;
}
#nyx-info .background-alert {
  width: 100%;
  height: 158px;
  text-align: center;
  vertical-align: middle;
}
#nyx-info .alert-number {
  vertical-align: middle;
  font-size: 64px;
  padding-top: 40px;
  color: white;
  font-weight: 500px;
}
</style>

