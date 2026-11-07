/**
 * The store actions and the mutations that talk to the API or to the websocket.
 *
 * These are the places where a screen silently stops working: a mutation that posts to the wrong
 * URL still returns without error (`axios.post(...).catch(() => {})` is the house pattern), a
 * relative time range that computes the wrong interval makes every chart read the wrong window,
 * and `changeApp` decides the title, the sub-category and the forced time range of a page.
 *
 * axios is mocked — no request leaves the process. The websocket is replaced by a fake whose event
 * listeners are fired by hand, which is the only way to exercise `check_websocket` without a server.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { axiosMock } = vi.hoisted(() => ({
  axiosMock: {
    get: vi.fn(() => Promise.resolve({ data: { error: '' } })),
    post: vi.fn(() => Promise.resolve({ data: { error: '' } })),
    delete: vi.fn(() => Promise.resolve({ data: { error: '' } })),
  },
}))

vi.mock('axios', () => ({ default: axiosMock }))

import { globalBus } from '@/utils/bus'
import moment from 'moment'
import store from '@/store/store.js'
import packageJson from '../package.json'

/** Let the `then`/`catch` callbacks of the mocked promises run. */
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

class FakeSocket {
  constructor(url) {
    this.url = url
    this.listeners = {}
    this.sent = []
    this.closed = false
    FakeSocket.instances.push(this)
  }

  addEventListener(type, callback) {
    this.listeners[type] = this.listeners[type] || []
    this.listeners[type].push(callback)
  }

  fire(type, event) {
    for (const callback of this.listeners[type] || []) callback(event)
  }

  send(data) {
    this.sent.push(data)
  }

  close() {
    this.closed = true
  }
}

FakeSocket.instances = []

function app(title, rec_id, extra) {
  return { title, rec_id, loc_title: title, ...extra }
}

/** One category, one sub-menu, the given applications. */
function menus(...apps) {
  return [
    {
      category: 'reports',
      title: 'Reports',
      submenus: [{ title: 'Field', loc_title: 'Field', apps }],
    },
  ]
}

/**
 * The initial state, captured before any test mutates it: `freshState` starts from it so that the
 * getters all have a field to read (and so the getter test below can iterate them all).
 */
const INITIAL_STATE = JSON.parse(JSON.stringify(store.state))

function freshState(overrides) {
  return {
    ...JSON.parse(JSON.stringify(INITIAL_STATE)),
    apiurl: 'api/v1/',
    creds: { token: 'TOK' },
    filters: [],
    ...overrides,
  }
}

beforeEach(() => {
  store.replaceState(freshState())
  axiosMock.get.mockClear()
  axiosMock.post.mockClear()
  axiosMock.delete.mockClear()
  FakeSocket.instances = []
  global.WebSocket = FakeSocket
  global.window = { location: { href: 'https://nyx.example/main' } }
  globalBus.$emit = vi.fn()
})

afterEach(() => {
  delete global.window
  delete global.WebSocket
})

describe('switchToApp', () => {
  it('resolves the rec_id of the application carrying the title', async () => {
    store.replaceState({ ...freshState(), filteredmenus: menus(app('YUL', 'id1'), app('Field', 'id2')) })
    await expect(store.dispatch('switchToApp', 'yul')).resolves.toBe('id1')
  })

  it('compares against the lower-cased title, so an upper-case argument matches nothing', async () => {
    // current quirk: the payload is compared with `title.toLowerCase()`, never lower-cased itself
    store.replaceState({ ...freshState(), filteredmenus: menus(app('YUL', 'id1')) })
    await expect(store.dispatch('switchToApp', 'YUL')).resolves.toBeUndefined()
  })

  it('resolves undefined for an unknown title instead of rejecting', async () => {
    // the caller must therefore test the result, not catch an error
    store.replaceState({ ...freshState(), filteredmenus: menus(app('YUL', 'id1')) })
    await expect(store.dispatch('switchToApp', 'nope')).resolves.toBeUndefined()
  })
})

