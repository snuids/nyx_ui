// @vitest-environment jsdom
/**
 * UserDetails — the account editor, and the `inactive` flag.
 *
 * "Inactive" is opt-in and stored as a boolean on the user document. A document that does **not**
 * carry the field is an **active** account: every user created before this release, and every user
 * created by a script, keeps working without a migration. The switch therefore reads the absent value
 * as `false` and only ever writes what the administrator chose.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

import UserDetails from '@/components/UserDetails.vue'
import { resetStore, mountView } from '../helpers/mount-view'

const creds = {
  token: 't',
  user: { id: 'admin@example.com', language: 'en', privileges: ['admin'], user: 'admin' },
  hasPrivilege: () => true,
}

function record(source = {}) {
  return {
    _id: 'ada@example.com',
    _index: 'nyx_user',
    _source: {
      login: 'ada@example.com',
      firstname: 'Ada',
      lastname: 'Lovelace',
      privileges: ['user'],
      language: 'en',
      ...source,
    },
  }
}

async function mountDetails(source = {}) {
  resetStore({ creds, apiurl: 'https://api.test/api/v1/' })
  const { wrapper } = await mountView(UserDetails, {
    at: '/main/rec-users',
    attachTo: document.body,
    props: { record: record(source) },
    mocks: { $notify: vi.fn(), $confirm: vi.fn(), $alert: vi.fn(), $prompt: vi.fn() },
  })
  await flushPromises()
  return wrapper
}

/** The `inactive` switch: the one whose form item label is the translated word. */
function inactiveSwitch(wrapper) {
  const item = wrapper.findAll('.el-form-item').find(node =>
    (node.text() || '').toLowerCase().includes('inactive'))
  return item ? item.findComponent({ name: 'ElSwitch' }) : null
}

describe('UserDetails — the inactive flag', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('reads an account without the field as active', async () => {
    const wrapper = await mountDetails()
    const sw = inactiveSwitch(wrapper)

    expect(sw, 'the switch is there').not.toBeNull()
    expect(sw.props('modelValue')).toBeFalsy()
    expect(wrapper.vm.newRec._source.inactive).toBeUndefined()
  })

  it('shows the flag when the document carries it', async () => {
    const wrapper = await mountDetails({ inactive: true })
    const sw = inactiveSwitch(wrapper)

    expect(sw.props('modelValue')).toBe(true)
  })

  it('writes the flag on the document the editor saves', async () => {
    const wrapper = await mountDetails()

    wrapper.vm.newRec._source.inactive = true
    await flushPromises()

    expect(wrapper.vm.newRec._source.inactive).toBe(true)
  })

  it('leaves every other field alone when the flag is set', async () => {
    const wrapper = await mountDetails()

    wrapper.vm.newRec._source.inactive = true
    await flushPromises()

    expect(wrapper.vm.newRec._source.login).toBe('ada@example.com')
    expect(wrapper.vm.newRec._source.privileges).toEqual(['user'])
  })
})
