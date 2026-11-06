/**
 * Meme famille de panne que `el-submenu` -> `el-sub-menu`, mais cote CSS : un selecteur qui ne
 * correspond plus ne produit aucune erreur, il ne s'applique simplement pas. C'est ainsi que les
 * entrees de la barre de gauche ont repris les 56 px par defaut au lieu des 40 px definis ici.
 *
 * Le test lit les blocs <style> des 62 composants et verifie que chaque classe `el-*` citee existe
 * dans la feuille d'Element Plus.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SRC = resolve(process.cwd(), 'src')
const EP_CSS = readFileSync(resolve(process.cwd(), 'node_modules/element-plus/dist/index.css'), 'utf8')

// Classes volontairement absentes d'Element Plus :
//  - `el-menu-vertical` est le nom de classe du projet (prefixe `el-` par heritage) ;
//  - les selecteurs Element UI 2 sont conserves a cote des nouveaux, sans effet ;
//  - `el-icon-info` reste d'une ancienne regle de ConfigDetails.
const ALLOWED = new Set(['el-menu-vertical', 'el-submenu', 'el-submenu__title', 'el-icon-info'])

function styleBlocks(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...styleBlocks(path))
    else if (entry.endsWith('.vue')) {
      const text = readFileSync(path, 'utf8')
      out.push(...(text.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).map((block) => [path, block]))
    }
  }
  return out
}

describe('classes Element Plus utilisees dans nos styles', () => {
  const used = new Map()
  for (const [file, block] of styleBlocks(SRC)) {
    for (const match of block.matchAll(/\.(el-[a-z0-9_-]+)/g)) {
      if (!used.has(match[1])) used.set(match[1], file.replace(SRC, ''))
    }
  }

  it('trouve des classes (garde-fou du test lui-meme)', () => {
    expect(used.size).toBeGreaterThan(20)
  })

  it('n applique aucun style a une classe qu Element Plus ne rend pas', () => {
    const unknown = [...used.keys()]
      .filter((name) => !ALLOWED.has(name))
      .filter((name) => !EP_CSS.includes('.' + name))
      .map((name) => `${name} (${used.get(name)})`)
    expect(unknown).toEqual([])
  })
})
