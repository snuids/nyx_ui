/**
 * La requete Elasticsearch des ecrans generiques (`utils/esQuery.js`).
 *
 * Ces fonctions etaient dans `GenericTable.loadData` : les tester demandait de monter l'ecran, de
 * mocker `axios` et de lire le corps envoye. Ici c'est un module pur — environnement `node`, pas de
 * DOM ni de composant — donc chaque branche coute une ligne et les cas limites (plage absente,
 * compte sans identifiant, export) se testent pour de bon.
 */

import { describe, it, expect } from 'vitest'

import {
  buildSearchQuery,
  genericSearchUrl,
  resolveTimeRange,
} from '@/utils/esQuery.js'

const RANGE = [new Date('2026-03-01T00:00:00Z'), new Date('2026-03-08T00:00:00Z')]

/** Configuration d'un ecran generique, comme `GenericTable` la recoit. */
const screen = (overrides = {}, payload = {}) => ({
  queryBarChecked: false,
  queryFilterChecked: false,
  graphicChecked: false,
  timeSelectorType: 'classic',
  ...overrides,
  config: {
    index: 'deliveries',
    timefield: null,
    headercolumns: [],
    ...payload,
  },
})

const mustOf = (query) => query.query.bool.must

describe('resolveTimeRange', () => {
  it('suit le selecteur de periode de l\'ecran', () => {
    const ranges = {
      classic: RANGE,
      autoClassic: '20m',
      day: ['d-start', 'd-end'],
      autoDay: '1m',
      week: ['w-start', 'w-end'],
      autoWeek: '4h',
      month: ['m-start', 'm-end'],
      autoMonth: '1d',
      year: ['y-start', 'y-end'],
      autoYear: '1w',
    }

    expect(resolveTimeRange('day', ranges)).toEqual({ range: ['d-start', 'd-end'], interval: '1m' })
    expect(resolveTimeRange('week', ranges)).toEqual({ range: ['w-start', 'w-end'], interval: '4h' })
    expect(resolveTimeRange('month', ranges)).toEqual({ range: ['m-start', 'm-end'], interval: '1d' })
    expect(resolveTimeRange('year', ranges)).toEqual({ range: ['y-start', 'y-end'], interval: '1w' })
  })

  it('retombe sur la periode classique quand le selecteur est absent ou inconnu', () => {
    const ranges = { classic: RANGE, autoClassic: '20m' }

    expect(resolveTimeRange(undefined, ranges)).toEqual({ range: RANGE, interval: '20m' })
    expect(resolveTimeRange('trimestre', ranges)).toEqual({ range: RANGE, interval: '20m' })
  })
})

describe('genericSearchUrl', () => {
  const base = {
    apiurl: 'api/v1/',
    index: 'deliveries*',
    token: 'tok',
    exportformat: 'xlsx',
  }

  it('construit l\'URL de recherche, sans doc_type quand il n\'est pas configure', () => {
    expect(genericSearchUrl(base)).toBe(
      'api/v1/generic_search/deliveries*?token=tok&download=0&output=xlsx'
    )
  })

  it('passe download=1 pour un export', () => {
    expect(genericSearchUrl({ ...base, download: true })).toContain('&download=1')
  })

  it('ajoute doc_type seulement s\'il est renseigne', () => {
    expect(genericSearchUrl({ ...base, docType: 'invoice' })).toContain('&doc_type=invoice')
    expect(genericSearchUrl({ ...base, docType: '' })).not.toContain('doc_type')
  })
})

describe('buildSearchQuery — periode', () => {
  it('n\'ajoute aucune clause de temps quand l\'ecran ne declare pas de champ de date', () => {
    const { query } = buildSearchQuery({ config: screen(), timeRange: RANGE })

    expect(mustOf(query)).toEqual([{ match_all: {} }])
  })

  it('borne la periode sur le champ configure, en epoch millis', () => {
    const { query } = buildSearchQuery({
      config: screen({}, { timefield: '@timestamp' }),
      timeRange: RANGE,
    })

    expect(mustOf(query)[1]).toEqual({
      range: {
        '@timestamp': { gte: RANGE[0].getTime(), lte: RANGE[1].getTime(), format: 'epoch_millis' },
      },
    })
  })

  it('retombe sur les dernieres 24 h quand le store n\'a pas de plage', () => {
    const { query } = buildSearchQuery({
      config: screen({}, { timefield: '@timestamp' }),
      timeRange: null,
    })

    expect(mustOf(query)[1]).toEqual({
      range: { '@timestamp': { gte: 'now-1d', lte: 'now', format: 'epoch_millis' } },
    })
  })

  it('ajoute l\'agregation horaire quand l\'ecran a un graphique', () => {
    const { query } = buildSearchQuery({
      config: screen({ graphicChecked: true }, { timefield: '@timestamp' }),
      timeRange: RANGE,
      interval: '4h',
    })

    expect(query.aggs['2'].date_histogram).toEqual({
      field: '@timestamp',
      interval: '4h',
      time_zone: 'Europe/Berlin',
      min_doc_count: 1,
    })
  })

  it('n\'agrege pas sans plage de temps, meme avec un graphique', () => {
    const { query } = buildSearchQuery({
      config: screen({ graphicChecked: true }, { timefield: '@timestamp' }),
      timeRange: null,
      interval: '4h',
    })

    expect(query.aggs).toBeUndefined()
  })
})

