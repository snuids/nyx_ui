#!/usr/bin/env node
/**
 * Vérifie que tous les fichiers de langue exposent exactement les mêmes clés que en.js.
 *
 * el.js avait quinze chaînes de retard sur en.js sans que rien ne le signale : le grec
 * affichait donc l'anglais par intermittence, et personne ne l'a vu. Ce contrôle tourne
 * avant le build.
 *
 * Les fichiers sont évalués tels quels (ce sont de simples littéraux d'objet) plutôt que
 * découpés à la main : la comparaison porte donc sur les clés réelles, pas sur la mise en
 * forme — el.js indente ses clés au niveau de leur section, ce qui trompe un parseur
 * basé sur les espaces.
 *
 * Usage : node scripts/check-lang-keys.mjs   (code 0 si aligné, 1 sinon)
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const langDir = join(here, '..', 'src', 'lang')

/** Charge le littéral `messages` d'un fichier de langue. */
function loadMessages(file) {
  const source = readFileSync(join(langDir, file), 'utf8').replace(/^\s*export\s+const\s+messages\s*=/, 'return')
  return new Function(source)()
}

/** Aplatit un objet en chemins de clés feuilles. */
function flatten(node, prefix = '') {
  const out = []
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flatten(value, path))
    } else {
      out.push(path)
    }
  }
  return out
}

function keysOf(file) {
  const messages = loadMessages(file)
  const language = Object.keys(messages)[0]
  return new Set(flatten(messages[language]))
}

const reference = keysOf('en.js')
const others = readdirSync(langDir).filter((f) => f.endsWith('.js') && f !== 'en.js')
let failed = false

for (const file of others) {
  const keys = keysOf(file)
  const missing = [...reference].filter((k) => !keys.has(k))
  const extra = [...keys].filter((k) => !reference.has(k))
  if (!missing.length && !extra.length) {
    console.log(`  ${file.padEnd(8)} ${String(keys.size).padStart(4)} clés — complet`)
    continue
  }
  // Une clé manquante fait échouer le build : c'est une chaîne qui s'affichera en anglais.
  // Une clé en trop est seulement signalée : elle ne casse rien, mais elle trahit souvent
  // une faute de frappe qui empêche le libellé de s'afficher.
  if (missing.length) failed = true
  console.error(`  ${file.padEnd(8)} ${keys.size} clés — ${missing.length} manquante(s), ${extra.length} en trop`)
  if (missing.length) console.error(`    manquantes : ${missing.join(', ')}`)
  if (extra.length) console.error(`    en trop    : ${extra.join(', ')}`)
}

if (failed) {
  console.error('\nLes fichiers de langue ne sont pas alignés sur en.js.')
  process.exit(1)
}
console.log(`\n${others.length + 1} fichiers de langue alignés sur ${reference.size} clés.`)
