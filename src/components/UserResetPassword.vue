<template>
  <el-dialog
    width="400px"
    :title="$t('changepassword.newpass')"
    v-model="visible"
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
          :icon="$icons.Key"
          style="width:100%; margin-top:8px;"
          type
          @click="generateStrongPassword()"
        >{{$t('changepassword.generate_strong_password')}}</el-button>
      </el-row>
      <el-row>
        <el-button
          style="width:100%; margin-top:30px;"
          type="primary"
          :disabled="confirmButtonDisabled"
          @click="submitForm('passwordForm')"
        >{{$t('changepassword.save_password')}}</el-button>
      </el-row>
      <el-row>
        <el-form-item :label="$t('changepassword.notify_by_mail')" prop="sendMail">
          <el-switch size="small" v-model="sendMail"></el-switch>
        </el-form-item>
      </el-row>
    </el-form>
  </el-dialog>
</template>

<script>
import axios from "axios";
import { generatePassword } from "@/utils/passwordGenerator";

export default {
  name: "UserResetPassword",
  data() {
    var checkPwd = (rule, value, callback) => {
      let res = this.passwordMatchRules(this.passwordForm.newPassword, this.passwordRules)
      if (!res.match)
        callback(new Error(res.message));

      callback()
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
            message: this.$t("ui.cannot_be_empty"),
            trigger: ["blur"]
          },
          { validator: checkPwd, trigger: ["blur"] }
        ]
      }
    };
  },
  computed: {
    passwordRules() {
      return this.$store.getters.passwordRules
    },
    confirmButtonDisabled() {
      if (!this.passwordMatchRules(this.passwordForm.newPassword, this.passwordRules).match)
        return true
     
      return false
    }
  },
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
    passwordMatchRules(pwd, rules) {
      let numUpper = (pwd.match(/[A-Z]/g) || []).length;
      let numNumber = (pwd.match(/[0-9]/g) || []).length;
      let numSpecial = (
        pwd.match(/[ !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g) || []
      ).length;


      let retObject = {
        match: true,
        message: ''
      }

      if (pwd.length < rules.length[0]) {
        retObject.message = "At least " +
              rules.length[0] +
              " characters. This one contains " +
              pwd.length
        retObject.match = false
      }
      else if (pwd.length > rules.length[1]){
        retObject.message = "No more than " +
              rules.length[1] +
              " characters. This one contains " +
              pwd.length
        retObject.match = false
      }
      else if (
        rules.forceUpper &&
        rules.minUpper > numUpper
      ) {
        retObject.message = "At least " +
              rules.minUpper +
              " uper cases. This one contains only " +
              numUpper
        retObject.match = false
      }
      else if (
        rules.forceNumber &&
        rules.minNumber > numNumber
      ) {
        retObject.message = "At least " +
              rules.minNumber +
              " numbers. This one contains only " +
              numNumber
        retObject.match = false
      }
      else if (
        rules.forceSpecial &&
        rules.minSpecial > numSpecial
      ) {
        retObject.message = "At least " +
              rules.minSpecial +
              " special chars. This one contains only " +
              numSpecial
        retObject.match = false
      }
        


      return retObject
    },
    generateStrongPassword: function() {
      // The generator lives in `utils/passwordGenerator.js`: it draws from the CSPRNG and
      // honours the instance's rules, including the minimum of each forced class.
      this.passwordForm.newPassword = generatePassword(this.passwordRules);

      this.$refs['passwordForm'].validate(() => {
      })
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          this.savePassword();
        } else {
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
          if (response.data.error == "") {
            this.$notify({
              title: "Success",
              message: this.$t("ui.new_password_saved"),
              type: "success",
              position: "bottom-right"
            });
          }
        })
        .catch(() => {
          this.$notify({
            title: "Error",
            message: this.$t("ui.query_failed"),
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