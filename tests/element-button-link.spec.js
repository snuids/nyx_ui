/**
 * `type="text"` on a button is Element UI 2. Element Plus 2 replaced it with the `link` prop, and
 * every render of such a button logs:
 *
 *   ElementPlusError: [props] [API] type.text is about to be deprecated in version 3.0.0,
 *   please use link instead.
 *
 * Sixty-three buttons across eight editor screens carried it, so the warning fired whenever a report
 * dialog or an application editor opened. The runtime warning is not an error and nothing else
 * reports it, so the rule is checked statically here — the same way the `el-radio` `label`/`value`
 * deprecation is.
 *
 * `type="text"` stays legal on `el-input`: this only looks inside `el-button` tags.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname
const BUTTON = /<el-button\b([^>]*)>/g

function walk(dir) {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(SRC).filter(f => f.endsWith('.vue'))

describe('el-button', () => {
  it('uses link, not the deprecated type="text"', () => {
    const offenders = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(BUTTON)) {
        if (/type="text"/.test(match[1])) {
          offenders.push(`${file.replace(SRC, 'src/')}:${text.slice(0, match.index).split('\n').length}`)
        }
      }
    }

    expect(offenders, 'use `link` (Element Plus 2) instead of `type="text"`').toEqual([])
  })

  it('sees the buttons it is supposed to check', () => {
    // a matcher that stops matching would pass the assertion above for ever
    const buttons = files.reduce((total, file) =>
      total + [...readFileSync(file, 'utf8').matchAll(BUTTON)].length, 0)

    expect(buttons).toBeGreaterThan(100)
  })
})
