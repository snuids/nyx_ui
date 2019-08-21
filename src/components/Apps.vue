<template>
<el-popover
      v-if="apps.length>0"
      placement="bottom"
      width="350"
      trigger="click"
      id="app-popover"
    >
      <el-form>
        <el-row v-for="(line,index) in moduloapps" :key="index">
          <el-col :span="24/modulo" v-for="(field,index2) in line" :key="index2" style="text-align:center;height:90px;">            
            
            <el-button plain    @click="appClicked(field.value)">
              <v-icon :name="field.value.icon" scale="2" style="height:40px;"/>
            </el-button>
            <br/>
            {{field.value.title}}            
          </el-col>
        </el-row>
      </el-form>

      <el-button circle type="primary" slot="reference"><i class="el-icon-menu"></i></el-button>
    </el-popover>


    <!--el-dropdown @command="appClicked" v-if="apps.length>0">
      <el-button type="primary">
        <i class="el-icon-menu"></i>        
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
          :command="item"
          v-for="(item, index) in apps"
          :key="index"
          :label="item.title"
          :value="item.title"
        >
          <v-icon class="menuicon" :name="item.icon" scale="1"/>
          &nbsp;&nbsp;{{item.title}}
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown-->

    
</template>
  
<script>
export default {
  name: "Apps",
  data: () => ({
    modulo: 3,
    moduloapps: [],
    apps: []
  }),
  props: {},
  computed: {},
  methods: {
    appClicked(e) {
      this.$emit("appclicked", e);
    },
    handleCommand(e) {
      if (e == "info") this.info();
      else this.logout();
    },
    info() {
      this.$alert("This is a message", "Title", {
        confirmButtonText: "OK"
      });
    },
    logout() {
      this.$store.commit({
        type: "logout",
        data: {}
      });
      this.$notify({
        title: "Success",
        message: "Bye Bye",
        type: "success",
        position: "bottom-right"
      });
      this.$router.push("/");
    }
  },
  created: function() {
    this.apps = this.$store.getters.apps;
    var lines = [];
    var curline = [];
    var allapps = this.apps;
    for (var i in allapps) {
      var rec = allapps[i];
      curline.push({ key: i, value: rec });
      if (curline.length >= this.modulo) {
        lines.push(curline);
        curline = [];
      }
    }
    if (curline.length > 0) {
      lines.push(curline);
      curline = [];
    }
    this.moduloapps = lines;
  }
};
</script>

<style>
.menuicon {
  margin-bottom: -3px;
}
</style>