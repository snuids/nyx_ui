<template>
  <span class="nyx-icon" :style="style">
    <font-awesome-icon :icon="icon" />
  </span>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(fas, far)

/**
 * Replacement for `vue-awesome`, which has no Vue 3 release. The templates use two forms —
 * `name="code"` and `name="regular/file-word"` — plus a `scale` factor that vue-awesome applied to
 * the glyph size; FontAwesome has no equivalent prop, so it is applied as a font size.
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
  },
  computed: {
    icon() {
      const parts = String(this.name).split('/')
      const prefix = parts.length > 1 ? parts[0] : 'solid'
      const name = parts.length > 1 ? parts[1] : parts[0]
      return [prefix === 'regular' ? 'far' : 'fas', name]
    },
    style() {
      return { fontSize: (Number(this.scale) || 1) + 'em' }
    },
  },
}
</script>

<style>
.nyx-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: -0.125em;
}

/* La taille vient de `font-size`, posee sur le conteneur : le SVG suit 1em et ne se deforme pas. */
.nyx-icon svg {
  width: 1em;
  height: 1em;
}
</style>
