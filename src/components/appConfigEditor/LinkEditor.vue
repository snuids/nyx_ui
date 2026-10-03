<template>
  <el-dialog
    width="400px"
    :title="title"
    :visible.sync="visible"
    :before-close="closeDialog"
    append-to-body
    id="item-editor"
  >
  <el-card shadow="never" v-if="curItem">

  <el-row>
    <el-button @click="setFocus('text')" type="text">{{ $t('cfg.text') }}</el-button>
  </el-row>
  <el-row>
    <el-input
          size="mini"
          ref="text"
          :placeholder="$t('cfg.text')"
          v-model="curItem.linktext"
        ></el-input>
  </el-row>
  <el-row>
    <el-button @click="setFocus('type')" type="text">{{ $t('cfg.button_type') }}</el-button>
  </el-row>
  <el-row>
    <el-input
          size="mini"
          ref="type"
          placeholder="primary / success / warning / danger / info / text"
          v-model="curItem.linkbuttontype"
        ></el-input>
  </el-row>
  <el-row>
    <el-button @click="setFocus('icon')" type="text">{{ $t('cfg.button_icon') }}</el-button>
  </el-row>
  <el-row>
    <el-input
          size="mini"
          ref="icon"
          placeholder="el-icon-..."
          v-model="curItem.linkbuttonicon"
        ></el-input>
  </el-row>
  <el-row>
    <el-button type="text">{{ $t('cfg.button_plain') }}</el-button>
  </el-row>
  <el-row>
    <el-switch v-model="curItem.linkbuttonplain">
    </el-switch>
  </el-row>
  <el-row>
    <el-button type="text">{{ $t('cfg.button_round') }}</el-button>
  </el-row>
  <el-row>
    <el-switch v-model="curItem.linkbuttonround">
    </el-switch>
  </el-row>
  <el-row>
    <el-button type="text">{{ $t('cfg.button_circle') }}</el-button>
  </el-row>
  <el-row>
    <el-switch v-model="curItem.linkbuttoncircle">
    </el-switch>
  </el-row>
  </el-card>
   </el-dialog>
  
</template>
<script>
import Vue from "vue";
import axios from "axios";
import _ from "lodash";

export default {
   name: "LinkEditor",
  data: () => ({
    visible: false,
    curItem: null,
  }),
  computed: {
    itemIn: function() {
      return this.item;
    },
    title: function() {
      return this.$t('cfg.link_editor');
    },
  },
  watch: {},
  props: {
    item: { type: Object },
  },
  created: function() {
    console.log('**************************')
    console.log('link editor')
    this.visible = true;

    this.curItem = JSON.parse(JSON.stringify(this.item))

    if(this.curItem.linktext == null)
      this.curItem.linktext = 'link text'
    if(this.curItem.linkbuttontype == null)
      this.curItem.linkbuttontype = ''
    if(this.curItem.linkbuttonicon == null)
      this.curItem.linkbuttonicon = 'el-icon-download'
    if(this.curItem.linkbuttonplain == null)
      this.curItem.linkbuttonplain = false
    if(this.curItem.linkbuttonround == null)
      this.curItem.linkbuttonround = false
    if(this.curItem.linkbuttoncircle == null)
      this.curItem.linkbuttoncircle = false    
  },
  mounted: function() {
    let tmp = JSON.parse(JSON.stringify(this.curItem))
    this.curItem = null
    this.curItem = JSON.parse(JSON.stringify(tmp))
  },
  methods: {
    closeDialog: function() {
      this.visible = false
      this.$emit("dialogclose", this.curItem);
    },
    setFocus: function(el) {
      this.$nextTick(() => this.$refs[el].focus());
    },
    setFocusInput: function() {
      let input = this.$refs.indexPattern;
      this.$nextTick(() => input.focus());
    },
    setFocusSelect: function() {
      let select = this.$refs.timeField;
      this.$nextTick(() => select.focus());
    },
  
  }
};
</script>
<style>
#item-editor .padding-right {
  padding-right: 10px;
}
</style>