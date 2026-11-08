// @vitest-environment jsdom
/**
 * `ESTableEditor` — l'editeur de table d'une application.
 *
 * 1 219 lignes, 0 % de couverture : c'est l'ecran ou l'on choisit l'index, les colonnes affichees,
 * les colonnes exportees, le champ de temps et la carte. Les tests figent ce que l'ecran fait de la
 * configuration recue, avant que la lecture du mapping n'en sorte (`utils/tableEditorFields.js`).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { mountView, resetStore } from '../helpers/mount-view'

import ESTableEditor from '@/components/appConfigEditor/ESTableEditor.vue'

/**
 * Un `esmapping/` : `response.data.data` est la **liste** des index, chacun avec son `obj`.
 * Le composant la donne telle quelle a `el-table`, d'ou la liste et non un objet.
 */
const MAPPING = [
  {
    index: 'deliveries*',
    obj: {
      mappings: {
        properties: {
          client: { type: 'keyword' },
          created: { type: 'date' },
          amount: { type: 'double' },
          address: { properties: { city: { type: 'keyword' }, geo: { type: 'geo_point' } } },
        },
      },
    },
  },
]

const mounted = []

afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
})

function appConfig(overrides = {}) {
  return {
    name: 'deliveries',
    config: {
      index: 'deliveries*',
      headercolumns: [{ field: 'client', title: 'Client' }],
      exportColumns: 'client->Client,created->Date',
      ...overrides,
    },
  }
}

async function mountEditor(overrides = {}, props = {}) {
  const result = await mountView(ESTableEditor, {
    props: {
      currentConfig: appConfig(overrides),
      allPrivileges: [],
      forcestep: 1,
      ...props,
    },
  })
  mounted.push(result.wrapper)
  return result
}

describe('ESTableEditor — ce que l\'ecran relit de la configuration', () => {
  beforeEach(() => {
    resetStore()
  })

  it('reprend le champ de temps configure', async () => {
    const { wrapper } = await mountEditor({ timefield: 'created' })

    expect(wrapper.vm.timefieldSelected).toBe('created')
  })

  it('n\'en prend aucun quand la configuration n\'en a pas', async () => {
    const { wrapper } = await mountEditor()

    expect(wrapper.vm.timefieldSelected).toBeNull()
  })

  it('reprend les colonnes affichees', async () => {
    const { wrapper } = await mountEditor()

    expect(wrapper.vm.fieldsToDisplay).toEqual(['client'])
  })

  it('relit les colonnes d\'export depuis la chaine de la configuration', async () => {
    const { wrapper } = await mountEditor()

    expect(wrapper.vm.currentConfig.config.tableFieldsToDownload).toEqual([
      { field: 'client', title: 'Client' },
      { field: 'created', title: 'Date' },
    ])
    expect(wrapper.vm.fieldsToDownload).toEqual(['client', 'created'])
  })

  it('se place a l\'etape demandee', async () => {
    const { wrapper } = await mountEditor({}, { forcestep: 3 })

    expect(wrapper.vm.step).toBe(3)
  })
})

