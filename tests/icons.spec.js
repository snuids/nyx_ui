/**
 * Les icones ont change de nature entre les deux bibliotheques : Element UI 2 utilisait une police
 * (`class="el-icon-edit"`), Element Plus des composants SVG. Une icone qui ne resout pas ne casse
 * rien — le bouton s'affiche simplement vide, ce qui est facile a ne pas remarquer.
 *
 * Ces tests verifient donc que chaque nom de la table de correspondance existe vraiment dans le
 * paquet, et que les noms stockes dans les configurations ("el-icon-download") sont bien traduits.
 */
import { describe, it, expect } from 'vitest'
import * as icons from '@element-plus/icons-vue'
import { iconComponent } from '@/utils/icons'

describe('iconComponent', () => {
  it('translates a stored Element UI name', () => {
    expect(iconComponent('el-icon-download', icons)).toBe(icons.Download)
    expect(iconComponent('el-icon-edit', icons)).toBe(icons.Edit)
  })

  it('accepts an Element Plus name, for records saved after the migration', () => {
    expect(iconComponent('Download', icons)).toBe(icons.Download)
  })

  it('returns undefined for an unknown or empty name', () => {
    expect(iconComponent('', icons)).toBeUndefined()
    expect(iconComponent(null, icons)).toBeUndefined()
    expect(iconComponent('el-icon-does-not-exist', icons)).toBeUndefined()
  })

  it('resolves every legacy name it knows', () => {
    const legacyNames = [
      'delete', 'refresh', 'plus', 'download', 'edit', 'copy-document', 'setting', 'search',
      'arrow-up', 'arrow-down', 'notebook-2', 'info', 'warning', 'user', 'refresh-right',
      'refresh-left', 'more', 'key', 'document', 'caret-right', 'arrow-right', 'arrow-left',
      'location', 'menu', 'question', 'upload', 'd-caret',
    ]
    const unresolved = legacyNames.filter((n) => !iconComponent('el-icon-' + n, icons))
    expect(unresolved).toEqual([])
  })
})
