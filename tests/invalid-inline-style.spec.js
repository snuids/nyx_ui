// @vitest-environment jsdom
/**
 * Garde-fou : un `style="{...}"` dans un template ne fait rien.
 *
 * `LogViewer` portait `<span style="{ color:black;white-space: pre-wrap !important;}">` — du balisage
 * Vue 2 (un objet lié par `:style`) laissé en attribut statique. Le navigateur jette la déclaration
 * entière : ni la couleur ni le `pre-wrap` ne s'appliquaient, donc les longues lignes de log ne se
 * repliaient pas et poussaient une barre de défilement horizontale. La couleur restait *légitime* en
 * clair, ce qui rendait le défaut invisible jusqu'à ce qu'un fond sombre ou une ligne longue le
 * révèle.
 *
 * Ce test lit la source : aucune feuille de style ne peut rattraper un attribut invalide, et le
 * compilateur Vue ne dit rien.
 */

import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SRC = resolve(process.cwd(), 'src')

/** Neutralise les commentaires HTML en gardant la longueur, donc les numeros de ligne. */
function withoutTemplateComments(source) {
  return source.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '))
}

function vueFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...vueFiles(path))
    else if (entry.endsWith('.vue')) out.push(path)
  }
  return out
}

describe('styles inline des templates', () => {
  it("n'ecrit jamais une expression Vue dans un attribut style", () => {
    const fautifs = []
    for (const file of vueFiles(SRC)) {
      const source = withoutTemplateComments(readFileSync(file, 'utf8'))
      const lines = source.split('\n')
      lines.forEach((line, index) => {
        // `style="{ ... }"` : l'objet d'un `:style` ecrit sans les deux-points, ou `style="{{ x }}"`
        // `:style` et `:body-style` sont des liaisons : seuls les attributs nus sont fautifs
        if (/(?<![:-\w])style\s*=\s*"\{/.test(line)) {
          fautifs.push(`${file.replace(SRC, '')}:${index + 1} ${line.trim().slice(0, 70)}`)
        }
      })
    }
    expect(fautifs).toEqual([])
  })

  it('lie une expression de style avec `:style`, pas `style`', () => {
    // Un `style="width: {{ x }}px"` n'est pas non plus du Vue : le mustache reste litteral.
    const fautifs = []
    for (const file of vueFiles(SRC)) {
      const source = withoutTemplateComments(readFileSync(file, 'utf8'))
      source.split('\n').forEach((line, index) => {
        if (/(?<![:-\w])style\s*=\s*"[^"]*\{\{/.test(line)) {
          fautifs.push(`${file.replace(SRC, '')}:${index + 1}`)
        }
      })
    }
    expect(fautifs).toEqual([])
  })
})
