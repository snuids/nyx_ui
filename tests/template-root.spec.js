/**
 * Un composant dont le bloc <template> porte un `v-slot` ne rend rien : Vue attend un parent qui
 * fournisse ce slot, et il n'y en a pas. Sept composants (Form, Kibana, Grafana, External, Upload,
 * Vega, ChangePassword) se sont retrouvés dans cet état après la migration — écrans vides, sans
 * erreur en console.
 *
 * Ce test vérifie que le bloc de template de chaque composant est un vrai racine.
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

describe('racine des composants', () => {
  it('aucun bloc <template> ne porte de v-slot', () => {
    const fautifs = []
    for (const file of vueFiles(SRC)) {
      const text = readFileSync(file, 'utf8')
      const m = text.match(/<template(\s[^>]*)?>/)
      if (m && m[1] && /#|v-slot/.test(m[1])) {
        fautifs.push(`${file.replace(SRC, '')} : <template${m[1]}>`)
      }
    }
    expect(fautifs).toEqual([])
  })

  it('chaque composant a un bloc template et un bloc script', () => {
    const incomplets = []
    for (const file of vueFiles(SRC)) {
      const text = readFileSync(file, 'utf8')
      if (!/<template[\s>]/.test(text) || !/<script[\s>]/.test(text)) {
        incomplets.push(file.replace(SRC, ''))
      }
    }
    expect(incomplets).toEqual([])
  })
})
