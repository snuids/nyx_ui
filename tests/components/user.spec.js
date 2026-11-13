// @vitest-environment jsdom
/**
 * User — the list of accounts, an administration screen.
 *
 * A small screen with heavy consequences: this is where an account is created, opened to change its
 * privileges and deleted. The test checks the list call, opening the dialog, creating an account
 * *without a shared password*, and the confirmed deletion.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import User from '@/components/User.vue'
import { resetStore, mountView } from '../helpers/mount-view'
import store from '@/store/store.js'

vi.mock('axios')

const userRecord = (id, source) => ({
  _id: id,
  _index: 'nyx_user',
  _source: { login: id, firstname: 'Ada', lastname: 'Lovelace', privileges: ['user'], ...source },
})

let notify
let confirm
let logs

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  logs = vi.spyOn(console, 'log').mockImplementation(() => {})
  notify = vi.fn()
  confirm = vi.fn()
  // `deleteRecord` (store) calls `axios.delete(...).catch(...)`: a mock returning `undefined` makes
  // the mutation fail and the screen shows "cancelled" although the deletion did happen.
  axios.delete.mockResolvedValue({ data: { error: '' } })
  resetStore({
    apiurl: 'api/v1/',
    creds: { token: 'tok', user: { language: 'en', privileges: ['admin'] }, hasPrivilege: () => true },
  })
})

afterEach(() => {
  logs.mockRestore()
  vi.useRealTimers()
})

const mountUsers = async () => {
  const bar = await mountView(User, {
    at: '/main/rec-1',
    stubs: { UserDetails: { name: 'UserDetails', template: '<div class="details-stub" />', props: ['record'] } },
    mocks: { $notify: notify, $confirm: confirm },
  })
  await flushPromises()
  return bar
}

describe('User', () => {
  it('charge la liste des comptes au montage', async () => {
    axios.post.mockResolvedValue({ data: { error: '', records: [userRecord('alice', {})] } })

    const { wrapper } = await mountUsers()

    expect(axios.post).toHaveBeenCalledWith('api/v1/generic_search/nyx_user*?token=tok', { size: 1000 })
    expect(wrapper.vm.tableData).toHaveLength(1)
  })

  it('affiche les comptes renvoyes par l\'API', async () => {
    axios.post.mockResolvedValue({
      data: { error: '', records: [userRecord('alice', {}), userRecord('bob', {})] },
    })

    const { wrapper } = await mountUsers()
    await flushPromises()

    const rows = wrapper.findAll('.el-table__row')
    expect(rows).toHaveLength(2)
    expect(wrapper.text()).toContain('Ada')
    expect(wrapper.text()).toContain('Lovelace')
  })

  it('ouvre le dialogue d\'edition sur le compte clique', async () => {
    axios.post.mockResolvedValue({ data: { error: '', records: [userRecord('alice', {})] } })

    const { wrapper } = await mountUsers()
    const row = wrapper.vm.tableData[0]
    wrapper.vm.handleView(0, row)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.dialogFormVisible).toBe(true)
    expect(wrapper.find('.details-stub').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'UserDetails' }).props('record')).toEqual(row)
  })

  it('cree un compte vierge sans mot de passe', async () => {
    axios.post.mockResolvedValue({ data: { error: '', records: [] } })

    const { wrapper } = await mountUsers()
    wrapper.vm.handleAddUser()
    await wrapper.vm.$nextTick()

    const created = wrapper.vm.currentRecord
    expect(created.isadd).toBe(true)
    expect(created._index).toBe('nyx_user')
    // No password is sent: the API generates one that nobody knows and marks the account
    // `mustResetPassword`. A shared hash gave every account the same secret.
    expect(created._source.password).toBeUndefined()
    expect(created._source.mustResetPassword).toBeUndefined()
    expect(wrapper.vm.dialogFormVisible).toBe(true)
  })

  it('supprime le compte apres confirmation et recharge la liste', async () => {
    axios.post.mockResolvedValue({ data: { error: '', records: [userRecord('alice', {})] } })
    confirm.mockResolvedValue('confirm')
    const commit = vi.spyOn(store, 'commit')

    const { wrapper } = await mountUsers()
    wrapper.vm.handleDelete(0, wrapper.vm.tableData[0])
    await flushPromises()

    const deletion = commit.mock.calls.find(([payload]) => payload && payload.type === 'deleteRecord')
    expect(deletion).toBeDefined()
    expect(deletion[0].data._id).toBe('alice')
    expect(axios.delete).toHaveBeenCalledWith('api/v1/generic/nyx_user/alice?token=tok')
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))

    await vi.advanceTimersByTimeAsync(1100)
    expect(axios.post).toHaveBeenCalledTimes(2)
  })

  it('ne supprime rien quand la confirmation est annulee', async () => {
    axios.post.mockResolvedValue({ data: { error: '', records: [userRecord('alice', {})] } })
    confirm.mockRejectedValue('cancel')
    const commit = vi.spyOn(store, 'commit')

    const { wrapper } = await mountUsers()
    wrapper.vm.handleDelete(0, wrapper.vm.tableData[0])
    await flushPromises()

    expect(commit).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'deleteRecord' }))
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }))
  })

  it('ne montre que les comptes inactifs quand la case est cochee', async () => {
    axios.post.mockResolvedValue({
      data: {
        error: '',
        records: [
          userRecord('alice', { firstname: 'Ada', lastname: 'Lovelace' }),
          userRecord('stub', { firstname: 'WM8233_equans', lastname: '', inactive: true }),
        ],
      },
    })

    const { wrapper } = await mountUsers()
    expect(wrapper.findAll('.el-table__row')).toHaveLength(2)

    wrapper.vm.onlyInactive = true
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.el-table__row')).toHaveLength(1)
    expect(wrapper.text()).toContain('WM8233_equans')
    expect(wrapper.text()).not.toContain('Lovelace')
  })

  it('affiche le nombre de comptes inactifs, meme a zero', async () => {
    axios.post.mockResolvedValue({
      data: { error: '', records: [userRecord('alice')] },
    })

    const { wrapper } = await mountUsers()

    expect(wrapper.vm.inactiveCount).toBe(0)
    expect(wrapper.find('.inactive-filter').text()).toContain('(0)')
  })

  it('combine le filtre des inactifs et la recherche', async () => {
    axios.post.mockResolvedValue({
      data: {
        error: '',
        records: [
          userRecord('stub1', { firstname: 'WM8233_equans', inactive: true }),
          userRecord('stub2', { firstname: 'OTHER_equans', inactive: true }),
          userRecord('alice', { firstname: 'Ada', inactive: true }),
          userRecord('bob', { firstname: 'Bob' }),
        ],
      },
    })

    const { wrapper } = await mountUsers()
    wrapper.vm.onlyInactive = true
    wrapper.vm.search = 'equans'
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('.el-table__row')
    expect(rows).toHaveLength(2)
    expect(wrapper.text()).toContain('WM8233_equans')
    expect(wrapper.text()).toContain('OTHER_equans')
  })

  it('filtre la liste sur la saisie de recherche', async () => {
    axios.post.mockResolvedValue({
      data: {
        error: '',
        records: [userRecord('alice', { firstname: 'Ada' }), userRecord('bob', { firstname: 'Bob' })],
      },
    })

    const { wrapper } = await mountUsers()
    wrapper.vm.search = 'bob'
    await wrapper.vm.$nextTick()

    // The filter is a template expression: we read what is rendered, not `tableData`.
    expect(wrapper.findAll('.el-table__row')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Ada')
  })
})
