/**
 * `vue-draggable-next` exige un slot `#item` : sans lui il leve « draggable element must have an item
 * slot » et **rien** du bloc ne se rend (c'etait le cas de l'editeur de table Elasticsearch, dont la
 * liste des champs restait invisible). Le codemod avait laisse la forme Vue 2 : un `v-for` sur un
 * enfant direct.
 *
 * Regle : chaque `<draggable>` porte un `<template #item>` et son enfant n'a pas de `v-for`.
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
    else if (e.endsWith('.vue')) out.push(p)
  }
  return out
}

describe('draggable', () => {
  it('chaque <draggable> declare un slot #item', () => {
    const fautifs = []
    for (const f of files(SRC)) {
      const text = readFileSync(f, 'utf8')
      const re = /<draggable[\s\S]*?<\/draggable>/g
      for (const m of text.matchAll(re)) {
        if (!m[0].includes('#item')) fautifs.push(f.replace(SRC, ''))
      }
    }
    expect(fautifs).toEqual([])
  })

  it("le contenu du slot #item ne boucle pas lui-meme", () => {
    const fautifs = []
    for (const f of files(SRC)) {
      const text = readFileSync(f, 'utf8')
      const re = /<template #item="[^"]*">\s*<[a-z-]+[^>]*v-for=/g
      for (const m of text.matchAll(re)) fautifs.push(`${f.replace(SRC, '')} : ${m[0].slice(0, 40)}`)
    }
    expect(fautifs).toEqual([])
  })
})
