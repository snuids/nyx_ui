/**
 * Dark theme guard: grey text written in hard stays grey on a dark background.
 *
 * `element-legacy.css` forces `h1..h6 { color: #606266 }` to recover the Element UI 2 typography.
 * That grey is the light theme one: on a dark card (#262c3a) it falls to 2.5:1, and the labels of
 * the status page — "Memory: 42 %", "Load 1m" — become unreadable. Nothing fails at compile time
 * in that case: the selector applies, it simply gives the wrong colour.
 *
 * This test reads both sheets and checks that the dark one takes over. It does not replace a
 * contrast measurement (done in the browser, 0 element under 4.5:1 after the fix): it keeps the
 * rule from disappearing in a refactor.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('theme sombre — couleurs de texte', () => {
  const legacy = read('src/styles/element-legacy.css')
  const dark = read('src/styles/dark.css')

  it('la feuille heritee fixe bien un gris clair sur les titres', () => {
    // if this assertion breaks, the rule has changed shape: re-read the override below
    expect(legacy).toMatch(/h1,\s*h2,\s*h3,[\s\S]*?color:\s*#606266/)
  })

  it('le theme sombre reprend les titres', () => {
    expect(dark).toMatch(/html\.dark h1,[\s\S]*?html\.dark h6\s*{\s*color:\s*var\(--nyx-text\)/)
  })

  it('le theme sombre peint aussi le texte courant du document', () => {
    expect(dark).toMatch(/html\.dark body\s*{[^}]*color:\s*var\(--nyx-text\)/)
  })

  it('les boites de confirmation reprennent le texte clair', () => {
    // `Main.vue` set #303133 on the title and #606266 on the content: on the #141414 background
    // of Element Plus, the "Info" window was unreadable (1.9:1 and 3.2:1). Both rules have gone
    // through the theme variables since 3.6.19; the `html.dark` overrides stay as a
    // second line of defence, they can no longer do harm.
    const main = read('src/views/Main.vue')
    expect(main).toMatch(/\.el-overlay-message-box \.el-message-box__title\s*{[^}]*color:\s*var\(--el-text-color-primary\)/)
    expect(main).toMatch(/\.el-overlay-message-box \.el-message-box__content\s*{[^}]*color:\s*var\(--el-text-color-regular\)/)

    expect(dark).toMatch(/html\.dark \.el-overlay-message-box \.el-message-box__title,[\s\S]*?color:\s*var\(--nyx-text\)/)
    expect(dark).toMatch(/html\.dark \.el-overlay-message-box \.el-message-box__content,[\s\S]*?color:\s*var\(--nyx-text\)/)
  })

  it("les libelles d'un formulaire d'edition suivent le theme", () => {
    // `GenericTableDetails` (record editor) and `SQLEditor` froze `#464646`, the grey of the
    // light theme: on the #1f2430 surface of the cards, field names fell to 1.6:1.
    // Element's `--el-text-color-regular` variable follows the theme (#606266 in light, #cfd3dc in
    // dark, i.e. 10.4:1 on this surface).
    const components = [
      'src/components/GenericTableDetails.vue',
      'src/components/tableEditor/SQLEditor.vue',
    ]

    for (const component of components) {
      const rule = read(component).match(/\.el-form-item__label\s*{[^}]*}/)
      expect(rule, `${component} : pas de regle .el-form-item__label`).toBeTruthy()
      expect(rule[0]).toMatch(/color:\s*var\(--el-text-color-regular\)/)
      expect(rule[0]).not.toMatch(/color:\s*#[0-9a-fA-F]{3,6}/)
    }
  })

  it('aucun autre composant ne fige un gris du theme clair', () => {
    // The 3.6.19 sweep: the same greys written in hard in nine files. Two deliberate
    // exceptions, where the background is white whatever the preference:
    //  - `LanguageSelect`: the `<option>` of a native select, painted by the system on white;
    //  - `Privacy`: the legal page is a sheet of paper, readable in dark as in light.
    const allowed = new Set(['components/LanguageSelect.vue', 'views/Privacy.vue'])
    const greys = /color:\s*#(2c3e50|303133|464646|606266|333|666)\b/i
    const offenders = []

    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.vue') && !entry.name.startsWith('.')) {
          const relative = full.slice(resolve(process.cwd(), 'src').length + 1)
          if (allowed.has(relative)) continue
          for (const line of read(full).split('\n')) {
            if (greys.test(line) && !line.trimStart().startsWith('//') && !line.includes('/*')) {
              offenders.push(`${relative}: ${line.trim()}`)
            }
          }
        }
      }
    }
    walk(resolve(process.cwd(), 'src'))

    expect(offenders, 'un gris du theme clair fige une couleur : passer par var(--el-text-color-*)')
      .toEqual([])
  })

  it("le dialogue d'edition reprend la palette de la console", () => {
    // The transfer panels stayed on `--el-bg-color-overlay` (#1d1e1f, almost black on the
    // #1f2430 surface) and their header on `--el-color-black`: black on #262727, 1.0:1.
    expect(dark).toMatch(/html\.dark \.el-overlay \.el-dialog\s*{[^}]*--el-bg-color-overlay:\s*var\(--nyx-surface-raised\)/)
    expect(dark).toMatch(/html\.dark \.el-transfer-panel__header\s*{\s*color:\s*var\(--nyx-text\)/)
  })

  it("le dialogue d'edition n'a qu'une surface", () => {
    // `--el-fill-color-blank` carried over to the dialog also paints the header and the body of the
    // sections of an `el-collapse`: the user form opened on two blacks (#262c3a edged with
    // #1f2430). The sections go back to transparent; the fields and the transfer panels
    // stay raised, for their part.
    expect(dark).toMatch(
      /html\.dark \.el-overlay \.el-dialog \.el-collapse-item__header,[\s\S]*?background-color:\s*transparent/
    )
    // `--el-disabled-bg-color` resolves on `html` (#262727): the disabled field therefore kept a
    // third grey next to the active fields.
    expect(dark).toMatch(/html\.dark \.el-overlay \.el-dialog\s*{[^}]*--el-disabled-bg-color:\s*var\(--nyx-surface-raised\)/)
  })

  it('la barre de telechargement de Grafana suit le theme', () => {
    const grafana = read('src/components/Grafana.vue')
    // `background: "#fff"` left a white band above the dark console.
    expect(grafana).not.toMatch(/background:\s*"#fff"/)
    expect(grafana).toMatch(/background:\s*"var\(--nyx-surface, #fff\)"/)
  })
})
