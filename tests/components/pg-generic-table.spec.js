// @vitest-environment jsdom
/**
 * `PGGenericTable` — the table of a PostgreSQL index.
 *
 * 812 lines at 0%: same contract as `GenericTable` (query, sorting, pagination, export) but a
 * different query, without the field cache. The tests freeze what the screen asks the server for and
 * what it does with the rows.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const post = vi.fn()
vi.mock('axios', () => ({ default: { post: (...args) => post(...args), get: vi.fn() } }))

import { flushPromises } from '@vue/test-utils'

import { mountView, resetStore } from '../helpers/mount-view'

import PGGenericTable from '@/components/PGGenericTable.vue'

const mounted = []
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
})

const CONFIG = {
  rec_id: 'app-pg',
  config: { index: 'nyx_pg_deliveries', timefield: null, headercolumns: [] },
  queryBarChecked: false,
  queryFilterChecked: false,
  graphicChecked: false,
}

async function mountTable(overrides = {}) {
  // `creds.hasPrivilege` is set on the store at login: the template reads it to display the write
  // actions.
  resetStore({ creds: { token: 'tok', hasPrivilege: () => true } })

  post.mockImplementation(() =>
    Promise.resolve({
      data: {
        error: '',
        records: [{ _source: { client: 'acme' } }],
        total: 1,
        took: 3,
        fields: [],
      },
    })
  )

  const result = await mountView(PGGenericTable, {
    props: {
      headers: [{ title: 'Client', field: 'client' }],
      data: [{ _source: { client: 'acme' } }],
      config: { ...CONFIG, ...overrides },
    },
    stubs: {
      BarChart: true,
      Map: true,
      QueryBar: true,
      PGGenericTableDetails: true,
    },
  })
  mounted.push(result.wrapper)
  await flushPromises()
  return result
}

describe('PGGenericTable — requête', () => {
  beforeEach(() => {
    resetStore()
    post.mockReset()
  })

  it('demande la première page de l\'index, avec le jeton', async () => {
    await mountTable()

    const [url, body] = post.mock.calls[0]
    // PostgreSQL tables go through `pg_search`, addressed by `rec_id` and not by index
    expect(url).toContain('pg_search/app-pg')
    expect(url).toContain('token=tok')
    expect(url).toContain('download=0')
    expect(body.size).toBe(100)
  })

  it('ajoute doc_type quand la configuration le demande', async () => {
    await mountTable({ config: { ...CONFIG.config, index: 'nyx_pg_x', doc_type: 'delivery' } })

    expect(post.mock.calls[0][0]).toContain('doc_type=delivery')
  })

  it('relance la requête quand la configuration change', async () => {
    const { wrapper } = await mountTable()
    const before = post.mock.calls.length

    await wrapper.setProps({ config: { ...CONFIG, rec_id: 'app-autre' } })
    await flushPromises()

    expect(post.mock.calls.length).toBeGreaterThan(before)
    expect(post.mock.calls[post.mock.calls.length - 1][0]).toContain('pg_search/app-autre')
  })
})

describe('PGGenericTable — tri et pagination', () => {
  beforeEach(() => {
    resetStore()
    post.mockReset()
  })

  it('retient la colonne et l\'ordre demandés, et recharge', async () => {
    const { wrapper } = await mountTable()

    wrapper.vm.sortChanged({ column: { property: 'client', order: 'descending' } })
    await flushPromises()

    expect(wrapper.vm.sort).toEqual({ column: 'client', order: 'descending' })
  })

  it('change la taille de page', async () => {
    const { wrapper } = await mountTable()

    wrapper.vm.handleSizeChange(50)
    await flushPromises()

    expect(wrapper.vm.pagesize).toBe(50)
    expect(post.mock.calls[post.mock.calls.length - 1][1].size).toBe(50)
  })

  it('recharge la page courante', async () => {
    const { wrapper } = await mountTable()
    const before = post.mock.calls.length

    wrapper.vm.handleCurrentChange()
    await flushPromises()

    expect(post.mock.calls.length).toBeGreaterThan(before)
  })
})

describe('PGGenericTable — export et lignes', () => {
  beforeEach(() => {
    resetStore()
    post.mockReset()
  })

  it('demande un export et ouvre le fichier rendu', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const { wrapper } = await mountTable()
    // the export must answer something other than a page load
    post.mockImplementation(() =>
      Promise.resolve({ data: { error: '', url: 'https://files/x.xlsx', type: 'file', total: 2 } })
    )

    wrapper.vm.handleCommand('xlsx')
    await flushPromises()

    const [url] = post.mock.calls[post.mock.calls.length - 1]
    expect(url).toContain('download=1')
    expect(url).toContain('output=xlsx')
    expect(open).toHaveBeenCalledWith('https://files/x.xlsx', '_blank')
    open.mockRestore()
  })

  it('tronque une valeur trop longue', async () => {
    const { wrapper } = await mountTable()
    const long = 'x'.repeat(80)

    expect(wrapper.vm.cutRec(long)).toHaveLength(53)
    expect(wrapper.vm.cutRec('court')).toBe('court')
    expect(wrapper.vm.cutRec(null)).toBeNull()
  })

  it('ouvre la fiche d\'une ligne', async () => {
    const { wrapper } = await mountTable()

    wrapper.vm.handleView(0, { _source: { client: 'acme' } })

    expect(wrapper.vm.dialogFormVisible).toBe(true)
    expect(wrapper.vm.editMode).toBe('edit')
    expect(wrapper.vm.currentRecord).toEqual({ _source: { client: 'acme' } })
  })
})
