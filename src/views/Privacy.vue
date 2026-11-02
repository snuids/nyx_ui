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
 * Data protection notice.
 *
 * Standalone page, deliberately unauthenticated: the text must be readable before owning an
 * account, and reachable again later from a permanent link. No banner, no "I accept" button —
 * there is no consent to collect, only information to make accessible.
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
    // In case a previous view had locked the document scrolling.
    document.body.classList.add("nyx-privacy");
  },
  beforeDestroy() {
    document.body.classList.remove("nyx-privacy");
  },
  async created() {
    // Public route: the notice must be displayed even if the API does not answer. On failure,
    // the text keeps its "to be completed" placeholders rather than staying empty.
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
  /* Normal block: scrolling is the document's own. A `position: fixed` layer with its own
     overflow scrolls fine in Chrome, but Safari refuses the wheel on that setup. */
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
  /* Real A4 format (210 x 297 mm), input margins: what is seen on screen is what will come
     out of the printer or the PDF. */
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
  /* The global stylesheet centres all the application text: a legal notice aligned to the
     centre is unreadable. */
  text-align: left;
}

/* Print / PDF: same margins, without the screen decoration. */
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
