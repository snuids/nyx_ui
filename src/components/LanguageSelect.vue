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
 * Sélecteur de langue.
 *
 * Les quatre catalogues sont déjà embarqués dans le bundle (i18n-setup les importe tous), donc
 * changer de langue est immédiat : pas d'appel réseau. Le choix est mémorisé dans le stockage
 * local, car avant la connexion il n'y a pas de compte dont on puisse lire la préférence.
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
        /* stockage refusé : le choix ne survivra pas au rechargement, sans plus */
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
