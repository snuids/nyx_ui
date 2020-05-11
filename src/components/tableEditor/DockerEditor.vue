<template>
  <el-dialog
    width="40%"
    :title="title"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    class="sr-report-exception-editor"
    append-to-body
  >  
    <el-card v-if="record" shadow="never">

     <h1>Name: <b>{{record._source.name}}</b> </h1>
     <h2>Image: <b>{{record._source.image}}</b> </h2>

      <el-row>
        <el-col :span="24">
          <el-button @click="setFocus('fr')" type="text">Action</el-button>
        </el-col>
      </el-row>      
      
      <el-row>
        <el-col :span="24">
          <el-select                
                v-model="action"
                ref="type"
                size="mini"
                placeholder="Mode"
              >
                <el-option
                  v-for="item in actions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
              &nbsp;
              <el-button          
                @click="sendMessage"
                type="danger"
                size="mini"
              >Send</el-button>
        </el-col>
                  
      </el-row> 

      

      <!-- <el-row style="text-align:center; margin-top:20px;">
        <el-button          
          @click="closeDialog"
          type="primary"
          size="mini"
        >Close</el-button>
      </el-row> -->
    </el-card>
  </el-dialog>
</template>

<script>
import Vue from "vue";
import axios from "axios";
import moment from "moment";

export default {
  name: "DockerEditor",
  data: () => ({
    dialogFormVisible: false,
    title: "Docker Actions",    
    actions:[],
    action:"restart",
    orgRecord:""
  }),
  computed: {
    modified:function(){
      return JSON.stringify(this.record)!=this.orgRecord;
    }
  },
  props: {
    record: {
      type: Object
    },
    config: {
      type: Object
    }
  },
  watch: {},
  created: function() {
    this.dialogFormVisible = true;
    this.orgRecord=JSON.stringify(this.record);
  },
  components: {},
  methods: {
    closeDialog: function() {
      this.$emit("dialogclose");
      this.dialogFormVisible = false;
    },
    sendMessage: function(){
        this.$store.commit({
              type: "sendMessage",
              data: {message:
                          JSON.stringify({name:this.record._source.name,command:this.action}),
                    destination:"/topic/DOCKER_COMMAND"}
            });

              this.$notify({
                title: "Message Sent.",
                type: "success",
                message: "Message Sent.",
                position: "bottom-right",
                duration: 1000
              });
              this.$emit("dialogclose");
              this.dialogFormVisible = false;
    },
    close: function() {

      // this.$store.commit({
      //     type: "updateRecord",
      //     data: this.record
      //   });

      //this.$emit("dialogcloseupdated", this.record);
      //this.dialogFormVisible = false;
    },
    setFocus: function(el) {
      if (el == null) return;
      this.$nextTick(() => this.$refs[el].focus());
    }
  },
  mounted: function() {
    this.actions=[{"label":"Restart","value":"restart"},{"label":"Start","value":"start"},{"label":"Stop","value":"stop"}]
    
    //this.title = this.$t('smartreport.modifysection');
  },
  destroyed: function() {}
};
//smartreport.modifysection
</script>

<style >
</style>
