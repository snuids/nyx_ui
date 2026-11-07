// @vitest-environment jsdom
/**
 * QueryBar — le champ de recherche des ecrans generiques.
 *
 * Petit composant, mais c'est lui qui decide *quand* la console interroge Elasticsearch : une
 * recherche par frappe (au lieu du debounce de 1,5 s) ou un cache de recherche non ecrit, et
 * l'ecran affiche des resultats qui ne correspondent plus a ce qui est tape.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import QueryBar from '@/components/QueryBar.vue'
import { resetStore, mountView } from '../helpers/mount-view'
import store from '@/store/store.js'

const config = (overrides = {}) => ({ rec_id: 'rec-1', type: 'generic-table', ...overrides })

let logs

beforeEach(() => {
  vi.useFakeTimers()
  resetStore({ searchCache: {} })
  logs = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  logs.mockRestore()
  vi.useRealTimers()
})

const mountBar = (opts = {}) =>
  mountView(QueryBar, { at: '/main/rec-1', props: { config: config() }, ...opts })

describe('QueryBar', () => {
  it('annonce la recherche courante des l\'affichage', async () => {
    const { wrapper } = await mountBar()

    expect(wrapper.emitted('querychanged')).toEqual([['']])
    expect(wrapper.vm.blockEvent).toBe(true)
  })

  it('reprend la derniere recherche de l\'application depuis le cache', async () => {
    resetStore({ searchCache: { 'rec-1': 'status:open' } })

    const { wrapper } = await mountBar()

    expect(wrapper.vm.query).toBe('status:open')
    expect(wrapper.emitted('querychanged')[0]).toEqual(['status:open'])
  })

  it('relance la recherche a la validation et retient la saisie', async () => {
    const { wrapper } = await mountBar()

    wrapper.vm.query = 'type:invoice'
    await wrapper.vm.$nextTick()
    await wrapper.find('.query-input input').trigger('change')

    expect(wrapper.emitted('querychanged').pop()).toEqual(['type:invoice'])
    expect(store.getters.searchCache['rec-1']).toBe('type:invoice')
  })

  it('bloque la recherche automatique pendant 1,5 s apres un rafraichissement manuel', async () => {
    const { wrapper } = await mountBar()
    await vi.advanceTimersByTimeAsync(1800) // le blocage du demarrage est retombe
    expect(wrapper.vm.blockEvent).toBe(false)

    wrapper.vm.refresh()
    expect(wrapper.vm.blockEvent).toBe(true)

    await vi.advanceTimersByTimeAsync(1500)
    expect(wrapper.vm.blockEvent).toBe(false)
  })

  it('ignore la recherche automatique tant que le blocage est pose', async () => {
    const { wrapper } = await mountBar()
    await vi.advanceTimersByTimeAsync(1800)
    const emitted = wrapper.emitted('querychanged').length

    wrapper.vm.blockEvent = true
    wrapper.vm.query = 'pendant le blocage'
    await wrapper.vm.$nextTick()
    await vi.advanceTimersByTimeAsync(1600) // le debounce tire, le blocage le fait sortir

    expect(wrapper.emitted('querychanged').length).toBe(emitted)
  })

  it('cherche automatiquement apres le delai, une fois le blocage leve', async () => {
    const { wrapper } = await mountBar()
    await vi.advanceTimersByTimeAsync(1800)

    wrapper.vm.query = 'client:acme'
    await wrapper.vm.$nextTick()
    await vi.advanceTimersByTimeAsync(1600)

    expect(wrapper.emitted('querychanged').pop()).toEqual(['client:acme'])
    expect(wrapper.vm.oldQuery).toBe('client:acme')
  })

  it('ne reinterroge pas quand la saisie n\'a pas change', async () => {
    const { wrapper } = await mountBar()
    await vi.advanceTimersByTimeAsync(1800)
    wrapper.vm.oldQuery = 'client:acme'
    const emitted = wrapper.emitted('querychanged').length

    wrapper.vm.query = 'client:acme'
    await wrapper.vm.$nextTick()
    await vi.advanceTimersByTimeAsync(1600)

    expect(wrapper.emitted('querychanged').length).toBe(emitted)
  })

  it('demande le telechargement dans le format choisi', async () => {
    const { wrapper } = await mountBar({ props: { config: config({ downloadChecked: true }) } })

    wrapper.vm.downloadSelection('xlsx')
    wrapper.vm.downloadSelection('csv')

    expect(wrapper.emitted('downloadasked')).toEqual([['xlsx'], ['csv']])
  })

  it('n\'offre le telechargement que si l\'application le permet', async () => {
    const withoutDownload = await mountBar()
    expect(withoutDownload.wrapper.find('.search-dl-bt').exists()).toBe(false)

    const withDownload = await mountBar({ props: { config: config({ downloadChecked: true }) } })
    expect(withDownload.wrapper.find('.search-dl-bt').exists()).toBe(true)
  })

  it('masque le bouton de rafraichissement sur un ecran Kibana', async () => {
    const { wrapper } = await mountBar({ props: { config: config({ type: 'kibana' }) } })

    expect(wrapper.find('.refresh-button').exists()).toBe(false)
  })
})
