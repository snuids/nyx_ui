<template>
  <el-dialog
    width="700px"
    title="User Form"
    :before-close="closeDialog"
    :visible.sync="dialogFormVisible"
    class="dialog-user"
  >
    <UserResetPassword
      :currentUser="record"
      v-on:dialogclose="resetPasswordVisible=false;"
      v-if="resetPasswordVisible"
    ></UserResetPassword>
    <el-form :model="newRec" ref="newRec" :rules="rules" status-icon>
      <el-collapse v-model="activeNames" @change="handleChange">
        <el-collapse-item title="Basics" name="1">
          <el-row>
            <el-form-item label="ID/Email" :label-width="formLabelWidth" prop="_id">
              <el-input
                :disabled="!newRec.isadd"
                size="mini"
                v-model="newRec._id"
                autocomplete="off"
              ></el-input>
            </el-form-item>
          </el-row>
          <el-row>
            <el-form-item label="Login" :label-width="formLabelWidth" prop="_source.login">
              <el-input size="mini" v-model="newRec._source.login" autocomplete="off"></el-input>
            </el-form-item>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item
                label="Firstname"
                :label-width="formLabelWidth"
                prop="_source.firstname"
              >
                <el-input size="mini" v-model="newRec._source.firstname" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Lastname" :label-width="formLabelWidth" prop="_source.lastname">
                <el-input size="mini" v-model="newRec._source.lastname" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="Phone" :label-width="formLabelWidth" prop="_source.phone">
                <el-input size="mini" v-model="newRec._source.phone" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12" style="text-align:left;">
              <el-form-item label="MFA" :label-width="formLabelWidth" prop="doublePhase">
                <el-switch
                  @change="MFAChanged()"
                  size="mini"
                  v-model="newRec._source.doublePhase"
                  autocomplete="off"
                ></el-switch>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row style="text-align:left;">
            <el-col :span="12">
              <el-form-item label="Language" :label-width="formLabelWidth" prop="_source.language">
                <el-select
                  style="width:210px;"
                  size="mini"
                  v-model="newRec._source.language"
                  placeholder="Please select a language"
                >
                  <el-option
                    :key="lang.value"
                    v-for="lang in languagesAvailable"
                    :label="lang.label"
                    :value="lang.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label :label-width="formLabelWidth">
                <el-button
                  size="mini"
                  @click="handleResetPassword()"
                  class="addbutton"
                  type="danger"
                  icon="el-icon-warning"
                  v-if="!newRec.isadd"
                >Reset Password</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-collapse-item>
        <el-collapse-item title="Privileges" name="2">
          <el-row style="padding-left:30px;">
            <el-transfer
              size="mini"
              style="text-align:left;"
              filterable
              v-model="newRec._source.privileges"
              :props="{
            key: 'value',
            label: 'desc'
          }"
              :data="privilegesdata"
              :titles="['Available', 'Assigned']"
            ></el-transfer>
          </el-row>
        </el-collapse-item>
        <el-collapse-item title="Filters" name="3">
          <el-row style="padding-left:30px;">
            <el-transfer
              size="mini"
              style="text-align:left;"
              filterable
              v-model="newRec._source.filters"
              :props="{
            key: 'value',
            label: 'desc'
          }"
              :data="filtersdata"
              :titles="['Available', 'Assigned']"
            ></el-transfer>
          </el-row>
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <el-button type="primary" :disabled="recModified()" @click="submitForm('newRec')">Confirm</el-button>
    </span>
  </el-dialog>
</template>

<script>
import userresetpassword from "@/components/UserResetPassword";
import Vue from "vue";
import axios from "axios";

Vue.component("UserResetPassword", userresetpassword);

export default {
  name: "UserDetails",
  data() {
    var checkID = (rule, value, callback) => {
      console.log(value);
      var url = this.$store.getters.apiurl + "generic/nyx_user/";
      url += this.newRec._id + "?token=";
      url += this.$store.getters.creds.token;
      axios
        .get(url)
        .then(response => {
          console.log(response);
          if (response.data.error != "") callback();
          else {
            console.log(response.data.data);
            if (response.data.data != null) {
              console.log("Succes");
              return callback(new Error("This email is already in use"));
            } else callback();
          }
        })
        .catch(error => {
          console.log(error);
          console.log("Error catch");
          callback();
        });
    };
    return {
      resetPasswordVisible: false,
      dialogFormVisible: false,
      isAdd: true,
      newRec: {},
      formLabelWidth: "120px",
      privileges: [],
      privilegesdata: [],
      filters: [],
      filtersdata: [],
      activeName: "main",
      userForm: {},
      activeNames: ["1", "2"],
      rules: {
        _id: [
          {
            required: true,
            message: "Please input email address",
            trigger: "blur"
          },
          {
            type: "email",
            message: "Please input correct email address",
            trigger: ["blur"]
          },
          {
            validator: checkID,
            trigger: "blur"
          }
        ],
        _source: {
          firstname: [
            {
              required: true,
              message: "Please input firstname",
              trigger: "blur"
            }
          ],
          lastname: [
            {
              required: true,
              message: "Please input lastname",
              trigger: "blur"
            }
          ],
          phone: [
            { required: false, message: "Please input phone", trigger: "blur" }
          ],
          language: [
            {
              required: true,
              message: "Please input language",
              trigger: "change"
            }
          ]
        }
      },
      languagesAvailable: [
        { label: "English", value: "en" },
        { label: "French", value: "fr" },
        { label: "Greek", value: "el" }
      ]
    };
  },
  computed: {
    recordin: function() {
      return this.record;
    }
  },
  props: {
    record: {
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
  created: function() {
    this.prepareData();
  },
  methods: {
    handleChange: function() {
      console.log(this.activeNames);
    },
    MFAChanged: function() {
      console.log(this.newRec._source.doublePhase);
      this.rules._source.phone[0].required = this.newRec._source.doublePhase;
      this.$refs.newRec.validateField("_source.phone");
    },
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    prepareData: function() {
      this.dialogFormVisible = true;
      this.newRec = JSON.parse(JSON.stringify(this.record));

      if (!this.newRec.isadd) {
        this.rules._id = [];
      }

      var data = [];
      for (var i in this.$store.getters.privileges) {
        var priv = this.$store.getters.privileges[i];
        data.push({
          value: priv._source.value,
          desc: priv._source.name
        });
      }
      this.privilegesdata = data;

      data = [];
      for (i in this.$store.getters.filters) {
        var filter = this.$store.getters.filters[i];
        data.push({
          value: filter._source.value,
          desc: filter._source.name
        });
      }

      this.filtersdata = data;
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          this.saveRecord();
        } else {
          console.log("error submit!!");
          this.activeNames.push["1"];
          return false;
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    },
    handleResetPassword() {
      this.resetPasswordVisible = true;
    },
    saveRecord() {
      var text = "User saved.";
      if (this.newRec.isadd) text = "User created.";

      this.$store.commit({
        type: "updateRecord",
        data: this.newRec
      });

      this.$notify({
        title: text,
        type: "success",
        position: "bottom-right"
      });
      this.$emit("dialogclose");
    },
    recModified() {
      return JSON.stringify(this.record) == JSON.stringify(this.newRec);
    }
  }
};
</script>
<style>
.dialog-user .el-transfer-panel {
  width: 250px;
}
</style>