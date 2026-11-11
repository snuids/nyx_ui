// @vitest-environment jsdom
/**
 * Login.vue — the branches `login.spec.js` leaves alone.
 *
 * `login.spec.js` covers what an ordinary user does: fill the two fields, sign in, land on the
 * first app, read the error when the API refuses. What it never exercised is what happens around
 * that path — the GitHub button, the second phase of a two-factor account, a session that was
 * interrupted by an OAuth round-trip, and the developer prefill — which is most of the file's
 * remaining uncovered statements.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import Login from '@/views/Login.vue'
import { i18n } from '@/i18n-setup'
import { resetStore, mountView } from '../helpers/mount-view'
import store from '@/store/store.js'

/** jsdom's `location` is not writable: the GitHub test replaces it, so the descriptor is kept. */
const realLocation = Object.getOwnPropertyDescriptor(window, 'location')

vi.mock('axios')

function authResponse() {
  return {
    data: {
      error: '',
      cred: { token: 'token-abc', user: { login: 'alice', language: 'en', privileges: ['user'] } },
      menus: [
        {
          category: 'Reports',
          submenus: [
            {
              title: 'Sales',
              loc_title: 'Sales',
              apps: [
                { rec_id: 'rec-1', title: 'Sales', loc_title: 'Sales' },
                // l'application visee par la redirection doit exister dans le catalogue, sinon
                // `changeApp` leve avant la navigation
                { rec_id: 'rec-9', title: 'Other', loc_title: 'Other' },
              ],
            },
          ],
        },
      ],
      all_priv: { admin: null },
      all_filters: {},
    },
  }
}

let notify
let message
let prompt

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  resetStore()
  i18n.global.locale = 'en'
  localStorage.clear()
  notify = vi.fn()
  message = vi.fn()
  prompt = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  if (realLocation) Object.defineProperty(window, 'location', realLocation)
  window.history.replaceState({}, '', '/')
})

const mountLogin = () =>
  mountView(Login, {
    mocks: { $notify: notify, $message: message, $prompt: prompt },
    at: window.location.pathname + window.location.search,
  })

describe('Login — le bouton GitHub', () => {
  it('suit l URL que l API renvoie quand elle est prete', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('cred/oauth/state')) {
        return Promise.resolve({ data: { error: '', url: 'https://github.com/login/oauth/authorize?x=1' } })
      }
      return Promise.resolve({ data: { error: '', welcome: 'W', icon: 'f', login: { github: true } } })
    })
    const navigation = { href: '' }
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, href: '', assign: (url) => { navigation.href = url }, origin: 'http://localhost' },
    })

    const { wrapper } = await mountLogin()
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    await wrapper.vm.startGithubLogin()
    await flushPromises()

    expect(window.location.href).toBe('https://github.com/login/oauth/authorize?x=1')
    expect(wrapper.vm.form.error).toBe('')
  })

  it('affiche l indisponibilite quand l API ne fournit pas d URL', async () => {
    axios.get.mockImplementation((url) =>
      url.includes('cred/oauth/state')
        ? Promise.resolve({ data: { error: 'oauth disabled', url: '' } })
        : Promise.resolve({ data: { error: '', welcome: 'W', icon: 'f', login: { github: true } } }),
    )

    const { wrapper } = await mountLogin()
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    await wrapper.vm.startGithubLogin()

    expect(wrapper.vm.form.error).toBe(i18n.global.t('github.unavailable'))
    expect(wrapper.vm.githubunderway).toBe(false)
  })

  it('affiche la meme indisponibilite quand l appel echoue', async () => {
    axios.get.mockImplementation((url) =>
      url.includes('cred/oauth/state')
        ? Promise.reject(new Error('reseau coupe'))
        : Promise.resolve({ data: { error: '', welcome: 'W', icon: 'f', login: { github: true } } }),
    )

    const { wrapper } = await mountLogin()
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    await wrapper.vm.startGithubLogin()

    expect(wrapper.vm.form.error).toBe(i18n.global.t('github.unavailable'))
    expect(wrapper.vm.githubunderway).toBe(false)
  })
})

describe('Login — la double authentification', () => {
  it('reste sur l ecran quand le second code est refuse', async () => {
    axios.post.mockImplementation((url, body) => {
      if (body && body.doublecode) {
        return Promise.resolve({ data: { error: 'BADCODE', cred: {}, menus: [] } })
      }
      return Promise.resolve({ data: { error: 'DoublePhase', cred: {}, menus: [] } })
    })
    prompt.mockResolvedValue({ value: '12345' })
    const error = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { wrapper, router } = await mountLogin()
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    wrapper.vm.form.login = 'alice'
    wrapper.vm.form.password = 'secret'
    await wrapper.vm.validateUser()
    await flushPromises()

    expect(prompt).toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/')
    expect(store.state.creds.token).toBeUndefined()
    error.mockRestore()
  })

  it('avertit quand le code est annule au lieu de rester muet', async () => {
    axios.post.mockResolvedValue({ data: { error: 'DoublePhase', cred: {}, menus: [] } })
    prompt.mockRejectedValue({ action: 'cancel' })

    const { wrapper } = await mountLogin()
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    wrapper.vm.form.login = 'alice'
    wrapper.vm.form.password = 'secret'
    await wrapper.vm.validateUser()
    await flushPromises()

    expect(message).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'info', message: i18n.global.t('ui.input_canceled') }),
    )
  })
})

describe('Login — apres l authentification', () => {
  it('ouvre l application demandee quand une redirection est en attente', async () => {
    axios.post.mockResolvedValue(authResponse())
    store.replaceState({ ...store.state, redirection: '/main/rec-9' })

    const { wrapper, router } = await mountLogin()
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    wrapper.vm.form.login = 'alice'
    wrapper.vm.form.password = 'secret'
    await wrapper.vm.validateUser()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/main/rec-9')
    expect(store.state.activeApp.rec_id).toBe('rec-9')
    // la redirection sert une fois : elle est consommee
    expect(store.state.redirection).toBeNull()
  })
})

describe('Login — le pre-remplissage de developpement', () => {
  it('lit `user` et `password` dans l URL', async () => {
    axios.get.mockResolvedValue({ data: { error: '', welcome: 'W', icon: 'f' } })
    window.history.replaceState({}, '', '/?user=dev@example.com&password=secret')

    const { wrapper } = await mountLogin()

    expect(wrapper.vm.form.login).toBe('dev@example.com')
    expect(wrapper.vm.form.password).toBe('secret')
  })

  it('ne pre-remplit rien sans les parametres', async () => {
    axios.get.mockResolvedValue({ data: { error: '', welcome: 'W', icon: 'f' } })

    const { wrapper } = await mountLogin()

    expect(wrapper.vm.form.login).toBe('')
    expect(wrapper.vm.form.password).toBe('')
  })
})
