<template>
  <!--LANDING PAGE -->
  <div style="text-align:left overflow:auto;">
    <el-card shadow="never" v-if="passwordRulesModel">
      <el-row style="text-align:left;">
        <el-button
          @click="savePasswordRules()"
          size="mini"
          :disabled="!passwordRulesModelModified"
          type="danger"
        >Save Rules</el-button>
      </el-row>
      <el-row>
        <el-col :span="12" class="pwd-rule-label">
          <el-button
            @click="setFocus('')"
            type="text"
          >Password length ({{passwordRulesModel.length[0]}} - {{passwordRulesModel.length[1]}})</el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-slider v-model="passwordRulesModel.length" range show-stops :min="1" :max="50"></el-slider>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8" class="pwd-rule-label">
          <el-card
            shadow="never"
            style="text-align:center;"
            :body-style="passwordRulesModel.forceUpper?'padding:20px;': 'padding:0px;'"
          >
            <div slot="header" class="clearfix">
              <el-button
                style="float: left; padding: 3px 0"
                @click="setFocus('')"
                type="text"
              >Upper case</el-button>
              <el-switch
                style="float: right; padding: 3px 0"
                v-model="passwordRulesModel.forceUpper"
              ></el-switch>
            </div>
            <div v-show="passwordRulesModel.forceUpper">
              <el-row>
                <b>Minimum number of upper cases</b>
              </el-row>
              <el-row>
                <el-input-number
                  size="mini"
                  v-model="passwordRulesModel.minUpper"
                  :step="1"
                  :min="0"
                  :max="maxUpperCase"
                ></el-input-number>
              </el-row>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8" class="pwd-rule-label">
          <el-card
            shadow="never"
            style="text-align:center;"
            :body-style="passwordRulesModel.forceLower?'padding:20px;': 'padding:0px;'"
          >
            <div slot="header" class="clearfix">
              <el-button
                style="float: left; padding: 3px 0"
                @click="setFocus('')"
                type="text"
              >Lower case</el-button>
              <el-switch
                style="float: right; padding: 3px 0"
                v-model="passwordRulesModel.forceLower"
              ></el-switch>
            </div>
            <div v-show="passwordRulesModel.forceLower">
              <el-row>
                <b>Minimum number of lower cases</b>
              </el-row>
              <el-row>
                <el-input-number
                  size="mini"
                  v-model="passwordRulesModel.minLower"
                  :step="1"
                  :min="0"
                  :max="maxLowerCase"
                ></el-input-number>
              </el-row>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8" class="pwd-rule-label">
          <el-card
            shadow="never"
            style="text-align:center;"
            :body-style="passwordRulesModel.forceSpecial?'padding:20px;': 'padding:0px;'"
          >
            <div slot="header" class="clearfix">
              <el-button
                style="float: left; padding: 3px 0"
                @click="setFocus('')"
                type="text"
              >Special char</el-button>
              <el-switch
                style="float: right; padding: 3px 0"
                v-model="passwordRulesModel.forceSpecial"
              ></el-switch>
            </div>
            <div v-show="passwordRulesModel.forceSpecial">
              <el-row>
                <b>Minimum number of special char</b>
              </el-row>
              <el-row>
                <el-input-number
                  size="mini"
                  v-model="passwordRulesModel.minSpecial"
                  :step="1"
                  :min="0"
                  :max="maxSpecial"
                ></el-input-number>
              </el-row>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" v-if="passwordRulesModel" style="margin-top:20px;">
      <el-form
        :model="testPwdForm"
        :rules="rules"
        ref="testPwdForm"
        label-width="120px"
        class="demo-ruleForm"
        size="small"
      >
        <el-form-item label="Try a password" prop="testPwd" style="padding-bottom:20px;">
          <el-input v-model="testPwdForm.testPwd" clearable size="mini" style="padding-bottom:5px;"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm('testPwdForm')">Test</el-button>
          <el-button @click="resetForm('testPwdForm')">Reset</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "PasswordRuleEditor",
  data() {
    var checkPwd = (rule, value, callback) => {
      console.log("checkPwdValidator");
      console.log(rule);
      console.log(value);

      console.log(this.passwordRulesModel);

      if (value.length < this.passwordRulesModel.length[0])
        callback(
          new Error(
            "At least " +
              this.passwordRulesModel.length[0] +
              " characters. This one contains " +
              value.length
          )
        );
      if (value.length > this.passwordRulesModel.length[1])
        callback(
          new Error(
            "No more than " +
              this.passwordRulesModel.length[1] +
              " characters. This one contains " +
              value.length
          )
        );

      let numUpper = (value.match(/[A-Z]/g) || []).length;

      if (
        this.passwordRulesModel.forceUpper &&
        this.passwordRulesModel.minUpper > numUpper
      )
        callback(
          new Error(
            "At least " +
              this.passwordRulesModel.minUpper +
              " uper cases. This one contains only " +
              numUpper
          )
        );

      let numLower = (value.match(/[a-z]/g) || []).length;

      if (
        this.passwordRulesModel.forceLower &&
        this.passwordRulesModel.minLower > numLower
      )
        callback(
          new Error(
            "At least " +
              this.passwordRulesModel.minLower +
              " lower cases. This one contains only " +
              numLower
          )
        );

      let numSpecial = (
        value.match(/[ !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g) || []
      ).length;

      if (
        this.passwordRulesModel.forceSpecial &&
        this.passwordRulesModel.minSpecial > numSpecial
      )
        callback(
          new Error(
            "At least " +
              this.passwordRulesModel.minSpecial +
              " Special char. This one contains only " +
              numSpecial
          )
        );

      callback();
    };

    return {
      indice: "nyx_config",
      id: "password_rules",
      passwordRulesModel: null,
      testPwdForm: {
        testPwd: ""
      },
      rules: {
        testPwd: [{ validator: checkPwd, trigger: "blur" }]
      }
    };
  },
  props: {},
  watch: {},
  computed: {
    passwordRulesModelModified: function() {
      return (
        JSON.stringify(this.$store.getters.passwordRules) !=
        JSON.stringify(this.passwordRulesModel)
      );
    },
    maxUpperCase: function() {
      if (this.passwordRulesModel == null) return 0;

      let ret = this.passwordRulesModel.length[1];

      if (this.passwordRulesModel.forceLower)
        ret -= this.passwordRulesModel.minLower;

      if (this.passwordRulesModel.forceSpecial)
        ret -= this.passwordRulesModel.minSpecial;

      return ret;
    },
    maxLowerCase: function() {
      if (this.passwordRulesModel == null) return 0;

      let ret = this.passwordRulesModel.length[1];

      if (this.passwordRulesModel.forceUpper)
        ret -= this.passwordRulesModel.minUpper;

      if (this.passwordRulesModel.forceSpecial)
        ret -= this.passwordRulesModel.minSpecial;

      return ret;
    },
    maxSpecial: function() {
      if (this.passwordRulesModel == null) return 0;

      let ret = this.passwordRulesModel.length[1];

      if (this.passwordRulesModel.forceLower)
        ret -= this.passwordRulesModel.minLower;

      if (this.passwordRulesModel.forceUpper)
        ret -= this.passwordRulesModel.minUpper;

      return ret;
    }
  },
  methods: {
    setFocus() {},
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    },
    savePasswordRules() {
      this.$store.commit({
        type: "setPasswordRules",
        data: this.passwordRulesModel
      })
    }
  },
  mounted: function() {},
  created: function() {
    if (this.$store.getters.passwordRules == null) {
      this.passwordRulesModel = {
        length: [10, 40],
        forceUpper: false,
        minUpper: 0,
        forceLower: false,
        minLower: 0,
        forceNumbers: false,
        minNumbers: 0,
        forceSpecial: false,
        minSpecial: 0
      };
    } else {
      this.passwordRulesModel = JSON.parse(
        JSON.stringify(this.$store.getters.passwordRules)
      );
    }
  }
};
</script>

<style>
.pwd-rule-label {
  text-align: left;
}
</style>

