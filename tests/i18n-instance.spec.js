/**
 * vue-i18n 8 exposed `i18n.t(...)` on the instance; version 9 moves it to `i18n.global`.
 * Calls left in v8 raised `TypeError: i18n.t is not a function` **inside `data()`**, hence
 * before any render: the window did not open at all, with no message (that is what broke
 * editing a user and editing a report).
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SRC = resolve(process.cwd(), 'src')

function files(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) out.push(...files(p))
    else if (/\.(vue|js)$/.test(e)) out.push(p)
  }
  return out
}

describe('API de vue-i18n', () => {
  it("n'utilise pas i18n.t(), retire en version 9", () => {
    const fautifs = []
    for (const f of files(SRC)) {
      const text = readFileSync(f, 'utf8')
      for (const m of text.matchAll(/(^|[^.\w])i18n\.t\(/g)) {
        fautifs.push(`${f.replace(SRC, '')} : i18n.t(...) — utiliser i18n.global.t(...)`)
      }
    }
    expect(fautifs).toEqual([])
  })
})
