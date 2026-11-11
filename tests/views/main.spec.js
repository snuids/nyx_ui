// @vitest-environment jsdom
/**
 * Main screen — the working frame: header, side menu, period selector.
 *
 * It is the only screen the user never leaves; a regression there costs the whole navigation (empty
 * menu, wrong default period, loop back to the login). The children (`Apps`, `Logout`,
 * `ChangePassword`) are replaced with doubles: they have their own network calls, out of scope
 * here.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

import Main from '@/views/Main.vue'
import App from '@/App.vue'
import { globalBus } from '@/utils/bus'
import { i18n } from '@/i18n-setup'
import { resetStore, mountView } from '../helpers/mount-view'
import store from '@/store/store.js'

const Apps = { name: 'Apps', template: '<div class="apps-stub" />' }
const Logout = { name: 'Logout', template: '<div class="logout-stub" />' }
const ChangePassword = {
  name: 'ChangePassword',
  template: '<div class="changepassword-stub" />',
  emits: ['changepassword_closed'],
}

function seededState(overrides = {}) {
  const subCategory = {
    title: 'Sales',
    loc_title: 'Sales',
    fulltitle: 'reports/sales',
    apps: [{ rec_id: 'rec-1', title: 'Sales', loc_title: 'Sales' }],
    ...overrides.subCategory,
  }
  return {
    maintitle: 'Sales',
    currentSubCategory: subCategory,
    activeApp: {
      rec_id: 'rec-1',
      title: 'Sales',
      loc_title: 'Sales',
      timeSelectorChecked: false,
      timeSelectorType: 'classic',
      ...overrides.activeApp,
    },
    filteredmenus: [
      {
        category: 'Reports',
        loc_category: 'Rapports',
        submenus: [
          { title: 'Sales', loc_title: 'Sales', fulltitle: 'reports/sales', apps: subCategory.apps },
          { title: 'Stock', loc_title: 'Stock', fulltitle: 'reports/stock', icon: 'brands/docker', apps: [] },
        ],
      },
      {
        category: 'Admin',
        loc_category: 'Administration',
        submenus: [
          { title: 'Users', loc_title: 'Users', fulltitle: 'admin/users', apps: [{ rec_id: 'rec-9' }] },
        ],
      },
    ],
    ...overrides.state,
  }
}

const mountMain = (opts = {}) =>
  mountView(Main, {
    at: opts.at || '/main/rec-1',
    stubs: { Apps, Logout, ChangePassword },
    ...opts,
  })

beforeEach(() => {
  vi.useFakeTimers()
  globalBus.all.clear()
  resetStore(seededState())
  i18n.global.locale = 'en'
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Main.vue — cadre', () => {
  it('affiche le titre de l\'application et le menu construit depuis le store', async () => {
    const { wrapper } = await mountMain()

    expect(wrapper.find('.el-header').text()).toContain('Sales')
    const items = wrapper.findAll('.submenu-item').map((item) => item.text())
    expect(items.some((t) => t.includes('Stock'))).toBe(true)
    expect(wrapper.findAll('.el-sub-menu')).toHaveLength(2)
  })

  it('ouvre la periode par defaut sur les sept derniers jours', async () => {
    await mountMain()
    await flushPromises()

    expect(store.state.lastTimeRangeEvent.type).toBe('absolute')
    expect(store.state.lastTimeRangeEvent.subtype).toBe('classic')
    const [start, end] = store.state.timeRange
    const days = Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000))
    expect(days).toBe(7)
  })

  it('replie le menu lateral et le retient dans le store', async () => {
    const { wrapper } = await mountMain()
    expect(wrapper.find('.aside').exists()).toBe(true)

    await wrapper.find('.el-header button').trigger('click')

    expect(wrapper.vm.menuOpen).toBe(false)
    expect(store.state.menuOpen).toBe(false)

    await wrapper.find('.el-header button').trigger('click')
    expect(wrapper.vm.menuOpen).toBe(true)
    expect(store.state.menuOpen).toBe(true)
  })

  it('navigue vers l\'application du sous-menu clique', async () => {
    const { wrapper, router } = await mountMain()

    const stock = wrapper.findAll('.submenu-item').find((item) => item.text().includes('Stock'))
    // The Stock submenu has no application: the click must not navigate — nor throw on
    // `apps[0].rec_id`, as it did before the click was guarded.
    await stock.trigger('click')
    expect(router.currentRoute.value.path).toBe('/main/rec-1')
    expect(store.state.maintitle).toBe('Sales')

    const users = wrapper.findAll('.submenu-item').find((item) => item.text().includes('Users'))
    await users.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/main/rec-9')
  })

  it('ouvre une application externe dans un nouvel onglet, chemin relatif resolu', async () => {
    const { wrapper } = await mountMain()
    const open = vi.spyOn(window, 'open').mockImplementation(() => {})

    wrapper.vm.appClicked({ type: 'external', config: { url: './grafana/d/abc' } })

    expect(open).toHaveBeenCalledWith('http://localhost:3000/grafana/d/abc')
    open.mockRestore()
  })

  it('affiche le dialogue de changement de mot de passe a la demande', async () => {
    const { wrapper } = await mountMain()
    expect(wrapper.find('.changepassword-stub').exists()).toBe(false)

    wrapper.vm.changePassword()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.changepassword-stub').exists()).toBe(true)
  })

  it('renvoie a la connexion quand aucune application n\'est active', async () => {
    resetStore({ currentSubCategory: null, activeApp: null, filteredmenus: [] })
    const { wrapper, router } = await mountMain({ at: '/main/rec-42' })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
    // The path is remembered so it can be reopened after sign-in.
    expect(store.state.redirection).toBe('/main/rec-42')
    expect(wrapper.find('.el-container').exists()).toBe(false)
  })
})

describe('Main.vue — periode', () => {
  it('suit le selecteur de type de periode', async () => {
    const { wrapper } = await mountMain()

    wrapper.vm.timeModeChanged('relative')
    await vi.advanceTimersByTimeAsync(500)

    expect(store.state.lastTimeRangeEvent.type).toBe('relative')
    expect(store.state.lastTimeRangeEvent.relativeType).toBe('h')
    expect(store.state.lastTimeRangeEvent.relativeValue).toBe(4)
  })

  it('publie les periodes jour, semaine, mois et annee', async () => {
    const { wrapper } = await mountMain()

    wrapper.vm.dayChanged('2026-03-10')
    expect(store.state.lastTimeRangeEvent.subtype).toBe('day')
    const [dayStart, dayEnd] = store.state.timeRangeDay
    expect(dayEnd.getTime() - dayStart.getTime()).toBeGreaterThan(3600 * 1000)

    wrapper.vm.weekChanged('2026-03-10')
    expect(store.state.lastTimeRangeEvent.subtype).toBe('week')
    expect(store.state.timeRangeWeek).toHaveLength(2)

    wrapper.vm.monthChanged('2026-03-10')
    expect(store.state.lastTimeRangeEvent.subtype).toBe('month')
    expect(store.state.timeRangeMonth).toHaveLength(2)

    wrapper.vm.yearChanged('2026-03-10')
    expect(store.state.lastTimeRangeEvent.subtype).toBe('year')
    expect(store.state.timeRangeYear).toHaveLength(2)
  })

  it('applique une periode poussee par le bus (forcetime)', async () => {
    resetStore(
      seededState({ activeApp: { timeSelectorChecked: true, timeSelectorType: 'classic' } })
    )
    await mountMain()

    globalBus.$emit('forcetime', '3d')

    expect(store.state.lastTimeRangeEvent.subtype).toBe('classic')
    expect(store.state.timeRange).toHaveLength(2)
  })

  it('adopte la periode d\'un graphique (charttimerangeupdated)', async () => {
    await mountMain()
    const start = new Date('2026-01-01T00:00:00Z').getTime()
    const end = new Date('2026-01-02T00:00:00Z').getTime()

    globalBus.$emit('charttimerangeupdated', [start, end])

    expect(store.state.timeRange[0].getTime()).toBe(start)
    expect(store.state.timeRange[1].getTime()).toBe(end)
  })

  it('ne reagit plus au bus apres demontage', async () => {
    const { wrapper } = await mountMain()
    const before = store.state.timeRange

    wrapper.unmount()
    globalBus.$emit('charttimerangeupdated', [1, 2])

    expect(store.state.timeRange).toBe(before)
  })
})

describe('Main.vue — dimensions', () => {
  it('enregistre la taille de la fenetre au montage', async () => {
    await mountMain()
    expect(store.state.containerSize).toEqual({
      width: window.innerWidth,
      height: window.innerHeight,
    })
  })

  it('suit le redimensionnement de la fenetre', async () => {
    await mountMain()

    window.dispatchEvent(new Event('resize'))
    await vi.advanceTimersByTimeAsync(600)

    expect(store.state.containerSize.width).toBe(window.innerWidth)
  })
})

describe('App.vue — coquille', () => {
  it('affiche une notification poussee par le websocket', async () => {
    const notify = vi.fn()
    await mountView(App, { mocks: { $notify: notify }, stubs: { 'router-view': true } })

    globalBus.$emit('messagereceived', {
      data: { notif_type: 'global', notif_title: 'Maintenance', notif_message: 'Ce soir' },
    })

    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Maintenance', message: 'Ce soir' })
    )
  })

  it('ignore les messages qui ne sont pas des notifications globales', async () => {
    const notify = vi.fn()
    await mountView(App, { mocks: { $notify: notify }, stubs: { 'router-view': true } })

    globalBus.$emit('messagereceived', { data: { notif_type: 'user', notif_title: 'x' } })

    expect(notify).not.toHaveBeenCalled()
  })

  it('retient la langue choisie sur le document et dans le stockage', async () => {
    const { wrapper } = await mountView(App, { mocks: { $notify: vi.fn() }, stubs: { 'router-view': true } })

    i18n.global.locale = 'nl'
    await wrapper.vm.$nextTick()

    expect(document.documentElement.lang).toBe('nl')
    expect(localStorage.nyx_language).toBe('nl')
  })
})
