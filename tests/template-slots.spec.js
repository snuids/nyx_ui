/**
 * Un `<template>` ne peut porter qu'une seule directive de slot. Le codemod qui a transforme
 * `slot="header" slot-scope="scope"` en `#header #default="scope"` a produit exactement le contraire
 * de ce qu'il fallait : sept tableaux ont perdu leur en-tete d'actions (le bouton « modifier » de la
 * liste des utilisateurs, entre autres).
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SRC = resolve(process.cwd(), 'src')

function vueFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...vueFiles(path))
    else if (entry.endsWith('.vue')) out.push(path)
  }
  return out
}

describe('directives de slot', () => {
  it('une seule directive # par <template>', () => {
    const fautifs = []
    for (const file of vueFiles(SRC)) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/<template([^>]*)>/g)) {
        const directives = m[1].match(/(^|\s)#[A-Za-z0-9_-]+/g) || []
        if (directives.length > 1) {
          fautifs.push(`${file.replace(SRC, '')} : <template${m[1].slice(0, 60)}>`)
        }
      }
    }
    expect(fautifs).toEqual([])
  })

  it('aucun attribut slot= sur un element ordinaire', () => {
    const fautifs = []
    for (const file of vueFiles(SRC)) {
      const text = readFileSync(file, 'utf8')
      const styleAndComments = text
        .replace(/<style[\s\S]*?<\/style>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
      for (const m of styleAndComments.matchAll(/<([A-Za-z][A-Za-z0-9-]*)([^>]*\sslot="[^"]*"[^>]*)>/g)) {
        if (m[1] !== 'template') fautifs.push(`${file.replace(SRC, '')} : <${m[1]} slot=...>`)
      }
    }
    expect(fautifs).toEqual([])
  })
})
