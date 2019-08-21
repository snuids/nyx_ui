<template>
  <div id="app" class="nyxapp">       
    <router-view/>
  </div>
</template>

<script>
/* eslint-disable */
export default {
  name: "App"
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  background-color: aqua;
}

#nav a {
  padding: 30px;
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  padding: 30px;
  color:red;
}

.nyxapp
{

}
</style>
