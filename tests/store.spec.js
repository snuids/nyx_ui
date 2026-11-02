/**
 * The console store: session, privileges, menus, time ranges.
 *
 * It is the most central module of the interface — `hasPrivilege` decides what a user sees,
 * `filteredmenus` builds the routes (`value`/`fulltitle`), and `setTimeRange` chooses the
 * aggregation interval sent to Elasticsearch. None of this was tested: regressions only showed
 * on screen, for a user who does not have the same privileges.
 *
 * The store is a Vuex singleton: every test starts from a fresh state via `replaceState`,
 * otherwise the execution order becomes significant.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import store from '@/store/store.js'
import packageJson from '../package.json'

function freshState() {
  return {
    apiurl: 'api/v1/',
    apiVersion: '',
    kibanaurl: '/kibana/',
    version: `v${packageJson.version}`,
    devMode: false,
    menus: [],
    menuOpen: true,
    apps: [],
    currentSubCategory: null,
    activeApp: null,
    creds: {},
    timeRange: null,
    timeRangeWeek: null,
    timeRangeMonth: null,
    timeRangeYear: null,
    timeRangeDay: null,
    lastTimeRangeEvent: null,
    initialized: false,
    elasticVersion: 0,
    filteredmenus: [],
    autoTime: '10m',
    privileges: [],
    maintitle: 'NYX',
    mainsubtitle: '',
    containerSize: { width: 1200, height: 800 },
    appConfigObj: null,
    passwordRules: null,
    searchCache: {},
    wsObject: { check_alive: false, socket: null },
  }
}

/** Minimal session payload, as `Login.vue` receives it from the API. */
function loginPayload(privileges) {
  return {
    data: {
      cred: { token: 'jeton', user: { login: 'alice@example.com', privileges } },
      menus: [
        {
          category: 'Admin',
          submenus: [
            {
              title: 'Monitoring Site',
              loc_title: 'Monitoring Site',
              apps: [
                { rec_id: 'app-1', title: 'Energy' },
                { rec_id: 'app-2', title: 'Alerts' },
              ],
            },
          ],
        },
        {
          category: 'apps',
          submenus: [{ title: 'Applications', apps: [{ rec_id: 'app-3', title: 'Raw Data' }] }],
        },
      ],
    },
  }
}

beforeEach(() => {
  store.replaceState(freshState())
})

describe('simple mutations', () => {
  it('copies the API version into apiVersion', () => {
    store.commit('version', { data: '3.22.14' })
    expect(store.getters.apiVersion).toBe('3.22.14')
  })

  it('exposes the package version in the version getter', () => {
    expect(store.getters.version).toBe(`v${packageJson.version}`)
  })

  it('stores the Elasticsearch version', () => {
    store.commit('elasticVersion', { data: 8 })
    expect(store.getters.elasticVersion).toBe(8)
  })

  it('stores the filters and the privileges', () => {
    store.commit('filters', { data: ['A', 'B'] })
    store.commit('privileges', { data: ['YUL'] })
    expect(store.getters.filters).toEqual(['A', 'B'])
    expect(store.getters.privileges).toEqual(['YUL'])
  })

  it('opens and closes the menu', () => {
    store.commit('setMenuState', { data: false })
    expect(store.getters.menuOpen).toBe(false)
  })

  it('copies the application configuration instead of referencing it', () => {
    // a `state.appConfigObj = payload` would let the screen modify the object of the caller
    const payload = { title: 'Energy', config: { index: 'nyx_energy' } }
    store.commit('setAppConfigObj', payload)
    payload.config.index = 'autre'
    expect(store.state.appConfigObj.config.index).toBe('nyx_energy')
  })
})

