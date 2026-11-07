import { describe, expect, it } from 'vitest'
import { resolveLatLng } from '../src/utils/mapCoords'

describe('map coordinates', () => {
  it('uses the two configured fields', () => {
    const record = { message: { latitude: 50.85, longitude: 4.35 }, other: 'x' }
    expect(resolveLatLng(record, { maplatfield: 'message.latitude', maplonfield: 'message.longitude' }))
      .toEqual([50.85, 4.35])
  })

  it('accepts coordinates stored as text', () => {
    expect(resolveLatLng({ lat: '50.85', lon: '4.35' },
      { maplatfield: 'lat', maplonfield: 'lon' })).toEqual(['50.85', '4.35'])
  })

  it('prefers the two fields over the geo field', () => {
    const record = { position: { lat: 1, lon: 2 }, lat: 50, lon: 4 }
    expect(resolveLatLng(record, { mapfield: 'position', maplatfield: 'lat', maplonfield: 'lon' }))
      .toEqual([50, 4])
  })

  it('falls back to the geo_point, as an object or as a string', () => {
    expect(resolveLatLng({ p: { lat: 47.4, lon: -1.2 } }, { mapfield: 'p' })).toEqual([47.4, -1.2])
    expect(resolveLatLng({ p: '47.4,-1.2' }, { mapfield: 'p' })).toEqual(['47.4', '-1.2'])
  })

  it('draws nothing when a coordinate is missing', () => {
    const twoFields = { maplatfield: 'lat', maplonfield: 'lon' }
    expect(resolveLatLng({ lat: 50 }, twoFields)).toBeNull()
    expect(resolveLatLng({ lat: '', lon: 4 }, twoFields)).toBeNull()
    expect(resolveLatLng({ lat: null, lon: null }, twoFields)).toBeNull()
    expect(resolveLatLng({ p: { lat: 47.4 } }, { mapfield: 'p' })).toBeNull()
    expect(resolveLatLng({ p: '47.4' }, { mapfield: 'p' })).toBeNull()
    expect(resolveLatLng({}, {})).toBeNull()
  })
})
