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

/**
 * The pages that fill the window.
 *
 * The browser's default `body` margin is 8 px, and nothing in the application reset it. Every view
 * that sizes itself against the window — the sign-in return page (`height: 100vh`), the
 * inactive-account page and the privacy notice (`min-height: 100vh`) — was therefore inset by 8 px
 * and stopped short on three sides, letting the page canvas show through: white in the light theme,
 * `#161a23` (from `html.dark body`) in the dark one. That is the "black or white border above and on
 * the right" a person sees while a sign-in completes. The sign-in screen itself escaped it only
 * because its container is an absolutely positioned layer covering the viewport, which is
 * presumably why the defect survived the migration.
 *
 * Both halves are checked: the reset exists, and the full-page views really do size themselves
 * against the window (so the reset is what they need, not a per-page offset).
 */
describe('the pages that fill the window', () => {
  const read = (path) => readFileSync(SRC + path, 'utf8')

  it('resets the default page margin once, on the application shell', () => {
    const shell = read('App.vue')
    const rule = shell.match(/html,\s*body\s*\{([^}]*)\}/)

    expect(rule, 'aucune remise a zero de html/body dans App.vue').toBeTruthy()
    expect(rule[1]).toMatch(/margin:\s*0/)
  })

  it('does not compensate page by page', () => {
    // A view that resized itself to `calc(100vh - 16px)` or carried a negative margin would now be
    // the bug: the reset makes the window the whole canvas.
    for (const page of ['views/OAuth.vue', 'views/Inactive.vue', 'views/Privacy.vue']) {
      const source = read(page)
      expect(source, page).not.toMatch(/margin:\s*-8px/)
      expect(source, page).not.toMatch(/calc\(100vh\s*-\s*16px\)/)
    }
  })

  it('keeps the full-page views sized against the window', () => {
    expect(read('views/OAuth.vue')).toMatch(/\.oauth-page\s*\{[^}]*height:\s*100vh/)
    expect(read('views/Inactive.vue')).toMatch(/\.inactive-page\s*\{[^}]*min-height:\s*100vh/)
    expect(read('views/Privacy.vue')).toMatch(/\.privacy-page\s*\{[^}]*min-height:\s*100vh/)
  })
})
