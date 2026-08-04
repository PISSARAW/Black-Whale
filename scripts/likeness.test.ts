import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The likeness vocabularies, kept in step across the two packages.
 *
 * `data/characters/appearance.json` declares a hairstyle, an attire and a set
 * of annexe B pieces; canon-lint checks them against `packages/contracts`,
 * which never opens the site. The walk draws them from `lib/tour`, which never
 * opens the contracts — they are a lint tool run over `data/`, not a runtime
 * dependency, and importing them into the browser would ship zod to every
 * visitor so the page could re-learn what CI already checked.
 *
 * So nothing but this connects the two lists, and without it a hairstyle could
 * pass the lint and come out of the walk as a bald head. Same arrangement, and
 * same reason, as `silhouettes.test.ts` next door.
 */
const ROOT = fileURLToPath(new URL('..', import.meta.url))

function listBetween(source: string, opening: string): string[] {
  const start = source.indexOf(opening)
  if (start < 0) throw new Error(`${opening} is missing`)
  const end = source.indexOf(']', start)
  return [...source.slice(start, end).matchAll(/'([^']+)'/g)].map((match) => match[1]!)
}

const contracts = readFileSync(`${ROOT}packages/contracts/src/appearance.ts`, 'utf8')
const walk = readFileSync(`${ROOT}apps/web/src/lib/tour/humanProfiles.ts`, 'utf8')

const PAIRS: ReadonlyArray<readonly [string, string, string]> = [
  ['hairstyles', 'export const APPEARANCE_HAIR_STYLES = [', 'export const HAIR_STYLES = ['],
  ['attire', 'export const APPEARANCE_ATTIRE = [', 'export const ATTIRE = ['],
  ['signatures', 'export const APPEARANCE_SIGNATURES = [', 'export const SIGNATURES = ['],
  ['frames', 'export const APPEARANCE_FRAMES = [', 'export const FRAMES = ['],
]

describe('the likeness vocabularies', () => {
  for (const [what, declared, drawn] of PAIRS) {
    it(`declares and draws the same ${what}`, () => {
      expect(listBetween(walk, drawn)).toEqual(listBetween(contracts, declared))
    })
  }
})

describe('every declared likeness is drawable', () => {
  const file = JSON.parse(
    readFileSync(`${ROOT}data/characters/appearance.json`, 'utf8'),
  ) as import('../packages/contracts/src/appearance.js').AppearanceFile

  it('uses no hairstyle, attire or piece the walk cannot draw', () => {
    const hair = new Set(listBetween(walk, 'export const HAIR_STYLES = ['))
    const attire = new Set(listBetween(walk, 'export const ATTIRE = ['))
    const pieces = new Set(listBetween(walk, 'export const SIGNATURES = ['))
    for (const entry of file.declared) {
      expect(hair.has(entry.head.hairStyle)).toBe(true)
      expect(attire.has(entry.attire)).toBe(true)
      for (const piece of entry.signatures) expect(pieces.has(piece)).toBe(true)
    }
  })

  /**
   * Annexe B's own porteurs column, read the other way round.
   *
   * A piece nobody wears is a geometry that ships and never appears, which is
   * how a vocabulary rots: the entry stays in the table, the drawing bit-rots
   * behind it, and nothing notices because nothing renders it. `afro` is the
   * one hairstyle deliberately declared without a wearer — the annexe lists it
   * and no notice claims it — so the check is on the pieces only.
   */
  it('has a wearer for every piece of annexe B', () => {
    const worn = new Set(file.declared.flatMap((entry) => entry.signatures))
    const declared = listBetween(walk, 'export const SIGNATURES = [')
    expect([...declared].filter((piece) => !worn.has(piece as never))).toEqual([])
  })
})
