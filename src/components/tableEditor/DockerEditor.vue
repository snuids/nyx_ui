<template>
  <el-dialog
    width="40%"
    :title="title"
    v-model="dialogFormVisible"
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
          <el-button @click="setFocus('type')" type="primary" link class="docker-action-label">Action</el-button>
        </el-col>
      </el-row>      

      <!-- One line for the selector and the button: in Element Plus `el-select` takes 100 % of
           the width, so "Send" fell under the selector (it sat beside it in Element UI 2). The
           select takes the remaining room, the button keeps its own. -->
      <el-row>
        <el-col :span="24">
          <div class="docker-action-row">
            <el-select
                  v-model="action"
                  ref="type"
                  size="small"
                  placeholder="Mode"
                  class="docker-action-select"
                >
                  <el-option
                    v-for="item in actions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></el-option>
                </el-select>
                <el-button          
                  @click="sendMessage"
                  type="danger"
                  size="small"
                >Send</el-button>
          </div>
        </el-col>
                  
      </el-row> 

      

      <!-- <el-row style="text-align:center; margin-top:20px;">
        <el-button          
          @click="closeDialog"
          type="primary"
          size="small"
        >Close</el-button>
      </el-row> -->
    </el-card>
  </el-dialog>
</template>

<script>

export default {
  name: "DockerEditor",
  data: () => ({
    dialogFormVisible: false,
    actions:[],
    action:"restart",
    orgRecord:""
  }),
  computed: {
    title: function() {
      return this.$t("ui.docker_actions");
    },
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
                title: this.$t("ui.message_sent"),
                type: "success",
                message: this.$t("ui.message_sent"),
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
/* The label of the field: a button (it puts the focus on the selector), not a title. */
.docker-action-label {
  padding: 0;
  height: auto;
  vertical-align: baseline;
}

/* Selector and button on the same line: `el-select` is 100 % wide by default in Element
   Plus, hence the `flex: 1` that leaves it the remaining room and the `min-width: 0` that
   lets it shrink instead of pushing the button onto the next line. */
.docker-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.docker-action-select {
  flex: 1;
  min-width: 0;
}
</style>
