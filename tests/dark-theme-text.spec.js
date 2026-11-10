/**
 * Garde du theme sombre : un texte gris en dur reste gris sur un fond sombre.
 *
 * `element-legacy.css` force `h1..h6 { color: #606266 }` pour retrouver la typographie d'Element UI 2.
 * Ce gris est celui du theme clair : sur une carte sombre (#262c3a) il tombe a 2,5:1, et les
 * libelles de la page d'etat — « Memory: 42 % », « Load 1m » — deviennent illisibles. Rien n'echoue
 * a la compilation dans ce cas : le selecteur s'applique, il donne simplement la mauvaise couleur.
 *
 * Ce test lit les deux feuilles et verifie que le sombre reprend la main. Il ne remplace pas une
 * mesure de contraste (faite au navigateur, 0 element sous 4,5:1 apres correction) : il empeche la
 * regle de disparaitre d'un refactor.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('theme sombre — couleurs de texte', () => {
  const legacy = read('src/styles/element-legacy.css')
  const dark = read('src/styles/dark.css')

  it('la feuille heritee fixe bien un gris clair sur les titres', () => {
    // si cette assertion casse, la regle a change de forme : relire l'override ci-dessous
    expect(legacy).toMatch(/h1,\s*h2,\s*h3,[\s\S]*?color:\s*#606266/)
  })

  it('le theme sombre reprend les titres', () => {
    expect(dark).toMatch(/html\.dark h1,[\s\S]*?html\.dark h6\s*{\s*color:\s*var\(--nyx-text\)/)
  })

  it('le theme sombre peint aussi le texte courant du document', () => {
    expect(dark).toMatch(/html\.dark body\s*{[^}]*color:\s*var\(--nyx-text\)/)
  })

  it('les boites de confirmation reprennent le texte clair', () => {
    // `Main.vue` fixait #303133 sur le titre et #606266 sur le contenu : sur le fond #141414
    // d'Element Plus, la fenetre « Info » etait illisible (1,9:1 et 3,2:1). Les deux regles
    // passent par les variables du theme depuis 3.6.19 ; les overrides `html.dark` restent en
    // second rideau, ils ne peuvent plus faire de mal.
    const main = read('src/views/Main.vue')
    expect(main).toMatch(/\.el-overlay-message-box \.el-message-box__title\s*{[^}]*color:\s*var\(--el-text-color-primary\)/)
    expect(main).toMatch(/\.el-overlay-message-box \.el-message-box__content\s*{[^}]*color:\s*var\(--el-text-color-regular\)/)

    expect(dark).toMatch(/html\.dark \.el-overlay-message-box \.el-message-box__title,[\s\S]*?color:\s*var\(--nyx-text\)/)
    expect(dark).toMatch(/html\.dark \.el-overlay-message-box \.el-message-box__content,[\s\S]*?color:\s*var\(--nyx-text\)/)
  })

  it("les libelles d'un formulaire d'edition suivent le theme", () => {
    // `GenericTableDetails` (editeur d'enregistrement) et `SQLEditor` figeaient `#464646`, le gris
    // du theme clair : sur la surface #1f2430 des cartes, les noms de champs tombaient a 1,6:1.
    // La variable `--el-text-color-regular` d'Element suit le theme (#606266 en clair, #cfd3dc en
    // sombre, soit 10,4:1 sur cette surface).
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
    // Le balayage de 3.6.19 : les memes gris ecrits en dur dans neuf fichiers. Deux exceptions,
    // volontaires, ou le fond est blanc quelle que soit la preference :
    //  - `LanguageSelect` : les `<option>` d'un select natif, peints par le systeme sur blanc ;
    //  - `Privacy` : la page legale est une feuille de papier, lisible en sombre comme en clair.
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
    // Les panneaux du transfert restaient sur `--el-bg-color-overlay` (#1d1e1f, quasi noir sur la
    // surface #1f2430) et leur en-tete sur `--el-color-black` : noir sur #262727, 1,0:1.
    expect(dark).toMatch(/html\.dark \.el-overlay \.el-dialog\s*{[^}]*--el-bg-color-overlay:\s*var\(--nyx-surface-raised\)/)
    expect(dark).toMatch(/html\.dark \.el-transfer-panel__header\s*{\s*color:\s*var\(--nyx-text\)/)
  })

  it("le dialogue d'edition n'a qu'une surface", () => {
    // `--el-fill-color-blank` repris sur le dialogue peint aussi l'en-tete et le corps des sections
    // d'un `el-collapse` : le formulaire utilisateur s'ouvrait sur deux noirs (#262c3a cerne de
    // #1f2430). Les sections repassent en transparent ; les champs et les panneaux du transfert
    // restent, eux, sureleves.
    expect(dark).toMatch(
      /html\.dark \.el-overlay \.el-dialog \.el-collapse-item__header,[\s\S]*?background-color:\s*transparent/
    )
    // `--el-disabled-bg-color` se resout sur `html` (#262727) : le champ desactive gardait donc un
    // troisieme gris a cote des champs actifs.
    expect(dark).toMatch(/html\.dark \.el-overlay \.el-dialog\s*{[^}]*--el-disabled-bg-color:\s*var\(--nyx-surface-raised\)/)
  })

  it('la barre de telechargement de Grafana suit le theme', () => {
    const grafana = read('src/components/Grafana.vue')
    // `background: "#fff"` laissait un bandeau blanc au-dessus de la console sombre.
    expect(grafana).not.toMatch(/background:\s*"#fff"/)
    expect(grafana).toMatch(/background:\s*"var\(--nyx-surface, #fff\)"/)
  })
})
