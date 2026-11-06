<template>
  <font-awesome-icon :icon="icon" :style="style" />
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
      return { fontSize: (Number(this.scale) || 1) + 'em', verticalAlign: '-0.125em' }
    },
  },
}
</script>
