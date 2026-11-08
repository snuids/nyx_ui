// @vitest-environment jsdom
/**
 * Page de retour de la connexion GitHub (`/oauth?code=…&state=…`).
 *
 * Ce que l'ecran doit faire tient en trois lignes : lire le `code` et le `state` de l'URL, les
 * donner a l'API, puis terminer la session comme le formulaire de mot de passe. Ce qui casse en
 * pratique est autour : une URL sans code (l'utilisateur revient a la main), une identite sans
 * compte, un compte qui doit d'abord changer son mot de passe, un compte sans application — et
 * l'URL qui garde le code en memoire si la redirection n'est pas un `replace`.
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
  // `mountView` est asynchrone : sans `await`, on pousse une promesse dans la liste des
  // composants a demonter et toutes les assertions lisent `undefined`.
  const view = await mountView(OAuth)
  mounted.push(view.wrapper)
  await flushPromises()
  return view
}

describe('retour de la connexion GitHub', () => {
  beforeEach(() => {
    // Le catalogue est resolu par la locale de l'instance : on lit les messages par leur cle
    // pour que le test ne depende pas de la langue active.
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
    // `normalizeOAuthLocation` deplace `/oauth?code=…` en `/#/oauth?code=…` : l'ecran doit lire
    // les deux formes, sinon il ne se passe rien au retour de GitHub.
    window.history.replaceState({}, '', '/#/oauth?code=the-code&state=the-state')
    axios.post.mockResolvedValue(authResponse())

    const { wrapper } = await mountOAuth()

    expect(axios.post.mock.calls[0][1]).toEqual({ code: 'the-code', state: 'the-state' })
    expect(wrapper.vm.errorMessage).toBe('')
  })

  it('le fragment de l’URL n’est pas collé au state', async () => {
    // getUrlVars garde le `#fragment` : le laisser passer ferait refuser le state par l'API.
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
