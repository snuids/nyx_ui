<template slot="items">
  <div>
    <h2 class="form_title">{{computeTranslatedText(config.config.formtitle,$store.getters.creds.user.language)}}</h2>
    <div style="text-align:left;width:100%">
      <el-form>
        <el-row v-for="item in config.config.headercolumns" :key="item.field">
          <el-col :span="23">
            <el-form-item
              :label="computeTranslatedText(item.title,$store.getters.creds.user.language)"
              :label-width="formLabelWidth"
              v-if="item.type =='number'"
            >
              <el-input-number :size="formSize"  v-model="item.value" autocomplete="off"></el-input-number>
            </el-form-item>
            <el-form-item
              :label="computeTranslatedText(item.title,$store.getters.creds.user.language)"
              :label-width="formLabelWidth"
              v-else-if="item.type =='date'"
            >
              <el-date-picker :size="formSize" v-model="item.value" type="date" placeholder="Pick a day"></el-date-picker>
            </el-form-item>
            <el-form-item
              :label="computeTranslatedText(item.title,$store.getters.creds.user.language)"
              :label-width="formLabelWidth"
              v-else-if="item.type =='datetime'"
            >
              <el-date-picker
                size="mini"
                v-model="item.value"
                type="datetime"
                placeholder="Pick a date and a time"
              ></el-date-picker>
            </el-form-item>

            <el-form-item
              :label="computeTranslatedText(item.title,$store.getters.creds.user.language)"
              :label-width="formLabelWidth"
              v-else-if="item.type =='selecter'"
            >
              <el-select v-model="item.value" :size="formSize" placeholder="Select">
                <el-option
                  v-for="item in item.selectOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                ></el-option>
              </el-select>
            </el-form-item>

            <el-form-item :label="computeTranslatedText(item.title,$store.getters.creds.user.language)" :label-width="formLabelWidth" v-else>
              <el-input v-model="item.value" :size="formSize" autocomplete="off"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="11">&nbsp;</el-col>
          <el-col :span="13">
            <el-button
              type="primary"
              @click="submit()"
              :loading="commitunderway"
            >{{this.$t("buttons.submit")}}</el-button>
            <span v-if="commitunderway">
              &nbsp;&nbsp;
              <v-icon name="spinner" scale="1" spin />
            </span>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>
  
<script>
import moment from "moment";
import Vue from "vue";
import {computeTranslatedText} from '../globalfunctions'

import VueGeolocation from "vue-browser-geolocation";
Vue.use(VueGeolocation);

export default {
  name: "Form",
  data: () => ({
    formLabelWidth: "120px",
    commitunderway: false,
    formSize: 'mini',
  }),
  props: {
    config: {
      type: Object
    }
  },
  methods: {
    computeTranslatedText: function(inText,inLocale){      
      return computeTranslatedText(inText,inLocale);
    },
    submit: function() {
      this.commitunderway = true;
      var newRec = {
        _index: this.config.config.index,
        _source: {},
        _id:
          "id_" +
          Math.floor((1 + Math.random()) * 0x1000000) +
          "_" +
          Math.floor((1 + Math.random()) * 0x1000000)
      };

      for (var i in this.config.config.headercolumns) {
        var item = this.config.config.headercolumns[i];
        newRec["_source"][item.field] = item.value;
      }
      newRec._source.user = this.$store.getters.creds.user.id;
      newRec["_source"]["@timestamp"] = moment();
      this.$getLocation({
        enableHighAccuracy: false,
        timeout: 20000
      })
        .then(coordinates => {
          newRec._source.location = [coordinates["lng"], coordinates["lat"]];

          var mode="table";
          if (this.config.config.formmode!=undefined)
            mode=this.config.config.formmode;


          if(mode=="table")
          {
            this.$store.commit({
              type: "updateRecord",
              data: newRec
            });
          }
          else
          {
            this.$store.commit({
              type: "sendMessage",
              data: {destination:this.config.config.destination
                  ,message:JSON.stringify( newRec._source)}
            });

              this.$notify({
                title: "Message Sent.",
                type: "success",
                message: "Message Sent.",
                position: "bottom-right",
                duration: 1000
              });
          }
          

          this.$alert("Your record has been saved.", "Message", {
            confirmButtonText: "OK"
          });
          this.commitunderway = false;
        })
        .catch(error => {
          alert(error);
        });
    }
  },
  created: function() {}
};
</script>

<style>
.form_title {
  color:black;
}
</style>