describe('check_websocket', () => {
  it('does nothing while the session is not alive', () => {
    store.dispatch('check_websocket')
    expect(FakeSocket.instances).toHaveLength(0)
  })

  it('opens the socket on the current host, in wss, and sends the credentials', () => {
    store.state.wsObject.check_alive = true
    store.dispatch('check_websocket')

    expect(FakeSocket.instances).toHaveLength(1)
    const socket = FakeSocket.instances[0]
    expect(socket.url).toBe('wss://nyx.example/nyx_ui_websocket/')

    socket.fire('open')
    expect(JSON.parse(socket.sent[0])).toEqual(store.state.creds)
  })

  it('derives the socket URL from apiurl when it is an absolute URL', () => {
    store.state.wsObject.check_alive = true
    store.state.apiurl = 'http://api.example/api/v1'
    store.dispatch('check_websocket')
    expect(FakeSocket.instances[0].url).toBe('ws://api.example/nyx_ui_websocket/')
  })

  it('leaves a doubled slash when apiurl ends with one', () => {
    // current quirk: the apiurl is substituted, not parsed — `?api=http://host/api/v1/` yields
    // `ws://host/nyx_ui_websocket//`. Browsers and the ws server tolerate it; do not "fix" it
    // without exercising a real connection.
    store.state.wsObject.check_alive = true
    store.state.apiurl = 'http://api.example/api/v1/'
    store.dispatch('check_websocket')
    expect(FakeSocket.instances[0].url).toBe('ws://api.example/nyx_ui_websocket//')
  })

  it('keeps one socket: a second call while it is open opens nothing', () => {
    store.state.wsObject.check_alive = true
    store.dispatch('check_websocket')
    store.dispatch('check_websocket')
    expect(FakeSocket.instances).toHaveLength(1)
  })

  it('forwards a message of type message on the global bus and refreshes the life sign', () => {
    store.state.wsObject.check_alive = true
    store.dispatch('check_websocket')
    const before = moment()
    FakeSocket.instances[0].fire('message', { data: JSON.stringify({ type: 'message', data: 'hi' }) })

    expect(globalBus.$emit).toHaveBeenCalledWith('messagereceived', 'hi')
    expect(moment(store.state.wsObject.last_lifesign).isSameOrAfter(before)).toBe(true)
  })

  it('does not emit for another message type', () => {
    store.state.wsObject.check_alive = true
    store.dispatch('check_websocket')
    FakeSocket.instances[0].fire('message', { data: JSON.stringify({ type: 'ping' }) })
    expect(globalBus.$emit).not.toHaveBeenCalled()
  })

  it('drops the socket on error so the next call reconnects', () => {
    store.state.wsObject.check_alive = true
    store.dispatch('check_websocket')
    const socket = FakeSocket.instances[0]

    socket.fire('error')
    expect(socket.closed).toBe(true)
    expect(store.state.wsObject.socket).toBeNull()
  })

  it('replaces a socket whose life sign is older than ten seconds', () => {
    store.state.wsObject.check_alive = true
    store.dispatch('check_websocket')
    const first = FakeSocket.instances[0]
    first.fire('open')
    store.state.wsObject.last_lifesign = moment().subtract(11, 'seconds')

    store.dispatch('check_websocket')
    expect(first.closed).toBe(true)
    expect(FakeSocket.instances).toHaveLength(2)
  })

  it('keeps a socket whose life sign is recent', () => {
    store.state.wsObject.check_alive = true
    store.dispatch('check_websocket')
    const first = FakeSocket.instances[0]
    store.state.wsObject.last_lifesign = moment().subtract(1, 'second')

    store.dispatch('check_websocket')
    expect(first.closed).toBe(false)
    expect(FakeSocket.instances).toHaveLength(1)
  })
})

describe('logout', () => {
  it('closes the socket, stops the loop and tells the API', () => {
    store.state.wsObject.check_alive = true
    store.dispatch('check_websocket')
    const socket = FakeSocket.instances[0]

    store.commit('logout')

    expect(store.state.wsObject.check_alive).toBe(false)
    expect(socket.closed).toBe(true)
    expect(axiosMock.get).toHaveBeenCalledWith('api/v1/cred/logout?token=TOK')
  })

  it('does not throw when no socket was ever opened', () => {
    expect(() => store.commit('logout')).not.toThrow()
  })

  it('forgets the stored session so a reload does not restore it', () => {
    // `Main.vue` rehydrates the session from `localStorage.authResponse` on load: leaving it there
    // brings back a session whose token has just been revoked.
    const removeItem = vi.fn()
    global.window = { localStorage: { removeItem } }
    try {
      store.commit('logout')
      expect(removeItem).toHaveBeenCalledWith('authResponse')
    } finally {
      delete global.window
    }
  })
})

describe('changeApp', () => {
  it('selects the application, its sub-category and the title', () => {
    store.replaceState({ ...freshState(), filteredmenus: menus(app('YUL', 'id1'), app('Field', 'id2')) })
    store.commit('changeApp', { data: 'id2' })

    expect(store.state.activeApp.rec_id).toBe('id2')
    expect(store.state.maintitle).toBe('Field')
    expect(store.state.currentSubCategory.apps).toHaveLength(2)
  })

  it('asks the pages for the default time range of the application', () => {
    store.replaceState({
      ...freshState(),
      filteredmenus: menus(app('YUL', 'id1', { timeDefault: '24h' })),
    })
    store.commit('changeApp', { data: 'id1' })
    expect(globalBus.$emit).toHaveBeenCalledWith('forcetime', '24h')
  })

  it('does not force a time range when the application declares none', () => {
    store.replaceState({ ...freshState(), filteredmenus: menus(app('YUL', 'id1', { timeDefault: '' })) })
    store.commit('changeApp', { data: 'id1' })
    expect(globalBus.$emit).not.toHaveBeenCalled()
  })

  it('throws on an unknown rec_id instead of navigating away', () => {
    // current quirk: `currentSubCategory` stays null and `.loc_title` throws
    store.replaceState({ ...freshState(), filteredmenus: menus(app('YUL', 'id1')) })
    expect(() => store.commit('changeApp', { data: 'unknown' })).toThrow(TypeError)
  })
})