describe('ESTableEditor — lecture du mapping', () => {
  beforeEach(() => {
    resetStore()
  })

  it('classe les champs, les dates et les geo_points', async () => {
    const { wrapper } = await mountEditor()

    wrapper.vm.esMapping = MAPPING
    wrapper.vm.computeFields()

    expect(Object.keys(wrapper.vm.allFields)).toEqual(
      expect.arrayContaining(['_id', '_index', 'client', 'created', 'amount', 'address.city', 'address.geo'])
    )
    expect(Object.keys(wrapper.vm.timeFields)).toEqual(['created', '_____________________', 'none'])
    expect(Object.keys(wrapper.vm.geoFields)).toEqual(['address.geo'])
    expect(wrapper.vm.noTimeField).toBe(false)
  })

  it('dit qu\'il n\'y a pas de champ de date quand le mapping n\'en a pas', async () => {
    const { wrapper } = await mountEditor()

    wrapper.vm.esMapping = [
      { index: 'x', obj: { mappings: { properties: { label: { type: 'text' } } } } },
    ]
    wrapper.vm.computeFields()

    expect(wrapper.vm.noTimeField).toBe(true)
    expect(wrapper.vm.timeFields).toEqual({})
  })

  it('vide les champs quand l\'index change', async () => {
    const { wrapper } = await mountEditor()
    wrapper.vm.esMapping = MAPPING
    wrapper.vm.computeFields()

    wrapper.vm.indexPatternChanged()

    expect(wrapper.vm.allFields).toEqual({})
    expect(wrapper.vm.timeFields).toEqual({})
    expect(wrapper.vm.geoFields).toEqual({})
  })

  it('propose des candidats latitude/longitude numeriques', async () => {
    const { wrapper } = await mountEditor()
    wrapper.vm.esMapping = MAPPING
    wrapper.vm.computeFields()

    // `address.city` est un `keyword` : il peut porter une coordonnee stockee en texte.
    expect(wrapper.vm.latLonFields).toEqual([
      { field: 'address.city' },
      { field: 'amount' },
      { field: 'client' },
    ])
  })
})

describe('ESTableEditor — champ de temps', () => {
  beforeEach(() => {
    resetStore()
  })

  it('ecrit le champ choisi dans la configuration', async () => {
    const { wrapper } = await mountEditor()

    wrapper.vm.timefieldSelected = 'created'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentConfig.config.timefield).toBe('created')
  })

  it('renoncer au filtre de temps efface le graphique et la periode', async () => {
    const { wrapper } = await mountEditor({ timefield: 'created' })
    wrapper.vm.currentConfig.graphicChecked = true
    wrapper.vm.currentConfig.timeSelectorChecked = true

    wrapper.vm.timefieldSelected = "I don't want to use the Time Filter"
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentConfig.config.timefield).toBeNull()
    expect(wrapper.vm.currentConfig.graphicChecked).toBe(false)
    expect(wrapper.vm.currentConfig.timeSelectorChecked).toBe(false)
  })
})

describe('ESTableEditor — listes de colonnes', () => {
  beforeEach(() => {
    resetStore()
  })

  it('garde le titre saisi quand le champ etait deja la, et ajoute les nouveaux', async () => {
    const { wrapper } = await mountEditor()
    wrapper.vm.esMapping = MAPPING
    wrapper.vm.computeFields()

    wrapper.vm.selectFieldsToDisplayChanged(['created', 'client'])

    expect(wrapper.vm.currentConfig.config.headercolumns).toEqual([
      { field: 'created', type: 'date', title: 'created' },
      { field: 'client', title: 'Client' },
    ])
  })

  it('vide la liste quand plus rien n\'est selectionne', async () => {
    const { wrapper } = await mountEditor()

    wrapper.vm.selectFieldsToDisplayChanged([])

    expect(wrapper.vm.currentConfig.config.headercolumns).toEqual([])
  })

  it('recopie l\'ordre des listes de glisser-deposer dans les champs suivis', async () => {
    const { wrapper } = await mountEditor()

    wrapper.vm.draggableChanged('display')
    expect(wrapper.vm.fieldsToDisplay).toEqual(['client'])

    wrapper.vm.currentConfig.config.tableFieldsToDownload = [{ field: 'created' }]
    wrapper.vm.draggableChanged('download')
    expect(wrapper.vm.fieldsToDownload).toEqual(['created'])
  })

  it('recopie les colonnes affichees vers l\'export', async () => {
    const { wrapper } = await mountEditor()

    wrapper.vm.copyFieldsToDisplayToDownload()

    expect(wrapper.vm.fieldsToDownload).toEqual(['client'])
  })

  it('remplace la colonne editee quand un lien est mis a jour', async () => {
    const { wrapper } = await mountEditor()

    wrapper.vm.linkUpdated({ field: 'client', title: 'Client', link: '/clients/{{id}}' })

    expect(wrapper.vm.currentConfig.config.headercolumns[0].link).toBe('/clients/{{id}}')
    expect(wrapper.vm.linkEditorVisible).toBe(false)
  })
})
