/**
 * The URL of a Kibana dashboard (`utils/kibanaUrl.js`).
 *
 * Two methods of `ConfigDetails` built this string, branch by branch, at 0 % coverage: reaching a
 * single one required mounting the screen and building a Kibana dashboard. Here, a `node`
 * environment, each case has its assertion — and the mounted-screen test checks that the component
 * produces exactly the same URL as before the extraction.
 */

import { describe, it, expect } from 'vitest'

import { DEFAULT_KIBANA_TIME, kibanaAppUrl, kibanaDashboardPath } from '@/utils/kibanaUrl.js'

const dash = (attributes = {}, overrides = {}) => ({
  id: 'dash-1',
  space: 'default',
  attributes: {
    description: 'Deliveries over time',
    panelsJSON: '[]',
    ...attributes,
  },
  ...overrides,
})

describe('kibanaDashboardPath — periode et rafraichissement', () => {
  it('prend la periode par defaut quand le formulaire n\'en a pas', () => {
    const { path, kibanaTime } = kibanaDashboardPath({ dash: dash() })

    expect(kibanaTime).toBe(DEFAULT_KIBANA_TIME)
    expect(path).toContain('_g=(refreshInterval:(pause:!t,value:0),time:(from:now-7d,mode:quick,to:now))')
  })

  it('garde la periode choisie', () => {
    const { kibanaTime } = kibanaDashboardPath({
      dash: dash(),
      kibanaTime: 'from:now-1y,mode:quick,to:now',
    })

    expect(kibanaTime).toBe('from:now-1y,mode:quick,to:now')
  })

  it('ecrit le rafraichissement quand la case est cochee et qu\'une duree est choisie', () => {
    const { path } = kibanaDashboardPath({
      dash: dash(),
      timeRefresh: true,
      timeRefreshValue: '30000',
    })

    expect(path).toContain('refreshInterval:(pause:!f,value:30000)')
  })

  it('n\'ecrit pas de rafraichissement quand la duree manque', () => {
    const { path } = kibanaDashboardPath({ dash: dash(), timeRefresh: true, timeRefreshValue: null })

    expect(path).toContain('refreshInterval:(pause:!t,value:0)')
  })
})

describe('kibanaDashboardPath — options et panneaux', () => {
  it('laisse les options vides quand le tableau de bord n\'en a pas', () => {
    expect(kibanaDashboardPath({ dash: dash() }).path).toContain(',options:()')
  })

  it('transcrit les options JSON au format de Kibana', () => {
    const { path } = kibanaDashboardPath({
      dash: dash({ optionsJSON: '{"hidePanelTitles":true,"useMargins":false}' }),
    })

    expect(path).toContain(',options:(hidePanelTitles:!t,useMargins:!f)')
  })

  it('encode les panneaux en rison et protege les separateurs d\'URL', () => {
    const { path } = kibanaDashboardPath({
      dash: dash({
        panelsJSON: JSON.stringify([
          { panelIndex: '1', id: 'p1', type: 'visualization' },
          { panelIndex: '2', id: 'p&2', type: 'search' },
        ]),
      }),
    })

    expect(path).toContain(",panels:!((id:p1,panelIndex:'1',type:visualization),(id:p%262,panelIndex:'2',type:search))")
  })

  it('resout les references des panneaux en 7.0.0', () => {
    const { path } = kibanaDashboardPath({
      dash: dash(
        { panelsJSON: JSON.stringify([{ panelIndex: '1', panelRefName: 'panel_0' }]) },
        {
          migrationVersion: { dashboard: '7.0.0' },
          references: [{ name: 'panel_0', id: 'resolved-1', type: 'visualization' }],
        }
      ),
    })

    expect(path).toContain("panelRefName:panel_0")
    expect(path).toContain('id:resolved-1')
    expect(path).toContain('type:visualization')
  })

  it('ne resout rien hors 7.0.0', () => {
    const { path } = kibanaDashboardPath({
      dash: dash(
        { panelsJSON: JSON.stringify([{ panelIndex: '1', panelRefName: 'panel_0' }]) },
        { references: [{ name: 'panel_0', id: 'resolved-1', type: 'visualization' }] }
      ),
    })

    expect(path).not.toContain('resolved-1')
  })
})

describe('kibanaDashboardPath — recherche', () => {
  it('met la recherche libre par defaut', () => {
    expect(kibanaDashboardPath({ dash: dash() }).path).toContain(
      "query:(language:lucene,query:'*')"
    )
  })

  it('reprend la recherche du tableau de bord quand il en a une', () => {
    const { path } = kibanaDashboardPath({
      dash: dash({
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({ query: { language: 'lucene', query: 'status:open' } }),
        },
      }),
    })

    expect(path).toContain("query:(language:lucene,query:'status:open')")
  })

  it('ferme la description `_a` et fixe le mode d\'affichage', () => {
    const { path } = kibanaDashboardPath({ dash: dash() })

    expect(path.endsWith(',timeRestore:!f,title:Test,viewMode:view)')).toBe(true)
    expect(path).toContain("_a=(description:'Deliveries over time',filters:!(),fullScreenMode:!f")
  })
})

describe('kibanaAppUrl', () => {
  it('remplace kibana par kibananyx dans l\'URL de base', () => {
    expect(kibanaAppUrl({ dash: dash(), baseUrl: '/kibana/', dashboardPath: '/dashboard/x' })).toBe(
      './kibananyx//app/kibana#/dashboard/x'
    )
  })

  it('ajoute l\'espace quand il n\'est pas celui par defaut', () => {
    expect(
      kibanaAppUrl({
        dash: dash({}, { space: 'ops' }),
        baseUrl: '/kibana/',
        dashboardPath: '/dashboard/x',
      })
    ).toBe('./kibananyx/s/ops/app/kibana#/dashboard/x')
  })

  it('n\'ajoute rien pour l\'espace par defaut', () => {
    expect(
      kibanaAppUrl({ dash: dash({}, { space: 'default' }), baseUrl: '/kibana/', dashboardPath: 'x' })
    ).toBe('./kibananyx//app/kibana#x')
  })
})
