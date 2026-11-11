// @vitest-environment jsdom
/**
 * `ConfigDetails` — the configuration screen of an application.
 *
 * It is 1,476 lines long and nothing covered it: it is the screen that decides what goes into a
 * save, and that builds a dashboard's Kibana URL. The tests below freeze that behaviour before the
 * URL construction moves out of the component.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { mountView, resetStore } from '../helpers/mount-view'

import ConfigDetails from '@/components/ConfigDetails.vue'

const APP = {
  rec_id: 'app-1',
  name: 'deliveries',
  icon: 'el-icon-s-order',
  category: 'Sales',
  subcategory: 'Deliveries',
  config: {
    index: 'deliveries*',
    controller: 'GenericTable',
    timefield: '@timestamp',
    headercolumns: [{ title: 'Client', field: 'client' }],
  },
  timeRefresh: false,
  timeRefreshValue: null,
}

const DASH = {
  id: 'dash-1',
  space: 'default',
  attributes: {
    description: 'Deliveries over time',
    panelsJSON: '[]',
  },
}

// Every mounted screen is unmounted after its test: the store is a singleton, and a component still
// alive re-renders with `appConfigObj` at null when the next test resets it.
const mounted = []

afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
})

/** Mounts the screen with its heavy children stubbed: we test this component, not Ace or the picker. */
async function mountDetails(overrides = {}) {
  const props = {
    currentConfig: JSON.parse(JSON.stringify(APP)),
    orgConfig: { _id: 'app-1', _source: JSON.parse(JSON.stringify(APP)) },
    isAdd: false,
    allPrivileges: [],
    ...overrides,
  }

  const mounted1 = await mountView(ConfigDetails, {
    props,
    stubs: {
      editor: true,
      FreeTextDetails: true,
      IconPicker: true,
      ESTableEditor: true,
      KibanaEditor: true,
      QueryFilterEditor: true,
    },
  })
  mounted.push(mounted1.wrapper)
  return mounted1
}

describe('ConfigDetails — mise en forme de la configuration', () => {
  beforeEach(() => {
    resetStore()
  })

  it('ouvre le dialogue et edite une copie de la configuration', async () => {
    const { wrapper } = await mountDetails()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.dialogFormVisible).toBe(true)
    expect(wrapper.vm.curConfig.name).toBe('deliveries')
    // a copy: editing the form does not touch the original configuration
    wrapper.vm.curConfig.name = 'autre'
    expect(wrapper.vm.currentConfig.name).toBe('deliveries')
  })

  it('cree les listes que le formulaire remplit', async () => {
    const { wrapper } = await mountDetails({
      currentConfig: { name: 'vide', config: {} },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.curConfig.config.queryfilters).toEqual([])
  })

  it('garde le YAML de reference et celui du formulaire', async () => {
    const { wrapper } = await mountDetails()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.strOrgRec).toContain('name: deliveries')
    expect(wrapper.vm.strNewRec).toContain('name: deliveries')

    // The form adds `queryfilters: []` to its copy, so the two YAMLs always differ, even with no
    // intervention. That is what `resolveSavedSource` compares, and why the save re-reads the YAML.
    expect(wrapper.vm.strNewRec).not.toBe(wrapper.vm.strOrgRec)
  })
})

describe('ConfigDetails — enregistrement', () => {
  beforeEach(() => {
    resetStore()
  })

  it('enregistre l\'objet du formulaire quand rien n\'a change', async () => {
    const { wrapper, store } = await mountDetails()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const commit = vi.spyOn(store, 'commit')
    await wrapper.vm.saveRecord()

    const call = commit.mock.calls.find(([payload]) => payload && payload.type === 'updateRecord')
    expect(call).toBeTruthy()
    expect(call[0].data._source.name).toBe('deliveries')
    expect(wrapper.emitted('dialogclose')).toBeTruthy()
  })

  it('enregistre le YAML quand l\'apercu a ete edite', async () => {
    const { wrapper, store } = await mountDetails()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    wrapper.vm.strNewRec = wrapper.vm.strNewRec.replace('name: deliveries', 'name: renomme')
    const commit = vi.spyOn(store, 'commit')
    await wrapper.vm.saveRecord()

    const call = commit.mock.calls.find(([payload]) => payload && payload.type === 'updateRecord')
    expect(call[0].data._source.name).toBe('renomme')
  })
})

