import type { Blueprint, Chapter, Character, Location } from './schemas.js'
import type { Catalogue, Finding } from './types.js'

/**
 * The rules the inhabited walk rests on.
 *
 * ADR-003 peoples `/tour` with the named characters of the canon and nothing
 * else: where they stand is the world state projected onto `blueprint.json`,
 * what they wear is their declared role, and whether they carry an aura or a
 * beast is a declaration in `data/`. Every one of those is a projection, so
 * every one of them can be broken by an edit that looks harmless — a trajectory
 * leg pointed at a location the ship has no room for draws nobody, silently.
 *
 * These invariants are the half of the deal ADR-001 asks for: the walk is
 * allowed to consume the catalogue without checking it, because canon-lint
 * refuses a catalogue the walk could not consume. They live apart from
 * `invariants.ts` for the reason ADR-002 gives — that file is one chantier away
 * from 500 lines — and are appended to the same list.
 */

type Invariant = (catalogue: Catalogue) => Finding[]

function finding(rule: string, where: string, message: string): Finding {
  return { rule, where, message }
}

/**
 * Which locations the ship has actual rooms for.
 *
 * Two ways in, both of them the walk's own: a space claims the location
 * outright, or it claims one whose id ends in it — the deck plans and the
 * catalogue still spell a handful of regions differently, and
 * `lib/tour/blueprint.ts` resolves that with the same suffix match. Keeping the
 * two in step is what makes this lint mean anything.
 */
function locationsWithRooms(blueprint: Blueprint): Set<string> {
  const claimed = new Set<string>()
  for (const space of blueprint.spaces) {
    if (space.locationId) claimed.add(space.locationId)
  }
  return claimed
}

/** Whether a location, or any location under it, has a room in the blueprint. */
function reachesTheShip(
  locationId: string,
  claimed: ReadonlySet<string>,
  children: ReadonlyMap<string, string[]>,
): boolean {
  const pending = [locationId]
  const seen = new Set<string>()
  while (pending.length > 0) {
    const current = pending.pop()!
    if (seen.has(current)) continue
    seen.add(current)
    if (claimed.has(current)) return true
    for (const id of claimed) {
      if (id.endsWith(`-${current}`)) return true
    }
    pending.push(...(children.get(current) ?? []))
  }
  return false
}

function childIndex(locations: readonly Location[]): Map<string, string[]> {
  const children = new Map<string, string[]>()
  for (const location of locations) {
    const parent = location.parentLocationId
    if (!parent) continue
    children.set(parent, [...(children.get(parent) ?? []), location.id])
  }
  return children
}

/**
 * Every leg of every trajectory lands somewhere the walk can stand.
 *
 * A leg resolves when the location it names holds a room, or is a sector one of
 * whose descendants does — the tour posts a body in a sector by picking one of
 * its rooms, deterministically, so a sector is a legitimate answer.
 *
 * The one thing that is not an answer and is still not a failure is the ship
 * itself. Four announcers and one Heil-Ly agent are recorded aboard `Black
 * Whale 1` with no deck, which is exactly what the panels give: aboard, room
 * unknown. The walk draws nobody for them rather than inventing a post, and
 * this says so out loud instead of leaving a silent hole. Anything else — a
 * location the catalogue holds but the ship has no room under — is a body the
 * map places and the walk cannot, which is the divergence ADR-003 exists to
 * make impossible.
 */
const trajectoriesReachTheShip: Invariant = ({ characters, locations, blueprint }) => {
  const findings: Finding[] = []
  const claimed = locationsWithRooms(blueprint)
  const children = childIndex(locations)
  const roots = new Set(
    locations.filter((location) => !location.parentLocationId).map((location) => location.id),
  )
  const resolved = new Map<string, boolean>()

  for (const character of characters) {
    for (const [index, leg] of (character.mapTrajectory ?? []).entries()) {
      if (roots.has(leg.location)) continue
      let answer = resolved.get(leg.location)
      if (answer === undefined) {
        answer = reachesTheShip(leg.location, claimed, children)
        resolved.set(leg.location, answer)
      }
      if (answer) continue
      findings.push(
        finding(
          'trajectory-reaches-the-ship',
          `characters#${character.id}`,
          `leg ${index} stands in ${leg.location}, which the blueprint has no room under`,
        ),
      )
    }
  }
  return findings
}

