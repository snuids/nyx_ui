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
  mounted() {
    // Au cas où une vue précédente aurait verrouillé le défilement du document.
    document.body.classList.add("nyx-privacy");
  },
  beforeDestroy() {
    document.body.classList.remove("nyx-privacy");
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
body.nyx-privacy,
body.nyx-privacy #app {
  height: auto;
  overflow-y: auto;
}

.privacy-page {
  /* Bloc normal : le défilement est celui du document. Une couche `position: fixed` avec son
     propre overflow défile bien dans Chrome, mais Safari refuse le wheel sur ce montage. */
  box-sizing: border-box;
  min-height: 100vh;
  padding: 14mm 6mm;
  background: #eef1f4;
}

.privacy-language {
  position: absolute;
  top: 18px;
  right: 20px;
}

.privacy-sheet {
  /* Format A4 réel (210 x 297 mm), marges de saisie : ce que l'on voit à l'écran est ce
     qui sortira à l'impression ou en PDF. */
  position: relative;
  box-sizing: border-box;
  width: 210mm;
  max-width: 100%;
  min-height: 297mm;
  margin: 0 auto;
  padding: 18mm 16mm;
  background: #ffffff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
  color: #333;
  line-height: 1.55;
  /* La feuille de style globale centre tout le texte de l'application : une notice
     juridique alignée au centre est illisible. */
  text-align: left;
}

/* Impression / PDF : mêmes marges, sans décor d'écran. */
@page {
  size: A4;
  margin: 18mm 16mm;
}

@media print {
  .privacy-page {
    min-height: 0;
    padding: 0;
    background: #ffffff;
  }

  .privacy-sheet {
    width: auto;
    min-height: 0;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }

  .privacy-back,
  .privacy-language {
    display: none !important;
  }
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
</style>