describe('login mutation', () => {
  it('stores the session credentials', () => {
    store.commit('login', loginPayload(['YUL']))
    expect(store.getters.creds.token).toBe('jeton')
    expect(store.getters.creds.user.login).toBe('alice@example.com')
  })

  it('gives every right to an administrator', () => {
    store.commit('login', loginPayload(['admin']))
    const has = store.state.creds.hasPrivilege
    expect(has('n importe quoi')).toBe(true)
    expect(has(['kibana', 'report'])).toBe(true)
  })

  it('accepts a single privilege as well as a list', () => {
    store.commit('login', loginPayload(['YUL', 'report']))
    const has = store.state.creds.hasPrivilege
    expect(has('YUL')).toBe(true)
    expect(has(['kibana', 'report'])).toBe(true)
    expect(has('kibana')).toBe(false)
    expect(has(['kibana', 'logs'])).toBe(false)
  })

  it('grants nothing when the privilege list is empty', () => {
    store.commit('login', loginPayload([]))
    expect(store.state.creds.hasPrivilege('YUL')).toBe(false)
  })

  it('extracts the applications of the apps category', () => {
    store.commit('login', loginPayload(['YUL']))
    expect(store.getters.apps).toEqual([{ rec_id: 'app-3', title: 'Raw Data' }])
  })

  it('builds the filtered menus without the apps category', () => {
    store.commit('login', loginPayload(['YUL']))
    const menus = store.getters.filteredmenus
    expect(menus.map(m => m.category)).toEqual(['Admin'])
    expect(menus[0].value).toBe('admin')
    expect(menus[0].submenus[0].value).toBe('monitoringsite')
    expect(menus[0].submenus[0].fulltitle).toBe('admin/monitoringsite')
  })

  it('slugifies spaces and case, not accents', () => {
    // current contract: only spaces are removed (`replace(/ /g, '')`), so "Reporting mensuel"
    // becomes reportingmensuel, but "Reporting généré" keeps its accent in the route
    const payload = loginPayload(['YUL'])
    payload.data.menus[0].submenus[0].title = 'Reporting  généré'
    store.commit('login', payload)
    expect(store.state.filteredmenus[0].submenus[0].value).toBe('reportinggénéré')
  })

  it('initialises the four reference time ranges', () => {
    store.commit('login', loginPayload(['YUL']))
    for (const key of ['timeRangeDay', 'timeRangeWeek', 'timeRangeMonth', 'timeRangeYear']) {
      const range = store.state[key]
      expect(Array.isArray(range)).toBe(true)
      expect(range[0]).toBeInstanceOf(Date)
      expect(range[1].getTime()).toBeGreaterThan(range[0].getTime())
    }
  })

  it('sets the default password rules and marks the websocket alive', () => {
    store.commit('login', loginPayload(['YUL']))
    expect(store.state.passwordRules.length).toEqual([10, 40])
    expect(store.state.wsObject.check_alive).toBe(true)
  })
})

describe('setTimeRange mutation', () => {
  const relative = (type, value) => ({ data: { type: 'relative', relativeType: type, relativeValue: value } })

  it('chooses a short interval for two hours', () => {
    // 120 minutes -> "1m" bucket of computeAutoTime
    store.commit('setTimeRange', relative('h', 2))
    expect(store.state.autoTime).toBe('1m')
    expect(store.state.timeRange[0]).toBeInstanceOf(Date)
    const minutes = (store.state.timeRange[1] - store.state.timeRange[0]) / 60000
    expect(Math.round(minutes)).toBe(120)
  })

  it('widens the interval progressively', () => {
    const cases = [
      [['h', 2], '1m'],
      [['d', 1], '20m'],
      [['w', 1], '4h'],
      [['d', 30], '12h'],
      [['d', 120], '7d'],
    ]
    for (const [[type, value], expected] of cases) {
      store.commit('setTimeRange', relative(type, value))
      expect(store.state.autoTime, type + value).toBe(expected)
    }
  })

  it('accepts an absolute range and fits the interval to its duration', () => {
    // 48 h = 2880 minutes -> "30m" bucket of computeAutoTime
    store.commit('setTimeRange', {
      data: { type: 'absolute', range: [new Date('2026-01-01T00:00:00Z'), new Date('2026-01-03T00:00:00Z')] },
    })
    expect(store.state.autoTime).toBe('30m')
  })

  it('fills the predefined ranges per subtype', () => {
    for (const [subtype, key] of [['day', 'timeRangeDay'], ['week', 'timeRangeWeek'],
                                  ['month', 'timeRangeMonth'], ['year', 'timeRangeYear']]) {
      const range = [new Date('2026-03-01T00:00:00Z'), new Date('2026-03-02T00:00:00Z')]
      store.commit('setTimeRange', { data: { subtype, type: 'absolute', range } })
      expect(store.state[key]).toEqual(range)
    }
  })

  it('forces the classic subtype when missing, on the caller object', () => {
    // accepted side effect: the mutation writes into `payload.data`
    const payload = { data: { type: 'relative', relativeType: 'h', relativeValue: 1 } }
    store.commit('setTimeRange', payload)
    expect(payload.data.subtype).toBe('classic')
  })
})

describe('switchToApp action', () => {
  beforeEach(() => {
    store.commit('login', loginPayload(['YUL']))
  })

  it('finds an application by its title, ignoring case', async () => {
    await expect(store.dispatch('switchToApp', 'energy')).resolves.toBe('app-1')
    await expect(store.dispatch('switchToApp', 'alerts')).resolves.toBe('app-2')
  })

  it('returns nothing for an unknown title', async () => {
    // current contract: the promise resolves to `undefined`, it does not fail
    await expect(store.dispatch('switchToApp', 'inexistant')).resolves.toBeUndefined()
  })
})
