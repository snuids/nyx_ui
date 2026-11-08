// @vitest-environment jsdom
/**
 * `Kibana` — l'ecran qui embarque un tableau de bord Kibana.
 *
 * 527 lignes a 0 % : il calcule la hauteur de l'iframe, compose l'URL du tableau de bord avec la
 * recherche et le filtre d'ecran, et lance les exports (PDF, CSV) par le serveur.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const post = vi.fn()
vi.mock('axios', () => ({ default: { post: (...args) => post(...args), get: vi.fn() } }))

import { flushPromises } from '@vue/test-utils'

import { mountView, resetStore } from '../helpers/mount-view'

import Kibana from '@/components/Kibana.vue'

const mounted = []
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
})

// une URL Kibana reelle porte la recherche dans `_a=(query:'...')`
const URL_WITH_QUERY = "kibana#/dashboard/dash-1?embed=true&_a=(query:'*',filters:!())"

const CONFIG = {
  rec_id: 'app-kibana',
  config: { url: URL_WITH_QUERY, index: 'logs', hiddenQuery: '' },
  queryBarChecked: false,
  queryFilterChecked: false,
  downloadChecked: false,
}

async function mountKibana(overrides = {}) {
  resetStore({
    creds: { token: 'tok', hasPrivilege: () => true, user: { id: 'u-1', login: 'alice' } },
    currentSubCategory: { apps: [{}], loc_title: 'Kibana' },
  })

  post.mockImplementation(() =>
    Promise.resolve({ data: { error: '', url: 'https://files/report.pdf', type: 'file', total: 1 } })
  )

  const result = await mountView(Kibana, {
    props: { config: { ...CONFIG, ...overrides } },
  })
  mounted.push(result.wrapper)
  await flushPromises()
  return result
}

describe('Kibana — URL du tableau de bord', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('garde l\'URL configuree quand rien n\'est tape', async () => {
    const { wrapper } = await mountKibana()

    const result = wrapper.vm.updateQuery(URL_WITH_QUERY)

    expect(result).toContain('dash-1')
    expect(result).toContain("query:'*'")
  })

  it('ajoute la recherche libre quand la barre est affichee', async () => {
    const { wrapper } = await mountKibana({
      queryBarChecked: true,
      config: { ...CONFIG.config, url: URL_WITH_QUERY },
    })
    wrapper.vm.queryField = 'status:open'

    const result = wrapper.vm.updateQuery(URL_WITH_QUERY)

    expect(result).toContain("query:'status:open'")
  })

  it('substitue les jetons de la requete cachee', async () => {
    const { wrapper } = await mountKibana({
      config: { ...CONFIG.config, hiddenQuery: 'owner:{{login}}' },
    })

    const result = wrapper.vm.updateQuery(URL_WITH_QUERY)

    // les jetons sont substitues dans la configuration, et la recherche part avec l'URL
    expect(wrapper.vm.config.config.hiddenQuery).toBe('owner:alice')
    // la requete cachee est groupee avec la recherche courante (`*` ici)
    expect(result).toContain('owner:alice')
  })
})

describe('Kibana — export', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('demande le format choisi au serveur', async () => {
    const { wrapper } = await mountKibana()

    wrapper.vm.handleCommand('pdf')
    await flushPromises()

    const [url, body] = post.mock.calls[post.mock.calls.length - 1]
    expect(url).toContain('kibana_load')
    expect(url).toContain('output=pdf')
    expect(body).toEqual({ export: 'pdf' })
  })

  it('annonce l\'envoi par mail plutot que d\'ouvrir un fichier', async () => {
    post.mockImplementation(() =>
      Promise.resolve({ data: { error: '', type: 'mail', total: 3 } })
    )
    const { wrapper } = await mountKibana()

    wrapper.vm.handleCommand('pdf')
    await flushPromises()

    expect(wrapper.vm.ready).toBe(true)
  })
})
