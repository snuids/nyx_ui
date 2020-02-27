<template>
  <el-dialog
    width="80%"
    :title="title"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    class="lambda-editor"
  >
    <!-- <h1>{{locEditMode}}</h1> -->
    <el-tabs v-model="activeName">
      <el-tab-pane label="Main" name="main">
        <el-card style="margin-bottom:20px;" shadow="never">
          <el-row style="text-align:left;" type="flex">
            <el-col :span="5">
              <el-button @click="setFocus('type')" type="text">Mode</el-button>
            </el-col>
            <el-col :span="5">
              <el-button @click="setFocus('runner')" type="text">Runner</el-button>
            </el-col>
            <el-col :span="5">
              <el-button @click="setFocus('notebook')" type="text">File</el-button>
            </el-col>
            <el-col :span="5">
              <el-button @click="setFocus('function')" type="text">Function</el-button>
            </el-col>
          </el-row>
          <el-row style="text-align:left;" type="flex">
            <el-col :span="5" style="padding-right:10px;">
              <el-select
                :disabled="locEditMode=='edit'"
                v-model="newRec._source.type"
                ref="type"
                size="mini"
                placeholder="Mode"
              >
                <el-option
                  v-for="item in typeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-col>
            <el-col :span="5" style="padding-right:10px;">
              <el-autocomplete
                :disabled="locEditMode=='edit'"
                size="mini"
                class="inline-input"
                ref="runner"
                v-model="newRec._source.runner"
                :fetch-suggestions="queryRunner"
                @input="handleSelectRunner"
                placeholder="Runner"
              ></el-autocomplete>
            </el-col>
            <el-col :span="5" style="padding-right:10px;">
              <el-autocomplete
                :disabled="locEditMode=='edit'"
                size="mini"
                ref="notebook"
                class="inline-input"
                v-model="newRec._source.file"
                :fetch-suggestions="queryFile"
                placeholder="File"
              ></el-autocomplete>
            </el-col>
            <el-col :span="5" style="padding-right:10px;">
              <el-input
                :disabled="locEditMode=='edit'"
                size="mini"
                ref="function"
                placeholder="Function"
                v-model="newRec._source.orgfunction"
              ></el-input>
            </el-col>
            <el-col :span="4" style="text-align:right;">
              <el-button
                style="min-width: 112px;"
                icon="el-icon-notebook-2"
                @click="openTabCode()"
                size="mini"
                v-if="locEditMode=='edit'"
              >Edit code</el-button>
              <!-- <el-popconfirm
                v-if="locEditMode!='edit'" 
                confirmButtonText='GO!'
                cancelButtonText='No, Thanks'
                icon="el-icon-info"
                iconColor="red"
                title="Overwrite existing file?"
              >-->
              <el-button
                v-if="locEditMode!='edit'"
                :loading="createLoading"
                @click="createFunction()"
                size="mini"
                type="primary"
                :disabled="goBtnDisabled"
              >Create function</el-button>
              <!-- </el-popconfirm> -->
            </el-col>
          </el-row>

          <el-row style="text-align:left;" type="flex" v-if="locEditMode=='edit'">
            <el-col :span="5">
              <el-button @click="setFocus()" type="text">Runs</el-button>
            </el-col>
            <el-col :span="5">
              <el-button @click="setFocus()" type="text">Error</el-button>
            </el-col>
            <el-col :span="5">
              <el-button @click="setFocus()" type="text">Crashed</el-button>
            </el-col>
          </el-row>

          <el-row style="text-align:left;" type="flex" v-if="locEditMode=='edit'">
            <el-col :span="5" style="padding-right:10px;">
              <el-input
                style="max-width:80px;"
                readonly
                size="mini"
                ref="function"
                v-model="newRec._source.runs"
              ></el-input>
            </el-col>
            <el-col :span="5" style="padding-right:10px;">
              <el-input
                style="max-width:80px;"
                readonly
                size="mini"
                ref="function"
                v-model="newRec._source.errors"
              ></el-input>
            </el-col>
            <el-col :span="5" style="padding-right:10px;">
              <el-input
                style="max-width:80px;"
                readonly
                size="mini"
                ref="function"
                v-model="newRec._source.crashed"
              ></el-input>
            </el-col>
            <el-col :span="9" style="text-align:right;">
              <el-button
                style="min-width: 112px;"
                icon="el-icon-refresh-left"
                :loading="resetStatsLoading"
                @click="resetStats()"
                type="warning"
                size="mini"
              >Reset Stats</el-button>
            </el-col>
          </el-row>
          <el-divider v-if="locEditMode=='edit'"></el-divider>

          <el-row style="text-align:left;" type="flex" v-if="locEditMode=='edit'">
            <el-col :span="10">
              <el-button @click="setFocus('runId')" type="text">Run Uuid</el-button>
            </el-col>
            <el-col :span="10">
              <el-button @click="setFocus('return')" type="text">Return</el-button>
            </el-col>
          </el-row>
          <el-row type="flex" v-if="locEditMode=='edit'">
            <el-col :span="10" style="text-align:left; padding-right:20px;">
              <el-autocomplete
                style="width:100%;"
                ref="runId"
                class="inline-input"
                v-model="selectedUuid"
                :fetch-suggestions="searchLastRun"
                placeholder="Select run"
                @select="handleSelectRun"
                size="mini"
                clearable
              >
                <template slot-scope="{ item }">
                  <div class="value">
                    <span style="font-weight:bold;">{{ item.time | formatTS2}} -&nbsp;</span>
                    <span>({{item.duration}}ms)</span>
                    <i
                      v-if="item.crashed"
                      style="color:red; float:right; margin-top:10px;"
                      class="el-icon-close"
                    ></i>
                    <i
                      v-else
                      style="color:green; float:right; margin-top:10px;"
                      class="el-icon-check"
                    ></i>
                  </div>
                </template>
              </el-autocomplete>
            </el-col>
            <el-col :span="10" style="text-align:left;">
              <el-input
                v-if="selectedRun"
                readonly
                size="mini"
                ref="return"
                v-model="selectedRun.return"
              ></el-input>
            </el-col>
            <el-col :span="4" style="text-align:right;">
              <el-button
                v-if="selectedRun && selectedRun.inputuuid"
                style="min-width: 112px;"
                icon="el-icon-download"
                @click="openTabInput"
                size="mini"
              >Input</el-button>
            </el-col>
          </el-row>
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
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.quit")}}</el-button>
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
    locEditMode: "",
    locRecord: null,
    strOrgRec: "",
    strNewRec: "",
    orgName: "",
    newName: "",
    formLabelWidth: "120px",
    changed: false,
    dialogFormVisible: false,
    title: "Lambda Status",
    activeName: "main",
    lastRuns: [],
    selectedRun: null,
    selectedUuid: null,
    runner: null,
    notebook: null,
    function: null,
    resetStatsLoading: false,
    createLoading: false,
    hierarchy: {},
    allRunners: new Set(),
    allNotebooks: new Set(),
    allFunctions: new Set(),
    typeOptions: [
      {
        value: "cron",
        label: "Cron"
      },
      {
        value: "message",
        label: "Message"
      }
    ],
    runnerOptions: [],
    fileOptions: []
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
    },
    goBtnDisabled: function() {
      if (this.newRec._source.type == null || this.newRec._source.type == "")
        return true;
      else if (
        this.newRec._source.runner == null ||
        this.newRec._source.runner == ""
      )
        return true;
      else if (
        this.newRec._source.file == null ||
        this.newRec._source.file == ""
      )
        return true;
      else if (
        this.newRec._source.orgfunction == null ||
        this.newRec._source.orgfunction == ""
      )
        return true;
      else if (
        this.hierarchy.hasOwnProperty(this.newRec._source.runner) &&
        this.hierarchy[this.newRec._source.runner].hasOwnProperty(
          this.newRec._source.file
        ) &&
        this.hierarchy[this.newRec._source.runner][
          this.newRec._source.file
        ].has(this.newRec._source.orgfunction)
      ) {
        console.warn(
          "this function already exists in this runner and this notebook"
        );
        return true;
      }

      return false;
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
    this.locEditMode = this.editMode;
    this.locRecord = this.record;

    console.log(this.record);
    this.prepareData();
  },
  components: {},
  methods: {
    resetStats: function() {
      this.resetStatsLoading = true;
      var url =
        this.$store.getters.apiurl +
        "generic/nyx_lambda/" +
        this.newRec._id +
        "?token=" +
        this.$store.getters.creds.token +
        "&doc_type=_doc";
      axios
        .get(url)
        .then(response => {
          if (response.data.error != "") {
            console.log("fail to retrieve lambda");
            this.resetStatsLoading = false;
          } else {
            console.log(response);

            let obj = response.data.data;
            obj._source.runs = 0;
            obj._source.errors = 0;
            obj._source.crashed = 0;

            axios
              .post(url, obj._source)
              .then(response => {
                console.log("update");
                this.newRec = JSON.parse(JSON.stringify(obj));
                this.orgRec = JSON.parse(JSON.stringify(obj));

                this.runner = obj._source.runner;
                this.notebook = obj._source.file;
                this.function = obj._source.orgfunction;
                this.resetStatsLoading = false;
              })
              .catch(error => {
                console.log(error);
                this.resetStatsLoading = false;
              });
          }
        })
        .catch(error => {
          console.log(error);
          this.resetStatsLoading = false;
        });
    },
    queryFile: function(queryString, cb) {
      var fileOptions = this.fileOptions;
      var results = queryString
        ? fileOptions.filter(this.createFilter(queryString))
        : fileOptions;
      cb(results);
    },
    queryRunner: function(queryString, cb) {
      var runnerOptions = this.runnerOptions;
      var results = queryString
        ? runnerOptions.filter(this.createFilter(queryString))
        : runnerOptions;
      cb(results);
    },
    createFilter(queryString) {
      return item => {
        return (
          item.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
        );
      };
    },
    openTabCode: function() {
      window.open(
        "./ipython/notebooks/lambdas/runner_" +
          this.runner +
          "/" +
          this.notebook
      );
    },
    openTabInput: function() {
      window.open(
        "./ipython/notebooks/lambdas/runner_" +
          this.runner +
          "/inputs/" +
          this.selectedUuid +
          ".txt"
      );
    },
    setFocus: function(el) {
      if (el == null) return;
      this.$nextTick(() => this.$refs[el].focus());
    },
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    handleSelectRun(item) {
      console.log(item);
      this.logObj = null;
      this.logObj = {};
      this.logObj.indice = "nyx_lambdalog";
      this.logObj.id = item.value;
      this.logObj.search = true;
      this.selectedRun = JSON.parse(JSON.stringify(item));
    },
    handleSelectRunner(item) {
      console.log("handleSelectRunner");
      console.log(item);

      this.fileOptions = [];

      if (item == "") {
      }

      if (this.hierarchy.hasOwnProperty(item)) {
        Object.keys(this.hierarchy[item]).forEach(not => {
          console.log(not);

          this.fileOptions.push({
            value: not,
            label: not
          });
        });
      }
    },
    prepareData: function() {
      // console.log("prepare data");
      // console.log(this.locRecord);

      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_lambda?token=" +
        this.$store.getters.creds.token +
        "&doc_type=_doc";
      axios
        .post(url, { size: 10000 })
        .then(response => {
          if (response.data.error != "")
            console.log("retrieve lambdas error...");
          else {
            this.allRunners = new Set();
            this.allNotebooks = new Set();
            this.allFunctions = new Set();

            this.hierarchy = {};

            response.data.records.forEach(row => {
              let runner = row._source.runner;
              let notebook = row._source.file.replace("/", "");
              let funct = row._source.orgfunction;

              this.allRunners.add(runner);
              this.allNotebooks.add(notebook);
              this.allFunctions.add(funct);

              if (!this.hierarchy.hasOwnProperty(runner))
                this.hierarchy[runner] = {};

              if (!this.hierarchy[runner].hasOwnProperty(notebook))
                this.hierarchy[runner][notebook] = new Set();

              this.hierarchy[runner][notebook].add(funct);
            });

            // console.log(this.hierarchy)

            this.allRunners.forEach(runner => {
              this.runnerOptions.push({
                value: runner,
                label: "runner_" + runner
              });
            });

            this.allNotebooks.forEach(not => {
              this.fileOptions.push({
                value: not,
                label: not
              });
            });
          }
        })
        .catch(error => {
          console.log(error);
        });

      // console.log(this.locEditMode)

      this.newRec = JSON.parse(JSON.stringify(this.locRecord));
      this.orgRec = JSON.parse(JSON.stringify(this.locRecord));

      if (this.locEditMode == "edit") {
        this.runner = this.locRecord._source.runner;
        this.notebook = this.locRecord._source.file;
        this.function = this.locRecord._source.orgfunction;

        this.getLastRunsUuid("", 1)
          .then(response => {
            if(response.length == 0)
              return;

            this.selectedUuid = response[0].uuid;
            this.selectedRun = response[0];
            this.handleSelectRun(response[0]);
          })
          .catch(error => {
            console.log(error);
          });
      }

      this.dialogFormVisible = true;
    },
    createFunction: function() {
      this.createLoading = true;
      let body = {
        action: "add",
        type: this.newRec._source.type,
        runner: this.newRec._source.runner,
        notebook: this.newRec._source.file,
        function: this.newRec._source.orgfunction
      };

      if (body.notebook.indexOf(".ipynb") == -1)
        body.notebook = body.notebook.replace(".", "") + ".ipynb";

      if (body.type == "cron") body.parameters = ["30s"];
      else if (body.type == "message")
        body.parameters = ["/topic/YOUR_TOPIC_HERE", "/queue/YOUR_QUEUE_HERE"];

      let url =
        this.$store.getters.apiurl +
        "sendmessage?token=" +
        this.$store.getters.creds.token;

      let message = {
        destination: "/topic/NYX_LAMBDA_COMMAND",
        body: JSON.stringify(body)
      };

      axios
        .post(url, message)
        .then(response => {
          if (response.data.error != "") {
            console.log("Unable to send message...");
            this.$notify({
              title: "Failed",
              type: "danger",
              message: "Unable to send message.",
              position: "bottom-right"
            });
          } else {
          }
        })
        .catch(error => {
          console.log(error);
        });

      this.$notify({
        title: "Creating...",
        type: "info",
        message: "The lambda is under creation.",
        position: "bottom-right"
      });

      setTimeout(() => {
        //r2_notebookstelephonyipynb_telephony_to_calls
        let lambda_id = "r" + this.newRec._source.runner + "_notebooks";
        lambda_id +=
          this.newRec._source.file.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "") +
          "_";
        lambda_id += this.newRec._source.orgfunction
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+/g, "");

        console.log(lambda_id);

        var url =
          this.$store.getters.apiurl +
          "generic/nyx_lambda/" +
          lambda_id +
          "?token=" +
          this.$store.getters.creds.token +
          "&doc_type=_doc";

        console.log(url);

        axios
          .get(url)
          .then(response => {
            console.log(response);
            if (response.data.error != "") {
              console.log("fail to retrieve lambda");
            } else {
              this.createFunction = false;
              this.locEditMode = null;
              this.locEditMode = "edit";
              this.locRecord = null;
              this.locRecord = JSON.parse(JSON.stringify(response.data.data));
              this.prepareData();
              // console.log('after prepare data')
            }
          })
          .catch(error => {
            console.log(error);
          });
      }, 5000);
      // this.$emit("dialogclose");
    },
    async getLastRunsUuid(queryString, size) {
      // console.log("getLastRunsUuid");
      let request = {
        version: true,
        size: size,
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

      // console.log(queryString);

      if (
        queryString != null &&
        queryString != "" &&
        queryString != "*" &&
        this.selectedRun != null &&
        queryString != this.selectedRun.uuid
      ) {
        let queryUuid = {
          match_phrase: {
            uuid: {
              query: queryString
            }
          }
        };

        request.query.bool.must.push(queryUuid);
      }

      try {
        var url =
          this.$store.getters.apiurl +
          "generic_search/nyx_lambdalog?token=" +
          this.$store.getters.creds.token;

        const response = await axios.post(url, request);

        // console.log(response);

        if (response.status == 200) {
          this.lastRuns = [];
          if (
            response.data.records == null ||
            response.data.records.length == 0
          ) {
            console.warn("no runs retrieved");
            return [];
          }

          let ret = [];

          console.log(response.data.records);

          response.data.records.forEach(obj => {
            let newObj = {
              value: obj._id,
              uuid: obj._id,
              time: obj._source["@timestamp"]
            };

            Object.keys(obj._source).forEach(keys => {
              newObj[keys] = obj._source[keys];
            });

            ret.push(newObj);
          });

          return ret;
        } else {
          console.error("unable to retrieve last runs");
          return [];
        }
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    searchLastRun(queryString, cb) {
      // console.log("search last runs");
      this.getLastRunsUuid(queryString, 20)
        .then(response => {
          // console.log(response);
          return cb(response);
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
.lambda-editor .el-divider--horizontal {
  margin: 24px 0px 10px 0 !important;
}
</style>