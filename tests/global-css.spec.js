// A component's `<style>` block is GLOBAL unless it says `scoped`: a rule written there reaches every
// screen of the console.
//
// That is how the report editor lost its radio spacing. `ProcessList.vue` used to render its module
// cards inside an `el-radio` and reset the component (`.el-radio { margin-right: 0 }`) to make room
// for a 120 px card. The cards were replaced, the rule stayed, and it stripped the 30 px that
// Element Plus puts between two radios — from every radio in the application, with nothing in the
// build or the console to say so.
//
// This guard only catches the shape of that mistake, which needs no judgement: a bare `.el-*`
// selector in a non-scoped style, in a component whose template does not use that component at all.
// A live rule for a component the file renders is a deliberate override and stays allowed.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC = resolve(process.cwd(), 'src')

function vueFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry)
    if (statSync(full).isDirectory()) out.push(...vueFiles(full))
    else if (entry.endsWith('.vue')) out.push(full)
  }
  return out
}

// `.el-radio`, `.el-radio__label`, `.el-radio.is-checked` → `el-radio`
function componentOf(selector) {
  const match = /^\.(el-[a-z0-9-]+)/.exec(selector.trim())
  return match ? match[1] : null
}

// Files that style the console's chrome rather than a component of their own: the layout (dialogs
// opened by children, the loading mask a directive creates, the menus it holds) and the generic
// page container. Everything else must render what it styles.
const LAYOUT = new Set(['views/Main.vue', 'components/Config.vue'])

describe('global component styles', () => {
  it('declares no rule for an Element component it does not render', () => {
    const orphans = []

    for (const file of vueFiles(SRC)) {
      const relative = file.slice(SRC.length + 1)
      if (LAYOUT.has(relative)) continue
      const source = readFileSync(file, 'utf8')
      const template = (source.match(/<template>([\s\S]*?)<\/template>\s*<script/) || [, ''])[1]
      const styles = [...source.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)]

      for (const [, attributes, body] of styles) {
        if (attributes.includes('scoped')) continue
        for (const rule of body.matchAll(/(^|\})\s*([^{}@/]+)\{/g)) {
          for (const selector of rule[2].split(',')) {
            const component = componentOf(selector)
            if (!component) continue
            if (template.includes('<' + component)) continue
            orphans.push(`${file.slice(SRC.length + 1)}: .${component} (from "${selector.trim()}")`)
          }
        }
      }
    }

    expect(orphans).toEqual([])
  })
})
