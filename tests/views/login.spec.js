// @vitest-environment jsdom
/**
 * Ecran de connexion — le premier ecran de l'application, et celui dont les pannes se voient le
 * plus mal : un bouton grise sans explication, un jeton stocke mais aucune redirection, un message
 * « Request failed with status code 429 » laisse la ou il faudrait « trop de tentatives ».
 *
 * Les cas couverts sont ceux qui ont un effet observable pour l'utilisateur : etat du bouton,
 * erreur affichee, jeton conserve, chemin ouvert, changement de mot de passe force.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import Login from '@/views/Login.vue'
import LanguageSelect from '@/components/LanguageSelect.vue'
import { i18n } from '@/i18n-setup'
import { resetStore, mountView } from '../helpers/mount-view'
import store from '@/store/store.js'

vi.mock('axios')

/** Reponse de `cred/login` telle que l'API la renvoie. */
function authResponse(overrides = {}) {
  const user = {
    login: 'alice',
    language: 'fr',
    privileges: ['user'],
    mustResetPassword: false,
    theme: null,
    ...overrides.user,
  }
  return {
    data: {
      error: '',
      cred: { token: 'token-abc', user },
      menus:
        overrides.menus !== undefined
          ? overrides.menus
          : [
              {
                category: 'Reports',
                submenus: [
                  {
                    title: 'Sales',
                    loc_title: 'Sales',
                    apps: [{ rec_id: 'rec-1', title: 'Sales', loc_title: 'Sales' }],
                  },
                ],
              },
            ],
      all_priv: { admin: null },
      all_filters: {},
      version: '3.6.3',
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
})

const mountLogin = () =>
  mountView(Login, { mocks: { $notify: notify, $message: message, $prompt: prompt } })

/** Remplit les deux champs et clique sur le bouton de connexion. */
async function submitCredentials(wrapper, login = 'alice', password = 'motdepasse') {
  wrapper.vm.form.login = login
  wrapper.vm.form.password = password
  await wrapper.vm.$nextTick()
  await wrapper.find('.login-button').trigger('click')
  await flushPromises()
}

describe('Login.vue — formulaire', () => {
  it('garde le bouton desactive tant que les deux champs ne sont pas remplis', async () => {
    axios.get.mockResolvedValue({ data: { error: '', welcome: 'W', icon: 'f' } })

    const { wrapper } = await mountLogin()
    expect(wrapper.find('.login-button').attributes('disabled')).toBeDefined()

    wrapper.vm.form.login = 'alice'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.login-button').attributes('disabled')).toBeDefined()

    wrapper.vm.form.password = 'secret'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.login-button').attributes('disabled')).toBeUndefined()
  })

  it('remplit l\'accueil et publie la version Elasticsearch apres le chargement de la config', async () => {
    axios.get.mockResolvedValue({
      data: { error: '', welcome: 'Bienvenue', icon: 'fingerprint', elastic_version: 8.19 },
    })

    const { wrapper } = await mountLogin()
    // `created` interroge la config une seconde apres le montage : sans cette avance, l'ecran
    // reste sur son etat « loading » que l'utilisateur voit au demarrage.
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(wrapper.vm.initialized).toBe(true)
    expect(wrapper.vm.config.welcome).toBe('Bienvenue')
    expect(store.state.elasticVersion).toBe(8.19)
    expect(wrapper.text()).toContain('Bienvenue')
  })
})

describe('Login.vue — connexion', () => {
  it('conserve le jeton, ouvre la session et redirige vers la premiere application', async () => {
    axios.post.mockResolvedValue(authResponse())

    const { wrapper, router } = await mountLogin()
    await submitCredentials(wrapper)

    expect(JSON.parse(localStorage.authResponse).data.cred.token).toBe('token-abc')
    expect(store.state.creds.token).toBe('token-abc')
    expect(router.currentRoute.value.path).toBe('/main/rec-1')
    expect(notify).toHaveBeenCalled()
  })

  it('affiche l\'erreur renvoyee par l\'API et reactive le bouton', async () => {
    axios.post.mockResolvedValue({ data: { error: 'Bad credentials' } })

    const { wrapper } = await mountLogin()
    await submitCredentials(wrapper)

    expect(wrapper.vm.form.error).toBe('Bad credentials')
    expect(wrapper.vm.loginunderway).toBe(false)
    expect(wrapper.find('.login_error').text()).toBe('Bad credentials')
    expect(localStorage.authResponse).toBeUndefined()
  })

  it('traduit un 429 en « trop de tentatives » avec le delai d\'attente', async () => {
    // Le portail repond 429 : sans ce message, l'utilisateur croit que son mot de passe est faux.
    axios.post.mockRejectedValue({
      response: { status: 429, data: { error: 'TOO_MANY_ATTEMPTS', retry_after: 60 } },
    })

    const { wrapper } = await mountLogin()
    await submitCredentials(wrapper)

    expect(wrapper.vm.form.error).toBe(i18n.global.t('firstlogin.locked', { seconds: 60 }))
    expect(wrapper.vm.form.error).toContain('60')
  })

  it('signale une API injoignable plutot qu\'une erreur brute', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'))

    const { wrapper } = await mountLogin()
    await submitCredentials(wrapper)

    expect(wrapper.vm.form.error).toBe(i18n.global.t('firstlogin.unreachable'))
  })

  it('force le changement d\'un mot de passe provisoire avant d\'entrer', async () => {
    axios.post.mockResolvedValue(authResponse({ user: { mustResetPassword: true } }))

    const { wrapper, router } = await mountLogin()
    await submitCredentials(wrapper)

    expect(wrapper.vm.forceChange).toBe(true)
    expect(wrapper.find('.login-card.force').exists()).toBe(true)
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('demande le code de double authentification puis le renvoie', async () => {
    axios.post
      .mockResolvedValueOnce({ data: { error: 'DoublePhase' } })
      .mockResolvedValueOnce(authResponse())
    prompt.mockResolvedValue({ value: '12345' })

    const { wrapper } = await mountLogin()
    await submitCredentials(wrapper)

    expect(prompt).toHaveBeenCalled()
    expect(axios.post).toHaveBeenCalledTimes(2)
    expect(axios.post.mock.calls[1][1]).toMatchObject({ login: 'alice', doublecode: '12345' })
    expect(store.state.creds.token).toBe('token-abc')
  })

  it('avertit et revient a l\'accueil quand le compte n\'a aucune application', async () => {
    // Compte sans application assignee : continuer faisait planter l'interface sur 'loc_title'.
    axios.post.mockResolvedValue(authResponse({ menus: [] }))

    const { wrapper, router } = await mountLogin()
    await submitCredentials(wrapper)

    expect(wrapper.vm.form.error).toBe(i18n.global.t('firstlogin.no_menu'))
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('suit le changement de langue choisi sur l\'ecran de connexion', async () => {
    axios.get.mockResolvedValue({ data: { error: '', welcome: 'W' } })

    const { wrapper } = await mountLogin()
    const select = wrapper.findComponent(LanguageSelect)
    const el = wrapper.find('.language-select select')
    el.element.value = 'fr'
    await el.trigger('change')

    expect(select.exists()).toBe(true)
    expect(i18n.global.locale).toBe('fr')
    expect(localStorage.nyx_language).toBe('fr')
    expect(document.documentElement.lang).toBe('fr')
  })
})

describe('Login.vue — changement de mot de passe', () => {
  async function mountWithForcedChange() {
    axios.post.mockResolvedValue(authResponse({ user: { mustResetPassword: true } }))
    const { wrapper } = await mountLogin()
    await submitCredentials(wrapper)
    return wrapper
  }

  it('refuse deux saisies differentes sans appeler l\'API', async () => {
    const wrapper = await mountWithForcedChange()
    axios.post.mockClear()

    wrapper.vm.newPassword = { current: 'ancien', first: 'nouveau-mot-de-passe', second: 'autre', error: '' }
    wrapper.vm.submitNewPassword()
    await flushPromises()

    expect(wrapper.vm.newPassword.error).toBe(i18n.global.t('firstlogin.mismatch'))
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('refuse un mot de passe de moins de douze caracteres', async () => {
    const wrapper = await mountWithForcedChange()
    axios.post.mockClear()

    wrapper.vm.newPassword = { current: 'ancien', first: 'court', second: 'court', error: '' }
    wrapper.vm.submitNewPassword()
    await flushPromises()

    expect(wrapper.vm.newPassword.error).toBe(i18n.global.t('firstlogin.too_short'))
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('enregistre le nouveau mot de passe, notifie et vide le formulaire', async () => {
    const wrapper = await mountWithForcedChange()
    axios.post.mockResolvedValue({ data: { error: '' } })

    wrapper.vm.newPassword = { current: 'ancien', first: 'mot-de-passe-solide', second: 'mot-de-passe-solide', error: '' }
    wrapper.vm.submitNewPassword()
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith(
      'api/v1/cred/changepassword?token=token-abc',
      { old_password: 'ancien', new_password: 'mot-de-passe-solide' }
    )
    expect(wrapper.vm.forceChange).toBe(false)
    expect(wrapper.vm.newPassword.first).toBe('')
    expect(wrapper.vm.form.password).toBe('')
    expect(notify).toHaveBeenCalled()
  })

  it('affiche le refus de l\'API sur le formulaire', async () => {
    const wrapper = await mountWithForcedChange()
    axios.post.mockRejectedValue({ response: { data: { error: 'Password reused' } } })

    wrapper.vm.newPassword = { current: 'ancien', first: 'mot-de-passe-solide', second: 'mot-de-passe-solide', error: '' }
    wrapper.vm.submitNewPassword()
    await flushPromises()

    expect(wrapper.vm.newPassword.error).toBe('Password reused')
    expect(wrapper.vm.loginunderway).toBe(false)
  })
})
