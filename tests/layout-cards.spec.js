/**
 * A panel that fills its row.
 *
 * Element Plus's `el-row` is a flex container, and a card placed directly in it is `flex: 0 1 auto`:
 * the fields panel of the form editor measured **333 px of table in a 1139 px dialog**, sitting in
 * the left third with empty space beside it. Element UI 2's `el-row` was a float clearer, so the
 * layout only broke after the migration.
 *
 * Two things keep it fixed, and both are checked here because neither is visible to the other tests:
 * the stylesheet makes a card in a row grow, and the editor no longer puts its fields panel there.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const SRC = new URL('../src/', import.meta.url).pathname

describe('cards in a row', () => {
  it('makes a card placed directly in a row take the width of that row', () => {
    const css = readFileSync(SRC + 'styles/element-legacy.css', 'utf8')

    expect(css).toMatch(/\.el-row\s*>\s*\.el-card\s*\{[^}]*flex:\s*1 1 auto/)
  })

  it('does not rely on it in the form editor: the fields card sits in a block', () => {
    const editor = readFileSync(SRC + 'components/appConfigEditor/FormEditor.vue', 'utf8')

    // `<el-row>` followed by `<el-card>` (comments and easing whitespace aside) is the shape that
    // shrank to 333 px.
    expect(editor).not.toMatch(/<el-row\b[^>]*>\s*(?:<!--[\s\S]*?-->\s*)?<el-card\b/)
    expect(editor).toMatch(/<el-row\s+:gutter="12">/)
  })
})