describe('refreshTimeRange', () => {
  it('recomputes a relative range and its aggregation interval', () => {
    store.state.lastTimeRangeEvent = { type: 'relative', relativeType: 'h', relativeValue: 2 }
    store.commit('refreshTimeRange')

    expect(store.state.autoTime).toBe('1m')
    const [start, end] = store.state.timeRange
    expect(end - start).toBeCloseTo(2 * 60 * 60 * 1000, -3)
  })

  it('leaves everything alone for an absolute range', () => {
    store.state.lastTimeRangeEvent = { type: 'absolute', subtype: 'classic' }
    store.state.timeRange = 'untouched'
    store.commit('refreshTimeRange')
    expect(store.state.timeRange).toBe('untouched')
  })

  it('throws when no range was ever set', () => {
    // called before the first setTimeRange: `lastTimeRangeEvent` is null
    expect(() => store.commit('refreshTimeRange')).toThrow(TypeError)
  })
})

describe('setTab', () => {
  it('prefixes the subtitle when the sub-category holds several applications', () => {
    store.state.currentSubCategory = { apps: [app('YUL', 'id1'), app('Field', 'id2')] }
    store.commit('setTab', { data: app('Field', 'id2') })
    expect(store.state.mainsubtitle).toBe(' / Field')
    expect(store.state.activeApp.rec_id).toBe('id2')
  })

  it('clears the subtitle when there is a single application', () => {
    store.state.currentSubCategory = { apps: [app('YUL', 'id1')] }
    store.state.mainsubtitle = ' / left over'
    store.commit('setTab', { data: app('YUL', 'id1') })
    expect(store.state.mainsubtitle).toBe('')
  })
})

describe('record mutations', () => {
  it('posts the whole _source of an updated record', () => {
    store.commit('updateRecord', {
      data: { _index: 'nyx_app', _id: 'a1', _source: { title: 'x' } },
    })
    expect(axiosMock.post).toHaveBeenCalledWith('api/v1/generic/nyx_app/a1?token=TOK', { title: 'x' })
  })

  it('deletes a record through the generic route', () => {
    store.commit('deleteRecord', { data: { _index: 'nyx_app', _id: 'a1' } })
    expect(axiosMock.delete).toHaveBeenCalledWith('api/v1/generic/nyx_app/a1?token=TOK')
  })

  it('keeps the document type when the record carries one', () => {
    store.commit('deleteRecord', { data: { _index: 'nyx_app', _id: 'a1', _type: 'app' } })
    expect(axiosMock.delete).toHaveBeenCalledWith('api/v1/generic/nyx_app/a1?token=TOK&doc_type=app')
  })

  it('updates a PostgreSQL record with its mode', () => {
    store.commit('updatePGRecord', {
      data: { config: { index: 'sites', pkey: 'id' }, id: 7, record: { name: 'x' }, mode: 'update' },
    })
    expect(axiosMock.post).toHaveBeenCalledWith('api/v1/pg_generic/sites/id/7?token=TOK', {
      record: { name: 'x' },
      mode: 'update',
    })
  })

  it('deletes a PostgreSQL record through its nested configuration', () => {
    store.commit('deletePGRecord', {
      data: { config: { config: { index: 'sites', pkey: 'id' } }, row: { _id: 7 } },
    })
    expect(axiosMock.delete).toHaveBeenCalledWith('api/v1/pg_generic/sites/id/7?token=TOK')
  })

  it('sends a broker message with a string destination', () => {
    store.commit('sendMessage', { data: { destination: 42, message: 'hello' } })
    expect(axiosMock.post).toHaveBeenCalledWith('api/v1/sendmessage?token=TOK', {
      destination: '42',
      body: 'hello',
    })
  })

  it('never rejects a failed record write, so the caller cannot tell', async () => {
    // the house pattern: `.catch(() => {})` — a refused write looks like a success on screen
    axiosMock.post.mockImplementationOnce(() => Promise.reject(new Error('403')))
    await expect(store.commit('updateRecord', { data: { _index: 'i', _id: 'x', _source: {} } })).toBeUndefined()
    await flush()
  })
})

