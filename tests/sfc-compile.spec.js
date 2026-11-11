/**
 * Every `.vue` file must compile.
 *
 * This exists because it did not: six tools tips were rewritten by hand in `ReportList.vue`,
 * `ReportPeriodic.vue` and `ReportTask.vue`, one of them was left with a stray quote — `<el-button"` —
 * and **the whole suite stayed green**, because no test mounts those three components (they sit at
 * 0 % coverage, they are editors opened on demand). The build failed, of course, but the build is
 * what runs after the merge.
 *
 * The Vue compiler is already in the tree (`@vue/compiler-sfc`, the one `vue-loader` uses), so
 * parsing every single-file component costs a couple of seconds and catches the whole class:
 * unbalanced tags, stray characters, a `<script>` that does not parse. No mount, no mocks, no DOM.
 */

import { describe, it, expect } from 'vitest'
import { parse } from '@vue/compiler-sfc'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname

function walk(dir) {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

describe('single-file components', () => {
  const files = walk(SRC).filter(f => f.endsWith('.vue'))

  it('has components to compile', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it.each(files.map(f => [f.replace(SRC, 'src/'), f]))('compiles %s', (name, path) => {
    const { descriptor, errors } = parse(readFileSync(path, 'utf8'), { filename: path })

    expect(errors.map(e => e.message || String(e))).toEqual([])
    expect(descriptor.template || descriptor.script || descriptor.scriptSetup).toBeTruthy()
  })
})
