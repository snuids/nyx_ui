// @vitest-environment jsdom
/**
 * The page an inactive account lands on.
 *
 * An administrator disables an account with the `inactive` flag; the API then refuses to mint a
 * token, and the console must not leave the user in front of a sign-in form that cannot work. The
 * login route sends them to `/inactive`, which says what happened and who to ask.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import Inactive from '@/views/Inactive.vue'
import Login from '@/views/Login.vue'
import { resetStore, mountView } from '../helpers/mount-view'

vi.mock('axios')

const creds = { token: '', user: { id: '', language: 'en', privileges: [] } }
creds.hasPrivilege = () => false

beforeEach(() => {
  document.body.innerHTML = ''
  vi.clearAllMocks()
  resetStore({ creds, apiurl: 'https://api.test/api/v1/' })
})

describe('Inactive — the page', () => {
  it('explains the situation instead of asking for the password again', async () => {
    const { wrapper } = await mountView(Inactive, { at: '/inactive' })
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Account inactive')
    expect(text).toMatch(/deactivated by an administrator/i)
    expect(text).toMatch(/ask an administrator/i)
    expect(text).toContain('Back to sign-in')
  })

  it('sends back to the sign-in screen', async () => {
    const { wrapper, router } = await mountView(Inactive, { at: '/inactive' })
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).not.toBe('/inactive')
  })
})

describe('Login — an inactive account', () => {
  it('is sent to the page that explains it, not left on the form', async () => {
    axios.post.mockResolvedValue({ status: 200, data: { error: 'ACCOUNT_INACTIVE' } })

    const { wrapper, router } = await mountView(Login, { at: '/' })
    await flushPromises()

    wrapper.vm.form.login = 'ada@example.com'
    wrapper.vm.form.password = 'whatever'
    await wrapper.vm.validateUser()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/inactive')
    expect(wrapper.vm.form.error).toBeFalsy()
    expect(credentialsStored()).toBe(false)
  })
})

describe('Login — an inactive account behind the second factor', () => {
  it('lands on the same page once the code is accepted', async () => {
    // first call: the account is asked for its code; second call: the account is refused
    axios.post
      .mockResolvedValueOnce({ status: 200, data: { error: 'DoublePhase' } })
      .mockResolvedValueOnce({ status: 200, data: { error: 'ACCOUNT_INACTIVE' } })

    const { wrapper, router } = await mountView(Login, { at: '/' })
    await flushPromises()

    wrapper.vm.form.login = 'ada@example.com'
    wrapper.vm.form.password = 'whatever'
    wrapper.vm.$prompt = vi.fn(() => Promise.resolve({ value: '12345' }))
    await wrapper.vm.validateUser()
    await flushPromises()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/inactive')
  })
})

/** Whether the store kept a session: an inactive account must not have one. */
function credentialsStored() {
  const store = document.querySelector('#app')
  return Boolean(store && store.__vue_app__ &&
    store.__vue_app__.config.globalProperties.$store.getters.creds.token)
}