describe('ConfigDetails — listes du formulaire', () => {
  beforeEach(() => {
    resetStore()
  })

  it('ajoute un champ a la liste des colonnes', async () => {
    const { wrapper } = await mountDetails()
    await wrapper.vm.$nextTick()

    wrapper.vm.handleAddField()
    expect(wrapper.vm.curConfig.config.headercolumns).toHaveLength(2)
    expect(wrapper.vm.curConfig.config.headercolumns[1]).toEqual({ title: 'title', field: 'field' })
  })

  it('supprime la colonne demandee et oublie la selection', async () => {
    const { wrapper } = await mountDetails()
    await wrapper.vm.$nextTick()

    wrapper.vm.currentHeader = { field: 'client' }
    wrapper.vm.handleDeleteHeader(0)

    expect(wrapper.vm.curConfig.config.headercolumns).toEqual([])
    expect(wrapper.vm.currentHeader).toEqual({})
  })

  it('ajoute et supprime un filtre d\'ecran', async () => {
    const { wrapper } = await mountDetails()
    await wrapper.vm.$nextTick()

    wrapper.vm.handleAddQueryFilterField()
    expect(wrapper.vm.curConfig.config.queryfilters).toHaveLength(1)

    wrapper.vm.handleDeleteQueryFilter(0)
    expect(wrapper.vm.curConfig.config.queryfilters).toEqual([])
  })
})

describe('ConfigDetails — autocompletion du menu', () => {
  beforeEach(() => {
    resetStore({
      filteredmenus: [
        { category: 'Sales', submenus: [{ loc_title: 'Deliveries' }, { loc_title: 'Invoices' }] },
        { category: 'Support', submenus: [{ loc_title: 'Tickets' }] },
      ],
    })
  })

  it('propose les categories du menu', async () => {
    const { wrapper } = await mountDetails()
    const cb = vi.fn()

    wrapper.vm.categorySuggestion('', cb)
    expect(cb).toHaveBeenCalledWith([{ value: 'Sales' }, { value: 'Support' }])
  })

  it('propose les sous-categories de la categorie choisie', async () => {
    const { wrapper } = await mountDetails()
    await wrapper.vm.$nextTick()
    wrapper.vm.curConfig.category = 'Sales'
    const cb = vi.fn()

    wrapper.vm.subcategorySuggestion('', cb)
    expect(cb).toHaveBeenCalledWith([{ value: 'Deliveries' }, { value: 'Invoices' }])
  })
})

describe('ConfigDetails — URL du tableau de bord Kibana', () => {
  beforeEach(() => {
    resetStore()
  })

  it('construit l\'URL depuis le tableau de bord selectionne', async () => {
    const { wrapper } = await mountDetails()
    await wrapper.vm.$nextTick()

    wrapper.vm.selectedDash = DASH
    wrapper.vm.computeUrlFromKibana()

    // The full URL, frozen: it guarantees that the extraction to `utils/kibanaUrl.js` changed
    // nothing in what Kibana receives.
    expect(wrapper.vm.curConfig.config.url).toBe(
      "./kibananyx//app/kibana#/dashboard/dash-1?embed=true&_g=" +
        '(refreshInterval:(pause:!t,value:0),time:(from:now-7d,mode:quick,to:now))' +
        "&_a=(description:'Deliveries over time',filters:!(),fullScreenMode:!f,options:()" +
        ",panels:!(),query:(language:lucene,query:'*'),timeRestore:!f,title:Test,viewMode:view)"
    )
    // the selected period is copied back into the configuration, for the form field
    expect(wrapper.vm.curConfig.config.kibanaTime).toBe('from:now-7d,mode:quick,to:now')
  })
})
