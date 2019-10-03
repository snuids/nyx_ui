<template>
  <el-dialog
    width="400px"
    title="New Password"
    :visible.sync="visible"
    :before-close="closeDialog"
    class="user-reset-password-dialog"
    append-to-body
  >
    <el-form :model="passwordForm" :rules="rules" ref="passwordForm" status-icon>
      <el-row>
        <el-form-item prop="newPassword">
          <el-input
            size="default"
            v-model="passwordForm.newPassword"
            autocomplete="off"
            show-password
          ></el-input>
        </el-form-item>
      </el-row>
      <el-row>
        <el-button
          icon="el-icon-key"
          style="width:100%"
          type
          @click="generateStrongPassword()"
        >Generate strong password</el-button>
      </el-row>
      <el-row>
        <el-button
          style="width:100%; margin-top:30px;"
          type="primary"
          @click="submitForm('passwordForm')"
        >Save password</el-button>
      </el-row>
      <el-row>
        <el-form-item label="Notify by mail" prop="sendMail">
          <el-switch size="mini" v-model="sendMail"></el-switch>
        </el-form-item>
      </el-row>
    </el-form>
  </el-dialog>
</template>

<script>
import axios from "axios";

export default {
  name: "UserResetPassword",
  data() {
    var validatePass = (rule, value, callback) => {
      // console.log(value)
      // return callback(new Error('Please input the age'));
    };
    return {
      visible: false,
      sendMail: false,
      passwordForm: {
        newPassword: ""
      },
      rules: {
        newPassword: [
          {
            required: true,
            message: "Cannot be empty",
            trigger: ["blur", "change"]
          }
          // { validator: validatePass, trigger: 'blur' }
        ]
      }
    };
  },
  computed: {},
  props: {
    currentUser: { type: Object }
  },
  mounted: function() {
    this.prepareData();
  },
  methods: {
    prepareData: function() {
      this.visible = true;
    },
    generateStrongPassword: function() {
      this.passwordForm.newPassword = Math.random()
        .toString(36)
        .slice(-10);
    },
    submitForm(formName) {
      console.log("submit form");
      this.$refs[formName].validate(valid => {
        if (valid) {
          this.savePassword();
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    savePassword: function() {
      var url =
        this.$store.getters.apiurl +
        "cred/resetpassword" +
        "?token=" +
        this.$store.getters.creds.token;

      var query = {
        login: this.currentUser._id,
        new_password: this.passwordForm.newPassword
      };

      if (this.sendMail) {
        query.queue = "/queue/RESET_PASSWORD";
      }

      axios
        .post(url, query)
        .then(response => {
          if (response.data.error != "") {
            this.$notify({
              title: "Error",
              message: response.data.error,
              type: "error",
              position: "bottom-right"
            });
          } else {
            this.$notify({
              title: "Success",
              message: "New Password Saved",
              type: "success",
              position: "bottom-right"
            });
          }
        })
        .catch(error => {
          console.log(error);
          this.$notify({
            title: "Error",
            message: "Query Failed",
            type: "error",
            position: "bottom-right"
          });
        });

      this.closeDialog();
    },
    closeDialog: function() {
      this.$emit("dialogclose");
    }
  }
};
</script>


<style>
.user-reset-password-dialog .el-form-item__error {
  margin-top: 5px;
}
</style>