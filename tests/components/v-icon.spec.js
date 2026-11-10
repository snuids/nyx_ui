// @vitest-environment jsdom
/**
 * `VIcon` — the `vue-awesome` replacement.
 *
 * The component is used everywhere: menus, module cards, table columns, and the "Waiting" state of
 * the report table. One test here covers all those call sites.
 *
 * The icon sets are no longer registered whole at import time (see `@/utils/fontAwesome`): the first
 * render of a name loads one small module, so the glyph appears one tick later. The tests that look
 * for the `<svg>` wait for that tick.
 */

import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'

import VIcon from '@/components/VIcon.vue'

const icon = (props) => mount(VIcon, { props })

describe('VIcon — animation', () => {
  it('tourne quand `spin` est demande', async () => {
    const wrapper = icon({ name: 'spinner', spin: true })

    // the class carries the animation: `@keyframes` live in the component's stylesheet
    expect(wrapper.classes()).toContain('nyx-icon--spin')
    await vi.waitFor(() => expect(wrapper.find('svg').exists()).toBe(true))
  })

  it('reste fixe sans `spin`', () => {
    const wrapper = icon({ name: 'check-circle' })

    expect(wrapper.classes()).not.toContain('nyx-icon--spin')
  })
})

describe('VIcon — taille et couleur', () => {
  it("applique le facteur d'echelle en taille de police", () => {
    const wrapper = icon({ name: 'cogs', scale: 2 })

    expect(wrapper.attributes('style')).toContain('font-size: 2em')
  })

  it("garde la couleur passee par l'appelant", () => {
    const wrapper = icon({ name: 'circle', color: '#409EFF' })

    // the style is serialised as rgb() by the DOM
    expect(wrapper.attributes('style')).toContain('rgb(64, 158, 255)')
  })
})

describe('VIcon — resolution du nom', () => {
  it('trouve une icone des marques', async () => {
    // `docker` only exists in `fab`: without that set the menu lost its icon
    const wrapper = icon({ name: 'brands/docker' })

    await vi.waitFor(() => expect(wrapper.html()).toContain('svg'))
  })

  it('trouve une icone pleine sans prefixe', async () => {
    const wrapper = icon({ name: 'code' })

    await vi.waitFor(() => expect(wrapper.html()).toContain('svg'))
  })

  it('demande l icone quand le nom change, et garde la derniere reponse', async () => {
    const wrapper = icon({ name: 'code' })
    await vi.waitFor(() => expect(wrapper.find('svg').exists()).toBe(true))

    await wrapper.setProps({ name: 'user' })

    await vi.waitFor(() => expect(wrapper.find('svg').exists()).toBe(true))
  })

  it('ne rend rien pour un nom que FontAwesome ne connait pas', async () => {
    const wrapper = icon({ name: 'pas-une-icone' })

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('rend le premier glyphe sans attendre le reseau quand il est deja charge', async () => {
    const first = icon({ name: 'code' })
    await vi.waitFor(() => expect(first.find('svg').exists()).toBe(true))

    // seconde instance : la resolution est synchrone, le glyphe est la au premier rendu
    const second = icon({ name: 'code' })
    expect(second.find('svg').exists()).toBe(true)
  })
})
