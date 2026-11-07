// @vitest-environment jsdom
/**
 * Map — le plan Leaflet d'une table Elasticsearch.
 *
 * Ce composant n'a aucune feuille de style pour le sauver : il **peint**, et deux defauts y ont ete
 * signales coup sur coup. Le premier etait fatal et silencieux — sans zoom ni centre configures (tous
 * deux facultatifs), `L.latLng(undefined, undefined)` leve, la couche de tuiles recoit `zoom:
 * undefined` et ne calcule plus rien : fond gris, aucun marqueur. Le second venait du volume : mille
 * documents sur une douzaine de positions empilaient mille icones et bloquaient l'onglet.
 *
 * Les tests portent donc sur ce que le composant **decide** — zoom et centre de repli, cadrage sur les
 * marqueurs, un marqueur par position, plafond — et non sur le rendu des tuiles.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

import Map from '@/components/Map.vue'
import { resetStore, mountView } from '../helpers/mount-view'

vi.mock('axios')

const config = (payload = {}) => ({
  rec_id: 'rec-map',
  type: 'generic-table',
  config: {
    index: 'house*',
    maplatfield: 'location.lat',
    maplonfield: 'location.lon',
    ...payload,
  },
})

const doc = (id, source) => ({ _id: id, _index: 'house', _source: source })
const withPosition = (id, lat, lon) => doc(id, { location: { lat, lon } })

const stubs = { LMap: true, LTileLayer: true, LMarker: true }

async function mountMap(tableData, payload = {}, extraStubs = {}) {
  const mounted = await mountView(Map, {
    at: '/main/rec-map',
    props: { config: config(payload), tableData },
    stubs: { ...stubs, ...extraStubs },
  })
  await flushPromises()
  return mounted
}

/**
 * `LMap` remplace : le composant lit `this.$refs.mapRef.leafletObject`, donc le double doit exposer
 * cette instance — la carte Leaflet elle-meme a besoin d'une vraie mise en page.
 */
function mapStub(map) {
  return { template: '<div class="l-map-stub" />', data: () => ({ leafletObject: map }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  resetStore({ apiurl: 'api/v1/', creds: { token: 'tok', user: { language: 'en', privileges: ['user'] } } })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Map — cadrage par defaut', () => {
  it('se donne un zoom et un centre valides quand l\'editeur n\'en fixe aucun', async () => {
    const { wrapper } = await mountMap([withPosition('1', 50.85, 4.35)])

    // Leaflet leve sur `L.latLng(undefined, undefined)`, et un zoom `undefined` laisse la couche de
    // tuiles sans vue a calculer : fond gris, aucun marqueur.
    expect(wrapper.vm.zoom).toBe(2)
    expect({ lat: wrapper.vm.center.lat, lng: wrapper.vm.center.lng }).toEqual({ lat: 0, lng: 0 })
    expect(wrapper.vm.explicitCenter).toBe(false)
  })

  it('respecte le zoom et le centre choisis dans l\'editeur', async () => {
    const { wrapper } = await mountMap([withPosition('1', 50.85, 4.35)],
      { mapzoom: 13, maplat: 50.85, maplong: 4.35 })

    expect(wrapper.vm.zoom).toBe(13)
    expect(wrapper.vm.explicitCenter).toBe(true)
    expect({ lat: wrapper.vm.center.lat, lng: wrapper.vm.center.lng }).toEqual({ lat: 50.85, lng: 4.35 })
  })
})

describe('Map — marqueurs', () => {
  it('place un marqueur par document quand les positions diffèrent', async () => {
    const { wrapper } = await mountMap([
      withPosition('1', 50.85, 4.35),
      withPosition('2', 51.05, 3.72),
    ])

    expect(wrapper.vm.markers.length).toBe(2)
    expect(wrapper.vm.markers[0].latlng.lat).toBe(50.85)
    expect(wrapper.vm.markers[0].id).toBe('1')
  })

  it('ne garde qu\'un marqueur par position', async () => {
    // Mille documents sur trois positions empilaient mille icones : l'onglet ne repondait plus.
    const many = []
    for (let i = 0; i < 50; i += 1) many.push(withPosition('id-' + i, 50.85, 4.35))
    many.push(withPosition('other', 51.05, 3.72))

    const { wrapper } = await mountMap(many)

    expect(wrapper.vm.markers.length).toBe(2)
    expect(wrapper.vm.markers[0].id).toBe('id-0', 'le premier document de la position est garde')
  })

  it('ignore un document sans coordonnees', async () => {
    const { wrapper } = await mountMap([
      withPosition('1', 50.85, 4.35),
      doc('2', { location: { lat: 50.9 } }),
      doc('3', { other: true }),
    ])

    expect(wrapper.vm.markers.length).toBe(1)
  })

  it('plafonne le nombre de documents examines', async () => {
    const many = []
    for (let i = 0; i < 900; i += 1) many.push(withPosition('id-' + i, 40 + i / 1000, 4 + i / 1000))

    const { wrapper } = await mountMap(many)

    expect(wrapper.vm.markers.length).toBeLessThanOrEqual(501)
  })
})

describe('Map — cadrage sur les marqueurs', () => {
  function fakeMap() {
    return { setView: vi.fn(), fitBounds: vi.fn() }
  }

  it('cadre tout seul sur le seul marqueur quand aucun centre n\'est impose', async () => {
    const map = fakeMap()
    // `prepareData` appelle `fitToMarkers` apres le montage : c'est ce cadrage la qui compte, sans
    // quoi la carte s'ouvre sur un point arbitraire et le marqueur est hors champ.
    const { wrapper } = await mountMap([withPosition('1', 50.85, 4.35)], {}, { LMap: mapStub(map) })
    await flushPromises()

    expect(wrapper.vm.markers.length).toBe(1)
    expect(map.setView).toHaveBeenCalledTimes(1)
    expect(map.setView.mock.calls[0][0].lat).toBe(50.85)
    expect(map.setView.mock.calls[0][1]).toBe(13)
    expect(map.fitBounds).not.toHaveBeenCalled()
  })

  it('englobe tous les marqueurs des qu\'il y en a plusieurs', async () => {
    const map = fakeMap()
    const { wrapper } = await mountMap([
      withPosition('1', 50.85, 4.35),
      withPosition('2', 51.05, 3.72),
    ], {}, { LMap: mapStub(map) })
    await flushPromises()

    expect(wrapper.vm.markers.length).toBe(2)
    expect(map.fitBounds).toHaveBeenCalledTimes(1)
    expect(map.setView).not.toHaveBeenCalled()
  })

  it('ne recadre pas quand l\'editeur impose un centre', async () => {
    const map = fakeMap()
    await mountMap([withPosition('1', 50.85, 4.35)],
      { maplat: 50.85, maplong: 4.35 }, { LMap: mapStub(map) })
    await flushPromises()

    expect(map.setView).not.toHaveBeenCalled()
    expect(map.fitBounds).not.toHaveBeenCalled()
  })

  it('ne fait rien sans marqueur', async () => {
    const map = fakeMap()
    await mountMap([], {}, { LMap: mapStub(map) })
    await flushPromises()

    expect(map.setView).not.toHaveBeenCalled()
    expect(map.fitBounds).not.toHaveBeenCalled()
  })

  it('ne fait rien tant que la carte n\'existe pas', async () => {
    // Avant que Leaflet soit pret, `$refs.mapRef` est undefined : la methode doit sortir sans bruit.
    const { wrapper } = await mountMap([withPosition('1', 50.85, 4.35)])
    expect(() => wrapper.vm.fitToMarkers()).not.toThrow()
  })
})
