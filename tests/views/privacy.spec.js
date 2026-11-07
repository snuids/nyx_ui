// @vitest-environment jsdom
/**
 * Ecran /privacy — la notice de protection des donnees.
 *
 * Page publique, donc joignable avant toute connexion et sans API : c'est justement l'endpoint qui
 * la remplit (`config.privacy`) qui peut ne pas repondre. Le test verifie les deux etats — texte
 * avec ses placeholders « a completer », puis texte rempli — parce que le contrat est que la notice
 * s'affiche dans tous les cas.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios from 'axios'

import Privacy from '@/views/Privacy.vue'
import { privacyNotice } from '@/content/privacy'
import { i18n } from '@/i18n-setup'
import { mountView } from '../helpers/mount-view'

vi.mock('axios')

const notice = privacyNotice('en')

beforeEach(() => {
  vi.clearAllMocks()
  document.body.className = ''
})

afterEach(() => {
  i18n.global.locale = 'en'
})

describe('Privacy.vue', () => {
  it('affiche le titre, la date et chaque section de la notice', async () => {
    axios.get.mockResolvedValue({ data: { error: '', privacy: {} } })

    const { wrapper } = await mountView(Privacy)

    expect(wrapper.find('h1').text()).toBe(notice.title)
    expect(wrapper.find('.privacy-updated').text()).toBe(notice.updated)
    expect(wrapper.findAll('.privacy-section')).toHaveLength(notice.sections.length)
    expect(wrapper.findAll('.privacy-section h2').map((n) => n.text())).toEqual(
      notice.sections.map((s) => s.h)
    )
  })

  it('garde les placeholders quand l\'API ne repond pas', async () => {
    // Le pire cas : la page doit rester lisible, pas vide.
    axios.get.mockRejectedValue(new Error('network down'))

    const { wrapper } = await mountView(Privacy)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain(notice.defaults.controller)
    expect(wrapper.text()).toContain(notice.defaults.contact)
  })

  it('remplit responsable, adresse et contact avec la configuration de l\'API', async () => {
    axios.get.mockResolvedValue({
      data: {
        error: '',
        privacy: {
          controller: 'ACME SA',
          address: '1 rue du Test, 1000 Bruxelles',
          contact: 'dpo@acme.test',
        },
      },
    })

    const { wrapper } = await mountView(Privacy)
    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('ACME SA')
    expect(text).toContain('1 rue du Test, 1000 Bruxelles')
    expect(text).toContain('dpo@acme.test')
    expect(text).not.toContain('{controller}')
  })

  it('interroge bien l\'endpoint config de l\'API configuree', async () => {
    axios.get.mockResolvedValue({ data: { error: '' } })

    const { wrapper } = await mountView(Privacy)
    await wrapper.vm.$nextTick()

    expect(axios.get).toHaveBeenCalledWith('api/v1/' + 'config', { timeout: 4000 })
  })

  it('suit la langue de l\'instance i18n', async () => {
    axios.get.mockResolvedValue({ data: { error: '' } })
    i18n.global.locale = 'fr'

    const { wrapper } = await mountView(Privacy, { locale: 'fr' })

    expect(wrapper.find('h1').text()).toBe(privacyNotice('fr').title)
  })

  it('pose la classe de page sur le body au montage et la retire au demontage', async () => {
    axios.get.mockResolvedValue({ data: { error: '' } })

    const { wrapper } = await mountView(Privacy)
    expect(document.body.classList.contains('nyx-privacy')).toBe(true)

    wrapper.unmount()
    expect(document.body.classList.contains('nyx-privacy')).toBe(false)
  })

  it('revient en arriere quand le navigateur a un historique', async () => {
    axios.get.mockResolvedValue({ data: { error: '' } })

    const { wrapper, router } = await mountView(Privacy)
    const back = vi.spyOn(router, 'back').mockImplementation(() => {})
    const push = vi.spyOn(router, 'push')
    Object.defineProperty(window.history, 'length', { configurable: true, value: 3 })

    await wrapper.find('.privacy-back').trigger('click')

    expect(back).toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('retombe sur l\'accueil quand il n\'y a pas d\'historique', async () => {
    axios.get.mockResolvedValue({ data: { error: '' } })

    const { wrapper, router } = await mountView(Privacy)
    const back = vi.spyOn(router, 'back').mockImplementation(() => {})
    const push = vi.spyOn(router, 'push')
    Object.defineProperty(window.history, 'length', { configurable: true, value: 1 })

    await wrapper.find('.privacy-back').trigger('click')

    expect(back).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/')
  })
})