describe('buildSearchQuery — recherche', () => {
  it('envoie la recherche libre de la barre quand elle est affichee', () => {
    const { query, queryText } = buildSearchQuery({
      config: screen({ queryBarChecked: true }),
      queryField: 'facture',
    })

    expect(queryText).toBe('facture')
    expect(mustOf(query)[1]).toEqual({
      query_string: { query: 'facture', analyze_wildcard: true, default_field: '*' },
    })
  })

  it('ignore la saisie quand la barre n\'est pas affichee', () => {
    const { query, queryText } = buildSearchQuery({
      config: screen({ queryBarChecked: false }),
      queryField: 'facture',
    })

    expect(queryText).toBe('')
    expect(mustOf(query)).toHaveLength(1)
  })

  it('substitue les jetons de la requete cachee', () => {
    const { queryText } = buildSearchQuery({
      config: screen({}, { hiddenQuery: 'owner:{{login}} AND tenant:{{id}}' }),
      user: { id: 'u-1', login: 'alice' },
    })

    expect(queryText).toBe('owner:alice AND tenant:u-1')
  })

  it('n\'ecrit pas « undefined » quand le compte n\'a pas d\'identifiant', () => {
    const { queryText } = buildSearchQuery({
      config: screen({}, { hiddenQuery: 'tenant:{{id}}' }),
      user: {},
    })

    expect(queryText).toBe('tenant:')
  })

  it('combine requete cachee et recherche libre, puis le filtre d\'ecran', () => {
    const { queryText } = buildSearchQuery({
      config: screen({ queryBarChecked: true, queryFilterChecked: true }, { hiddenQuery: 'tenant:acme' }),
      queryField: 'facture',
      queryfilter: 'status:"open"',
    })

    // Le filtre d'ecran est ajoute apres coup, d'ou le groupement imbrique : sans consequence
    // pour `query_string`, mais c'est la forme envoyee (et celle que `GenericTable` testait deja).
    expect(queryText).toBe('((tenant:acme) AND (facture)) AND (status:"open")')
  })

  it('ignore le filtre d\'ecran quand l\'ecran ne l\'affiche pas', () => {
    const { queryText } = buildSearchQuery({
      config: screen({ queryFilterChecked: false }),
      queryfilter: 'status:"open"',
    })

    expect(queryText).toBe('')
  })

  it('n\'envoie pas de query_string quand il n\'y a rien a chercher', () => {
    const { query } = buildSearchQuery({ config: screen({ queryBarChecked: true }) })

    expect(mustOf(query).some((clause) => clause.query_string)).toBe(false)
  })
})

describe('buildSearchQuery — tri, pagination, export', () => {
  it('trie sur le champ configure, en descendant quand orderDirection est pose', () => {
    const ascending = buildSearchQuery({ config: screen({}, { orderField: 'created' }) })
    const descending = buildSearchQuery({
      config: screen({}, { orderField: 'created', orderDirection: 'desc' }),
    })

    expect(ascending.query.sort).toEqual([{ created: { order: 'asc' } }])
    expect(descending.query.sort).toEqual([{ created: { order: 'desc' } }])
  })

  it('laisse le tri de l\'utilisateur l\'emporter sur celui de la configuration', () => {
    const { query } = buildSearchQuery({
      config: screen({}, { orderField: 'created' }),
      sort: { client: { order: 'asc' } },
    })

    expect(query.sort).toEqual([{ client: { order: 'asc' } }])
  })

  it('pagine sur la page courante et la taille demandee', () => {
    const { query } = buildSearchQuery({ config: screen(), pagesize: 200, currentPage: 3 })

    expect(query.size).toBe(200)
    expect(query.extra).toEqual({ currentpage: 3, pagesize: 200 })
  })

  it('demande 10 000 lignes pour un export', () => {
    const { query } = buildSearchQuery({ config: screen(), download: true })

    expect(query.size).toBe(10000)
  })

  it('garde la liste de colonnes de l\'export avec la pagination', () => {
    const { query } = buildSearchQuery({
      config: screen({}, { exportColumns: 'client,date' }),
      download: true,
      pagesize: 100,
      currentPage: 2,
    })

    expect(query.extra).toEqual({ exportColumns: 'client,date', currentpage: 2, pagesize: 100 })
  })
})
