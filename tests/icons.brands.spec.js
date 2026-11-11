// @vitest-environment jsdom
/**
 * `brands/docker` and `brands/canadian-maple-leaf` are stored as they are in the application
 * configuration. They only exist in the FontAwesome "brands" set: without `fab` they produce no
 * glyph — that is how the Docker icon disappeared from the left menu, and the maple leaf with it.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { resolveIcon } from '@/utils/iconMap'

library.add(fas, far, fab)

const d = library.definitions

describe('resolveIcon', () => {
  it('traduit brands/docker en fab', () => {
    expect(resolveIcon('brands/docker', d)).toEqual(['fab', 'docker'])
  })

  it('traduit brands/canadian-maple-leaf en fab', () => {
    expect(resolveIcon('brands/canadian-maple-leaf', d)).toEqual(['fab', 'canadian-maple-leaf'])
  })

  it('laisse les icones pleines et regulieres dans leur jeu', () => {
    expect(resolveIcon('cogs', d)).toEqual(['fas', 'cogs'])
    expect(resolveIcon('regular/envelope', d)).toEqual(['far', 'envelope'])
  })

  it('retombe sur un autre jeu quand le prefixe demande ne contient pas le nom', () => {
    expect(resolveIcon('solid/docker', d)).toEqual(['fab', 'docker'])
  })

  it('rend le nom demande quand il est introuvable partout', () => {
    expect(resolveIcon('solid/nexistepas', d)).toEqual(['fas', 'nexistepas'])
  })
})

describe('rendu', () => {
  const monter = (name) =>
    mount(
      {
        components: { FontAwesomeIcon },
        data: () => ({ icone: resolveIcon(name, d) }),
        template: '<span><font-awesome-icon :icon="icone" /></span>',
      }
    )

  it('produit un svg pour brands/docker', () => {
    expect(monter('brands/docker').find('svg').exists()).toBe(true)
  })

  it('produit un svg pour regular/envelope', () => {
    expect(monter('regular/envelope').find('svg').exists()).toBe(true)
  })
})
