/**
 * ACE editors and the theme.
 *
 * `vue3-ace-editor` reads its `theme` prop **once**, in its own `mounted`, and `ace.edit` falls
 * silently back to `ace-tm` (white) when the requested theme module is not loaded yet — which is
 * what happened with `theme="chrome"` written in five files. Loading the themes from the `@init`
 * handler comes too late for the first paint, and the prop alone therefore changed nothing.
 *
 * So the mixin does two things: it keeps a `aceTheme` prop in step for the reactive path, and it
 * syncs the mounted editors from the DOM (`ace.edit` leaves `el.env.editor` on the container),
 * once after mount and again on every `nyx:theme`. `ace-builds` themes are side-effect modules: the
 * `require`s below are what make `ace/theme/tomorrow_night` resolvable at all.
 *
 * Usage: `mixins: [aceThemeMixin]` and `:theme="aceTheme"` on the `<editor>`.
 */

import { currentTheme } from "@/utils/theme";

export const ACE_THEME_LIGHT = "chrome";
export const ACE_THEME_DARK = "tomorrow_night";

/** The ACE theme for a resolved console theme. */
export function aceThemeFor(theme) {
  return theme === "dark" ? ACE_THEME_DARK : ACE_THEME_LIGHT;
}

export default {
  data: () => ({
    aceTheme: aceThemeFor(currentTheme())
  }),
  mounted: function() {
    // Le theme est deja applique au montage ; seul un changement ensuite demande un nouveau rendu.
    this.aceThemeHandler = () => {
      this.aceTheme = aceThemeFor(currentTheme());
      this.syncAceEditors();
    };
    document.addEventListener("nyx:theme", this.aceThemeHandler);
    this.$nextTick(() => this.syncAceEditors());
  },
  beforeUnmount: function() {
    document.removeEventListener("nyx:theme", this.aceThemeHandler);
  },
  methods: {
    /** ACE loads a theme by side effect: without this the dark theme resolves to a missing module. */
    registerAceThemes: function() {
      require("ace-builds/src-noconflict/theme-chrome");
      require("ace-builds/src-noconflict/theme-tomorrow_night");
    },
    /**
     * Re-apply the theme on the editors already mounted. `ace.edit(el)` stores the instance on
     * `el.env.editor`; going through the DOM reaches the editor the prop could not re-theme.
     */
    syncAceEditors: function() {
      try {
        this.registerAceThemes();
      } catch (e) {
        /* module already loaded, or require unavailable: the prop path still applies */
      }
      const theme = "ace/theme/" + aceThemeFor(currentTheme());
      const editors = document.querySelectorAll(".ace_editor");
      Array.prototype.forEach.call(editors, (node) => {
        const editor = node.env && node.env.editor;
        if (editor && typeof editor.setTheme === "function") {
          if (editor.getTheme && editor.getTheme() === theme) return;
          editor.setTheme(theme);
        }
      });
    }
  }
};
