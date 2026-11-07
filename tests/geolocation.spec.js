// @vitest-environment jsdom
/**
 * `vue-browser-geolocation` n'a pas de version Vue 3 : Form.vue utilise une promesse autour de
 * navigator.geolocation, qui est ce que ce module fournit.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { geolocation } from '@/utils/geolocation'

afterEach(() => {
  delete global.navigator.geolocation
})

describe('geolocation', () => {
  it('resout avec la position', async () => {
    const position = { coords: { latitude: 50.85, longitude: 4.35 } }
    global.navigator.geolocation = {
      getCurrentPosition: (ok) => ok(position),
    }
    await expect(geolocation.getCurrentPosition()).resolves.toEqual(position)
  })

  it('rejette quand le navigateur refuse', async () => {
    const error = new Error('refus')
    global.navigator.geolocation = {
      getCurrentPosition: (ok, ko) => ko(error),
    }
    await expect(geolocation.getCurrentPosition()).rejects.toThrow('refus')
  })

  it('rejette proprement quand l API est absente', async () => {
    delete global.navigator.geolocation
    await expect(geolocation.getCurrentPosition()).rejects.toThrow('not available')
  })
})
