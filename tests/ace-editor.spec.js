/**
 * `vue3-ace-editor` est un composant Vue 3 qui garde la convention Vue 2 : il declare `value` et
 * emet `update:value`. Le `v-model` simple lie donc `modelValue`, que le composant ignore — l'editeur
 * s'affiche vide et les saisies ne remontent pas. Il faut `v-model:value`.
 *
 * Il ne connait pas non plus de prop `height` : il rend un <div> et laisse Ace le remplir. Un
 * `height="600"` est un attribut inerte et l'editeur s'effondre a zero. La hauteur doit etre dans
 * le `style`.
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

function editorBlocks(file) {
  return readFileSync(file, 'utf8').match(/<editor\b[\s\S]*?><\/editor>/g) || []
}

describe('editeurs Ace', () => {
  const files = vueFiles(SRC).filter((f) => editorBlocks(f).length)

  it('en trouve au moins cinq', () => {
    expect(files.length).toBeGreaterThanOrEqual(5)
  })

  it('utilise v-model:value et jamais v-model seul', () => {
    const fautifs = []
    for (const file of files) {
      for (const block of editorBlocks(file)) {
        if (/\bv-model="/.test(block)) fautifs.push(`${file.replace(SRC, '')} : v-model seul`)
        if (!/v-model:value="/.test(block)) fautifs.push(`${file.replace(SRC, '')} : v-model:value absent`)
      }
    }
    expect(fautifs).toEqual([])
  })

  it('donne une hauteur dans le style, pas dans un attribut', () => {
    const fautifs = []
    for (const file of files) {
      for (const block of editorBlocks(file)) {
        if (/\sheight="/.test(block)) fautifs.push(`${file.replace(SRC, '')} : height= en attribut`)
        if (!/height:/.test(block)) fautifs.push(`${file.replace(SRC, '')} : pas de height dans style`)
      }
    }
    expect(fautifs).toEqual([])
  })
})
