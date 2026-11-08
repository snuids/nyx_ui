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
import { readFileSync } from 'node:fs'
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
})
