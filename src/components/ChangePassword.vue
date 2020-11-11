<template slot="items">
  <el-dialog
    :title="$t('logout.change_pass')"
    :visible="visible"
    width="50%"
    :before-close="closeDialog"
    class="change-pwd-dlg"
  >
    <el-form label-position="top" class="form" :rules="rules" ref="cpform" status-icon label-width="180px">
      <el-card shadow="never" style="margin-bottom:10px" body-style="padding:10px">
      <el-form-item :label="$t('changepassword.oldpass')" prop="oldpassword">
        <el-input
          size="mini"
          type="password"
          name="password"
          autocomplete="none"
          v-model="cpform.oldpassword"
          show-password
        />
      </el-form-item>
      </el-card>
      <el-card shadow="never"  body-style="padding:10px">
      <el-form-item class="formitem" :label="$t('changepassword.newpass')" prop="newpassword1">
        <el-input  size="mini" type="password" autocomplete="none" v-model="cpform.newpassword1" show-password/>
      </el-form-item>
      <el-form-item class="formitem" :label="$t('changepassword.repeatpass')" prop="newpassword2">
        <el-input size="mini" type="password" autocomplete="none" v-model="cpform.newpassword2" show-password/>

      </el-form-item>
      </el-card>
    </el-form>
    {{errorstr}}
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeDialog()">{{$t('buttons.cancel')}}</el-button>
      <el-button
        type="primary"
        :disabled="confirmButtonDisabled"
        @click="changePassword()"
      >{{$t('buttons.confirm')}}</el-button>
    </span>
  </el-dialog>
</template>
  
<script>
import axios from "axios";

export default {
  name: "ChangePassword",
  data() {
    

    var checkPwd1 = (rule, value, callback) => {
      


      let res = this.passwordMatchRules(this.cpform.newpassword1, this.passwordRules)
      if (!res.match)
        callback(new Error(res.message));

      callback()
    };

    var checkPwd2 = (rule, value, callback) => {
      if (this.cpform.newpassword1 != this.cpform.newpassword2) {
        callback(new Error("Password don't match"))
      }

      callback()
    };

    return {
      visible: true,
      actionunderway: false,
      errorstr: "",
      cpform: {oldpassword: "", newpassword1: "", newpassword2: "" },
      rules: {
        oldpassword: [],
        newpassword1: [{ validator: checkPwd1, trigger: "blur" }],
        newpassword2: [{ validator: checkPwd2, trigger: "blur" }]
      }
    };
  },
  computed: {
    passwordRules() {
      return this.$store.getters.passwordRules
    },
    confirmButtonDisabled() {
      if (!this.passwordMatchRules(this.cpform.newpassword1, this.passwordRules).match)
        return true
      if (this.cpform.newpassword1 != this.cpform.newpassword2)
        return true
      if (this.cpform.oldpassword == '')
        return true 

      return false
    }

  },
  methods: {
    passwordMatchRules(pwd, rules) {
      console.log(rules)

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
    closeDialog() {
      this.$emit("changepassword_closed");
    },
    async changePassword() {
      try {
        this.actionunderway = true;
        const response = await axios.post(
          this.$store.getters.apiurl +
            "cred/changepassword?token=" +
            this.$store.getters.creds.token,
          {
            old_password: this.cpform.oldpassword,
            new_password: this.cpform.newpassword2
          }
        );
        if (response.data.error == "") {
          this.actionunderway = false;
          this.$emit("changepassword_closed");
          this.$notify({
            title: "Message",
            message: "Password changed",
            type: "success",
            position: "bottom-right"
          });
        } else {
          this.actionunderway = false;
          this.errorstr = response.data.error;
        }
      } catch (e) {
        alert(e);
      }
    }
  }
};
</script>

<style>
.change-pwd-dlg .el-form-item{
  text-align: left;

}
.change-pwd-dlg .el-form-item label{
  font-weight: bold;
  padding: 0px;
}
.change-pwd-dlg .el-form-item__content{
  line-height: 30px
}

.cpform {
  background-color: red;
}
</style>
