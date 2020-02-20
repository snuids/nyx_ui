<template>
  <!--LANDING PAGE -->
  <div  style="text-align:left overflow:auto;">
    <div v-if="siteMap">
      <h1>Site Map</h1>
      <el-card 
        shadow="never"
        v-for="cat in $store.getters.filteredmenus" :key="cat.loc_category" style="margin:10px 10px 10px 0px; ">
        <!-- <el-col style="width:130px;">
        </el-col> -->
        <div slot="header">
          <h2>{{cat.loc_category}}</h2>
        </div>
        <el-row type="flex">
          <el-card 
            shadow="hover"
            v-for="subcat in cat.submenus" :key="subcat.loc_title" style=" margin: 0px 5px; min-width:120px; padding:2px;">
          <!-- <div v-for="subcat in cat.submenus" :key="subcat.loc_title" style="border:solid 1px red; margin: 0px 5px; width:120px; padding:5px;"> -->
            <div style="width:100%;">
              <h2>{{subcat.loc_title}}</h2>
            </div>
            <div
              v-for="app in subcat.apps"
              :key="app.rec_id">
              <router-link :to="'/main/'+app.rec_id">{{app.loc_title}}</router-link>
            </div>
          </el-card>
        </el-row>
      </el-card>
    </div>
    <div v-else></div>
  </div>
</template>

<script>
export default {
  name: "LandingPage",
  data: () => ({
    siteMap: true
  }),
  props: {},
  methods: {},
  created: function() {},

  mounted: function() {}
};
</script>

<style>
</style>

