/**
 * `el-tooltip` and `el-popover` need exactly one element child to hang themselves on: it is what the
 * pointer events are bound to, and what the bubble is positioned against. A child carrying `v-if` is
 * a comment node whenever the condition is false, and Element Plus then logs
 *
 *   ElementPlusError: [ElOnlyChild] no valid child node found
 *
 * The list of generated reports did it on every row that had not failed — the error icon was hidden
 * behind `v-if="status == 'Error'"` inside its own tooltip — so the warning appeared as soon as the
 * screen opened, on rows where everything had gone well.
 *
 * Putting the `v-if` on the tooltip instead renders nothing at all when the condition is false, which
 * is what was meant, and leaves a real element for the tooltip when it is true. Checked here,
 * statically, because the runtime warning is not an error and nothing else reports it.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname
const ONE_CHILD = /<el-(?:tooltip|popover)\b([^>]*)>([\s\S]*?)<\/el-(?:tooltip|popover)>/g

function walk(dir) {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

/** Wrappers whose own tag has no `v-if` but whose first child does. */
function offenders() {
  const found = []
  for (const file of walk(SRC).filter(f => f.endsWith('.vue'))) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(ONE_CHILD)) {
      const [, attrs, body] = match
      if (/\bv-if\b/.test(attrs)) continue
      // the reference slot of a popover is a `<template>`, not the child itself
      const children = [...body.matchAll(/<(?!template\b|\/|!)([a-zA-Z][\w.-]*)([^>]*?)\/?>/g)]
      const conditional = children.find(([, , childAttrs]) => /\bv-if\b/.test(childAttrs))
      if (conditional) {
        const line = text.slice(0, match.index).split('\n').length
        found.push(`${file.replace(SRC, 'src/')}:${line} <${conditional[1]}>`)
      }
    }
  }
  return found
}

describe('ElOnlyChild', () => {
  it('gives every tooltip and popover an element child, never a conditional one', () => {
    expect(offenders(), 'put the v-if on the tooltip/popover itself').toEqual([])
  })

  it('sees the wrappers it is supposed to check', () => {
    // a matcher that finds nothing would pass the assertion above for ever
    let seen = 0
    for (const file of walk(SRC).filter(f => f.endsWith('.vue'))) {
      seen += [...readFileSync(file, 'utf8').matchAll(ONE_CHILD)].length
    }
    expect(seen).toBeGreaterThan(20)
  })
})
