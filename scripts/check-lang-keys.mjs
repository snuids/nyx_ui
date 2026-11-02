#!/usr/bin/env node
/**
 * Checks that every language file exposes exactly the same keys as en.js.
 *
 * el.js was fifteen strings behind en.js without anything reporting it: Greek therefore showed
 * English intermittently, and nobody saw it. This check runs before the build.
 *
 * The files are evaluated as they are (they are plain object literals) rather than split by
 * hand: the comparison therefore bears on the real keys, not on the formatting — el.js indents
 * its keys at the level of their section, which defeats a parser based on whitespace.
 *
 * Usage: node scripts/check-lang-keys.mjs   (exit code 0 when aligned, 1 otherwise)
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const langDir = join(here, '..', 'src', 'lang')

/** Loads the `messages` literal of a language file. */
function loadMessages(file) {
  const source = readFileSync(join(langDir, file), 'utf8').replace(/^\s*export\s+const\s+messages\s*=/, 'return')
  return new Function(source)()
}

/** Flattens an object into leaf key paths. */
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
  // A missing key makes the build fail: it is a string that will be displayed in English.
  // An extra key is only reported: it breaks nothing, but it often betrays a typo that
  // prevents the label from being displayed.
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
