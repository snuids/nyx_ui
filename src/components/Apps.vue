<template>
  <el-popover v-if="apps.length>0" placement="bottom" width="350" trigger="click" id="app-popover">
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

/* La capture de la version Vue 2 montre, dans ce panneau, de grands boutons carres (~80 x 64 px)
   avec une icone de 40 px et le libelle SOUS le bouton. Les forcer a 40 x 40 laissait les cellules de
   90 px presque vides : c'est ce qui donnait l'impression de « trop de padding ». On rend au bouton
   sa taille naturelle et on fixe l'icone a 40 px. */
#app-popover .el-button,
.el-popover .el-button {
  width: auto;
  height: auto;
  min-width: 72px;
  min-height: 64px;
  padding: 12px 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

#app-popover .el-button .nyx-icon,
.el-popover .el-button .nyx-icon {
  height: 40px;
}

#app-popover .el-button .nyx-icon svg,
.el-popover .el-button .nyx-icon svg {
  width: 40px;
  height: 40px;
}

</style>