/**
 * A body the walk may draw carries the role its wardrobe is read off.
 *
 * ADR-003 dresses a silhouette from `shipLocation.role` through a closed table,
 * and an unmapped role is a build failure on the site's side. The half that
 * belongs here is the input: someone with a trajectory has a role at all, in
 * words rather than in an empty string.
 */
const placedBodiesDeclareARole: Invariant = ({ characters }) => {
  return characters
    .filter((character) => (character.mapTrajectory ?? []).length > 0)
    .filter((character) => !String(character.shipLocation?.role ?? '').trim())
    .map((character) =>
      finding(
        'wardrobe-input',
        `characters#${character.id}`,
        'is placed on the ship with no role: the walk has nothing to dress it in',
      ),
    )
}

/**
 * A declared Nen is a claim about a person, so it says which claim it is.
 *
 * The walk gives an aura to whoever carries this block. A block that names
 * neither a category nor `confirmed: true` gives one to somebody the archive
 * has not actually asserted anything about — the inference ADR-003 forbids,
 * moved into the data where it is harder to see.
 */
const nenClaimsSayWhat: Invariant = ({ characters }) => {
  return characters
    .filter((character) => character.nen)
    .filter((character) => !character.nen?.type && character.nen?.confirmed !== true)
    .map((character) =>
      finding(
        'nen-claim',
        `characters#${character.id}`,
        'declares nen with no category and no `confirmed: true`',
      ),
    )
}

/**
 * Whether a chapter reference falls inside the arc.
 *
 * Membership in `chapters.json` proves nothing — it holds the chapters the
 * archive *details*, twenty-one of them — so this checks the same thing
 * `chapterReferencesAreWellFormed` checks: a real chapter number, no later than
 * the end of the arc.
 */
function chapterIsInTheArc(value: string, chapters: readonly Chapter[]): boolean {
  const match = /^ch-(\d+)(?:\.\d+)?$/.exec(value)
  if (!match) return false
  return Number(match[1]) <= Math.max(...chapters.map((chapter) => chapter.number))
}

/** Whether the archive can put this body in a room at some point in the arc. */
function isPlaced(character: Character | undefined): boolean {
  return (character?.mapTrajectory ?? []).length > 0
}

/**
 * A beast is sourced, and it belongs to someone the walk can find a room for.
 *
 * Both halves are what keeps §2.4 of ADR-003 honest. A beast with no chapter is
 * scenery — the walk would be putting an animal in a room on its own authority.
 * A beast whose owner is never placed is an animal with no salon to stand in,
 * which is not a rendering problem but a claim nobody can check; `standsWith`
 * is the declared way out of it, and it has to name a body that *is* placed.
 */
const guardianBeastsAreSourced: Invariant = ({ characters, chapters }) => {
  const findings: Finding[] = []
  const byId = new Map(characters.map((character) => [character.id, character]))

  for (const character of characters) {
    const beast = character.guardianBeast
    if (!beast) continue
    const where = `characters#${character.id}`
    if (!chapterIsInTheArc(beast.sourceChapterId, chapters)) {
      findings.push(
        finding(
          'guardian-beast',
          where,
          `beast sourced on ${beast.sourceChapterId}, outside the arc`,
        ),
      )
    }
    if (isPlaced(character)) continue
    if (!beast.standsWith) {
      findings.push(
        finding(
          'guardian-beast',
          where,
          'has a beast and no trajectory: name the body it stands with, or the walk can never draw it',
        ),
      )
      continue
    }
    if (!isPlaced(byId.get(beast.standsWith))) {
      findings.push(
        finding('guardian-beast', where, `stands with ${beast.standsWith}, which is never placed`),
      )
    }
  }
  return findings
}

export const INHABITANT_INVARIANTS: ReadonlyArray<{ name: string; run: Invariant }> = [
  { name: 'trajectories-reach-the-ship', run: trajectoriesReachTheShip },
  { name: 'placed-bodies-declare-a-role', run: placedBodiesDeclareARole },
  { name: 'nen-claims-say-what', run: nenClaimsSayWhat },
  { name: 'guardian-beasts-are-sourced', run: guardianBeastsAreSourced },
]

export type { Character }
