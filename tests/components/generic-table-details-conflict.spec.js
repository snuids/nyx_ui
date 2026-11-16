// @vitest-environment jsdom
/**
 * `GenericTableDetails` — saving a record that somebody else saved first.
 *
 * The editor used to `commit("updateRecord")` and close on a success notification it had not
 * earned: the mutation swallowed every error, so a write the API refused was announced as saved.
 * The route now refuses a stale write with a 409 and hands back the document that won; the dialog
 * must stay open, say which fields changed meanwhile, and let the operator reload or overwrite.
 *
 * The version travels as `If-Match: "<seq_no>-<primary_term>"`. A row read before this change has
 * neither number, and must keep posting unasserted — that is the contract the workers and the
 * integrations rely on, and it is pinned here too.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

const post = vi.fn()
vi.mock('axios', () => ({ default: { post: (...args) => post(...args), get: vi.fn() } }))

import GenericTableDetails from '@/components/GenericTableDetails.vue'
import { versionTag } from '@/store/store.js'
import { resetStore, mountView } from '../helpers/mount-view'

const URL = 'https://api.test/api/v1/generic/airport_alert-2026.11/1?token=tok'

function row(overrides = {}) {
  return {
    _id: '1',
    _index: 'airport_alert-2026.11',
    _seq_no: 3,
    _primary_term: 1,
    _source: { site: 'A', flights: 2 },
    ...overrides,
  }
}

async function mountDetails(record = row()) {
  resetStore({
    apiurl: 'https://api.test/api/v1/',
    creds: { token: 'tok', hasPrivilege: () => true },
  })
  const notify = vi.fn()
  const { wrapper } = await mountView(GenericTableDetails, {
    at: '/main/rec-table',
    attachTo: document.body,
    props: { record, config: { config: { writeprivileges: ['YUL'] } } },
    mocks: { $notify: notify },
    // the YAML tabs are the record's raw text, not the subject here
    stubs: { editor: true },
  })
  await flushPromises()
  return { wrapper, notify }
}

/** The 409 body the route answers: the document that won, with its version. */
function conflict(overrides = {}) {
  const stored = row({ _seq_no: 7, _source: { site: 'B', flights: 2 }, ...overrides })
  return { response: { status: 409, data: { error: 'conflict', data: stored } } }
}

beforeEach(() => {
  post.mockReset()
  document.body.innerHTML = ''
})

describe('GenericTableDetails — the version a save asserts', () => {
  it('envoie la version lue en If-Match', async () => {
    post.mockResolvedValue({ data: { error: '', seq_no: 4, primary_term: 1 } })
    const { wrapper } = await mountDetails()

    await wrapper.vm.saveRecord()
    await flushPromises()

    expect(post.mock.calls[0][0]).toBe(URL)
    expect(post.mock.calls[0][1]).toEqual({ site: 'A', flights: 2 })
    expect(post.mock.calls[0][2]).toEqual({ headers: { 'If-Match': '"3-1"' } })
  })

  it('poste sans version quand la ligne n en porte pas', async () => {
    // a row read before the API served the numbers: last-write-wins, as before
    const { wrapper } = await mountDetails(row({ _seq_no: undefined, _primary_term: undefined }))
    post.mockResolvedValue({ data: { error: '' } })

    await wrapper.vm.saveRecord()
    await flushPromises()

    expect(post.mock.calls[0][2]).toBeUndefined()
    expect(versionTag({ _id: '1' })).toBeNull()
  })

  it('annonce l enregistrement quand il a eu lieu', async () => {
    post.mockResolvedValue({ data: { error: '', seq_no: 4, primary_term: 1 } })
    const { wrapper, notify } = await mountDetails()

    await wrapper.vm.saveRecord()
    await flushPromises()

    expect(wrapper.emitted('dialogcloseupdated')).toBeTruthy()
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
  })
})

describe('GenericTableDetails — un enregistrement refuse', () => {
  it('garde le dialogue ouvert et affiche le conflit', async () => {
    post.mockRejectedValue(conflict())
    const { wrapper, notify } = await mountDetails()

    await wrapper.vm.saveRecord()
    await flushPromises()

    expect(wrapper.emitted('dialogcloseupdated')).toBeFalsy()
    expect(notify).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    expect(wrapper.vm.conflict).not.toBeNull()
    expect(wrapper.find('.table-conflict').exists()).toBe(true)
  })

  it('nomme les champs modifies entre-temps', async () => {
    post.mockRejectedValue(conflict())
    const { wrapper } = await mountDetails()

    await wrapper.vm.saveRecord()
    await flushPromises()

    // `site` changed from A to B, `flights` did not
    expect(wrapper.vm.conflict.keys).toEqual(['site'])
  })

  it('recharge la version stockee, avec sa version', async () => {
    post.mockRejectedValue(conflict())
    const { wrapper } = await mountDetails()

    await wrapper.vm.saveRecord()
    await flushPromises()
    wrapper.vm.reloadConflict()
    await flushPromises()

    expect(wrapper.vm.conflict).toBeNull()
    expect(wrapper.vm.newRec._source.site).toBe('B')
    expect(versionTag(wrapper.vm.newRec)).toBe('"7-1"')
  })

  it('ecrase sciemment, sans version, quand l operateur le demande', async () => {
    post.mockRejectedValueOnce(conflict())
    post.mockResolvedValueOnce({ data: { error: '', seq_no: 8, primary_term: 1 } })
    const { wrapper } = await mountDetails()

    await wrapper.vm.saveRecord()
    await flushPromises()
    await wrapper.vm.forceSave()
    await flushPromises()

    expect(post.mock.calls).toHaveLength(2)
    expect(post.mock.calls[1][2]).toBeUndefined()
    expect(wrapper.emitted('dialogcloseupdated')).toBeTruthy()
  })

  it('signale une panne autrement qu un conflit', async () => {
    post.mockRejectedValue({ response: { status: 500, data: { error: 'unable to post data' } } })
    const { wrapper, notify } = await mountDetails()

    await wrapper.vm.saveRecord()
    await flushPromises()

    expect(wrapper.vm.conflict).toBeNull()
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', message: 'unable to post data' })
    )
  })
})
