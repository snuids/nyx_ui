<template>
  <span>
    <el-dropdown @command="handleCommand">
      <el-button type circle>
        <div
          style="width:16px;height:16px;font-size:14px;"
        >{{$store.getters.creds.user.firstname[0]}}</div>
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="info">
          <v-icon class="menuicon" name="info-circle" scale="1" />
          &nbsp;&nbsp;{{ $t("logout.info") }}
        </el-dropdown-item>
        <el-dropdown-item v-if="!$store.getters.creds.user.conexion_source || $store.getters.creds.user.conexion_source !== 'ad'" command="password">
          <v-icon class="menuicon" name="key" scale="1" />
          &nbsp;&nbsp;{{ $t("logout.change_pass") }}
        </el-dropdown-item>
        <el-dropdown-item divided command="logout">
          <v-icon class="menuicon" name="external-link-alt" scale="1" />
          &nbsp;&nbsp;{{ $t("logout.logout") }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </span>
</template>
  
<script>
export default {
  name: "Logout",
  data: () => ({}),
  props: {},
  created: function() {},
  methods: {
    handleCommand(e) {
      if (e == "info") this.info();
      else if (e == "password") {
        //this.password();
        this.$emit("changepassword");
      } else this.logout();
    },
    info() {
      this.$alert(
        "<strong>UI Version:</strong> " +
          this.$store.getters.version +
          "<br/><strong>API Version:</strong> "+this.$store.getters.apiVersion+ "<br/><strong>Window size:</strong> (" +
          this.$store.getters.containerSize.width +
          "," +
          this.$store.getters.containerSize.height +
          ")"
          +"<br/><strong>Browser:</strong> "+this.$browserDetect.meta.name 
          +"<br/><strong>Browser Version:</strong> "+this.$browserDetect.meta.version
          
          ,
        "Nyx Version",
        {
          confirmButtonText: "OK",
          dangerouslyUseHTMLString: true
        }
      );
    },
    logout() {
      console.log("BEFCOMMIT");
      this.$store.commit({
        type: "logout",
        data: {}
      });
      console.log("AFTERCOMMIT");
      this.$notify({
        title: this.$t("notifications.message"),
        message: this.$t("notifications.byebye"),
        type: "success",
        position: "bottom-right"
      });
      this.$router.push("/");
    }
  }
};
</script>

<style>
.menuicon {
  margin-bottom: -3px;
}
</style>