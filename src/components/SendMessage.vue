<template>
  <!--MAIN DIALOG -->
  <div style="text-align:left">
    <el-card class="maincard">
      <div slot="header" class="clearfix">
        <h3>{{$t('sendmessage.send_message')}}</h3>
      </div>
      <el-form ref="form" :model="form" label-width="120px">
        <el-row>
          <el-col :span="8">
            <el-form-item label="Type">
              <el-radio v-model="message_type" label="topic">Topic</el-radio>
              <el-radio v-model="message_type" label="queue">Queue</el-radio>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="Destination">
              <el-input
                :placeholder="this.$t('generic.pleaseinput')"
                v-model="destination"
                label="destination"
                size="mini"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Message">
          <el-input type="textarea" v-model="message"></el-input>
        </el-form-item>
        <el-form-item label>
          <el-button
            style="float: right;"
            type="primary"
            size="mini"
            @click="sendMessage()"
            :disabled="message.length==0 || destination.length==0"
          >{{$t('sendmessage.send_message')}}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "SendMessage",
  data: () => ({ message_type: "topic", destination: "", message: "" }),
  props: {
    config: {
      type: Object
    }
  },
  methods: {
    sendMessage: function(e) {
      console.log("Send Message");

      var url =
        this.$store.getters.apiurl +
        "sendmessage?token=" +
        this.$store.getters.creds.token;

      var message = {
        destination: "/" + this.message_type + "/" + this.destination,
        body: this.message
      };

      axios
        .post(url, message)
        .then(response => {
          if (response.data.error != "") console.log("Report list error...");
          else {
            this.$notify({
              title: "Message Sent.",
              type: "success",
              message: "Message Sent.",
              position: "bottom-right",
              duration: 1000
            });
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
  },
  created: function() {},

  mounted: function() {},
  beforeDestroy: function() {}
};
</script>

<style>
.maincard {
  width: 99%;
}
</style>

