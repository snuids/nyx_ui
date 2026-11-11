<template>
  <el-popover v-if="apps.length>0" placement="bottom" width="350" trigger="click" id="app-popover" popper-class="app-popover-panel">
    <el-form>
      <el-row v-for="(line,index) in moduloapps" :key="index">
        <el-col
          :span="24/modulo"
          v-for="(field,index2) in line"
          :key="index2"
          style="text-align:center;height:90px;"
        >
          <el-button plain @click="appClicked(field.value)">
            <v-icon :name="field.value.icon" scale="2" style="height:40px;" />
          </el-button>
          <br />
          {{field.value.title}}
        </el-col>
      </el-row>
    </el-form>

    <template #reference><el-button circle type="primary">
      <el-icon><component :is="$icons.Menu" /></el-icon>
    </el-button></template>
  </el-popover>
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
        message: this.$t("notifications.byebye"),
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

/* The Vue 2 screenshots show, in this panel, large square buttons (~80 x 64 px) with a 40 px
   icon and the label UNDER the button. Forcing them to 40 x 40 left the 90 px cells almost
   empty: that is what gave the impression of "too much padding". The button gets its natural
   size back and the icon is fixed at 40 px. */
/* Targets the applications panel only: `.el-popover .el-button` also hit the other
   popovers, including the download one, whose .xlsx/.csv buttons went from 24 to 64 px. */
.app-popover-panel .el-button,
#app-popover .el-button {
  width: auto;
  height: auto;
  min-width: 72px;
  min-height: 64px;
  padding: 12px 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.app-popover-panel .el-button .nyx-icon,
#app-popover .el-button .nyx-icon {
  height: 40px;
}

#app-popover .el-button .nyx-icon svg,
.el-popover .el-button .nyx-icon svg {
  width: 40px;
  height: 40px;
}

</style>