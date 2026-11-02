<template>
  <div class="language-select" :class="{ 'on-dark': dark }">
    <select :value="current" :aria-label="label" @change="change($event.target.value)">
      <option v-for="locale in locales" :key="locale.code" :value="locale.code">
        {{ locale.label }}
      </option>
    </select>
  </div>
</template>

<script>
/**
 * Language selector.
 *
 * All four catalogues are already bundled (i18n-setup imports every one of them), so switching
 * language is immediate: no network call. The choice is remembered in local storage, because
 * before signing in there is no account whose preference could be read.
 */
export default {
  name: "LanguageSelect",
  props: {
    dark: { type: Boolean, default: false },
  },
  data() {
    return {
      locales: [
        { code: "fr", label: "Français" },
        { code: "nl", label: "Nederlands" },
        { code: "en", label: "English" },
        { code: "el", label: "Ελληνικά" },
      ],
      label: "Langue / Taal / Language",
    };
  },
  computed: {
    current() {
      return (this.$i18n && this.$i18n.locale) || "en";
    },
  },
  methods: {
    change(code) {
      if (!code || code === this.current) return;
      this.$i18n.locale = code;
      document.documentElement.lang = code;
      try {
        localStorage.nyx_language = code;
      } catch (e) {
        /* storage refused: the choice will not survive a reload, nothing more */
      }
      this.$emit("change", code);
    },
  },
};
</script>

<style>
.language-select select {
  padding: 3px 6px;
  font-size: 12px;
  color: #04416b;
  background: #ffffff;
  border: 1px solid #cfd8de;
  border-radius: 3px;
  cursor: pointer;
}

.language-select.on-dark select {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.45);
}

.language-select.on-dark select option {
  color: #333;
  background: #ffffff;
}
</style>
