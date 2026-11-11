/**
 * A component whose <template> block carries a `v-slot` renders nothing: Vue expects a parent that
 * provides that slot, and there is none. Seven components (Form, Kibana, Grafana, External, Upload,
 * Vega, ChangePassword) ended up in that state after the migration — blank screens, with no error
 * in the console.
 *
 * This test checks that the template block of every component is a real root.
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
