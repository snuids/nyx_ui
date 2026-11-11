// @vitest-environment jsdom
/**
 * GenericComponent — the screen that displays *all* the pages of the console.
 *
 * It reads `currentSubCategory.apps` and decides what to render: a generic screen per `type`
 * (`generic-table`, `external`, `kibana`, `grafana`, `form`, `upload`), or the controller named in
 * `config.controller`, loaded through `require.context`. An error here does not break one page, it
 * breaks all of them — and the error message looks like "blank page".
 *
 * The children are replaced with doubles (except `LandingPage`, tested for real): they alone make
 * the network calls, and it is the choice of child, not its content, that this component decides.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

import GenericComponent from '@/components/GenericComponent.vue'
import { globalBus, localBus } from '@/utils/bus'
import { resetStore, mountView } from '../helpers/mount-view'
import store from '@/store/store.js'

const stub = (name) => ({ name, template: `<div class="${name.toLowerCase()}-stub" />`, props: ['config'] })

const stubs = {
  GenericTable: stub('GenericTable'),
  External: stub('External'),
  Kibana: stub('Kibana'),
  Grafana: stub('Grafana'),
  Form: stub('Form'),
  Upload: stub('Upload'),
  ReportTask: stub('ReportTask'),
}

const app = (overrides = {}) => ({
  rec_id: 'rec-a',
  loc_title: 'Sales',
  title: 'Sales',
  type: 'generic-table',
  config: {},
  ...overrides,
})

const menu = (apps) => [
  {
    category: 'Reports',
    loc_category: 'Rapports',
    submenus: [{ title: 'Sales', loc_title: 'Sales', fulltitle: 'reports/sales', apps }],
  },
]

function seed(apps = [app()], activeId = apps[0] && apps[0].rec_id) {
  resetStore({
    containerSize: { width: 1200, height: 800 },
    currentSubCategory: { title: 'Sales', loc_title: 'Sales', fulltitle: 'reports/sales', apps },
    filteredmenus: menu(apps),
    activeApp: apps.find((a) => a.rec_id === activeId) || null,
  })
}

const mountPage = (opts = {}) =>
  mountView(GenericComponent, { at: '/main/rec-a', stubs, ...opts })

let logs
beforeEach(() => {
  globalBus.all.clear()
  localBus.all.clear()
  // The component logs every lifecycle step: without this the run output becomes unreadable.
  logs = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  logs.mockRestore()
})

describe('GenericComponent — une seule application', () => {
  it('rend l\'ecran generique de type generic-table avec sa configuration', async () => {
    const only = app({ config: { api: 'records' } })
    seed([only])

    const { wrapper } = await mountPage()
    const child = wrapper.findComponent(stubs.GenericTable)

    expect(child.exists()).toBe(true)
    expect(child.props('config')).toEqual(only)
  })

  it.each([
    ['external', 'External'],
    ['kibana', 'Kibana'],
    ['grafana', 'Grafana'],
    ['form', 'Form'],
    ['upload', 'Upload'],
  ])('rend le composant dedie au type « %s »', async (type, componentName) => {
    seed([app({ type, config: { url: 'x' } })])

    const { wrapper } = await mountPage()

    expect(wrapper.findComponent(stubs[componentName]).exists()).toBe(true)
    // A single child: the other branches must render nothing.
    for (const [name, stubbed] of Object.entries(stubs)) {
      if (name !== componentName) expect(wrapper.findComponent(stubbed).exists()).toBe(false)
    }
  })

  it('charge le controleur nomme par config.controller', async () => {
    // Default path: the page is a component from `src/components`, resolved by require.context.
    seed([app({ type: undefined, config: { controller: 'LandingPage' } })])

    const { wrapper } = await mountPage()
    // The component is loaded on demand (defineAsyncComponent): without waiting for the dynamic
    // imports, the node stays a comment and the assertion would test nothing.
    await vi.dynamicImportSettled()
    await flushPromises()
    await wrapper.vm.$nextTick()

    // LandingPage renders the site map from the store's menus.
    expect(wrapper.text()).toContain('Rapports')
  })

  it('ne rend rien tant qu\'aucune sous-categorie n\'est selectionnee', async () => {
    resetStore({
      containerSize: { width: 1200, height: 800 },
      currentSubCategory: null,
      filteredmenus: [],
      activeApp: app(),
    })

    const { wrapper } = await mountPage()

    expect(wrapper.findComponent(stubs.GenericTable).exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })
})

describe('GenericComponent — plusieurs applications', () => {
  const apps = [
    app({ rec_id: 'rec-a', loc_title: 'Sales' }),
    app({ rec_id: 'rec-b', loc_title: 'Stock' }),
  ]

  it('affiche un onglet par application et selectionne l\'application active', async () => {
    seed(apps, 'rec-b')

    const { wrapper } = await mountPage()

    const tabs = wrapper.findAll('.el-tabs__item')
    expect(tabs).toHaveLength(2)
    expect(tabs.map((t) => t.text())).toEqual(['Sales', 'Stock'])
    expect(wrapper.vm.selectedTab).toBe('rec-b')
  })

  it('navigue vers l\'application de l\'onglet clique', async () => {
    seed(apps, 'rec-a')

    const { wrapper, router } = await mountPage()
    await wrapper.findAll('.el-tabs__item')[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/main/rec-b')
  })

  it('bascule sur l\'onglet des rapports quand un rapport est genere', async () => {
    const withReports = [
      ...apps,
      app({ rec_id: 'rec-r', loc_title: 'Tasks', type: undefined, config: { controller: 'ReportTask' } }),
    ]
    seed(withReports, 'rec-a')

    const { wrapper } = await mountPage()
    globalBus.$emit('reportgenerated')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedTab).toBe('rec-r')
  })
})

describe('GenericComponent — bus et routage', () => {
  it('reemet en local les messages qui ne sont pas des notifications globales', async () => {
    seed()
    const local = vi.fn()
    localBus.$on('localmessagereceived', local)

    await mountPage()
    globalBus.$emit('messagereceived', { data: { notif_type: 'user', notif_title: 'x' } })

    expect(local).toHaveBeenCalledWith({ notif_type: 'user', notif_title: 'x' })
  })

  it('laisse les notifications globales a App.vue', async () => {
    seed()
    const local = vi.fn()
    localBus.$on('localmessagereceived', local)

    await mountPage()
    globalBus.$emit('messagereceived', { notif_type: 'global', notif_title: 'maintenance' })

    expect(local).not.toHaveBeenCalled()
  })

  it('se desabonne au demontage sans couper les autres abonnes du bus', async () => {
    seed()
    const other = vi.fn() // App.vue's listener, on the same event
    globalBus.$on('messagereceived', other)

    const { wrapper } = await mountPage()
    wrapper.unmount()

    globalBus.$emit('messagereceived', { notif_type: 'user' })

    expect(other).toHaveBeenCalledTimes(1)
  })

  it('recharge l\'application quand la route change de recid', async () => {
    const apps = [
      app({ rec_id: 'rec-a', loc_title: 'Sales' }),
      app({ rec_id: 'rec-b', loc_title: 'Stock', config: { api: 'stock' } }),
    ]
    seed(apps, 'rec-a')

    const { wrapper, router } = await mountPage()
    await router.push('/main/rec-b')
    await flushPromises()

    expect(store.state.activeApp.rec_id).toBe('rec-b')
    expect(wrapper.vm.selectedTab).toBe('rec-b')
    expect(wrapper.vm.loading).toBe(false)
  })

  it('ne recharge rien quand seul le sous-chemin change', async () => {
    seed()
    const { wrapper, router } = await mountPage()
    const commit = vi.spyOn(store, 'commit')

    await router.push('/main/rec-a')
    await flushPromises()

    expect(commit).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'changeApp' }))
    expect(wrapper.vm.loading).toBe(false)
  })
})
