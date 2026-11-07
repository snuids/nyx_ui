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
