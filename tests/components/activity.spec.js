// @vitest-environment jsdom
/**
 * Activity — the API activity dashboard (volumetry, errors, latencies).
 *
 * Two families of defects have already been reported there: counters unreadable in dark mode (inline
 * `#303133` colour) and a request path overflowing its bar. What is checked here is what the screen
 * computes, not how `el-table` renders:
 *
 * - the colours of the four counters (neutral = theme variable, errors = semantic green/red);
 * - `errorCount` / `activeUsers`: exact count from the aggregation, fallback on buckets capped at 10;
 * - `topEndpoints`: percentage relative to the maximum, latency rounded or `-`;
 * - `buildQuery`: period in epoch millis on the configured time field, `onlyErrors`, export.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import Activity from '@/components/Activity.vue'
import { resetStore, mountView } from '../helpers/mount-view'

vi.mock('axios')

const config = (payload = {}) => ({
  rec_id: 'rec-activity',
  type: 'internal',
  config: { index: 'nyx_apicalls-*', ...payload },
})

const mappings = {
  status: 200,
  data: {
    data: [
      {
        id: 'nyx_apicalls-2026.11.07',
        obj: {
          mappings: {
            properties: {
              url: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              error: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              user: { type: 'keyword' },
              method: { type: 'keyword' },
            },
          },
        },
      },
    ],
  },
}

const searchResponse = (payload = {}) => ({
  status: 200,
  data: {
    total: 120,
    took: 0.012,
    aggs: {
      by_url: { buckets: [
        { key: '/api/v1/calls', doc_count: 80, avg_ms: { value: 42.6 } },
        { key: '/api/v1/status', doc_count: 20, avg_ms: { value: null } },
      ] },
      by_error: { buckets: [{ key: '', doc_count: 100 }, { key: 'timeout', doc_count: 3 }] },
      by_user: { buckets: [{ key: 'alice', doc_count: 70 }, { key: 'bob', doc_count: 40 }] },
      by_method: { buckets: [{ key: 'GET', doc_count: 90 }] },
      errors_total: { doc_count: 3 },
      users_total: { value: 7 },
      latency: { values: { '50.0': 11.4, '95.0': 240.9, '99.0': 900.2 } },
    },
    records: [
      { _id: 'r1', _index: 'nyx_apicalls', _source: { user: 'alice', method: 'GET', url: '/api/v1/calls', timespan: 12, error: '' } },
    ],
    ...payload,
  },
})

/** The component calls the mapping endpoint first, then the search. */
function serveNetwork(search = searchResponse()) {
  axios.get.mockResolvedValue(mappings)
  axios.post.mockResolvedValue(search)
}

