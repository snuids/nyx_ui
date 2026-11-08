#!/usr/bin/env node
/**
 * Coverage, rendered for GitHub.
 *
 * Reads `coverage/coverage-summary.json` (Vitest's `json-summary` reporter) and writes a markdown
 * table — totals, a breakdown by area (logic javascript / screens / components) and the least
 * covered files — to three places: stdout, the run's own summary page (`$GITHUB_STEP_SUMMARY`) and
 * `coverage/summary.md`, which the next step posts as a pull-request comment.
 *
 * No dependency on purpose: it runs on the runner's node without an extra install, and the same
 * command works locally (`node .github/scripts/coverage-summary.mjs`).
 *
 * Exit code is always 0. The gate is the test step; this one only reports, so a missing or partial
 * report must not turn a green build red — it must say so instead.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const REPORT = 'coverage/coverage-summary.json'
const OUT_FILE = 'coverage/summary.md'
// Ecrit pour le badge `shields.io` (endpoint JSON) publie sur la branche `badges`.
const BADGE_FILE = 'coverage/badge.json'
// Couverture de `master` au dernier run publie : sert a afficher le delta d'une pull request.
const BASELINE_FILE = 'coverage/baseline.json'
const METRICS = ['statements', 'branches', 'functions', 'lines']
const METRIC_LABELS = {
  statements: 'instructions',
  branches: 'branches',
  functions: 'fonctions',
  lines: 'lignes',
}

/** Zones the console's team actually reasons about (see vitest.config.mjs thresholds). */
const AREAS = [
  { label: 'Tout `src`', match: () => true },
  { label: 'JavaScript de logique', match: (file) => file.endsWith('.js') },
  { label: 'Écrans `src/views`', match: (file) => file.includes('/src/views/') },
  { label: 'Composants `src/components`', match: (file) => file.includes('/src/components/') },
]

const pct = (m) => (m.total === 0 ? '—' : `${m.pct.toFixed(1).replace('.', ',')} %`)

/** Couleur `shields.io` : le chiffre doit se lire d'un coup d'oeil, pas se deviner. */
function badgeColor(value) {
  if (value >= 80) return 'brightgreen'
  if (value >= 60) return 'green'
  if (value >= 40) return 'yellowgreen'
  if (value >= 25) return 'yellow'
  if (value >= 10) return 'orange'
  return 'red'
}

/** La couverture publiee sur `master`, si la CI en a laissee une. */
function readBaseline() {
  try {
    return JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
  } catch {
    return null
  }
}
const counts = (m) => (m.total === 0 ? '—' : `${m.covered} / ${m.total}`)

function empty(reason) {
  return [
    '### Couverture',
    '',
    `> Rapport de couverture indisponible : ${reason}.`,
    '',
  ].join('\n')
}

function main() {
  let report
  try {
    report = JSON.parse(readFileSync(REPORT, 'utf8'))
  } catch (error) {
    return empty(`\`${REPORT}\` illisible (${error.message})`)
  }

  const files = Object.entries(report).filter(([path]) => path !== 'total')
  if (files.length === 0) return empty('aucun fichier mesuré')

  const total = report.total
  const lines = []

  lines.push('### Couverture', '')
  lines.push(
    `${files.length} fichiers mesurés, ${total.statements.total} instructions — ` +
      `**${pct(total.statements)}** des instructions, ${pct(total.branches)} des branches.`,
    ''
  )

  // Le delta n'a de sens que sur une pull request : la CI y depose la couverture de `master`.
  const baseline = readBaseline()
  if (baseline && typeof baseline.value === 'number') {
    const delta = total.statements.pct - baseline.value
    const sign = delta > 0 ? '+' : delta < 0 ? '−' : '±'
    lines.push(
      `**Δ vs master : ${sign}${Math.abs(delta).toFixed(1).replace('.', ',')} pt** ` +
        `(${pct({ pct: baseline.value, total: 1 })} → ${pct(total.statements)})`,
      ''
    )
  }

  // Per-area table: the global number alone says nothing while most components are untested.
  lines.push(`| zone | ${METRICS.map((m) => METRIC_LABELS[m]).join(' | ')} |`)
  lines.push(`|---|${METRICS.map(() => '---:').join('|')}|`)
  for (const area of AREAS) {
    const selected = files.filter(([path]) => area.match(path)).map(([, data]) => data)
    if (selected.length === 0) continue
    const cells = METRICS.map((metric) => {
      const covered = selected.reduce((sum, data) => sum + data[metric].covered, 0)
      const size = selected.reduce((sum, data) => sum + data[metric].total, 0)
      const value = { covered, total: size, pct: size === 0 ? 0 : (covered / size) * 100 }
      return `${pct(value)} (${counts(value)})`
    })
    lines.push(`| ${area.label} | ${cells.join(' | ')} |`)
  }
  lines.push('')

  // The least covered measured files, so the table points at the next place to work.
  const weakest = files
    .filter(([, data]) => data.statements.total > 0 && data.statements.pct < 100)
    .sort((a, b) => a[1].statements.pct - b[1].statements.pct)
    .slice(0, 5)

  if (weakest.length > 0) {
    lines.push('Fichiers mesurés les moins couverts :', '')
    for (const [path, data] of weakest) {
      const short = path.replace(/^.*\/src\//, 'src/')
      lines.push(`- \`${short}\` — ${pct(data.statements)} des instructions (${counts(data.statements)})`)
    }
    lines.push('')
  }

  lines.push(
    '_Détail complet dans l\'artefact `coverage-report` du run (`html/index.html`)._',
    ''
  )

  return lines.join('\n')
}

const markdown = main()

process.stdout.write(markdown + '\n')

// Le badge lit ce fichier via `raw.githubusercontent.com` : `shields.io/endpoint` accepte
// `{schemaVersion, label, message, color}`.
try {
  const value = JSON.parse(readFileSync(REPORT, 'utf8')).total.statements.pct
  writeFileSync(
    BADGE_FILE,
    JSON.stringify(
      {
        schemaVersion: 1,
        label: 'couverture',
        message: `${value.toFixed(1).replace('.', ',')} %`,
        color: badgeColor(value),
        // Pas lu par shields.io, mais c'est la valeur que la CI relit sur master pour le delta.
        value: Number(value.toFixed(2)),
      },
      null,
      2
    ) + '\n'
  )
} catch {
  // Pas de rapport : pas de badge non plus, l'etape de publication le verra absent.
}

if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n', { flag: 'a' })
}

// The pull-request comment step reads this file, if the coverage run produced a report at all.
try {
  writeFileSync(OUT_FILE, markdown + '\n')
} catch {
  // No coverage directory (report step ran before the tests, for instance): stdout was enough.
}

if (!existsSync(REPORT)) process.exitCode = 0
