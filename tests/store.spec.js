/**
 * Le store de la console : session, droits, menus, plages de temps.
 *
 * C'est le module le plus central de l'interface — `hasPrivilege` décide de ce qu'un utilisateur
 * voit, `filteredmenus` construit les routes (`value`/`fulltitle`), et `setTimeRange` choisit
 * l'intervalle d'agrégation envoyé à Elasticsearch. Rien de tout cela n'était testé : les
 * régressions ne se voyaient qu'à l'écran, chez un utilisateur qui n'a pas les mêmes privilèges.
 *
 * Le store est un singleton Vuex : chaque test repart d'un état neuf via `replaceState`, sinon
 * l'ordre d'exécution devient significatif.
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

/** Charge de session minimal, tel que `Login.vue` le reçoit de l'API. */
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

describe('mutations simples', () => {
  it('recopie la version de l API dans apiVersion', () => {
    store.commit('version', { data: '3.22.14' })
    expect(store.getters.apiVersion).toBe('3.22.14')
  })

  it('expose la version du paquet dans le getter version', () => {
    expect(store.getters.version).toBe(`v${packageJson.version}`)
  })

  it('stocke la version elasticsearch', () => {
    store.commit('elasticVersion', { data: 8 })
    expect(store.getters.elasticVersion).toBe(8)
  })

  it('stocke les filtres et les privileges', () => {
    store.commit('filters', { data: ['A', 'B'] })
    store.commit('privileges', { data: ['YUL'] })
    expect(store.getters.filters).toEqual(['A', 'B'])
    expect(store.getters.privileges).toEqual(['YUL'])
  })

  it('ouvre et ferme le menu', () => {
    store.commit('setMenuState', { data: false })
    expect(store.getters.menuOpen).toBe(false)
  })

  it('copie la configuration d application au lieu de la referencer', () => {
    // un `state.appConfigObj = payload` laisserait l ecran modifier l objet de l appelant
    const payload = { title: 'Energy', config: { index: 'nyx_energy' } }
    store.commit('setAppConfigObj', payload)
    payload.config.index = 'autre'
    expect(store.state.appConfigObj.config.index).toBe('nyx_energy')
  })
})

describe('mutation login', () => {
  it('range les identifiants de session', () => {
    store.commit('login', loginPayload(['YUL']))
    expect(store.getters.creds.token).toBe('jeton')
    expect(store.getters.creds.user.login).toBe('alice@example.com')
  })

  it('donne tous les droits a un administrateur', () => {
    store.commit('login', loginPayload(['admin']))
    const has = store.state.creds.hasPrivilege
    expect(has('n importe quoi')).toBe(true)
    expect(has(['kibana', 'report'])).toBe(true)
  })

  it('accepte une privilege simple comme une liste', () => {
    store.commit('login', loginPayload(['YUL', 'report']))
    const has = store.state.creds.hasPrivilege
    expect(has('YUL')).toBe(true)
    expect(has(['kibana', 'report'])).toBe(true)
    expect(has('kibana')).toBe(false)
    expect(has(['kibana', 'logs'])).toBe(false)
  })

  it('ne donne rien quand la liste de privileges est vide', () => {
    store.commit('login', loginPayload([]))
    expect(store.state.creds.hasPrivilege('YUL')).toBe(false)
  })

  it('extrait les applications de la categorie apps', () => {
    store.commit('login', loginPayload(['YUL']))
    expect(store.getters.apps).toEqual([{ rec_id: 'app-3', title: 'Raw Data' }])
  })

  it('construit les menus filtres sans la categorie apps', () => {
    store.commit('login', loginPayload(['YUL']))
    const menus = store.getters.filteredmenus
    expect(menus.map(m => m.category)).toEqual(['Admin'])
    expect(menus[0].value).toBe('admin')
    expect(menus[0].submenus[0].value).toBe('monitoringsite')
    expect(menus[0].submenus[0].fulltitle).toBe('admin/monitoringsite')
  })

  it('sluggifie les espaces et la casse, pas les accents', () => {
    // contrat actuel : seuls les espaces sont retires (`replace(/ /g, '')`), donc « Reporting
    // mensuel » devient reportingmensuel mais « Reporting généré » garde son accent dans la route
    const payload = loginPayload(['YUL'])
    payload.data.menus[0].submenus[0].title = 'Reporting  généré'
    store.commit('login', payload)
    expect(store.state.filteredmenus[0].submenus[0].value).toBe('reportinggénéré')
  })

  it('initialise les quatre plages de temps de reference', () => {
    store.commit('login', loginPayload(['YUL']))
    for (const key of ['timeRangeDay', 'timeRangeWeek', 'timeRangeMonth', 'timeRangeYear']) {
      const range = store.state[key]
      expect(Array.isArray(range)).toBe(true)
      expect(range[0]).toBeInstanceOf(Date)
      expect(range[1].getTime()).toBeGreaterThan(range[0].getTime())
    }
  })

  it('pose les regles de mot de passe par defaut et marque le websocket vivant', () => {
    store.commit('login', loginPayload(['YUL']))
    expect(store.state.passwordRules.length).toEqual([10, 40])
    expect(store.state.wsObject.check_alive).toBe(true)
  })
})

