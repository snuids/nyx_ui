<template slot="items">
  <el-dialog
    :title="$t('logout.change_pass')"
    :visible="visible"
    width="50%"
    :before-close="closeDialog"
  >
    <el-form class="form" :rules="rules" ref="cpform" status-icon label-width="180px">
      <el-form-item :label="$t('changepassword.oldpass')" prop="oldpassword">
        <el-input type="password" name="password" autocomplete="none" v-model="cpform.oldpassword" />
      </el-form-item>
      <div>&nbsp;</div>
      <el-form-item class="formitem" :label="$t('changepassword.newpass')" prop="newpassword1">
        <el-input type="password" autocomplete="none" v-model="cpform.newpassword1" />
      </el-form-item>
      <el-form-item class="formitem" :label="$t('changepassword.repeatpass')" prop="newpassword2">
        <el-input type="password" autocomplete="none" v-model="cpform.newpassword2" />
      </el-form-item>
    </el-form>
    {{errorstr}}
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeDialog()">{{$t('buttons.cancel')}}</el-button>
      <el-button
        type="primary"
        :disabled="cpform.newpassword1 != cpform.newpassword2 || cpform.newpassword2.length <8  || cpform.oldpassword.length <8"
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
    var validatePass2 = (rule, value, callback) => {
      var nvalue = this.cpform.newpassword2;
      if (nvalue == "" || nvalue == undefined) {
        callback(new Error("New password cannot be empty"));
      } else if (nvalue !== this.cpform.newpassword1) {
        callback(new Error("Two inputs don't match!"));
      } else if (nvalue.length < 8) {
        callback(new Error("Length must be at least of 8 chars."));
      } else {
        callback();
      }
    };
    return {
      visible: true,
      actionunderway: false,
      errorstr: "",
      cpform: { newpassword1: "", newpassword2: "", oldpassword: "" },
      rules: {
        oldpassword: [],
        newpassword1: [],
        newpassword2: [{ validator: validatePass2, trigger: "blur" }]
      }
    };
  },
  methods: {
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
.cpform {
  background-color: red;
}
</style>
