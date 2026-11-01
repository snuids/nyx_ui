<template>
  <div class="privacy-page">
    <div class="privacy-sheet">
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
import { privacyNotice } from "@/content/privacy";

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
  computed: {
    notice() {
      return privacyNotice((this.$i18n && this.$i18n.locale) || "en");
    },
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
  min-height: 100vh;
  padding: 40px 16px;
  background: #f4f6f8;
  overflow-y: auto;
}

.privacy-sheet {
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

/* Lien sous le bouton de connexion, dans la carte blanche : lisible, mais sans
   concurrencer l'action principale. */
.privacy-inline {
  margin-top: 14px;
  text-align: center;
}

.privacy-inline a {
  font-size: 12px;
  color: #6b7c8a;
  text-decoration: underline;
}

.privacy-inline a:hover {
  color: #04416b;
}

.privacy-link-aside {
  display: block;
  padding: 10px 20px;
  font-size: 11px;
  color: #9fb3c8;
  text-decoration: underline;
}

.privacy-link-aside:hover {
  color: #ffffff;
}
</style>
