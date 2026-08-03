import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The two lists of Nen creature shapes, kept in step.
 *
 * `data/` declares a guardian beast's silhouette and canon-lint checks it
 * against `packages/contracts`, which never opens the site. The walk draws that
 * silhouette from `lib/tour/nenCreatureFigure.ts`, which never opens `data/`.
 * The two packages do not depend on each other — the contracts are a lint tool,
 * not a runtime dependency of the app — so nothing but this connects them, and
 * without it a silhouette could pass the lint and come out of the walk as
 * nothing at all.
 *
 * Read as text rather than imported for the same reason: this is a check on the
 * repository, and the repository is the only place both files are in scope.
 */
const ROOT = fileURLToPath(new URL('..', import.meta.url))

function listBetween(source: string, opening: string): string[] {
  const start = source.indexOf(opening)
  if (start < 0) throw new Error(`${opening} is missing`)
  const end = source.indexOf(']', start)
  return [...source.slice(start, end).matchAll(/'([^']+)'/g)].map((match) => match[1]!)
}

const contracts = listBetween(
  readFileSync(`${ROOT}packages/contracts/src/schemas.ts`, 'utf8'),
  'export const NEN_CREATURE_SILHOUETTES = [',
)
const walk = listBetween(
  readFileSync(`${ROOT}apps/web/src/lib/tour/nenCreatureFigure.ts`, 'utf8'),
  'export const NEN_CREATURE_KINDS = new Set<ApparitionKind>([',
)
const posed = listBetween(
  readFileSync(`${ROOT}packages/contracts/src/schemas.ts`, 'utf8'),
  'export const POSED_SILHOUETTES = [',
)

/**
 * The kinds the scene positions from the camera rather than from the room.
 *
 * Read out of `TourScene.svelte`'s animation loop: a branch that sets a root's
 * position from `camera.position` is drawing something the visitor is carrying.
 * Two of them are Nen creatures — Tyson's beast and its eye-wogs hang in front
 * of whoever reads the Book of Tyson, which is the whole ability — and a
 * guardian beast declared as one of those is an animal glued to the visitor's
 * face on every deck. That is not a hypothesis: it shipped, and it is what this
 * pair of lists exists to prevent.
 */
function carriedKinds(): string[] {
  const scene = readFileSync(`${ROOT}apps/web/src/lib/components/tour/TourScene.svelte`, 'utf8')
  const found = new Set<string>()
  let kind: string | null = null
  for (const line of scene.split('\n')) {
    const branch = /held\.kind === '([a-z-]+)'/.exec(line)
    if (branch) kind = branch[1]!
    if (kind && line.includes('camera.position.x +')) {
      found.add(kind)
      kind = null
    }
  }
  return [...found]
}

describe('the Nen creature silhouettes', () => {
  it('are the same shapes in the contracts and in the walk', () => {
    expect([...contracts].sort()).toEqual([...walk].sort())
  })

  it('keep the carried creatures out of the posed list', () => {
    const carried = carriedKinds()
    // A guard on the guard: if the scene is refactored past this reading, the
    // list comes back empty and the check below would pass by knowing nothing.
    expect(carried).toContain('tyson-guardian')
    expect(posed.filter((silhouette) => carried.includes(silhouette))).toEqual([])
    expect(posed.every((silhouette) => walk.includes(silhouette))).toBe(true)
  })

  it('cover every beast the catalogue declares', () => {
    const characters = JSON.parse(
      readFileSync(`${ROOT}data/characters/characters.json`, 'utf8'),
    ) as Array<{ guardianBeast?: { silhouette: string } }>
    const declared = characters
      .map((character) => character.guardianBeast?.silhouette)
      .filter((silhouette): silhouette is string => Boolean(silhouette))
    expect(declared.length).toBeGreaterThan(0)
    expect(declared.filter((silhouette) => !walk.includes(silhouette))).toEqual([])
    expect(declared.filter((silhouette) => !posed.includes(silhouette))).toEqual([])
  })
})
