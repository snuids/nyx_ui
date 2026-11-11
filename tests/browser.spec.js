// @vitest-environment jsdom
/**
 * `vue-browser-detect-plugin` has no Vue 3 version. Kibana.vue only read four flags,
 * recomputed here from `detect-browser`.
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
    // at least one flag must stay false, otherwise the table is overwritten
    const flags = ['isIE', 'isEdge', 'isChrome', 'isChromeIOS'].map((f) => browserDetect[f])
    expect(flags.some((v) => v === false)).toBe(true)
  })
})
