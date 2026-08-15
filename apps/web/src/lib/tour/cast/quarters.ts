/**
 * Where in a suite a body stands, and where in a room.
 *
 * A prince's apartment is drawn twice: as a box on the deck plan, and as seven
 * rooms on its own interior level — `types.ts` says why the two are kept apart
 * rather than reconciled. The distribution once posted everyone on the deck
 * box as well as inside, so the entrance was crowded with a duplicate cast.
 * The apartment *is* the detailed interior; its deck box is only the threshold
 * used to enter it.
 *
 * Which of the seven rooms, and where in it, is staging rather than canon: no
 * page says which end of the drawing room a guard is standing at. So this
 * module holds the rule in the open, as ADR-003 §2.3 asks of a conduct — no
 * fact of catalogue is written here, and nothing it decides moves a body out of
 * the room the archive puts them in. That last part is the line: a guard stands
 * at the door of the suite because the suite is where the catalogue has them,
 * and not in the corridor outside it, which would be the walk overruling the
 * archive about a position.
 */
import { doorwayOf } from '../apparitions'
import type { Ship } from '../blueprint'
import { interiorPoint } from '../geometry'
import type { Space, Vec2 } from '../types'
import { seedOf, stationIn } from './stations'
import type { Costume } from './types'

/** How far inside the door a posted body stands, in metres. */
const INSIDE_THE_DOOR = 1.1

/** How far apart two bodies at the same door stand, in metres. */
const SHOULDER = 0.8

/**
 * The attested post immediately outside a room's real door.
 *
 * This is never inferred from a costume: the caller reaches it only through an
 * explicit `outsideDoorOf` catalogue claim. The doorway comes from the same
 * resolved plan the visitor walks through, and the body is pulled one stride
 * into the adjacent corridor so it never stands in the wall opening itself.
 */
export function standingOutsideDoor(
  ship: Ship,
  room: Space,
  seed: string,
): { space: Space; at: Vec2; heading: number } | null {
  const plan = ship.plans.get(room.tierId)
  const doorway = plan?.doorways.find((door) => {
    if (door.a !== room.id && door.b !== room.id) return false
    const other = ship.spaces.get(door.a === room.id ? door.b : door.a)
    return other?.category === 'corridor'
  })
  if (!doorway) return null
  const space = ship.spaces.get(doorway.a === room.id ? doorway.b : doorway.a)
  if (!space) return null

  const door: Vec2 = [
    (doorway.start[0] + doorway.end[0]) / 2,
    (doorway.start[1] + doorway.end[1]) / 2,
  ]
  const middle = interiorPoint(space.footprint)
  const dx = middle[0] - door[0]
  const dz = middle[1] - door[1]
  const reach = Math.hypot(dx, dz)
  if (reach < 0.01) return null
  const abreast = ((seedOf(seed) % 5) - 2) * SHOULDER
  const at: Vec2 = [
    door[0] + (dx / reach) * INSIDE_THE_DOOR - (dz / reach) * abreast,
    door[1] + (dz / reach) * INSIDE_THE_DOOR + (dx / reach) * abreast,
  ]
  return { space, at, heading: Math.atan2(door[0] - at[0], door[1] - at[1]) }
}

/** The interior level of a room, and the rooms on it, or null for a plain room. */
export function interiorOf(ship: Ship, space: Space): Space[] {
  const inside = ship.tiers.find((tier) => tier.parentSpaceId === space.id)
  if (!inside) return []
  return ship.blueprint.spaces.filter((candidate) => candidate.tierId === inside.id)
}

/**
 * Which room of a suite this body keeps.
 *
 * Read off the drawing rather than off a list of names: the interior plans
 * carry a category per room, and a suite's way in is the one drawn as a
 * corridor. So a body on watch takes the entrance — that is what standing a
 * watch is — and everybody else takes one of the rooms that are lived in,
 * seeded on their own id so it is the same room every visit.
 *
 * Service rooms are excluded for the visitor's sake as much as for accuracy: a
 * queen posted in the lavatory is a joke the reconstruction should not make.
 */
export function roomWithin(
  rooms: readonly Space[],
  options: { costume: Costume; seed: string; catalogueRole: string },
): Space | null {
  const { costume, seed, catalogueRole } = options
  if (rooms.length === 0) return null
  const sorted = [...rooms].sort((left, right) => left.id.localeCompare(right.id))
  const onWatch = costume.role === 'guard' || costume.role === 'nen-guard'
  const ways = sorted.filter((room) => room.category === 'corridor')
  if (onWatch && ways.length > 0) return ways[seedOf(seed) % ways.length]!

  // A costume describes the silhouette, not the person's job. Princes,
  // investigators and doctors can all wear the steward profile, so using that
  // profile as proof of domestic work put them in bathrooms and cupboards.
  // Only an explicit domestic role takes the servants' room, and even they are
  // never staged in a WC or bathroom without an attested position there.
  const domestic = /servant|maid|butler|majordomo|chamberlain/i.test(catalogueRole)
  const attendants = sorted.filter((room) => /-servants$/.test(room.id))
  if (domestic && attendants.length > 0) return attendants[seedOf(seed) % attendants.length]!

  const service = /servants|wc|bathroom|kitchen|supplies|storage/
  const lived = sorted.filter(
    (room) => room.category !== 'corridor' && room.category !== 'storage' && !service.test(room.id),
  )
  const nonCorridors = sorted.filter((room) => room.category !== 'corridor')
  const pool = lived.length > 0 ? lived : nonCorridors.length > 0 ? nonCorridors : sorted
  return pool[seedOf(seed) % pool.length]!
}

/**
 * Where in the room, given what the body is doing there.
 *
 * A watch is kept at the door and faces the room: `doorwayOf` already answers
 * where a room's way out is — the point of its boundary nearest its middle,
 * which is where somebody leaving would have to pass — so a guard stands a
 * stride inside it, looking in. Everyone else takes their own spot, the way
 * they always have.
 */
export function standingIn(
  space: Space,
  costume: Costume,
  seed: string,
): { at: Vec2; heading?: number } {
  if (costume.role !== 'guard' && costume.role !== 'nen-guard') return stationIn(space, seed)
  const door = doorwayOf(space)
  const middle = stationIn(space, `middle:${space.id}`).at
  const dx = middle[0] - door[0]
  const dz = middle[1] - door[1]
  const reach = Math.hypot(dx, dz)
  if (reach < 0.01) return stationIn(space, seed)
  // Abreast rather than on top of each other: a detail is several people at one
  // door, and two guards sharing a spot is one guard with a shadow. Stepped
  // along the wall, seeded, so the same detail lines up the same way every time.
  const abreast = ((seedOf(seed) % 5) - 2) * SHOULDER
  const at: Vec2 = [
    door[0] + (dx / reach) * INSIDE_THE_DOOR - (dz / reach) * abreast,
    door[1] + (dz / reach) * INSIDE_THE_DOOR + (dx / reach) * abreast,
  ]
  return { at, heading: Math.atan2(dx, dz) }
}
