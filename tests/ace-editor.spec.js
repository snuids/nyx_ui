/**
 * `vue3-ace-editor` is a Vue 3 component that keeps the Vue 2 convention: it declares `value` and
 * emits `update:value`. A plain `v-model` therefore binds `modelValue`, which the component
 * ignores — the editor shows empty and keystrokes do not come back. It needs `v-model:value`.
 *
 * It also knows no `height` prop: it renders a <div> and lets Ace fill it. A
 * `height="600"` is an inert attribute and the editor collapses to zero. The height must be in
 * the `style`.
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

  it('suit le theme de la console au lieu d une valeur figee', () => {
    // `theme="chrome"` was written in five files: the editor stayed white on the dark
    // console. The mixin carries the real prop, and resynchronises editors that are already mounted.
    const fautifs = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const block of editorBlocks(file)) {
        if (/\btheme="chrome"/.test(block)) fautifs.push(`${file.replace(SRC, '')} : theme fige`)
        if (!/:theme="aceTheme"/.test(block)) fautifs.push(`${file.replace(SRC, '')} : :theme="aceTheme" absent`)
      }
      if (!/mixins: \[aceThemeMixin\]/.test(source)) fautifs.push(`${file.replace(SRC, '')} : mixin absent`)
    }
    expect(fautifs).toEqual([])
  })
})
