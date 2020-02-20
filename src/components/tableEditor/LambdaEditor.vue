<template>
  <el-dialog
    width="80%"
    :title="title"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    class="bhd-tech-editor"
  >
    <el-tabs v-model="activeName">
      <el-tab-pane label="Logs" name="logs">
        <el-card style="margin-bottom:20px;" shadow="never">
        <el-row style="text-align:left;" v-if="!noTimeField">
          <el-button @click="setFocus('runId')" type="text">Run Uuid</el-button>
        </el-row>
        <el-row>
          <el-col :span="12" style="text-align:left;">
            <el-autocomplete
              ref="runId"
              style="width:410px;"
              class="inline-input"
              v-model="selectedUuid"
              :fetch-suggestions="getLastRunsUuid"
              placeholder="Select run"
              @select="handleSelect"
              size="mini"
              clearable
            >
              <template slot-scope="{ item }">
                <div class="value">
                  <span style="font-weight:bold;">{{ item.time | formatTS2}} - </span>
                   <span>({{item.duration}}ms)</span>
                   <i v-if="item.crashed" style="color:red; float:right; margin-top:10px;"  class="el-icon-close"></i>
                   <i v-else style="color:green; float:right; margin-top:10px;" class="el-icon-check"></i>
                </div>
              </template>
            </el-autocomplete>
          </el-col>
        </el-row>
        <el-row v-if="selectedUuid">{{selectedRun}}</el-row>
        </el-card>
        <el-row v-if="selectedRun">
          <LogViewer :logObj="logObj"></LogViewer>
        </el-row>
      </el-tab-pane>
      <el-tab-pane label="Info" name="info">
        <el-form v-model="newRec._source">
          <el-card shadow="hover" :body-style="{ padding: '10px' }">
            <el-form-item label="File" :label-width="formLabelWidth">
              <el-input
                :disabled="true"
                size="mini"
                v-model="newRec._source.file"
                autocomplete="off"
              ></el-input>
            </el-form-item>
            <el-form-item label="Function" :label-width="formLabelWidth">
              <el-input
                :disabled="true"
                size="mini"
                v-model="newRec._source.function"
                autocomplete="off"
              ></el-input>
            </el-form-item>
            <el-row>
              <el-col :span="6">
                <el-form-item
                  label="Duration"
                  :label-width="formLabelWidth"
                >{{newRec._source.duration}} ms</el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Runs" :label-width="formLabelWidth">{{newRec._source.runs}}</el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Errors" :label-width="formLabelWidth">{{newRec._source.errors}}</el-form-item>
              </el-col>
            </el-row>
          </el-card>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import Vue from "vue";

import YAML from "js-yaml";
import axios from "axios";

export default {
  name: "lambdaEditor",
  data: () => ({
    orgRec: null,
    newRec: null,
    strOrgRec: "",
    strNewRec: "",
    orgName: "",
    newName: "",
    formLabelWidth: "120px",
    changed: false,
    dialogFormVisible: false,
    title: "Lambda Status",
    activeName: "logs",
    lastRuns: [],
    selectedRun: null,
    selectedUuid: null
  }),
  computed: {
    recordin: function() {
      return this.record;
    },
    recordstr: function() {
      return JSON.stringify(this.record);
    },
    recchanged: function() {
      return JSON.stringify(this.recordin) != JSON.stringify(this.newRec);
    }
  },
  props: {
    record: {
      type: Object
    },
    config: {
      type: Object
    },
    editMode: {
      type: String
    }
  },
  watch: {
    recordin: {
      handler: function() {
        this.prepareData();
      },
      deep: true
    }
  },
  created: function() {
    console.log("created event");
    this.prepareData();
  },
  components: {},
  methods: {
    setFocus: function(el) {
      this.$nextTick(() => this.$refs[el].focus());
    },
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    handleSelect(item) {
      console.log(item);
      this.logObj = null;
      this.logObj = {};
      this.logObj.indice = "nyx_lambdalog";
      this.logObj.id = item.value;
      this.logObj.search = true;
      this.selectedRun = JSON.parse(JSON.stringify(item));
    },
    prepareData: function() {
      console.log("prepare data");
      this.dialogFormVisible = true;
      this.newRec = JSON.parse(JSON.stringify(this.record));
      this.orgRec = JSON.parse(JSON.stringify(this.record));
    },
    saveRecord: function() {
      if (!this.weatherActivated && this.newRec._source.weather != null) {
        delete this.newRec._source.weather;
      }

      this.$notify({
        title: "Record saved.",
        type: "success",
        message: "The lambda has been succesfuly saved.",
        position: "bottom-right"
      });
      this.$emit("dialogcloseupdated");
    },
    getLastRunsUuid(queryString, cb) {
      console.log("getLastRunsUuid");
      let request = {
        version: true,
        size: 20,
        sort: [
          {
            "@timestamp": {
              order: "desc",
              unmapped_type: "boolean"
            }
          }
        ],
        _source: {
          excludes: ["logs"]
        },
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
                match_phrase: {
                  function: {
                    query: "lambda1_test2"
                  }
                }
              }
            ]
          }
        }
      };

      let _function = this.orgRec._source.function;

      request.query.bool.must[0].match_phrase["function"].query = _function;

      console.log(queryString)

      if (queryString != null && queryString != "" && queryString != "*" 
                              && this.selectedRun!= null && queryString != this.selectedRun.uuid) {
        let queryUuid = {
          match_phrase: {
            uuid: {
              query: queryString
            }
          }
        };

        request.query.bool.must.push(queryUuid)
      }

      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_lambdalog?token=" +
        this.$store.getters.creds.token;

      axios
        .post(url, request)
        .then(response => {
          if (response.status == 200) {
            this.lastRuns = [];
            if (
              response.data.records == null ||
              response.data.records.length == 0
            ) {
              console.warn("no runs retrieved");
              return cb([]);
            }

            let ret = [];

            response.data.records.forEach(obj => {
              ret.push({
                value: obj._id,
                uuid: obj._id,
                time: obj._source["@timestamp"],
                error: obj._source.errors,
                crashed: obj._source.crashed,
                duration: obj._source.duration,
                runner: obj._source.runner,
                return: obj._source.return,
                runs: obj._source.runs,
              });
            });

            return cb(ret);
          } else {
            console.error("unable to retrieve last runs");
            return cb([]);
          }
        })
        .catch(error => {
          console.log(error);
          return cb([]);
        });
    }
  }
};
</script>

<style >
.bhd-tech-editor .view-table {
  margin-bottom: 30px;
}
.bhd-tech-editor .screen-name-input {
  margin-bottom: 10px;
}

.bhd-tech-editor .add-view-button {
  margin-bottom: 30px;
}
</style>