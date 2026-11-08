// @vitest-environment jsdom
/**
 * `External` — l'ecran qui affiche une application tierce dans une iframe.
 *
 * Son URL porte des jetons que la console remplace : le token de l'utilisateur, l'API, l'hote, la
 * langue, les bornes de temps et, depuis cette version, le theme en cours (`THEME`). Un ecran a 0 %
 * de couverture jusqu'ici, alors que c'est le seul endroit ou ces remplacements existent.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'

vi.mock('axios', () => ({ default: { post: vi.fn(), get: vi.fn() } }))

import { mountView, resetStore } from '../helpers/mount-view'
import { applyTheme } from '@/utils/theme'

import External from '@/components/External.vue'

const mounted = []
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.classList.remove('dark')
})

const config = (url, extra = {}) => ({
  rec_id: 'app-ext',
  config: { url, ...extra },
})

async function mountExternal(url, extra = {}) {
  resetStore({
    creds: {
      token: 'tok-123',
      hasPrivilege: () => true,
      user: { id: 'u-1', login: 'alice', language: 'fr' },
    },
    currentSubCategory: { apps: [{}], loc_title: 'Ext' },
  })

  const result = await mountView(External, { props: { config: config(url, extra) } })
  mounted.push(result.wrapper)
  return result
}

describe('External — jetons de l\'URL', () => {
  it('remplace le token, l\'API, l\'hôte et la langue', async () => {
    const { wrapper } = await mountExternal(
      'https://HOST/API/report?token=TOKEN&lang=LANG'
    )

    const url = wrapper.vm.computedUrl
    expect(url).toContain('token=tok-123')
    expect(url).not.toContain('TOKEN')
    expect(url).toContain('lang=fr')
    expect(url).toContain('api/v1/') // `apiurl` du store
  })

  it('n\'invente pas d\'hôte quand l\'URL est illisible', async () => {
    const { wrapper } = await mountExternal('https://HOST/x')

    expect(wrapper.vm.computedUrl).toContain('localhost')
  })
})

describe('External — jeton THEME', () => {
  it('rend le theme clair quand la console est claire', async () => {
    applyTheme('light')
    const { wrapper } = await mountExternal('https://app.example/?theme=THEME')

    expect(wrapper.vm.computedUrl).toBe('https://app.example/?theme=light')
  })

  it('rend le theme sombre quand la console est sombre', async () => {
    applyTheme('dark')
    const { wrapper } = await mountExternal('https://app.example/?theme=THEME')

    expect(wrapper.vm.computedUrl).toBe('https://app.example/?theme=dark')
  })

  it('suit une bascule clair/sombre sans remonter l\'écran', async () => {
    applyTheme('light')
    const { wrapper } = await mountExternal('https://app.example/?theme=THEME')
    expect(wrapper.vm.computedUrl).toContain('theme=light')

    // `applyTheme` emet `nyx:theme` : l'ecran ecoute pour recalculer l'URL de l'iframe
    applyTheme('dark')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.computedUrl).toContain('theme=dark')
  })

  it('ne touche pas un mot qui contient THEME', async () => {
    applyTheme('dark')
    const { wrapper } = await mountExternal('https://app.example/MYTHEMEAPP?theme=THEME')

    expect(wrapper.vm.computedUrl).toBe('https://app.example/MYTHEMEAPP?theme=dark')
  })
})