async function mountActivity(payload = {}) {
  const message = { error: vi.fn(), success: vi.fn() }
  const mounted = await mountView(Activity, {
    at: '/main/rec-activity',
    props: { config: config(payload) },
    stubs: { LogViewer: true },
    mocks: { $message: message, $notify: vi.fn() },
  })
  await flushPromises()
  return { ...mounted, message }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  resetStore({
    apiurl: 'api/v1/',
    creds: { token: 'tok', user: { language: 'en', privileges: ['user'], id: 'u-1', login: 'alice' } },
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Activity — compteurs', () => {
  it('peint le neutre avec la variable de theme et les erreurs en semantique', async () => {
    serveNetwork()
    const { wrapper } = await mountActivity()

    const kpis = wrapper.vm.kpis
    const byKey = Object.fromEntries(kpis.map((k) => [k.key, k]))
    // Inline colour: a stylesheet cannot override `#303133` on a dark background.
    expect(byKey.calls.color).toBe('var(--nyx-text, #303133)')
    expect(byKey.users.color).toBe('var(--nyx-text, #303133)')
    expect(byKey.latency.color).toBe('var(--nyx-text, #303133)')
    expect(byKey.errors.color).toBe('#f56c6c')

    wrapper.vm.aggs = { errors_total: { doc_count: 0 } }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.kpis.find((k) => k.key === 'errors').color).toBe('#67c23a')
  })

  it('affiche les quatre compteurs dans le DOM', async () => {
    serveNetwork()
    const { wrapper } = await mountActivity()

    expect(wrapper.findAll('.kpi-value').length).toBe(4)
    const values = wrapper.findAll('.kpi-value').map((n) => n.text())
    expect(values[0]).toBe('120')
    expect(values[1]).toBe('3')
    expect(values[2]).toBe('7')
    expect(values[3]).toBe('241 ms')
  })

  it('prend le compteur exact de l\'agregation, et se replie sur les buckets', async () => {
    serveNetwork()
    const { wrapper } = await mountActivity()

    // `errors_total` is authoritative (terms buckets are capped at 10)
    expect(wrapper.vm.errorCount).toBe(3)
    expect(wrapper.vm.activeUsers).toBe(7)

    // without the exact counters (older mapping), we sum / count the buckets
    wrapper.vm.aggs = {
      by_error: { buckets: [{ key: 'a', doc_count: 4 }, { key: 'b', doc_count: 2 }] },
      by_user: { buckets: [{ key: 'a', doc_count: 9 }, { key: 'b', doc_count: 1 }] },
    }
    expect(wrapper.vm.errorCount).toBe(6)
    expect(wrapper.vm.activeUsers).toBe(2)
  })

  it('calcule les parts du panneau « top endpoints »', async () => {
    serveNetwork()
    const { wrapper } = await mountActivity()

    const top = wrapper.vm.topEndpoints
    expect(top[0]).toMatchObject({ key: '/api/v1/calls', count: 80, pct: 100, avg: 43 })
    expect(top[1]).toMatchObject({ key: '/api/v1/status', count: 20, pct: 25, avg: '-' })
  })
})

describe('Activity — requete envoyee', () => {
  it('filtre sur la periode, en epoch millis, avec les champs keyword resolus', async () => {
    serveNetwork()
    await mountActivity()

    const [url, body] = axios.post.mock.calls[0]
    expect(url).toContain('generic_search/nyx_apicalls-*')
    expect(body.size).toBe(200)
    const range = body.query.bool.must[0].range['@timestamp']
    expect(range.format).toBe('epoch_millis')
    expect(range.lte - range.gte).toBe(24 * 3600 * 1000)
    // the mapping says `url: text + keyword` and `user: keyword`: the former takes `.keyword`
    expect(body.aggs.by_url.terms.field).toBe('url.keyword')
    expect(body.aggs.by_user.terms.field).toBe('user')
  })

  it('respecte le champ de temps configure', async () => {
    serveNetwork()
    await mountActivity({ timefield: 'timestamp' })

    const [, body] = axios.post.mock.calls[0]
    expect(body.query.bool.must[0].range).toHaveProperty('timestamp')
  })

  it('ajoute une exclusion quand on ne veut que les erreurs', async () => {
    serveNetwork()
    const { wrapper } = await mountActivity()
    wrapper.vm.filters.onlyErrors = true
    wrapper.vm.load()
    await flushPromises()

    const [, body] = axios.post.mock.lastCall
    expect(body.query.bool.must_not).toEqual([{ term: { 'error.keyword': '' } }])
  })

  it('pagine large et se passe d\'agregations pour un export', async () => {
    serveNetwork()
    const { wrapper } = await mountActivity()

    const query = wrapper.vm.buildQuery(true)
    expect(query.size).toBe(10000)
    expect(query.aggs).toBeUndefined()
  })

  it('mappe les documents en lignes lisibles', async () => {
    serveNetwork()
    const { wrapper } = await mountActivity()

    expect(wrapper.vm.records.length).toBe(1)
    expect(wrapper.vm.records[0]).toMatchObject({ user: 'alice', method: 'GET', url: '/api/v1/calls' })
  })

  it('affiche l\'erreur de l\'API au lieu d\'un tableau vide silencieux', async () => {
    serveNetwork({ status: 200, data: { error: 'index_not_found_exception' } })
    const { wrapper, message } = await mountActivity()

    expect(message.error).toHaveBeenCalledWith('index_not_found_exception')
    expect(wrapper.vm.records).toEqual([])
  })

  it('ne tire rien sans jeton', async () => {
    resetStore({ apiurl: 'api/v1/', creds: {} })
    await mountActivity()
    expect(axios.post).not.toHaveBeenCalled()
  })
})
