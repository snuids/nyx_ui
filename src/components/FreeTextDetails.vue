<template>
  <div style="text-align:left;">
    <!-- tiptap 1 n'a pas d'equivalent Vue 3 : la barre de mise en forme et l'editeur riche sont
         remplaces par une zone de texte qui edite le HTML source. Le contrat du composant est
         conserve (prop `config`, evenement `freetextchanged`). A reprendre avec tiptap 3 si la mise
         en forme riche doit revenir. -->
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
