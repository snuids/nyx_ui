<template>
  <span class="nyx-icon" :class="{ 'nyx-icon--spin': spin }" :style="style">
    <font-awesome-icon :icon="icon" />
  </span>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { resolveIcon } from '@/utils/iconMap'

library.add(fas, far, fab)

/**
 * Replacement for `vue-awesome`, which has no Vue 3 release. The templates and the stored
 * configuration use three forms — `code`, `regular/file-word`, `brands/docker` — plus a `scale`
 * factor that vue-awesome applied to the glyph size; FontAwesome has no equivalent prop, so it is
 * applied as a font size.
 *
 * The brands set matters: `docker` and `canadian-maple-leaf` only exist there, so without `fab`
 * they render nothing at all — which is how the Docker icon disappeared from the left menu.
 *
 * The glyph is wrapped in a <span> on purpose. Vue merges the parent's `style` onto the component's
 * root element, and the call sites pass `style="height:60px"`: with the <svg> as root, that
 * *stretched the glyph itself* (60 px icons in the module cards, 30 % bigger than before). With the
 * wrapper, the height sizes the box and the glyph keeps `scale × 1em`, centred inside it.
 */
export default {
  name: 'VIcon',
  components: { FontAwesomeIcon },
  props: {
    name: { type: String, required: true },
    scale: { type: [String, Number], default: 1 },
    // vue-awesome prenait une prop `color`. Sans elle, la couleur passee par les appelants
    // (`<v-icon :color="...">` dans les colonnes « format: icon ») etait perdue et les icones
    // sortaient en noir la ou la version precedente les affichait en vert.
    color: { type: String, default: '' },
    /**
     * `vue-awesome` tournait l'icone avec une prop `spin` ; FontAwesome n'a pas d'equivalent en
     * props, et son animation vit dans sa feuille de style, que ce projet ne charge pas. Sans cette
     * prop, `<v-icon name="spinner" spin>` rendait un glyphe fixe : l'etat « Waiting » du tableau
     * des rapports affichait un rond immobile au lieu d'un rond qui tourne.
     */
    spin: { type: Boolean, default: false },
  },
  computed: {
    icon() {
      return resolveIcon(this.name, library.definitions)
    },
    style() {
      const style = { fontSize: (Number(this.scale) || 1) + 'em' }
      if (this.color) style.color = this.color
      return style
    },
  },
}
</script>

<style>
@keyframes nyx-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

.nyx-icon--spin svg {
  animation: nyx-icon-spin 1s linear infinite;
}

.nyx-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: -0.125em;
}

/* La hauteur vient de `font-size` (scale x 1em), posee sur le conteneur. On ne fixe PAS la largeur :
   FontAwesome la deduit du viewBox, et les icones larges (640 de large, comme « cogs ») sont plus
   larges que hautes. Les forcer a 1em les rapetissait. */
.nyx-icon svg {
  height: 1em;
  overflow: visible;
}
</style>
