<template>
  <el-dialog
    width="80%"
    :title="title"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    class="bhd-tech-editor"
  >
    <el-form v-model="newRec._source">
      <el-card shadow="hover" :body-style="{ padding: '10px' }">
        <el-form-item label="Matricule" :label-width="formLabelWidth">
          <el-input :disabled="editMode!='create'" size="mini" v-model="newRec._id" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="Gaia" :label-width="formLabelWidth">
          <el-input size="mini" v-model="newRec._source.gaia" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="First Name" :label-width="formLabelWidth">
          <el-input size="mini" v-model="newRec._source.firstname" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="Last Name" :label-width="formLabelWidth">
          <el-input size="mini" v-model="newRec._source.lastname" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="Tel" :label-width="formLabelWidth">
          <el-input size="mini" v-model="newRec._source.tel" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="Zone" :label-width="formLabelWidth">
          <el-input size="mini" v-model="newRec._source.zone" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="Shift" :label-width="formLabelWidth" style="text-align:left">
          <el-select
            size="mini"
            v-model="newRec._source.shift"
            filterable
            placeholder="Select a shift"
          >
            <el-option
              v-for="shift in shiftList"
              :key="shift.value"
              :label="shift.label"
              :value="shift.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Technic" :label-width="formLabelWidth" style="text-align:left">
          <el-select
            size="mini"
            v-model="newRec._source.technic"
            filterable
            placeholder="Select a technic"
          >
            <el-option
              v-for="tec in tecList"
              :key="tec.value"
              :label="tec.label"
              :value="tec.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Active" :label-width="formLabelWidth" style="text-align:left;">
          <el-switch v-model="newRec._source.bhd_active"></el-switch>
        </el-form-item>
        <el-form-item label="Management" :label-width="formLabelWidth" style="text-align:left;">
          <el-switch v-model="newRec._source.management"></el-switch>
        </el-form-item>
      </el-card>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <el-button
        v-if="$store.getters.creds.hasPrivilege(config.config.writeprivileges)"
        type="primary"
        :disabled="!recchanged"
        @click="saveRecord()"
      >{{this.$t("buttons.confirm")}}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import Vue from "vue";

import YAML from "js-yaml";
import axios from "axios";

export default {
  name: "bhdTechnicianEditor",
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
    title: "Technician configuration",
    shiftList: [
      {
        label: "Tot 7h/15h30",
        value: "early"
      },
      {
        label: "Tard 10h30/19h",
        value: "late"
      },
      {
        label: "Inconnu",
        value: "unknown"
      }
    ],
    tecList: [
      {
        label: "HVA",
        value: "HVA"
      },
      {
        label: "INC",
        value: "INC"
      },
      {
        label: "SAN",
        value: "SAN"
      },
      {
        label: "ELE",
        value: "ELE"
      }
    ]
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
    closeDialog: function() {
      this.$emit("dialogclose");
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

      this.$store.commit({
        type: "updateRecord",
        data: this.newRec
      });
      this.$notify({
        title: "Record saved.",
        type: "success",
        message: "The technician has been succesfuly saved.",
        position: "bottom-right"
      });
      this.$emit("dialogcloseupdated");
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