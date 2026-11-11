/**
 * Icons changed nature between the two libraries: Element UI 2 used a font
 * (`class="el-icon-edit"`), Element Plus uses SVG components. An icon that does not resolve breaks
 * nothing — the button simply renders empty, which is easy not to notice.
 *
 * These tests therefore check that every name of the mapping table really exists in the package,
 * and that the names stored in the configurations ("el-icon-download") are translated.
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
