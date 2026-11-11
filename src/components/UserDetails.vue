<template>
  <!-- 700 px left two 180 px columns for the fields and two privilege lists stuck to the
       right edge. `min()` keeps the window usable on a narrow screen. -->
  <el-dialog
    width="min(1040px, 94vw)"
    :title="this.$t('user.user_form')"
    :before-close="closeDialog"
    v-model="dialogFormVisible"
    class="dialog-user"
  >
    <UserResetPassword
      :currentUser="record"
      v-on:dialogclose="resetPasswordVisible=false;"
      v-if="resetPasswordVisible"
    ></UserResetPassword>
    <el-form :model="newRec" ref="newRec" :rules="rules" status-icon>
      <el-collapse v-model="activeNames" @change="handleChange">
        <el-collapse-item :title="this.$t('generic.basics')" name="1">
          <el-row>
            <el-form-item :label="this.$t('user.id_email')" :label-width="formLabelWidth" prop="_id">
              <el-input
                :disabled="!newRec.isadd"
                size="small"
                v-model="newRec._id"
                autocomplete="off"
              ></el-input>
            </el-form-item>
          </el-row>
          <el-row>
            <el-form-item :label="this.$t('user.login')" :label-width="formLabelWidth" prop="_source.login">
              <el-input size="small" v-model="newRec._source.login" autocomplete="off"></el-input>
            </el-form-item>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item
                :label="this.$t('user.firstname')"
                :label-width="formLabelWidth"
                prop="_source.firstname"
              >
                <el-input size="small" v-model="newRec._source.firstname" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="this.$t('user.lastname')" :label-width="formLabelWidth" prop="_source.lastname">
                <el-input size="small" v-model="newRec._source.lastname" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item :label="this.$t('user.phone')" :label-width="formLabelWidth" prop="_source.phone">
                <el-input size="small" v-model="newRec._source.phone" autocomplete="off"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12" style="text-align:left;">
              <el-form-item :label="this.$t('user.mfa')" :label-width="formLabelWidth" prop="doublePhase">
                <el-switch
                  @change="MFAChanged()"
                  size="small"
                  v-model="newRec._source.doublePhase"
                  autocomplete="off"
                ></el-switch>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row style="text-align:left;">
            <el-col :span="12">
              <el-form-item :label="this.$t('user.language')" :label-width="formLabelWidth" prop="_source.language">
                <el-select
                  style="width:210px;"
                  size="small"
                  v-model="newRec._source.language"
                  :placeholder="$t('ui.select_language')"
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
                  size="small"
                  @click="handleResetPassword()"
                  class="addbutton"
                  type="danger"
                  :icon="$icons.WarningFilled"
                  v-if="!newRec.isadd"
                >{{$t('user.reset_password')}}</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-collapse-item>
        <el-collapse-item :title="this.$t('generic.privileges')" name="2">
          <el-row style="padding-left:30px;">
            
            <el-transfer
              size="small"
              style="text-align:left;"
              filterable
              v-model="newRec._source.privileges"
              :props="{
            key: 'value',
            label: 'desc'
          }"
              :data="privilegesdata"
              :titles="[this.$t('generic.available'), this.$t('generic.assigned')]"
            ></el-transfer>
          </el-row>
        </el-collapse-item>
        <el-collapse-item :title="this.$t('generic.filters')" name="3">
          <el-row style="padding-left:30px;">
            
            <el-transfer
              size="small"
              style="text-align:left;"
              filterable
              v-model="newRec._source.filters"
              :props="{
            key: 'value',
            label: 'desc'
          }"
              :data="filtersdata"
              :titles="[this.$t('generic.available'), this.$t('generic.assigned')]"
            ></el-transfer>
          </el-row>
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <template #footer><span class="dialog-footer">
      <el-button @click="$emit('dialogclose')">{{this.$t("buttons.cancel")}}</el-button>
      <el-button type="primary" :disabled="recModified()" @click="submitForm('newRec')">{{this.$t("buttons.submit")}}</el-button>
    </span></template>
  </el-dialog>
</template>

<script>
import { registerComponent } from '@/utils/vue3shim'
import userresetpassword from "@/components/UserResetPassword";
import Vue from "vue";
import axios from "axios";
import { i18n } from "../i18n-setup";

registerComponent("UserResetPassword", userresetpassword);

export default {
  name: "UserDetails",
  data() {
    var checkID = (rule, value, callback) => {
      var url = this.$store.getters.apiurl + "generic/nyx_user/";
      url += this.newRec._id + "?token=";
      url += this.$store.getters.creds.token;
      axios
        .get(url)
        .then(response => {
          if (response.data.error != "") callback();
          else {
            if (response.data.data != null) {
              return callback(new Error("This email is already in use"));
            } else callback();
          }
        })
        .catch(() => {
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
            message: i18n.global.t("ui.input_email"),
            trigger: "blur"
          },
          {
            type: "email",
            message: i18n.global.t("ui.input_correct_email"),
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
              message: i18n.global.t("ui.input_firstname"),
              trigger: "blur"
            }
          ],
          lastname: [
            {
              required: true,
              message: i18n.global.t("ui.input_lastname"),
              trigger: "blur"
            }
          ],
          phone: [
            { required: false, message: i18n.global.t("ui.input_phone"), trigger: "blur" }
          ],
          language: [
            {
              required: true,
              message: i18n.global.t("ui.input_language"),
              trigger: "change"
            }
          ]
        }
      },
      languagesAvailable: [
        { label: "English", value: "en" },
        { label: "Français", value: "fr" },
        { label: "Nederlands", value: "nl" },
        { label: "Ελληνικά", value: "el" }
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
    },
    MFAChanged: function() {
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
/* The expanded form is 938 px: in a 577 px window, the footer (Cancel / Submit) fell off
   the screen and the whole page had to be scrolled. The dialog now fits in the window and
   it is its body that scrolls. */
.dialog-user {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  margin: 5vh auto;
}

.dialog-user .el-dialog__body {
  overflow-y: auto;
}

/* `el-row` is a flex container: the `<el-transfer>` becomes a flex item sized on its
   content there, and the two lists shrank to 200 px each. It takes the full width. */
.dialog-user .el-transfer {
  width: 100%;
}

.dialog-user .el-transfer-panel {
  /* Two 250 px lists in a 660 box: the privilege descriptions were truncated and the two
     lists touched the edge. The panel is a flex item (`element-legacy.css` gives it
     `flex: 0 0 250px` so that it stays next to the second one), so the flex basis is what has
     to be widened — `width` alone does nothing here.
     Two 300 panels + the 162 px of buttons fit in the 970 px of the dialog; `0 1` (and not
     `0 0`) lets them shrink rather than overflow on a narrower window. */
  flex: 0 1 300px;
}
</style>