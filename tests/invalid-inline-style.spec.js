// @vitest-environment jsdom
/**
 * Guard: a `style="{...}"` in a template does nothing.
 *
 * `LogViewer` carried `<span style="{ color:black;white-space: pre-wrap !important;}">` — Vue 2
 * markup (an object bound through `:style`) left as a static attribute. The browser drops the whole
 * declaration: neither the colour nor the `pre-wrap` applied, so the long log lines did not wrap
 * and pushed a horizontal scrollbar. The colour stayed *legitimate* in light mode, which kept the
 * defect invisible until a dark background or a long line revealed it.
 *
 * This test reads the source: no stylesheet can fix an invalid attribute, and the Vue compiler
 * says nothing.
 */

import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SRC = resolve(process.cwd(), 'src')

/** Neutralises HTML comments while keeping the length, hence the line numbers. */
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
        // `style="{ ... }"`: the object of a `:style` written without the colon, or `style="{{ x }}"`
        // `:style` and `:body-style` are bindings: only bare attributes are at fault
        if (/(?<![:-\w])style\s*=\s*"\{/.test(line)) {
          fautifs.push(`${file.replace(SRC, '')}:${index + 1} ${line.trim().slice(0, 70)}`)
        }
      })
    }
    expect(fautifs).toEqual([])
  })

  it('lie une expression de style avec `:style`, pas `style`', () => {
    // A `style="width: {{ x }}px"` is not Vue either: the mustache stays literal.
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