describe('mutation setTimeRange', () => {
  const relative = (type, value) => ({ data: { type: 'relative', relativeType: type, relativeValue: value } })

  it('choisit un intervalle court pour deux heures', () => {
    // 120 minutes -> palier « 1m » de computeAutoTime
    store.commit('setTimeRange', relative('h', 2))
    expect(store.state.autoTime).toBe('1m')
    expect(store.state.timeRange[0]).toBeInstanceOf(Date)
    const minutes = (store.state.timeRange[1] - store.state.timeRange[0]) / 60000
    expect(Math.round(minutes)).toBe(120)
  })

  it('elargit progressivement l intervalle', () => {
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

  it('accepte une plage absolue et cadre l intervalle sur sa duree', () => {
    // 48 h = 2880 minutes -> palier « 30m » de computeAutoTime
    store.commit('setTimeRange', {
      data: { type: 'absolute', range: [new Date('2026-01-01T00:00:00Z'), new Date('2026-01-03T00:00:00Z')] },
    })
    expect(store.state.autoTime).toBe('30m')
  })

  it('remplit les plages predefinies par sous-type', () => {
    for (const [subtype, key] of [['day', 'timeRangeDay'], ['week', 'timeRangeWeek'],
                                  ['month', 'timeRangeMonth'], ['year', 'timeRangeYear']]) {
      const range = [new Date('2026-03-01T00:00:00Z'), new Date('2026-03-02T00:00:00Z')]
      store.commit('setTimeRange', { data: { subtype, type: 'absolute', range } })
      expect(store.state[key]).toEqual(range)
    }
  })

  it('force le sous-type classic quand il manque, sur l objet de l appelant', () => {
    // effet de bord assume : la mutation ecrit dans `payload.data`
    const payload = { data: { type: 'relative', relativeType: 'h', relativeValue: 1 } }
    store.commit('setTimeRange', payload)
    expect(payload.data.subtype).toBe('classic')
  })
})

describe('action switchToApp', () => {
  beforeEach(() => {
    store.commit('login', loginPayload(['YUL']))
  })

  it('retrouve une application par son titre, sans tenir compte de la casse', async () => {
    await expect(store.dispatch('switchToApp', 'energy')).resolves.toBe('app-1')
    await expect(store.dispatch('switchToApp', 'alerts')).resolves.toBe('app-2')
  })

  it('ne rend rien pour un titre inconnu', async () => {
    // contrat actuel : la promesse se resout sur `undefined`, elle n echoue pas
    await expect(store.dispatch('switchToApp', 'inexistant')).resolves.toBeUndefined()
  })
})
