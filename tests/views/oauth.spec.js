// @vitest-environment jsdom
/**
 * Return page of the GitHub sign-in (`/oauth?code=…&state=…`).
 *
 * What the screen must do fits in three lines: read the `code` and the `state` from the URL, give
 * them to the API, then finish the session like the password form. What actually breaks is around
 * that: a URL with no code (the user comes back by hand), an identity with no account, an account
 * that must first change its password, an account with no application — and the URL keeping the
 * code in memory if the redirect is not a `replace`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import OAuth from '@/views/OAuth.vue'
import { i18n } from '@/i18n-setup'
import { resetStore, mountView } from '../helpers/mount-view'
import store from '@/store/store.js'

vi.mock('axios')

const mounted = []

function authResponse(overrides = {}) {
  return {
    data: {
      error: '',
      cred: {
        token: 'token-abc',
        user: {
          login: 'alice',
          language: 'fr',
          privileges: ['user'],
          mustResetPassword: false,
          ...overrides.user,
        },
      },
      menus:
        overrides.menus !== undefined
          ? overrides.menus
          : [
              {
                category: 'Reports',
                submenus: [
                  { title: 'Sales', loc_title: 'Sales', apps: [{ rec_id: 'rec-1', title: 'Sales' }] },
                ],
              },
            ],
      all_priv: {},
      all_filters: {},
      version: '3.6.13',
    },
  }
}

function openAt(query) {
  window.history.replaceState({}, '', '/oauth' + (query || ''))
}

async function mountOAuth() {
  // `mountView` is asynchronous: without `await`, a promise is pushed into the list of components
  // to unmount and every assertion reads `undefined`.
  const view = await mountView(OAuth)
  mounted.push(view.wrapper)
  await flushPromises()
  return view
}

describe('retour de la connexion GitHub', () => {
  beforeEach(() => {
    // The catalogue is resolved from the instance locale: messages are read by their key so that
    // the test does not depend on the active language.
    i18n.global.locale = 'en'
    resetStore()
    localStorage.clear()
    vi.clearAllMocks()
    openAt('')
  })

  afterEach(() => {
    while (mounted.length) mounted.pop().unmount()
  })

  it('sans code ni state, il ne se passe rien et l’erreur est dite', async () => {
    const { wrapper } = await mountOAuth()

    expect(axios.post).not.toHaveBeenCalled()
    expect(wrapper.vm.errorMessage).toBe(i18n.global.t('github.failed'))
  })

  it('le bouton de retour ramene a la connexion', async () => {
    const { wrapper, router } = await mountOAuth()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('le code et le state partent a l’API', async () => {
    openAt('?code=the-code&state=the-state')
    axios.post.mockResolvedValue(authResponse())

    await mountOAuth()

    expect(axios.post).toHaveBeenCalledTimes(1)
    const [url, body] = axios.post.mock.calls[0]
    expect(url).toContain('cred/login_github')
    expect(body).toEqual({ code: 'the-code', state: 'the-state' })
  })

  it('une session valide ouvre la premiere application du compte', async () => {
    openAt('?code=the-code&state=the-state')
    axios.post.mockResolvedValue(authResponse())

    const { wrapper, router } = await mountOAuth()
    await flushPromises()

    expect(store.state.creds.token).toBe('token-abc')
    expect(localStorage.authResponse).toContain('token-abc')
    expect(router.currentRoute.value.path).toBe('/main/rec-1')
    expect(wrapper.vm.errorMessage).toBe('')
  })

  it('la requete dans le fragment (apres le report du routeur) est lue pareil', async () => {
    // `normalizeOAuthLocation` moves `/oauth?code=…` to `/#/oauth?code=…`: the screen must read both
    // forms, otherwise nothing happens on the way back from GitHub.
    window.history.replaceState({}, '', '/#/oauth?code=the-code&state=the-state')
    axios.post.mockResolvedValue(authResponse())

    const { wrapper } = await mountOAuth()

    expect(axios.post.mock.calls[0][1]).toEqual({ code: 'the-code', state: 'the-state' })
    expect(wrapper.vm.errorMessage).toBe('')
  })

  it('le fragment de l’URL n’est pas collé au state', async () => {
    // getUrlVars keeps the `#fragment`: letting it through would make the API reject the state.
    openAt('?code=the-code&state=the-state')
    axios.post.mockResolvedValue(authResponse())

    await mountOAuth()

    expect(axios.post.mock.calls[0][1]).toEqual({ code: 'the-code', state: 'the-state' })
  })

  it('une identite sans compte ne cree aucune session', async () => {
    openAt('?code=the-code&state=the-state')
    axios.post.mockResolvedValue({ data: { error: 'Bad Credentials' } })

    const { wrapper, router } = await mountOAuth()

    expect(wrapper.vm.errorMessage).toBe(i18n.global.t('github.no_account'))
    expect(store.state.creds.token).toBeFalsy()
    expect(localStorage.authResponse).toBeUndefined()
    expect(router.currentRoute.value.path).not.toContain('/main')
  })

  it('un compte inactive par le serveur renvoie vers la page dediee', async () => {
    // `GITHUB_UNKNOWN_ACCOUNTS=inactive`: the identity is filed as a disabled account, so it exists
    // and the message must not say "no account is linked".
    openAt('?code=the-code&state=the-state')
    axios.post.mockResolvedValue({ data: { error: 'ACCOUNT_INACTIVE' } })

    const { wrapper, router } = await mountOAuth()

    expect(router.currentRoute.value.path).toBe('/inactive')
    expect(wrapper.vm.errorMessage).toBe('')
    expect(store.state.creds.token).toBeFalsy()
  })

  it('un mot de passe provisoire renvoie a la connexion par mot de passe', async () => {
    openAt('?code=the-code&state=the-state')
    axios.post.mockResolvedValue(authResponse({ user: { mustResetPassword: true } }))

    const { wrapper, router } = await mountOAuth()

    expect(wrapper.vm.errorMessage).toBe(i18n.global.t('github.change_password'))
    expect(router.currentRoute.value.path).not.toContain('/main')
  })

  it('un compte sans application ne fait pas planter l’ecran', async () => {
    openAt('?code=the-code&state=the-state')
    axios.post.mockResolvedValue(authResponse({ menus: [] }))

    const { wrapper, router } = await mountOAuth()

    expect(wrapper.vm.errorMessage).toBe(i18n.global.t('firstlogin.no_menu'))
    expect(router.currentRoute.value.path).not.toContain('/main')
  })

  it('un serveur injoignable est dit, pas avale', async () => {
    openAt('?code=the-code&state=the-state')
    axios.post.mockRejectedValue(new Error('network'))

    const { wrapper } = await mountOAuth()

    expect(wrapper.vm.errorMessage).toBe(i18n.global.t('github.unavailable'))
  })
})
