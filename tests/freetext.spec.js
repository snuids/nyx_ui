// The free-text module stores HTML (the application editor writes it), so the viewer has to render
// it — and has to sanitise it first, because the same document is shown to every visitor.
//
// This is a source scan, like the other guard suites: the .vue file is read, not mounted, because
// this Vitest runs in a node environment without the Vue plugin. It catches the two regressions that
// have already happened on this component: interpolating the field (the markup is printed on screen,
// no error anywhere) and rendering it without DOMPurify.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(
  resolve(process.cwd(), 'src/components/FreeText.vue'),
  'utf8'
)

describe('FreeText module', () => {
  it('renders the stored text as HTML instead of printing the markup', () => {
    expect(source).toMatch(/v-html="html"/)
    expect(source).not.toMatch(/\{\{\s*config\.config\.freetext\s*\}\}/)
  })

  it('sanitises it before rendering', () => {
    expect(source).toMatch(/DOMPurify\.sanitize\(/)
    // the link attributes the stored documents use must survive the sanitiser
    expect(source).toMatch(/ADD_ATTR/)
  })
})
