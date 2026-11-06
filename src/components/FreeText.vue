<template>
  <!--MAIN DIALOG -->
  <div style="text-align:left">
    <!-- Interpolated, not v-html: this field holds an application's free text, and a configuration
         written by an administrator would otherwise execute in every visitor's session. -->
    <span>{{ config.config.freetext }}</span>
  </div>
</template>

<script>
// import axios from "axios";

export default {
  name: "FreeText",
  data: () => ({}),
  props: {
    config: {
      type: Object
    }
  },
  methods: {},
  created: function() {},

  mounted: function() {},
  beforeDestroy: function() {
    clearInterval(this.timer);
  }
};
</script>

<style>
</style>