describe('setPasswordRules', () => {
  it('stores the rules only once the API accepted them', async () => {
    store.commit('setPasswordRules', { data: { length: [12, 40] } })

    expect(axiosMock.post).toHaveBeenCalledWith('api/v1/generic/nyx_config/password_rules?token=TOK', {
      length: [12, 40],
    })
    expect(store.state.passwordRules).toBeNull()

    await flush()
    expect(store.state.passwordRules).toEqual({ length: [12, 40] })
  })

  it('leaves the current rules in place when the write is refused', async () => {
    store.state.passwordRules = { length: [10, 40] }
    axiosMock.post.mockImplementationOnce(() => Promise.reject(new Error('403')))
    store.commit('setPasswordRules', { data: { length: [12, 40] } })
    await flush()
    expect(store.state.passwordRules).toEqual({ length: [10, 40] })
  })
})

describe('getters', () => {
  it('exposes every field of the state through a getter of the same name', () => {
    // 33 one-line getters copied from one another: a copy-paste that reads the wrong field
    // (`timeRangeWeek: state => state.timeRangeDay`) is invisible on screen until a chart is wrong
    for (const name of Object.keys(store.getters)) {
      expect(
        Object.prototype.hasOwnProperty.call(store.state, name),
        `getter ${name} has no state field`
      ).toBe(true)
      expect(store.getters[name], `getter ${name} does not return its state field`).toBe(store.state[name])
    }
  })

  it('takes the version from package.json, not from the API', () => {
    // `version` is the image tag; `apiVersion` is what /api/v1/config answered — two different things
    expect(store.getters.version).toBe(`v${packageJson.version}`)
  })
})

describe('changeContainerSize', () => {
  it('stores the size of the container so the tables can follow it', () => {
    store.commit('changeContainerSize', { data: { width: 900, height: 600 } })
    expect(store.state.containerSize).toEqual({ width: 900, height: 600 })
  })
})

describe('refreshTimeRange, day and week', () => {
  it('counts a relative range in days', () => {
    store.state.lastTimeRangeEvent = { type: 'relative', relativeType: 'd', relativeValue: 1 }
    store.commit('refreshTimeRange')
    expect(store.state.autoTime).toBe('20m')
    expect(store.state.timeRange[1] - store.state.timeRange[0]).toBeCloseTo(24 * 60 * 60 * 1000, -3)
  })

  it('counts a relative range in weeks', () => {
    store.state.lastTimeRangeEvent = { type: 'relative', relativeType: 'w', relativeValue: 1 }
    store.commit('refreshTimeRange')
    expect(store.state.autoTime).toBe('4h')
    expect(store.state.timeRange[1] - store.state.timeRange[0]).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3)
  })

  it('treats an unknown unit as minutes', () => {
    // the switch has no default: minutesmulti stays 1
    store.state.lastTimeRangeEvent = { type: 'relative', relativeType: 'x', relativeValue: 1 }
    store.commit('refreshTimeRange')
    expect(store.state.autoTime).toBe('1m')
    expect(store.state.timeRange[1] - store.state.timeRange[0]).toBeCloseTo(60 * 1000, -3)
  })
})

describe('computeAutoTime thresholds, through setTimeRange', () => {
  const cases = [
    [3 * 60, '5m'],
    // 3 * 1440 is exactly the top of the "2h" band: `new Date()` is taken a moment after the start, so
    // the elapsed time lands just above the boundary and the case flipped to "4h" on CI. A value inside
    // the band tests the threshold without betting on a millisecond.
    [3 * 1440 - 5, '2h'],
    [60 * 1440, '1d'],
    [200 * 1440, '20d'],
  ]

  for (const [minutes, expected] of cases) {
    it(`chooses ${expected} for ${minutes} minutes`, () => {
      const start = moment().subtract(minutes, 'minutes')
      store.commit('setTimeRange', { data: { type: 'absolute', range: [start.toDate(), new Date()] } })
      expect(store.state.autoTime).toBe(expected)
    })
  }
})

describe('record mutations, failed writes', () => {
  // every one of them swallows its error: the console shows a success notification whatever happens
  const failing = [
    ['deleteRecord', { data: { _index: 'i', _id: 'x' } }],
    ['updatePGRecord', { data: { config: { index: 'i', pkey: 'p' }, id: 1, record: {}, mode: 'update' } }],
    ['deletePGRecord', { data: { config: { config: { index: 'i', pkey: 'p' } }, row: { _id: 1 } } }],
    ['sendMessage', { data: { destination: 'q', message: 'm' } }],
  ]

  for (const [mutation, payload] of failing) {
    it(`${mutation} swallows the failure`, async () => {
      axiosMock.post.mockImplementationOnce(() => Promise.reject(new Error('403')))
      axiosMock.delete.mockImplementationOnce(() => Promise.reject(new Error('403')))
      expect(() => store.commit(mutation, payload)).not.toThrow()
      await flush()
    })
  }
})
