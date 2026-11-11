/**
 * What `ConfigDetails` does around the form (`utils/appConfigForm.js`).
 *
 * These six functions lived in a 1,476-line component at 0 % coverage: reaching them required
 * mounting the whole configuration screen. Here, a `node` environment, each branch costs one
 * assertion.
 */

import { describe, it, expect } from 'vitest'

import {
  configYaml,
  controllerLabel,
  normaliseConfigForForm,
  resolveSavedSource,
  suggestCategories,
  suggestSubcategories,
  unmangleRefreshInterval,
} from '@/utils/appConfigForm.js'

const MENUS = [
  {
    category: 'Sales',
    submenus: [{ loc_title: 'Deliveries' }, { loc_title: 'Invoices' }],
  },
  {
    category: 'Support',
    submenus: [{ loc_title: 'Tickets' }],
  },
]

describe('unmangleRefreshInterval', () => {
  it('retire l\'enveloppe Kibana pour ne laisser que le nombre', () => {
    expect(unmangleRefreshInterval('refreshInterval:(pause:!f,value:30000)')).toBe('30000')
  })

  it('laisse passer une valeur absente', () => {
    expect(unmangleRefreshInterval(null)).toBeNull()
    expect(unmangleRefreshInterval(undefined)).toBeUndefined()
  })
})

describe('normaliseConfigForForm', () => {
  const app = {
    name: 'deliveries',
    config: { index: 'deliveries*', controller: 'GenericTable' },
    timeRefreshValue: 'refreshInterval:(pause:!f,value:60000)',
  }

  it('rend une copie profonde : le formulaire n\'ecrit pas dans l\'original', () => {
    const form = normaliseConfigForForm(app)
    form.config.index = 'autre'

    expect(app.config.index).toBe('deliveries*')
  })

  it('cree les listes que le formulaire remplit, meme vides', () => {
    const form = normaliseConfigForForm(app)

    expect(form.config.queryfilters).toEqual([])
  })

  it('garde les listes deja remplies', () => {
    const form = normaliseConfigForForm({
      config: { queryfilters: [{ field: 'status' }] },
    })

    expect(form.config.queryfilters).toEqual([{ field: 'status' }])
  })

  it('cree `config` quand la configuration n\'en a pas', () => {
    expect(normaliseConfigForForm({ name: 'vide' }).config).toEqual({ queryfilters: [] })
  })

  it('remet la valeur de rafraichissement Kibana en clair', () => {
    expect(normaliseConfigForForm(app).timeRefreshValue).toBe('60000')
  })

  it('ne touche pas a la valeur quand elle est absente', () => {
    const form = normaliseConfigForForm({ config: {} })

    expect(form.timeRefreshValue).toBeUndefined()
  })
})

describe('configYaml', () => {
  it('rend la configuration en YAML, indentation de dix', () => {
    const text = configYaml({ name: 'deliveries', config: { index: 'deliveries*' } })

    expect(text).toContain('name: deliveries')
    expect(text).toContain('index: deliveries*')
  })
})

describe('resolveSavedSource', () => {
  const curConfig = { name: 'edite' }

  it('garde l\'objet du formulaire quand rien n\'a bouge', () => {
    expect(
      resolveSavedSource({ newText: 'a: 1', orgText: 'a: 1', curConfig, isAdd: false })
    ).toBe(curConfig)
  })

  it('lit le YAML quand l\'apercu a ete modifie', () => {
    const source = resolveSavedSource({
      newText: 'name: depuis-le-yaml',
      orgText: 'name: edite',
      curConfig,
      isAdd: false,
    })

    expect(source).toEqual({ name: 'depuis-le-yaml' })
  })

  it('ignore la comparaison pour une creation', () => {
    expect(
      resolveSavedSource({ newText: 'a: 1', orgText: 'a: 2', curConfig, isAdd: true })
    ).toBe(curConfig)
  })
})

describe('suggestCategories', () => {
  it('propose toutes les categories quand rien n\'est tape', () => {
    expect(suggestCategories(MENUS, '')).toEqual([{ value: 'Sales' }, { value: 'Support' }])
  })

  it('filtre sur ce qui est tape', () => {
    expect(suggestCategories(MENUS, 'Sup')).toEqual([{ value: 'Support' }])
  })

  it('ne propose rien quand rien ne correspond', () => {
    expect(suggestCategories(MENUS, 'zzz')).toEqual([])
  })

  it('supporte un menu vide', () => {
    expect(suggestCategories(undefined, 'a')).toEqual([])
  })
})

describe('suggestSubcategories', () => {
  it('propose les sous-menus de la categorie choisie', () => {
    expect(suggestSubcategories(MENUS, 'Sales', '')).toEqual([
      { value: 'Deliveries' },
      { value: 'Invoices' },
    ])
  })

  it('s\'arrete a la categorie trouvee', () => {
    expect(suggestSubcategories(MENUS, 'Support', '')).toEqual([{ value: 'Tickets' }])
  })

  it('filtre sur ce qui est tape', () => {
    expect(suggestSubcategories(MENUS, 'Sales', 'Deli')).toEqual([{ value: 'Deliveries' }])
  })

  it('ne propose rien sans categorie choisie', () => {
    expect(suggestSubcategories(MENUS, '', '')).toEqual([])
  })

  it('ne propose rien pour une categorie absente du menu', () => {
    expect(suggestSubcategories(MENUS, 'Inconnue', '')).toEqual([])
  })
})

describe('controllerLabel', () => {
  const page = { name: 'GenericTable', description: 'A table of records' }

  it('prend la traduction quand elle existe', () => {
    expect(controllerLabel(page, () => true, (key) => 'traduit:' + key)).toBe(
      'traduit:configdetails.ctrl.GenericTable'
    )
  })

  it('retombe sur la description du catalogue', () => {
    expect(controllerLabel(page, () => false, (key) => 'x:' + key)).toBe('A table of records')
  })

  it('supporte une absence de `$te`', () => {
    expect(controllerLabel(page, undefined, () => 'jamais appele')).toBe('A table of records')
  })

  it('ne rend rien pour un controleur absent du catalogue', () => {
    expect(controllerLabel(null, () => true, () => 'x')).toBeNull()
  })
})
