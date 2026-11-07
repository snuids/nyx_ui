// @vitest-environment jsdom
/**
 * `vue-browser-detect-plugin` n'a pas de version Vue 3. Kibana.vue ne lisait que quatre drapeaux,
 * recalcules ici depuis `detect-browser`.
 */
import { describe, it, expect } from 'vitest'
import { browserDetect } from '@/utils/browser'

describe('browserDetect', () => {
  it('expose les quatre drapeaux que lit Kibana.vue', () => {
    for (const flag of ['isIE', 'isEdge', 'isChrome', 'isChromeIOS']) {
      expect(typeof browserDetect[flag]).toBe('boolean')
    }
  })

  it('expose les metadonnees du navigateur', () => {
    expect(browserDetect.meta).toBeTypeOf('object')
    expect(browserDetect.name).toBe(browserDetect.meta.name)
  })

  it('ne confond pas un navigateur avec les autres', () => {
    // au moins un drapeau doit rester faux, sinon la table est ecrasee
    const flags = ['isIE', 'isEdge', 'isChrome', 'isChromeIOS'].map((f) => browserDetect[f])
    expect(flags.some((v) => v === false)).toBe(true)
  })
})
