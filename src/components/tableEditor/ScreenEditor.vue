<template>
  <el-dialog
    width="80%"
    :title="title"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    class="screen-editor"
  >
    <div v-if="accepted <= 0">
      <el-button @click="validateToken()" type="primary" round icon="el-icon-circle-check">Validate</el-button>
      <el-button
        @click="rejectToken()"
        v-if="accepted >= 0"
        type="danger"
        round
        icon="el-icon-error"
      >Reject</el-button>
    </div>
    <div v-else>
      <el-form v-model="newRec._source">
        <el-card shadow="hover" :body-style="{ padding: '10px' }">
          <el-row type="flex" slot="header" class="row-bg" justify="space-between">
            <span>Basics</span>
          </el-row>
          <el-row>
            <el-col :span="8">
              <el-form-item label="Name" :label-width="formLabelWidth">
                <el-input size="mini" v-model="newRec._source.optiboard" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Description" :label-width="formLabelWidth">
                <el-input size="mini" v-model="newRec._source.description" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="RSS" :label-width="formLabelWidth">
                <el-input size="mini" v-model="newRec._source.rss" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- <el-input size="mini" v-model="newRec._source.carrousel" autocomplete="off"></el-input> -->

          <el-row>
            <el-col :span="8">
              <el-form-item label="Carousel" :label-width="formLabelWidth" style="text-align:left">
                <el-select
                  size="mini"
                  v-model="newRec._source.carrousel"
                  filterable
                  placeholder="Select a carousel"
                >
                  <el-option
                    v-for="car in carouselList"
                    :key="car.value"
                    :label="car.label"
                    :value="car.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="LifeSign (ms)" :label-width="formLabelWidth">
                <el-input size="mini" v-model="newRec._source.lifesigninterval" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Poll (ms)" :label-width="formLabelWidth">
                <el-input size="mini" v-model="newRec._source.pollinterval" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="8">
            <el-form-item label="Mode" :label-width="formLabelWidth" style="text-align:left">
                <el-select
                  size="mini"
                  v-model="newRec._source.mode"
                  filterable
                  placeholder="Select a mode"
                >
                  <el-option
                    v-for="mod in modeList"
                    :key="mod"
                    :label="mod"
                    :value="mod"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
              <el-col :span="8">
              <el-form-item label="Kibana Wrapper" :label-width="formLabelWidth">
                <el-input size="mini" v-model="newRec._source.kibanawrapper" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>


        <el-card shadow="hover" :body-style="{ padding: '0px' }" style="margin-top:10px">
          <el-row type="flex" slot="header" class="row-bg" justify="space-between">
            <span>Weather</span>
            <el-switch v-model="weatherActivated"></el-switch>
          </el-row>
          <!-- <div slot="header" class="clearfix" style="text-align:left;">
              <span>Weather</span>
          </div>-->
          <el-collapse-transition>
            <div v-if="weatherActivated" style="padding:20px;">
              <el-row>
                <el-col :span="8">
                  <el-form-item label="API Key" :label-width="formLabelWidth">
                    <el-input
                      size="mini"
                      v-model="newRec._source.weather.apikey"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Language" :label-width="formLabelWidth">
                    <el-input
                      size="mini"
                      v-model="newRec._source.weather.language"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Location" :label-width="formLabelWidth">
                    <el-input
                      size="mini"
                      v-model="newRec._source.weather.location"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-collapse-transition>
        </el-card>
        <div></div>
        <el-card shadow="hover" :body-style="{ padding: '10px' }" style="margin-top:10px">
          <el-row type="flex" slot="header" class="row-bg" justify="space-between">
            <span>Actions</span>
          </el-row>
          <el-row>
            <el-col :span="12">
              Refresh screen&nbsp;
              <el-button
                type="danger"
                v-if="orgRec._source.accepted == 1"
                @click="refreshScreen()"
                size="mini"
              >{{this.$t("buttons.refresh")}}</el-button>
            </el-col>
            <el-col :span="12">
              <span v-if="dockerList.length>=1">
                Update screen&nbsp;
                <el-select
                  size="mini"
                  v-model="selectedDocker"
                  filterable
                  placeholder="Select a version"
                >
                  <el-option
                    v-for="doc in dockerList"
                    :key="doc._id"
                    :label="doc._source.version"
                    :value="doc._source.content"
                  ></el-option>
                </el-select>
              </span>
              &nbsp;
              <el-button
                type="danger"
                v-if="selectedDocker"
                @click="updateScreen()"
                size="mini"
              >{{this.$t("buttons.update")}}</el-button>
            </el-col>
          </el-row>
          <el-row></el-row>
        </el-card>

        <div></div>
      </el-form>
    </div>

    <span slot="footer" class="dialog-footer" v-if="accepted == 1">
      <el-button
        type="danger"
        v-if="orgRec._source.accepted == 1"
        @click="revokeToken"
      >{{this.$t("buttons.revoke")}}</el-button>
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <el-button
        v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
        type="primary"
        :disabled="!recchanged && readytovalidate"
        @click="saveRecord()"
      >{{this.$t("buttons.confirm")}}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import Vue from "vue";

import vieweditor from "@/components/tableEditor/ViewEditor";
//import YAML from "js-yaml";
import axios from "axios";

