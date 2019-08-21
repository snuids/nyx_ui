<template>
 <span>
  <!--el-popover
      
      placement="bottom"
      width="150"
      trigger="click"      
    >
      <el-form>
          <el-row>
            <el-col>
              <span></span>
            </el-col>
          </el-row>  

      </el-form>

      <el-button circle type="success" slot="reference"><div style='width:16px;height:16px;font-size:14px;'>{{$store.getters.creds.user.firstname[0]}}</div></el-button>
    </el-popover-->


  <el-dropdown @command="handleCommand">
    <el-button type="" circle><div style='width:16px;height:16px;font-size:14px;'>{{$store.getters.creds.user.firstname[0]}}</div></el-button>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item command='info'>
        <v-icon class='menuicon'  name="info-circle" scale="1"/>&nbsp;&nbsp;{{ $t("logout.info") }}
      </el-dropdown-item>
      <el-dropdown-item  command='password'>
        <v-icon class='menuicon'  name="key" scale="1"/>&nbsp;&nbsp;{{ $t("logout.change_pass") }}
      </el-dropdown-item>
      <el-dropdown-item divided  command='logout'>
        <v-icon class='menuicon' name="external-link-alt" scale="1"/>&nbsp;&nbsp;{{ $t("logout.logout") }}
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
    handleCommand(e)
    {
      if(e=='info')
        this.info();
      else if(e=='password')
      {
        //this.password();
        this.$emit("changepassword");
      }
      else
        this.logout();
    },
    info(){
      this.$alert('Nyx version '+this.$store.getters.version +' Window size ('+this.$store.getters.containerSize.width+','+this.$store.getters.containerSize.height+')', 'Version', {
          confirmButtonText: 'OK'
        });
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
.menuicon
{
  margin-bottom:-3px;
}
</style>