/**
 * Reading the mapping in the table editor (`utils/tableEditorFields.js`).
 *
 * These functions were recursive inside `ESTableEditor`, hence reachable only by mounting the
 * editor and giving it a complete mapping. Here each case — nested mapping, ES 6 mapping with an
 * intermediate type, index without a date, no `geo_point` — is an assertion.
 */

import { describe, it, expect } from 'vitest'

import {
  NO_TIME_FILTER,
  TIME_SELECTOR_PLACEHOLDERS,
  allFieldsAsList,
  exportColumnsFromTableFields,
  fieldsOf,
  flattenMapping,
  latLonCandidates,
  tableFieldsFromExportColumns,
  timefieldSelection,
  withTimeSelectors,
} from '@/utils/tableEditorFields.js'

/** A recent `esmapping/`: `mappings: { properties }`. */
const modernMapping = {
  'deliveries*': {
    obj: {
      mappings: {
        properties: {
          client: { type: 'keyword' },
          date: { type: 'date' },
          amount: { type: 'double' },
          address: {
            properties: {
              city: { type: 'keyword' },
              geo: { type: 'geo_point' },
            },
          },
        },
      },
    },
  },
}

describe('flattenMapping', () => {
  it('aplatit les proprietes imbriquees en chemins pointes', () => {
    const { allFields } = flattenMapping(modernMapping)

    expect(Object.keys(allFields)).toEqual(
      expect.arrayContaining(['address.city', 'address.geo', 'client', 'date', 'amount'])
    )
  })

  it('toujours les deux champs systeme', () => {
    const { allFields } = flattenMapping({})

    expect(allFields._id).toEqual({ field: '_id', type: '_id', title: '_id' })
    expect(allFields._index).toEqual({ field: '_index', type: '_index', title: '_index' })
  })

  it('classe les dates et les geo_points a part', () => {
    const { timeFields, geoFields } = flattenMapping(modernMapping)

    expect(Object.keys(timeFields)).toEqual(['date'])
    expect(Object.keys(geoFields)).toEqual(['address.geo'])
  })

  it('accepte un mapping ES 6, avec le type intermediaire', () => {
    const { allFields, timeFields } = flattenMapping({
      old: {
        obj: {
          mappings: {
            doc: { properties: { created: { type: 'date' }, label: { type: 'text' } } },
          },
        },
      },
    })

    expect(allFields.label).toEqual({ field: 'label', type: 'text', title: 'label' })
    expect(Object.keys(timeFields)).toEqual(['created'])
  })

  it('fusionne plusieurs index', () => {
    const { allFields } = flattenMapping({
      a: { obj: { mappings: { properties: { x: { type: 'keyword' } } } } },
      b: { obj: { mappings: { properties: { y: { type: 'keyword' } } } } },
    })

    expect(allFields.x.field).toBe('x')
    expect(allFields.y.field).toBe('y')
  })

  it('ignore une entree sans mapping', () => {
    const { allFields, noTimeField } = flattenMapping({ bug: { obj: null }, autre: {} })

    expect(Object.keys(allFields)).toEqual(['_id', '_index'])
    expect(noTimeField).toBe(true)
  })

  it('dit s\'il n\'y a aucun champ de date', () => {
    expect(flattenMapping(modernMapping).noTimeField).toBe(false)
    expect(flattenMapping({}).noTimeField).toBe(true)
  })
})

describe('withTimeSelectors', () => {
  it('ajoute les deux entrees de sortie quand l\'index a une date', () => {
    const selectors = withTimeSelectors({ date: { field: 'date', type: 'date' } })

    expect(selectors.date).toBeTruthy()
    expect(selectors['_____________________']).toEqual(TIME_SELECTOR_PLACEHOLDERS['_____________________'])
    expect(selectors.none.field).toBe(NO_TIME_FILTER)
  })

  it('n\'ajoute rien sans champ de date', () => {
    expect(withTimeSelectors({})).toEqual({})
  })

  it('ne modifie pas la liste recue', () => {
    const source = { date: { field: 'date' } }
    withTimeSelectors(source)

    expect(Object.keys(source)).toEqual(['date'])
  })
})

