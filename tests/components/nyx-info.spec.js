// @vitest-environment jsdom
/**
 * `NYXInfo` — la page d'etat de l'installation.
 *
 * 615 lignes a 0 % : elle interroge huit index (modules, charge, noeuds, ActiveMQ, logstash,
 * elastalert, conteneurs, lambdas) et affiche des pastilles de couleur selon des seuils. Les tests
 * ci-dessous donnent les reponses et verifient ce qui est retenu et ce que les seuils decident.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const post = vi.fn()
vi.mock('axios', () => ({ default: { post: (...args) => post(...args), get: vi.fn() } }))

import { flushPromises } from '@vue/test-utils'

import { mountView, resetStore } from '../helpers/mount-view'

import NYXInfo from '@/components/NYXInfo.vue'

const mounted = []
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
})

/** Une reponse de `generic_search` avec les enregistrements demandes. */
const records = (rows) => Promise.resolve({ data: { error: '', records: rows } })

/** Repond selon l'index vise, pour les huit appels du chargement. */
function serve({ modules = [], loads = [], nodes = [], containers = [], lambdas = [] } = {}) {
  post.mockImplementation((url) => {
    if (url.includes('nyx_module_info')) return records(modules)
    if (url.includes('nyx_infra_load')) return records(loads)
    if (url.includes('nyx_infra_node')) return records(nodes)
    if (url.includes('nyx_containers')) return records(containers)
    if (url.includes('nyx_lambda')) return records(lambdas)
    return records([])
  })
}

describe('NYXInfo — chargement', () => {
  beforeEach(() => {
    resetStore()
    post.mockReset()
  })

  it('interroge les index de l\'installation avec le jeton', async () => {
    serve()
    const { wrapper } = await mountView(NYXInfo)
    mounted.push(wrapper)
    await wrapper.vm.$nextTick()

    const urls = post.mock.calls.map(([url]) => url)
    expect(urls.some((url) => url.includes('nyx_module_info-*'))).toBe(true)
    expect(urls.some((url) => url.includes('nyx_infra_load-*'))).toBe(true)
    expect(urls.every((url) => url.includes('token='))).toBe(true)
  })

  it('separe les modules ActiveMQ et WebSocketServer', async () => {
    serve({
      modules: [
        { _source: { module: 'ActiveMQ', status: 'ok' } },
        {
          _source: {
            module: 'WebSocketServer',
            status: 'ok',
            clients: [{ clients: 2, logins: ['alice', 'bob', 'alice'] }],
          },
        },
        { _source: { module: 'Autre', status: 'ok' } },
      ],
    })

    const { wrapper } = await mountView(NYXInfo)
    mounted.push(wrapper)
    await flushPromises()

    expect(wrapper.vm.data).toHaveLength(3)
    expect(wrapper.vm.activeMQ).toHaveLength(1)
    expect(wrapper.vm.WebSocketServer).toHaveLength(1)
    // les doublons de connexion ne comptent qu'une fois
    expect(wrapper.vm.webSocketLogins).toEqual(['alice', 'bob'])
    expect(wrapper.vm.webSocketClients.clients).toBe(2)
  })

  it('supporte un module WebSocket qui n\'a encore aucun client', async () => {
    serve({ modules: [{ _source: { module: 'WebSocketServer', status: 'ok' } }] })

    const { wrapper } = await mountView(NYXInfo)
    mounted.push(wrapper)
    await flushPromises()

    // sans garde, le rendu tombait ici : `clients[0]` sur un module qui vient de demarrer
    expect(wrapper.vm.webSocketClients).toEqual({ clients: 0, logins: [] })
    expect(wrapper.vm.webSocketLogins).toEqual([])
  })

  it('garde les listes vides quand le serveur ne rend rien', async () => {
    serve()
    const { wrapper } = await mountView(NYXInfo)
    mounted.push(wrapper)
    await flushPromises()

    expect(wrapper.vm.data).toEqual([])
    expect(wrapper.vm.activeMQ).toEqual([])
  })
})

describe('NYXInfo — seuils de couleur', () => {
  beforeEach(() => {
    resetStore()
    post.mockReset()
    serve()
  })

  it('passe du vert au jaune puis au rouge', async () => {
    const { wrapper } = await mountView(NYXInfo)
    mounted.push(wrapper)

    expect(wrapper.vm.compute_status(10, 50, 80)).toBe('success')
    expect(wrapper.vm.compute_status(50, 50, 80)).toBe('success')
    expect(wrapper.vm.compute_status(51, 50, 80)).toBe('warning')
    expect(wrapper.vm.compute_status(80, 50, 80)).toBe('warning')
    expect(wrapper.vm.compute_status(81, 50, 80)).toBe('exception')
  })
})

describe('NYXInfo — navigation', () => {
  beforeEach(() => {
    resetStore()
    post.mockReset()
    serve()
  })

  it('suit l\'application rendue par le serveur', async () => {
    const dispatch = vi.fn(() => Promise.resolve('rec-42'))
    resetStore()
    const { wrapper, store, router } = await mountView(NYXInfo)
    mounted.push(wrapper)
    store.dispatch = dispatch

    wrapper.vm.switch_to('apps/nyxinfo')
    await flushPromises()

    expect(dispatch).toHaveBeenCalledWith('switchToApp', 'apps/nyxinfo')
    expect(router.currentRoute.value.path).toBe('/main/rec-42')
  })
})
