<template>
  <div class="privacy-page">
    <div class="privacy-sheet">
      <language-select class="privacy-language" />
      <h1>{{ notice.title }}</h1>
      <p class="privacy-updated">{{ notice.updated }}</p>
      <p class="privacy-intro">{{ notice.intro }}</p>

      <div v-for="(section, index) in notice.sections" :key="index" class="privacy-section">
        <h2>{{ section.h }}</h2>
        <p>{{ section.p }}</p>
      </div>

      <el-button class="privacy-back" size="small" @click="goBack">{{ notice.back }}</el-button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { privacyNotice, fillNotice } from "@/content/privacy";
import LanguageSelect from "@/components/LanguageSelect";

/**
 * Notice de protection des données.
 *
 * Page autonome, volontairement sans authentification : on doit pouvoir lire ce texte avant
 * de posséder un compte, et y revenir ensuite depuis un lien permanent. Aucun bandeau, aucun
 * bouton « j'accepte » — il n'y a pas de consentement à recueillir, seulement une information
 * à rendre accessible.
 */
export default {
  name: "Privacy",
  components: { LanguageSelect },
  data() {
    return { mentions: null };
  },
  computed: {
    notice() {
      const locale = (this.$i18n && this.$i18n.locale) || "en";
      return fillNotice(privacyNotice(locale), this.mentions);
    },
  },
  async created() {
    // Route publique : la notice doit s'afficher même si l'API ne répond pas. En cas d'échec,
    // le texte garde ses mentions « à compléter » plutôt que de rester vide.
    try {
      const response = await axios.get(this.$store.getters.apiurl + "config", { timeout: 4000 });
      this.mentions = (response.data && response.data.privacy) || null;
    } catch (e) {
      this.mentions = null;
    }
  },
  methods: {
    goBack() {
      if (window.history.length > 1) this.$router.back();
      else this.$router.push("/");
    },
  },
};
</script>

<style>
.privacy-page {
  /* Couche fixe : la mise en page de l'application coupe l'overflow de ses conteneurs, donc
     une page qui se contente de « min-height: 100vh » ne défile pas — le texte est tronqué. */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 40px 16px;
  background: #f4f6f8;
}

.privacy-language {
  position: absolute;
  top: 18px;
  right: 20px;
}

.privacy-sheet {
  position: relative;
  max-width: 820px;
  margin: 0 auto;
  padding: 36px 44px 44px;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  color: #333;
  line-height: 1.55;
  /* La feuille de style globale centre tout le texte de l'application : une notice
     juridique alignée au centre est illisible. */
  text-align: left;
}

.privacy-sheet h1 {
  margin: 0 0 4px;
  font-size: 24px;
  color: #04416b;
}

.privacy-updated {
  margin: 0 0 20px;
  font-size: 12px;
  color: #888;
}

.privacy-intro {
  margin: 0 0 24px;
  padding-left: 12px;
  border-left: 3px solid #04416b;
  font-size: 14px;
}

.privacy-section h2 {
  margin: 24px 0 6px;
  font-size: 15px;
  color: #04416b;
}

.privacy-section p {
  margin: 0;
  font-size: 14px;
}

.privacy-back {
  margin-top: 32px;
}

