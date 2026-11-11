<template>
  <div style="text-align:left;">
    <!-- tiptap 1 has no Vue 3 equivalent: the formatting bar and the rich editor are replaced
         by a text area that edits the raw HTML. The component contract is kept (prop `config`,
         event `freetextchanged`). To revisit with tiptap 3 if rich formatting has to come back. -->
    <p class="editor__hint">{{ $t('ui.free_text') }} — HTML</p>
    <el-input v-model="html" type="textarea" :rows="14" spellcheck="false" />
  </div>
</template>

<script>
export default {
  name: 'FreeTextDetails',
  data: () => ({
    html: '',
  }),
  props: {
    config: {
      type: Object,
    },
  },
  watch: {
    html: {
      handler: function () {
        this.$emit('freetextchanged', this.html)
      },
    },
  },
  mounted() {
    if (this.config.config.freetext == undefined) {
      this.config.config.freetext = '<p>' + this.$t('ui.free_text') + '</p>'
    }
    this.html = this.config.config.freetext
  },
}
</script>

<style>
.editor__hint {
  margin: 0 0 6px;
  color: #909399;
  font-size: 12px;
}
</style>