export default {
  name: "screenEditor",
  data: () => ({
    orgRec: null,
    newRec: null,
    selectedDocker: null,
    strOrgRec: "",
    strNewRec: "",
    orgName: "",
    newName: "",
    formLabelWidth: "120px",
    changed: false,
    dialogFormVisible: false,
    accepted: false,
    weatherActivated: true,
    title: "Screen validation",
    carouselList: [],
    dockerList: [],
    modeList: ["Main","Main3G"],
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
    readytovalidate: function() {
      if (this.newRec._source.optiboard == "") return false;
      if (this.newRec._source.carrousel == null) return false;
      if (this.newRec._source.carrousel == null) return false;

      return true;
    }
  },
  props: {
    record: {
      type: Object
    },
    config: {
      type: Object
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
  mounted: function() {
    console.log("mounted event");
    this.prepareData();
    this.loadDockerRecords();
  },
  components: {},
  methods: {
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    prepareData: function() {
      console.log("prepare data");
      this.dialogFormVisible = true;
      this.newRec = JSON.parse(JSON.stringify(this.record));
      this.orgRec = JSON.parse(JSON.stringify(this.record));

      this.accepted = this.newRec._source.accepted;

      console.log(this.newRec._source);

      if (this.newRec._source.rss == null)
        this.newRec._source.rss =
          "https://www.engie.com/en/journalists/news-flash/feed";

      if (this.newRec._source.weather == null)
        this.newRec._source.weather = {
          apikey: "1d2ecad14f22621ba67a6bab674d82c8",
          language: "en",
          location: "Brussels,BE"
        };

      this.getCarousels();
    },
    getCarousels: function() {
      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_carousel*?token=" +
        this.$store.getters.creds.token;

      var query = {
        size: 2000,
        query: {
          bool: {
            must: [
              {
                match_all: {}
              }
            ]
          }
        }
      };

      axios
        .post(url, query)
        .then(response => {
          if (response.data.error != "")
            console.log("generic search view carousel error...");
          else {
            console.log(response);
            for (var i in response.data.records) {
              var obj = {
                label: response.data.records[i]._source.name,
                value: response.data.records[i]._source.name
              };
              this.carouselList.push(obj);
            }
          }
        })
        .catch(error => {
          console.log(error);
        });
    },
    validateToken: function() {
      this.newRec._source.accepted = 1;
      this.accepted = 1;
    },
    rejectToken: function() {
      this.newRec._source.accepted = -1;
      this.accepted = -1;
      this.saveRecord();
    },
    revokeToken: function() {
      this.newRec._source.accepted = -1;
      this.accepted = -1;
      this.saveRecord();
    },
    loadDockerRecords: function() {
      var url =
        this.$store.getters.apiurl +
        "generic_search/optiboard_docker?token=" +
        this.$store.getters.creds.token;

      axios
        .post(url, { size: 1000 })
        .then(response => {
          if (response.data.error != "") console.log("Docker error...");
          else {
            console.log("Docker success...");
            //console.log(response.data.records);
            this.dockerList = response.data.records;
          }
        })
        .catch(error => {
          console.log(error);
        });
    },
    refreshScreen: function() {
      var refreshrec = {
        _index: "optiboard_command",
        _id: "id_" + Math.floor((1 + Math.random()) * 0x1000000),
        _source: {
          "@timestamp": Date.now(),
          cmd: "REFRESH",
          cmdType: "REFRESH",
          executed: 0,
          guid: this.newRec._source.guid,
          screen: this.newRec._source.optiboard
        },
        _type: "doc"
      };
      //alert(JSON.stringify(refreshrec))
      this.$store.commit({
        type: "updateRecord",
        data: refreshrec
      });
      this.$notify({
        title: "Command sent.",
        type: "success",
        message: "The commmand has been sent.",
        position: "bottom-right"
      });
    },
    updateScreen: function() {
      
      var refreshrec = {
        _index: "optiboard_command",
        _id: "id_" + Math.floor((1 + Math.random()) * 0x1000000),
        _source: {
          "@timestamp": Date.now(),
          cmd: "COPY",
          cmdType: "COPY",
          folder: "/etc/opt/newdocker-compose/docker-compose.yml",
          file: btoa(this.selectedDocker),
          executed: 0,
          guid: this.newRec._source.guid,
          screen: this.newRec._source.optiboard
        },
        _type: "doc"
      };
      //alert(JSON.stringify(refreshrec))
      this.$store.commit({
        type: "updateRecord",
        data: refreshrec
      });
      this.$notify({
        title: "Command sent.",
        type: "success",
        message: "The commmand has been sent.",
        position: "bottom-right"
      });
    },
    saveRecord: function() {
      if (!this.weatherActivated && this.newRec._source.weather != null) {
        delete this.newRec._source.weather;
      }

      this.$store.commit({
        type: "updateRecord",
        data: this.newRec
      });
      // this.$notify({
      //   title: "Record saved.",
      //   type: "success",
      //   message: "The view has been succesfuly saved.",
      //   position: "bottom-right"
      // });
      this.$emit("dialogcloseupdated");
    }
  }
};
</script>

<style >
.screen-editor .view-table {
  margin-bottom: 30px;
}
.screen-editor .screen-name-input {
  margin-bottom: 10px;
}

.screen-editor .add-view-button {
  margin-bottom: 30px;
}
</style>