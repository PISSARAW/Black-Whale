import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, parse } from 'node:path'
import { CATALOGUE_FILES, type CataloguePath } from './schemas.js'
import { INVARIANTS } from './invariants.js'
import type { Catalogue, Finding } from './types.js'

/**
 * canon-lint: reads `data/`, checks every file against its schema, then checks
 * the archive against itself.
 *
 * ADR-001 makes `data/` the single declaration of every canonical fact. That
 * only holds if something refuses a declaration that contradicts another one,
 * which is what this is. It answers non-zero, so it can sit in CI.
 */

/** Walks up from a starting directory to the repository's `data/`. */
export function findDataRoot(from: string = process.cwd()): string {
  let current = from
  const { root } = parse(current)
  while (true) {
    if (existsSync(join(current, 'data/characters/characters.json'))) return join(current, 'data')
    if (current === root) break
    current = dirname(current)
  }
  throw new Error(`Unable to locate data/ starting from ${from}`)
}

function readJson(dataRoot: string, relativePath: string): unknown {
  return JSON.parse(readFileSync(join(dataRoot, relativePath), 'utf-8'))
}

export interface CanonLintResult {
  findings: Finding[]
  /** Absent when a file failed its schema: the invariants need every file. */
  catalogue: Catalogue | null
}

/**
 * Schema pass, then invariant pass.
 *
 * The two are not merged on purpose: an invariant that reads a field the
 * schema has not accepted would be reasoning about a value it cannot trust, so
 * a schema failure stops the run and says so rather than producing a second
 * page of consequences.
 */
export function canonLint(dataRoot: string = findDataRoot()): CanonLintResult {
  const findings: Finding[] = []
  const parsed: Record<string, unknown> = {}

  for (const [path, schema] of Object.entries(CATALOGUE_FILES) as Array<
    [CataloguePath, (typeof CATALOGUE_FILES)[CataloguePath]]
  >) {
    let raw: unknown
    try {
      raw = readJson(dataRoot, path)
    } catch (error) {
      findings.push({
        rule: 'readable',
        where: path,
        message: error instanceof Error ? error.message : String(error),
      })
      continue
    }
    const result = schema.safeParse(raw)
    if (!result.success) {
      for (const issue of result.error.issues.slice(0, 50)) {
        findings.push({
          rule: 'schema',
          where: `${path}:${issue.path.join('.')}`,
          message: issue.message,
        })
      }
      continue
    }
    parsed[path] = result.data
  }

  if (findings.length > 0) return { findings, catalogue: null }

  const catalogue: Catalogue = {
    chapters: parsed['chapters/chapters.json'] as Catalogue['chapters'],
    characters: parsed['characters/characters.json'] as Catalogue['characters'],
    appearance: parsed['characters/appearance.json'] as Catalogue['appearance'],
    abilities: parsed['abilities/abilities.json'] as Catalogue['abilities'],
    abilityUses: parsed['abilities/uses.json'] as Catalogue['abilityUses'],
    factions: parsed['factions/factions.json'] as Catalogue['factions'],
    locations: parsed['locations/locations.json'] as Catalogue['locations'],
    events: parsed['events/events.json'] as Catalogue['events'],
    prophecies: parsed['prophecies/prophecies.json'] as Catalogue['prophecies'],
    blueprint: parsed['ship/blueprint.json'] as Catalogue['blueprint'],
  }

  for (const invariant of INVARIANTS) findings.push(...invariant.run(catalogue))
  return { findings, catalogue }
}

/** Human-readable report, grouped by rule so a class of defect reads as one. */
export function formatFindings(findings: readonly Finding[]): string {
  if (findings.length === 0) return 'canon-lint: the catalogue is consistent.'

  const byRule = new Map<string, Finding[]>()
  for (const found of findings) {
    const bucket = byRule.get(found.rule) ?? []
    bucket.push(found)
    byRule.set(found.rule, bucket)
  }

  const lines: string[] = []
  for (const [rule, bucket] of [...byRule].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`\n${rule} — ${bucket.length}`)
    for (const found of bucket.slice(0, 20)) lines.push(`  ${found.where}: ${found.message}`)
    if (bucket.length > 20) lines.push(`  … and ${bucket.length - 20} more`)
  }
  lines.push(`\ncanon-lint: ${findings.length} problem${findings.length === 1 ? '' : 's'}.`)
  return lines.join('\n')
}
