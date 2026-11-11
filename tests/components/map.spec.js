// @vitest-environment jsdom
/**
 * Map — the Leaflet map of an Elasticsearch table.
 *
 * This component has no stylesheet to save it: it **paints**, and two defects were reported there in
 * quick succession. The first was fatal and silent — with no zoom or centre configured (both
 * optional), `L.latLng(undefined, undefined)` throws, the tile layer receives `zoom: undefined` and
 * computes nothing more: grey background, no marker. The second came from volume: a thousand
 * documents over a dozen positions piled up a thousand icons and froze the tab.
 *
 * The tests therefore bear on what the component **decides** — fallback zoom and centre, framing on
 * the markers, one marker per position, cap — and not on how tiles render.
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
 * `LMap` replaced: the component reads `this.$refs.mapRef.leafletObject`, so the double must expose
 * that instance — a real Leaflet map needs a real layout.
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

    // Leaflet throws on `L.latLng(undefined, undefined)`, and an `undefined` zoom leaves the tile
    // layer with no view to compute: grey background, no marker.
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
    // A thousand documents over three positions piled up a thousand icons: the tab stopped responding.
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
    // `prepareData` calls `fitToMarkers` after mounting: that framing is the one that matters,
    // without it the map opens on an arbitrary point and the marker is out of view.
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
    // Before Leaflet is ready, `$refs.mapRef` is undefined: the method must return quietly.
    const { wrapper } = await mountMap([withPosition('1', 50.85, 4.35)])
    expect(() => wrapper.vm.fitToMarkers()).not.toThrow()
  })
})