describe('allFieldsAsList', () => {
  it('rend la forme attendue par les selects', () => {
    expect(allFieldsAsList({ client: { field: 'client', type: 'keyword' } })).toEqual({
      client: { field: 'client' },
    })
  })

  it('supporte une liste vide', () => {
    expect(allFieldsAsList({})).toEqual({})
    expect(allFieldsAsList(undefined)).toEqual({})
  })
})

describe('latLonCandidates', () => {
  it('propose les champs numeriques et les keywords, par ordre alphabetique', () => {
    const candidates = latLonCandidates({
      b: { type: 'double' },
      a: { type: 'keyword' },
      z: { type: 'long' },
      texte: { type: 'text' },
      geo: { type: 'geo_point' },
    })

    expect(candidates).toEqual([{ field: 'a' }, { field: 'b' }, { field: 'z' }])
  })

  it('retombe sur tous les champs quand aucun n\'est du bon type', () => {
    expect(latLonCandidates({ texte: { type: 'text' } })).toEqual([{ field: 'texte' }])
  })

  it('rend une liste vide sans champ', () => {
    expect(latLonCandidates({})).toEqual([])
    expect(latLonCandidates(undefined)).toEqual([])
  })
})

describe('exportColumnsFromTableFields', () => {
  it('ecrit `champ->Titre`, joints par des virgules', () => {
    expect(
      exportColumnsFromTableFields([
        { field: 'client', title: 'Client' },
        { field: 'date', title: 'Date' },
      ])
    ).toBe('client->Client,date->Date')
  })

  it('rend une chaine vide pour une liste vide', () => {
    expect(exportColumnsFromTableFields([])).toBe('')
    expect(exportColumnsFromTableFields(undefined)).toBe('')
  })
})

describe('tableFieldsFromExportColumns', () => {
  it('relit ce que la configuration stocke', () => {
    expect(tableFieldsFromExportColumns('client->Client,date->Date')).toEqual([
      { field: 'client', title: 'Client' },
      { field: 'date', title: 'Date' },
    ])
  })

  it('laisse le titre vide quand il n\'y a pas de fleche', () => {
    expect(tableFieldsFromExportColumns('client')).toEqual([{ field: 'client', title: undefined }])
  })

  it('ignore les segments vides', () => {
    expect(tableFieldsFromExportColumns('client->Client,')).toEqual([
      { field: 'client', title: 'Client' },
    ])
  })

  it('supporte une chaine vide', () => {
    expect(tableFieldsFromExportColumns('')).toEqual([])
    expect(tableFieldsFromExportColumns(null)).toEqual([])
  })
})

describe('timefieldSelection', () => {
  it('retourne en arriere sans rien effacer sur l\'entree de service', () => {
    expect(timefieldSelection('_____________________')).toEqual({
      timefield: null,
      clearGraphic: false,
      backToNone: true,
    })
  })

  it('efface le graphique et la periode quand on renonce au filtre de temps', () => {
    expect(timefieldSelection(NO_TIME_FILTER)).toEqual({
      timefield: null,
      clearGraphic: true,
      backToNone: false,
    })
    expect(timefieldSelection(null).clearGraphic).toBe(true)
    expect(timefieldSelection('').clearGraphic).toBe(true)
  })

  it('retient le champ choisi', () => {
    expect(timefieldSelection('created')).toEqual({
      timefield: 'created',
      clearGraphic: false,
      backToNone: false,
    })
  })
})

describe('fieldsOf', () => {
  it('rend les noms des champs d\'une liste', () => {
    expect(fieldsOf([{ field: 'a', title: 'A' }, { field: 'b' }])).toEqual(['a', 'b'])
  })

  it('supporte une liste absente', () => {
    expect(fieldsOf(null)).toEqual([])
  })
})
