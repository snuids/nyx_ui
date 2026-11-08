// @vitest-environment jsdom
/**
 * `ConfigDetails` — l'ecran de configuration d'une application.
 *
 * Il fait 1 476 lignes et n'etait couvert par rien : c'est l'ecran qui decide ce qui part a
 * l'enregistrement, et qui construit l'URL Kibana d'un tableau de bord. Les tests ci-dessous figent
 * ce comportement avant que la construction de l'URL ne sorte du composant.
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

// Chaque ecran monte est demonte apres son test : le store est un singleton, et un composant
// encore vivant se re-rend avec `appConfigObj` a null quand le test suivant le remet a zero.
const mounted = []

afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
})

/** Monte l'ecran avec ses enfants lourds remplaces : on teste ce composant, pas Ace ni le picker. */
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
    // une copie : modifier le formulaire ne touche pas la configuration d'origine
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

    // Le formulaire ajoute `queryfilters: []` a sa copie : les deux YAML different donc toujours,
    // meme sans intervention. C'est ce que compare `resolveSavedSource`, et c'est pourquoi
    // l'enregistrement relit le YAML.
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

    // L'URL complete, figee : c'est la garantie que l'extraction vers `utils/kibanaUrl.js` n'a rien
    // change a ce que Kibana recoit.
    expect(wrapper.vm.curConfig.config.url).toBe(
      "./kibananyx//app/kibana#/dashboard/dash-1?embed=true&_g=" +
        '(refreshInterval:(pause:!t,value:0),time:(from:now-7d,mode:quick,to:now))' +
        "&_a=(description:'Deliveries over time',filters:!(),fullScreenMode:!f,options:()" +
        ",panels:!(),query:(language:lucene,query:'*'),timeRestore:!f,title:Test,viewMode:view)"
    )
    // la periode retenue est recopiee dans la configuration, pour le champ du formulaire
    expect(wrapper.vm.curConfig.config.kibanaTime).toBe('from:now-7d,mode:quick,to:now')
  })
})
