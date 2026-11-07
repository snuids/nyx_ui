// @vitest-environment jsdom
/**
 * QueryFilter — les filtres d'ecran, et la chaine de requete qui en sort.
 *
 * Ce composant transforme des champs de formulaire en requete Elasticsearch
 * (`field:"valeur" AND (*texte*)`). C'est une logique pure, sans rendu a verifier, et une erreur
 * ici ne se voit pas : l'ecran repond, avec les mauvaises lignes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import QueryFilter from '@/components/QueryFilter.vue'
import { resetStore, mountView } from '../helpers/mount-view'
import store from '@/store/store.js'

vi.mock('axios')

let logs

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  logs = vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  resetStore({
    apiurl: 'api/v1/',
    creds: { token: 'tok', user: { language: 'en' } },
    searchCache: {},
    timeRange: [new Date('2026-01-01'), new Date('2026-01-02')],
  })
})

afterEach(() => {
  logs.mockRestore()
  vi.useRealTimers()
})

const config = (queryfilters, overrides = {}) => ({
  rec_id: 'rec-1',
  type: 'generic-table',
  timeSelectorType: 'classic',
  config: { queryfilters, timefield: null, ...overrides },
})

const mountFilter = async (queryfilters, overrides = {}) => {
  const bar = await mountView(QueryFilter, {
    at: '/main/rec-1',
    props: { config: config(queryfilters, overrides) },
  })
  await vi.advanceTimersByTimeAsync(1100) // le throttle de `refresh` est de 1 s
  return bar
}

describe('QueryFilter — construction de la requete', () => {
  it('cherche un champ texte en joker, meme sans etoile saisie', async () => {
    // Comportement reel : un filtre `text` est encadre d'etoiles (recherche « contient »).
    const { wrapper } = await mountFilter([
      { title: 'Client', field: 'client', type: 'text', default: 'acme' },
    ])

    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual(['client:*acme*'])
  })

  it('accepte une valeur numerique comme valeur de filtre', async () => {
    // Avant la conversion en texte, un `default: 42` levait « valq.indexOf is not a function » et
    // l'ecran ne filtrait plus du tout.
    const { wrapper } = await mountFilter([
      { title: 'Montant', field: 'amount', type: 'text', default: 42 },
    ])

    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual(['amount:*42*'])
  })

  it('cherche en joker quand la valeur contient deja une etoile', async () => {
    const { wrapper } = await mountFilter([
      { title: 'Client', field: 'client', type: 'text', default: '*acme*' },
    ])

    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual(['client:*acme*'])
  })

  it('ignore un filtre texte vide', async () => {
    const { wrapper } = await mountFilter([
      { title: 'Client', field: 'client', type: 'text', default: '' },
      { title: 'Ville', field: 'city', type: 'text', default: 'Bruxelles' },
    ])

    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual(['city:*Bruxelles*'])
  })

  it('traite un champ texte global comme une recherche pleine', async () => {
    const { wrapper } = await mountFilter([
      { title: 'Chercher', field: 'all', type: 'globaltext', default: 'facture' },
    ])

    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual(['(*facture*)'])
  })

  it('inverse un selecteur dont la valeur commence par un tiret', async () => {
    const { wrapper } = await mountFilter([
      {
        title: 'Etat',
        field: 'status',
        type: 'selecter',
        selectOptions: ['-closed=Clos', 'open=Ouvert'],
      },
    ])

    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual(['-status:"closed"'])
  })

  it('perd l\'inversion sur un filtre texte, l\'etoile ajoutee passant devant', async () => {
    // Quirk a garder en tete : `-annule` devient `status:*-annule*`, donc une recherche, pas une
    // exclusion. Corriger changerait le sens des filtres deja enregistres dans `nyx_app`.
    const { wrapper } = await mountFilter([
      { title: 'Etat', field: 'status', type: 'text', default: '-annule' },
    ])

    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual(['status:*-annule*'])
  })

  it('echappe les espaces du nom de champ', async () => {
    const { wrapper } = await mountFilter([
      { title: 'Nom complet', field: 'nom complet', type: 'text', default: 'dupont' },
    ])

    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual(['nom\\ complet:*dupont*'])
  })

  it('prend la premiere option d\'un selecteur sans valeur par defaut', async () => {
    const { wrapper } = await mountFilter([
      {
        title: 'Etat',
        field: 'status',
        type: 'selecter',
        selectOptions: ['open=Ouvert', 'closed=Clos'],
      },
    ])

    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual(['status:"open"'])
  })

  it('assemble plusieurs filtres avec AND', async () => {
    const { wrapper } = await mountFilter([
      { title: 'Client', field: 'client', type: 'text', default: 'acme' },
      { title: 'Etat', field: 'status', type: 'text', default: 'ouvert' },
    ])

    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual([
      'client:*acme* AND status:*ouvert*',
    ])
  })

  it('retient la valeur de chaque filtre dans le cache de recherche', async () => {
    await mountFilter([
      { title: 'Client', field: 'client', type: 'text', default: 'acme' },
      { title: 'Etat', field: 'status', type: 'text', default: 'ouvert' },
    ])

    expect(store.state.searchCache['rec-1-Client']).toBe('acme')
    expect(store.state.searchCache['rec-1-Etat']).toBe('ouvert')
  })

  it('demande le telechargement dans le format choisi', async () => {
    const { wrapper } = await mountFilter([
      { title: 'Client', field: 'client', type: 'text', default: 'acme' },
    ])

    wrapper.vm.downloadSelection('csv')

    expect(wrapper.emitted('downloadasked')).toEqual([['csv']])
  })
})

describe('QueryFilter — donnees des filtres', () => {
  it('applique la valeur par defaut puis la derniere recherche', async () => {
    resetStore({
      apiurl: 'api/v1/',
      creds: { token: 'tok', user: { language: 'en' } },
      searchCache: { 'rec-1-Client': 'reprise' },
      timeRange: [new Date('2026-01-01'), new Date('2026-01-02')],
    })

    const { wrapper } = await mountFilter([
      { title: 'Client', field: 'client', type: 'text', default: 'defaut' },
    ])

    expect(wrapper.vm.queryFilterCopy[0].selected).toBe('reprise')
  })

  it('traduit les libelles des options d\'un selecteur', async () => {
    const { wrapper } = await mountFilter([
      {
        title: 'Etat',
        field: 'status',
        type: 'selecter',
        selectOptions: ['open=Ouvert', 'closed=Ferme'],
      },
    ])

    expect(wrapper.vm.queryFilterCopy[0].options).toEqual([
      { title: 'Ouvert', value: 'open' },
      { title: 'Ferme', value: 'closed' },
    ])
  })

  it('charge les valeurs d\'un selecteur dynamique avant de filtrer', async () => {
    // `queryselecter` : les valeurs viennent de l'API, pas de la configuration.
    axios.post.mockResolvedValue({
      data: {
        queryfilters: [
          {
            title: 'Client',
            field: 'client',
            type: 'queryselecter',
            buckets: [{ key: 'acme' }, { key: 'globex' }],
          },
        ],
      },
    })

    const { wrapper } = await mountFilter([
      { title: 'Client', field: 'client', type: 'queryselecter' },
    ])
    await flushPromises()
    await vi.advanceTimersByTimeAsync(1100)

    // Au premier chargement il n'y a pas encore de valeurs a joindre : la requete part avec la
    // seule periode (ici aucune, `timefield` n'est pas configure).
    expect(axios.post).toHaveBeenCalledWith('api/v1/queryFilter/rec-1?token=tok', {})
    // `*` est ajoute en tete pour offrir « pas de filtre ».
    expect(wrapper.vm.queryFilterCopy[0].buckets[0]).toEqual({ key: '*' })
    // `*` est justement la valeur « pas de filtre » : la requete reste vide.
    expect(wrapper.emitted('queryfilterchanged').pop()).toEqual([''])
  })

  it('joint la periode selectionnee a la requete de valeurs', async () => {
    axios.post.mockResolvedValue({ data: { queryfilters: [] } })

    await mountFilter([{ title: 'Client', field: 'client', type: 'queryselecter' }], {
      timefield: 'created',
    })
    await flushPromises()

    const body = axios.post.mock.calls[0][1]
    expect(body.timerange).toEqual([new Date('2026-01-01'), new Date('2026-01-02')])
  })
})
