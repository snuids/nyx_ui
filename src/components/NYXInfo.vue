<template>
  <!--LANDING PAGE -->
  <div style="text-align:left;">
    <el-row>
      <el-col :span="8">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>Versions</span>
          </div>
          <div class="text item">
            UI Version:{{$store.getters.version}}
            <br />
            API Version:{{$store.getters.apiVersion}}
            <br />
            Window size:{{$store.getters.containerSize.width}} * {{$store.getters.containerSize.height}}
            <br />
            Browser:{{$browserDetect.meta.name }}
            <br />
            Browser Version:{{$browserDetect.meta.version}}
            <br />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>Active MQ</span>
          </div>
          <div class="text item">
            Version:{{activeMQ[0]._source.version}}
            <br />
            Connections:{{activeMQ[0]._source.currentconnectionscount}}
            <br />
            Memory:{{activeMQ[0]._source.memorypercentusage}} %
            <br />
            Store:{{activeMQ[0]._source.storepercentusage}} %
            <br />
            Temp:{{activeMQ[0]._source.temppercentusage}} %
            <br />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>Load</span>
          </div>
          <div class="text item">
            Load 1m:{{loads[0]._source.load_1m}}
            <br />
            Load 5m:{{loads[0]._source.load_5m}}
            <br />
            Load 15m:{{loads[0]._source.load_15m}}
            <br />&nbsp;
            <br />&nbsp;
            <br />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="8">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>Users</span>
          </div>
          <div class="text item">
            Connected:{{WebSocketServer[0]._source.clients[0].clients}}
            <br />
            Uniques:{{Array.from(new Set(WebSocketServer[0]._source.clients[0].logins)).length}}
            <br />
            <div
              v-for="(item, index) in Array.from(new Set(WebSocketServer[0]._source.clients[0].logins))"
              :key="index"
            >&nbsp;- {{item}}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="box-card" >
          <div slot="header" class="clearfix">
            <span>Logstash 24H</span>
          </div>
          <div class="text item">
            {{logstash.total}}
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="box-card" >
          <div slot="header" class="clearfix">
            <span>Elast Alert 24H</span>
          </div>
          <div class="text item">
            {{elastalert.total}}
          </div>
        </el-card>
      </el-col>
    </el-row>
    

    <h2>ES NODES</h2>
    <el-table :data="nodes" style="width: 100%">
              <el-table-column prop="node" label="Node"></el-table-column>
              <el-table-column prop="disk_indices" label="Indices"></el-table-column>
              <el-table-column prop="disk_percent" label="Percent"></el-table-column>
              <el-table-column prop="disk_total" label="Total"></el-table-column>
              <el-table-column prop="shards" label="Shards"></el-table-column>
            </el-table>
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
    logstash:{}
  }),
  props: {},
  methods: {
    loadData: function() {
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

      var queryload = {
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

      var querynodes = {
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

      var querylogstash={
        "aggs": {},
        "size": 0,
        "docvalue_fields": [
          {
            "field": "@timestamp",
            "format": "date_time"
          }
        ],
        "query": {
          "bool": {
            "must": [
              {
                "match_all": {}
              }
            ],
            "filter": [
              {
                "range": {
                  "@timestamp": {
                    "format": "strict_date_optional_time",
                    "gte": "now-1d",
                    "lte": "now"
                  }
                }
              }
            ],
            "should": [],
            "must_not": []
          }
        }
      }

      var queryelastalert={
        "aggs": {},
        "size": 0,
        "docvalue_fields": [
          {
            "field": "@timestamp",
            "format": "date_time"
          }
        ],
        "query": {
          "bool": {
            "must": [
              {
                "match_all": {}
              }
            ],
            "filter": [
              {
                "range": {
                  "@timestamp": {
                    "format": "strict_date_optional_time",
                    "gte": "now-1d",
                    "lte": "now"
                  }
                }
              }
            ],
            "should": [],
            "must_not": []
          }
        }
      }
      // MODULES

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

      axios.post(url, queryelastalert).then(response => {
        if (response.data.error != "") console.log("Report list error...");
        else {
          this.elastalert = response.data;
        }
      });
    }    
  },
  created: function() {
    this.loadData();
  },

  mounted: function() {}
};
</script>

<style>
</style>

