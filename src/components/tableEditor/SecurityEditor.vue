<template>
  <el-dialog
    width="80%"
    :title="title"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    class="security-editor"
  >
    <el-form v-model="newRec._source">
      <el-card shadow="hover" :body-style="{ padding: '10px' }">
        <el-row>
          <el-col :span="12">
            <el-form-item label="Firstname" :label-width="formLabelWidth">
              <el-input size="mini" v-model="newRec._source.firstname" autocomplete="off"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Lastname" :label-width="formLabelWidth">
              <el-input size="mini" v-model="newRec._source.lastname" autocomplete="off"></el-input>
            </el-form-item>

          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="Sector" :label-width="formLabelWidth">
              <el-input size="mini" v-model="newRec._source.sector" autocomplete="off"></el-input>
            </el-form-item>
          </el-col> 
          

        </el-row>
        <el-row>
          <el-col :span="6">
            <el-form-item label="Age" :label-width="formLabelWidth"  style="text-align:left">
              <el-input-number size="mini" v-model="newRec._source.age" :min="0" :max="150"></el-input-number>
            </el-form-item>
          </el-col>

        </el-row>
        <el-row>
          <el-col :span="6">
            <el-form-item label="Seniority" :label-width="formLabelWidth"  style="text-align:left">
              <el-input-number size="mini" v-model="newRec._source.seniority" :min="0" :max="150"></el-input-number>
            </el-form-item>
          </el-col>

        </el-row>
        
        
      </el-card>
      <el-card shadow="hover" class="accident-card" :body-style="{ padding: '10px'}">

        <el-row>
          <el-col :span="12">
            <el-form-item label="File" :label-width="formLabelWidth">
              <el-input size="mini" v-model="newRec._source.file" autocomplete="off"></el-input>
            </el-form-item>
            
          </el-col>
          <el-col :span="12">
            
            <el-form-item label="Location" :label-width="formLabelWidth">
              <el-input size="mini" v-model="newRec._source.location" autocomplete="off"></el-input>
            </el-form-item>
            
            

          </el-col>
        </el-row>
        <el-row>
            <el-form-item label="Description" :label-width="formLabelWidth">
              <el-input size="mini" v-model="newRec._source.injury" autocomplete="off"></el-input>
            </el-form-item>
        </el-row>
        <el-row>
        
          <el-col :span="12">
            <el-form-item label="Type" :label-width="formLabelWidth" style="text-align:left">
              <el-select
                size="mini"
                v-model="newRec._source.type"
                filterable
                placeholder="Select"
              >
                <el-option
                  v-for="type in typeList"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                ></el-option>
              </el-select>
            </el-form-item>
            

          </el-col>
          <el-col :span="6">
            <el-form-item label="Break" :label-width="formLabelWidth" style="text-align:left">
              <el-switch
                v-model="newRec._source.break">
              </el-switch>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="Break Duration" :label-width="formLabelWidth">
              <el-input-number :min="0" :disabled="!newRec._source.break" size="mini" v-model="newRec._source.break_duration" autocomplete="off"></el-input-number>
            </el-form-item>
            
          </el-col>
        </el-row>
        
        <el-row>
          <el-col :span="12">
            <el-form-item label="Accident Date" :label-width="formLabelWidth" style="text-align:left">
              <el-date-picker
                v-model="newRec._source.accident_date"
                type="date"
                size="mini"
                :picker-options={firstDayOfWeek:1}
                placeholder="Pick a day">
              </el-date-picker>
            </el-form-item>
            
          </el-col>
          <el-col :span="12">
            <el-form-item label="Return Date" :label-width="formLabelWidth" style="text-align:left">
              <el-date-picker
                v-model="newRec._source.return_date"
                :disabled="!newRec._source.break"
                type="date"
                size="mini"
                :picker-options={firstDayOfWeek:1}
                placeholder="Pick a day">
              </el-date-picker>
            </el-form-item>
            

          </el-col>
        </el-row>





        
        
        
        
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
  name: "securityEditor",
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
    title: "Security",
    typeList: [
      {
        'label': 'Situations dangereuse',
        'value': 'Situations dangereuse',
      },
      {
        'label': 'Presqu\'accidents',
        'value': 'Presqu\'accidents',
      },
      {
        'label': 'Accident benin',
        'value': 'Accident benin',
      },
      {
        'label': 'Accident majeur type I',
        'value': 'Accident majeur type I',
      },
      {
        'label': 'Accident majeur type II',
        'value': 'Accident majeur type II',
      },
      {
        'label': 'Accident majeur type III',
        'value': 'Accident majeur type III',
      },
      {
        'label': 'Accident majeur type IV',
        'value': 'Accident majeur type IV',
      },
      {
        'label': 'Accident mortel',
        'value': 'Accident mortel',
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
.security-editor .el-select {
  min-width: 220px;
}
.security-editor .view-table {
  margin-bottom: 30px;
}
.security-editor .accident-card {
  margin-top: 20px;
}
.security-editor .screen-name-input {
  margin-bottom: 10px;
}

.security-editor .add-view-button {
  margin-bottom: 30px;
}
</style>