/**
 * Element Plus 2.x deprecated `label` on radios: it used to carry the *value*, and 3.0 makes `value`
 * the only way. The console said so at runtime —
 * `[el-radio] [API] label act as value is about to be deprecated in version 3.0.0` — on every
 * screen that showed a radio, which is how it was found.
 *
 * A runtime warning is easy to miss and will simply stop being emitted when the deprecation becomes
 * a removal, so the rule is checked statically here: a radio whose `label` carries a value fails the
 * suite. `label` stays legal as the *text* of a radio, which is why the check looks for a `value`
 * attribute on the same tag.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname

function walk(dir) {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

/** Every open tag of `el-radio` / `el-radio-button`, with its attributes. */
function radioTags() {
  const tags = []
  for (const file of walk(SRC).filter(f => f.endsWith('.vue'))) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(/<el-radio(?:-button)?\b([^>]*)>/g)) {
      tags.push({ file: file.replace(SRC, 'src/'), attrs: match[1] })
    }
  }
  return tags
}

describe('el-radio', () => {
  it('carries its value in `value`, not in `label`', () => {
    const offenders = radioTags()
      .filter(({ attrs }) => /\blabel\s*=/.test(attrs) && !/\bvalue\s*=/.test(attrs))
      .map(({ file, attrs }) => `${file}: ${attrs.trim()}`)

    expect(offenders, 'use value="…" (and label only for the text)').toEqual([])
  })

  it('finds the radios it is supposed to check', () => {
    // a broken regex that matches nothing would pass the test above for ever
    expect(radioTags().length).toBeGreaterThan(15)
  })
})
