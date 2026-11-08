// @vitest-environment jsdom
/**
 * `VIcon` — le remplacant de `vue-awesome`.
 *
 * Le composant est utilise partout : menus, cartes de modules, colonnes de tableaux, et l'etat
 * « Waiting » du tableau des rapports. Un test ici vaut pour tous ces appels.
 */

import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'

import VIcon from '@/components/VIcon.vue'

const icon = (props) => mount(VIcon, { props })

describe('VIcon — animation', () => {
  it('tourne quand `spin` est demande', () => {
    const wrapper = icon({ name: 'spinner', spin: true })

    // la classe porte l'animation : `@keyframes` dans la feuille du composant
    expect(wrapper.classes()).toContain('nyx-icon--spin')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('reste fixe sans `spin`', () => {
    const wrapper = icon({ name: 'check-circle' })

    expect(wrapper.classes()).not.toContain('nyx-icon--spin')
  })
})

describe('VIcon — taille et couleur', () => {
  it('applique le facteur d\'echelle en taille de police', () => {
    const wrapper = icon({ name: 'cogs', scale: 2 })

    expect(wrapper.attributes('style')).toContain('font-size: 2em')
  })

  it('garde la couleur passee par l\'appelant', () => {
    const wrapper = icon({ name: 'circle', color: '#409EFF' })

    // le style est serialise en rgb() par le DOM
    expect(wrapper.attributes('style')).toContain('rgb(64, 158, 255)')
  })
})

describe('VIcon — resolution du nom', () => {
  it('trouve une icone des marques', () => {
    // `docker` n'existe que dans `fab` : sans ce jeu, le menu perdait son icone
    const wrapper = icon({ name: 'brands/docker' })

    expect(wrapper.html()).toContain('svg')
  })

  it('trouve une icone pleine sans prefixe', () => {
    const wrapper = icon({ name: 'code' })

    expect(wrapper.html()).toContain('svg')
  })
})
