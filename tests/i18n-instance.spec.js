/**
 * vue-i18n 8 exposait `i18n.t(...)` sur l'instance ; la version 9 le deplace sur `i18n.global`.
 * Les appels restes en v8 levaient `TypeError: i18n.t is not a function` **dans `data()`**, donc
 * avant tout rendu : la fenetre ne s'ouvrait pas du tout, sans message (c'est ce qui cassait
 * l'edition d'un utilisateur et l'edition d'un rapport).
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
