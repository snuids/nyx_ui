// @vitest-environment jsdom
/**
 * GenericTable — la table generique, ecran de travail quotidien de la console.
 *
 * Ce qui compte ici n'est pas le rendu de `el-table` (Element Plus le teste pour nous) mais la
 * requete que ce composant fabrique : periode en epoch millis, `hiddenQuery` avec ses jetons,
 * filtre d'ecran combine a la recherche libre, tri, pagination, export. Une erreur dans cette
 * requete ne se voit pas — l'ecran affiche des lignes, seulement pas les bonnes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import GenericTable from '@/components/GenericTable.vue'
import { globalBus } from '@/utils/bus'
import { resetStore, mountView } from '../helpers/mount-view'

vi.mock('axios')

const RANGE = [new Date('2026-03-01T00:00:00Z'), new Date('2026-03-08T00:00:00Z')]

const config = (overrides = {}, payload = {}) => ({
  rec_id: 'rec-1',
  type: 'generic-table',
  timeSelectorType: 'classic',
  queryBarChecked: false,
  queryFilterChecked: false,
  mapChecked: false,
  graphicChecked: false,
  ...overrides,
  config: {
    index: 'nyx_demo',
    timefield: '@timestamp',
    headercolumns: [
      { title: 'Client', field: 'client', type: 'text' },
      { title: 'Date', field: 'date', type: 'date' },
    ],
    writeprivileges: 'write',
    ...payload,
  },
})

const record = (source) => ({ _id: 'id-1', _index: 'nyx_demo', _source: source })

const response = (overrides = {}) => ({
  status: 200,
  data: {
    records: [record({ client: 'acme', date: '2026-03-02 10:11:12' })],
    total: 1,
    took: 4,
    ...overrides,
  },
})

let notify
let logs

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  globalBus.all.clear()
  logs = vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  notify = vi.fn()
  resetStore({
    apiurl: 'api/v1/',
    timeRange: RANGE,
    autoTime: '20m',
    lastTimeRangeEvent: { type: 'absolute', subtype: 'classic', range: RANGE },
    searchCache: {},
    creds: {
      token: 'tok',
      user: { language: 'en', privileges: ['user'], id: 'u-1', login: 'alice' },
      hasPrivilege: () => true,
    },
  })
})

afterEach(() => {
  logs.mockRestore()
  vi.useRealTimers()
})

const stubs = {
  QueryBar: true,
  QueryFilter: true,
  Map: true,
  BarChart: true,
  GenericTableDetails: true,
}

async function mountTable(cfg) {
  const bar = await mountView(GenericTable, {
    at: '/main/rec-1',
    props: { config: cfg },
    stubs,
    mocks: { $notify: notify },
  })
  await flushPromises()
  return bar
}

const sentBody = (callIndex = 0) => axios.post.mock.calls[callIndex][1]

describe('GenericTable — requete envoyee', () => {
  it('interroge l\'index configure avec la periode du store, en epoch millis', async () => {
    axios.post.mockResolvedValue(response())

    await mountTable(config())

    const [url] = axios.post.mock.calls[0]
    expect(url).toContain('api/v1/generic_search/nyx_demo?token=tok')
    expect(url).toContain('&download=0')

    const body = sentBody()
    expect(body.size).toBe(100)
    expect(body.query.bool.must[0]).toEqual({ match_all: {} })
    expect(body.query.bool.must[1]).toEqual({
      range: {
        '@timestamp': { gte: RANGE[0].getTime(), lte: RANGE[1].getTime(), format: 'epoch_millis' },
      },
    })
    expect(body.extra).toEqual({ currentpage: 1, pagesize: 100 })
  })

  it('n\'interroge pas l\'API au montage quand une barre de recherche est affichee', async () => {
    axios.post.mockResolvedValue(response())

    await mountTable(config({ queryBarChecked: true }))

    // La barre emet `querychanged` a son propre montage : c'est elle qui declenche la recherche.
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('substitue {{login}} et {{id}} dans la requete cachee de la configuration', async () => {
    axios.post.mockResolvedValue(response())

    await mountTable(config({}, { hiddenQuery: 'owner:{{login}} AND tenant:{{id}}' }))

    const queryString = sentBody().query.bool.must.find((clause) => clause.query_string)
    expect(queryString).toEqual({
      query_string: {
        query: 'owner:alice AND tenant:u-1',
        analyze_wildcard: true,
        default_field: '*',
      },
    })
  })

  it('combine le filtre d\'ecran et la recherche libre avec AND', async () => {
    axios.post.mockResolvedValue(response())

    const { wrapper } = await mountTable(
      config({ queryBarChecked: true, queryFilterChecked: true }, { hiddenQuery: 'tenant:acme' })
    )

    wrapper.vm.queryBarChanged('facture')
    await flushPromises()
    wrapper.vm.queryFilterChanged('status:"open"')
    await flushPromises()

    const last = sentBody(axios.post.mock.calls.length - 1)
    const queryString = last.query.bool.must.find((clause) => clause.query_string)
    // Le filtre d'ecran est ajoute apres la requete cachee et la recherche libre, d'ou ce
    // groupement imbrique — sans consequence pour `query_string`, mais c'est la forme envoyee.
    expect(queryString.query_string.query).toBe('((tenant:acme) AND (facture)) AND (status:"open")')
  })

  it('envoie le tri demande par l\'utilisateur', async () => {
    axios.post.mockResolvedValue(response())
    const { wrapper } = await mountTable(config())

    wrapper.vm.sortChanged({ column: { property: '_source.client', order: 'ascending' } })
    await flushPromises()

    expect(sentBody(1).sort).toEqual([{ client: { order: 'asc' } }])
  })

  it('trie par defaut sur le champ configure quand l\'utilisateur n\'a rien demande', async () => {
    axios.post.mockResolvedValue(response())

    await mountTable(config({}, { orderField: 'created', orderDirection: 'desc' }))

    expect(sentBody().sort).toEqual([{ created: { order: 'desc' } }])
  })

  it('recharge avec la nouvelle taille de page et revient en page 1', async () => {
    axios.post.mockResolvedValue(response())
    const { wrapper } = await mountTable(config())

    wrapper.vm.currentPage = 3
    wrapper.vm.handleSizeChange(200)
    await flushPromises()

    expect(sentBody(1).size).toBe(200)
    expect(sentBody(1).extra).toEqual({ currentpage: 1, pagesize: 200 })
  })
})

describe('GenericTable — reponse', () => {
  it('remplit la table, le total et garde l\'enregistrement d\'origine', async () => {
    axios.post.mockResolvedValue(response())

    const { wrapper } = await mountTable(config())
    await flushPromises()

    expect(wrapper.vm.rows).toBe(1)
    expect(wrapper.vm.tableData).toHaveLength(1)
    // L'instantane garde la valeur brute : c'est lui qui permet de ne renvoyer que les champs
    // reellement modifies a l'enregistrement.
    expect(wrapper.vm.tableData[0].original._source).toEqual({
      client: 'acme',
      date: '2026-03-02 10:11:12',
    })
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
  })

  it('formate les colonnes de date avant affichage', async () => {
    axios.post.mockResolvedValue(response())

    const { wrapper } = await mountTable(config())
    await flushPromises()

    expect(wrapper.vm.tableData[0]._source.date).toBe('2026-03-02 10:11:12')
  })

  it('alimente le graphique avec les agregations de la reponse', async () => {
    axios.post.mockResolvedValue(
      response({ aggs: { 2: { buckets: [{ key: 1772442000000, doc_count: 7 }] } } })
    )

    const cfg = config({ graphicChecked: true })
    const { wrapper } = await mountTable(cfg)
    await flushPromises()

    expect(wrapper.vm.series).toEqual([{ name: 'Documents', data: [[1772442000000, 7]] }])
    // L'agregation suit le pas de temps calcule par le store.
    expect(sentBody().aggs['2'].date_histogram.interval).toBe('20m')
  })

  it('signale une erreur d\'API au lieu de laisser l\'ecran muet', async () => {
    axios.post.mockRejectedValue(new Error('boom'))

    const { wrapper } = await mountTable(config())
    await flushPromises()

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
    expect(wrapper.vm.tableData).toEqual([])
  })
})

describe('GenericTable — export et carte', () => {
  it('demande l\'export et ouvre le fichier prepare par l\'API', async () => {
    axios.post.mockResolvedValue({
      status: 200,
      data: { url: 'https://files.test/export.xlsx', total: 42, took: 12 },
    })
    const open = vi.spyOn(window, 'open').mockImplementation(() => {})

    const { wrapper } = await mountTable(config())
    wrapper.vm.downloadAsked('xlsx')
    await flushPromises()

    const [url] = axios.post.mock.calls[1]
    expect(url).toContain('&download=1')
    expect(url).toContain('&output=xlsx')
    expect(open).toHaveBeenCalledWith('https://files.test/export.xlsx', '_blank')
    open.mockRestore()
  })

  it('annonce un export envoye par mail sans ouvrir d\'onglet', async () => {
    axios.post.mockResolvedValue({ status: 200, data: { type: 'mail', total: 42, took: 12 } })
    const open = vi.spyOn(window, 'open').mockImplementation(() => {})

    const { wrapper } = await mountTable(config())
    wrapper.vm.downloadAsked('csv')
    await flushPromises()

    expect(open).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    open.mockRestore()
  })

  it('demande une seconde fois les points de la carte, avec lat/lon explicites', async () => {
    axios.post.mockResolvedValue(response())

    await mountTable(
      config({ mapChecked: true }, { maplatfield: 'lat', maplonfield: 'lon', mapfield: 'geo' })
    )
    await flushPromises()

    expect(axios.post).toHaveBeenCalledTimes(2)
    const mapBody = sentBody(1)
    expect(mapBody.size).toBe(1000)
    expect(mapBody._source).toEqual(['lat', 'lon'])
  })
})

describe('GenericTable — changement de periode', () => {
  it('recharge quand le bus annonce la periode de cet ecran', async () => {
    axios.post.mockResolvedValue(response())
    await mountTable(config())

    globalBus.$emit('timerangechanged', { subtype: 'classic', type: 'absolute' })
    await flushPromises()

    expect(axios.post).toHaveBeenCalledTimes(2)
  })

  it('ignore un changement de periode destine a un autre selecteur', async () => {
    axios.post.mockResolvedValue(response())
    await mountTable(config())

    globalBus.$emit('timerangechanged', { subtype: 'week', type: 'absolute' })
    await flushPromises()

    expect(axios.post).toHaveBeenCalledTimes(1)
  })
})
