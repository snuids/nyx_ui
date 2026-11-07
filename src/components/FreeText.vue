<template>
  <!--MAIN DIALOG -->
  <div style="text-align:left" class="freetext">
    <!-- The field stores HTML: the application editor writes it (`FreeTextDetails` posts its textarea
         content, and the default value is a `<p>`), so interpolating it printed the markup on screen
         instead of the page the administrator wrote. It is rendered with `v-html` — through
         `DOMPurify`, because the document is authored by an administrator but displayed to every
         visitor, and a `<script>` or an `onclick` left in the text would run in all their sessions. -->
    <div v-html="html"></div>
  </div>
</template>

<script>
import DOMPurify from "dompurify";

export default {
  name: "FreeText",
  data: () => ({}),
  props: {
    config: {
      type: Object
    }
  },
  computed: {
    html() {
      const source =
        (this.config && this.config.config && this.config.config.freetext) || "";
      // `target` is not in DOMPurify's default attribute list and the stored links use it.
      return DOMPurify.sanitize(source, { ADD_ATTR: ["target"] });
    }
  },
  methods: {},
  created: function() {},

  mounted: function() {},
  beforeUnmount: function() {
    clearInterval(this.timer);
  }
};
</script>

<style scoped>
/* The editor leaves empty paragraphs behind (the `Help` module ends with two of them): rendered,
   each one is a blank line under the text. */
.freetext :deep(p:empty) {
  display: none;
}

/* An `h1` written inline — as the first line of the text usually is — must not open a gap above
   the block: the console's heading reset already removes its margin, this keeps the first element
   flush with the tab bar. */
.freetext :deep(div > :first-child) {
  margin-top: 0;
}
</style>
