/**
 * Les valeurs des parametres d'un rapport (`utils/reportParameters.js`).
 *
 * `ReportGenerator` et `ReportPeriodicEditor` portaient la meme methode `getESValues`, recopiee a
 * l'identique — 110 lignes chacune, dans deux composants a 0 % de couverture. La requete, l'URL et
 * la lecture de la reponse se testent ici ; l'appel `axios` reste dans les composants.
 */

import { describe, it, expect } from 'vitest'

import {
  buildParameterValuesQuery,
  parameterValuesUrl,
  rangeShortcut,
  valuesFromBuckets,
  visibleParameters,
} from '@/utils/reportParameters.js'

const PARAM = {
  escomboindex: 'deliveries*',
  escombokey: 'client',
  usetimestamp: false,
  timestampfield: 'created',
  useboolean: false,
  booleanfield: 'archived',
}

const DAY = { start: new Date('2026-03-01T10:00:00Z'), end: new Date('2026-03-07T10:00:00Z') }
const FIXED = new Date('2026-04-15T08:00:00Z')

describe('buildParameterValuesQuery — agrégation seule', () => {
  it('demande les valeurs distinctes du champ, sans filtre', () => {
    const query = buildParameterValuesQuery({ par: PARAM })

    expect(query).toEqual({
      size: 0,
      aggs: { values_uniques: { terms: { field: 'client', size: 10000 } } },
    })
  })
})

describe('buildParameterValuesQuery — bornes de temps', () => {
  it('borne sur la période choisie, fin de journée incluse', () => {
    const query = buildParameterValuesQuery({
      par: { ...PARAM, usetimestamp: true },
      interval: true,
      intervalValue: { start: DAY.start, end: new Date(DAY.end) },
    })

    const range = query.query.bool.must[0].range.created
    expect(range.gte).toBe(DAY.start.toISOString())
    // `setHours` travaille en heure locale : la fin de journée est 23:59:59.999 *locale*.
    const end = new Date(range.lte)
    expect([end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds()]).toEqual([
      23, 59, 59, 999,
    ])
  })

  it('borne sur la date fixe', () => {
    const query = buildParameterValuesQuery({
      par: { ...PARAM, usetimestamp: true },
      fixdate: true,
      fixdateValue: new Date(FIXED),
    })

    const range = query.query.bool.must[0].range.created
    expect(range.gte).toBe(FIXED.toISOString())
    expect(new Date(range.lte).getHours()).toBe(23)
  })

  it('laisse la date fixe l\'emporter quand les deux sont demandées', () => {
    const query = buildParameterValuesQuery({
      par: { ...PARAM, usetimestamp: true },
      interval: true,
      fixdate: true,
      intervalValue: { start: DAY.start, end: new Date(DAY.end) },
      fixdateValue: new Date(FIXED),
    })

    expect(query.query.bool.must).toHaveLength(1)
    expect(query.query.bool.must[0].range.created.gte).toBe(FIXED.toISOString())
  })

  it('n\'ajoute aucune borne sans champ de temps déclaré', () => {
    const query = buildParameterValuesQuery({
      par: PARAM,
      interval: true,
      intervalValue: { start: DAY.start, end: new Date(DAY.end) },
    })

    expect(query.query).toBeUndefined()
  })
})

describe('buildParameterValuesQuery — champ booléen', () => {
  it('complète la clause de temps quand il y en a une', () => {
    const query = buildParameterValuesQuery({
      par: { ...PARAM, usetimestamp: true, useboolean: true },
      fixdate: true,
      fixdateValue: new Date(FIXED),
    })

    expect(query.query.bool.must[0].range).toBeTruthy()
    expect(query.query.bool.must[1]).toEqual({ term: { archived: true } })
  })

  it('crée la clause à lui seul quand il n\'y a pas de temps', () => {
    const query = buildParameterValuesQuery({ par: { ...PARAM, useboolean: true } })

    expect(query.query).toEqual({ bool: { must: [{ term: { archived: true } }] } })
  })

  it('ne pose pas de booléen quand le paramètre ne le demande pas', () => {
    expect(buildParameterValuesQuery({ par: PARAM }).query).toBeUndefined()
  })
})

describe('parameterValuesUrl', () => {
  it('vise la recherche générique de l\'index, avec le jeton', () => {
    expect(
      parameterValuesUrl({ apiurl: 'api/v1/', token: 'tok', index: 'deliveries*' })
    ).toBe('api/v1/generic_search/deliveries*?token=tok')
  })
})

describe('valuesFromBuckets', () => {
  it('rend les clés triées', () => {
    expect(
      valuesFromBuckets({
        aggs: { values_uniques: { buckets: [{ key: 'z' }, { key: 'a' }, { key: 'm' }] } },
      })
    ).toEqual(['a', 'm', 'z'])
  })

  it('rend une liste vide quand Elasticsearch n\'a rien agrégé', () => {
    expect(valuesFromBuckets({})).toEqual([])
    expect(valuesFromBuckets(null)).toEqual([])
    expect(valuesFromBuckets({ aggs: { values_uniques: {} } })).toEqual([])
  })

  it('rend une liste vide pour un index sans document', () => {
    expect(valuesFromBuckets({ aggs: { values_uniques: { buckets: [] } } })).toEqual([])
  })
})

describe('visibleParameters', () => {
  it('écarte les paramètres masqués', () => {
    expect(
      visibleParameters([{ name: 'a' }, { name: 'b', hidden: true }, { name: 'c' }])
    ).toEqual([{ name: 'a' }, { name: 'c' }])
  })

  it('supporte une liste absente', () => {
    expect(visibleParameters(undefined)).toEqual([])
  })
})

describe('rangeShortcut', () => {
  const now = new Date('2026-03-10T15:30:00Z')

  it('recule du nombre de jours demandé', () => {
    const [start, end] = rangeShortcut('7d', now)

    expect(end).toEqual(now)
    expect(start.toISOString()).toBe('2026-03-03T15:30:00.000Z')
  })

  it('gère les quatre durées', () => {
    expect(rangeShortcut('1d', now)[0].toISOString()).toBe('2026-03-09T15:30:00.000Z')
    expect(rangeShortcut('30d', now)[0].toISOString()).toBe('2026-02-08T15:30:00.000Z')
    expect(rangeShortcut('90d', now)[0].toISOString()).toBe('2025-12-10T15:30:00.000Z')
  })

  it('prend la journée entière pour « aujourd\'hui »', () => {
    const [start, end] = rangeShortcut('today', now)

    expect(start.getHours()).toBe(0)
    expect(end.getTime() - start.getTime()).toBe(24 * 3600 * 1000)
  })

  it('ne rend pas les mêmes objets que la date reçue', () => {
    const [start] = rangeShortcut('1d', now)
    start.setTime(0)

    expect(now.getTime()).not.toBe(0)
  })
})
