/**
 * The ground the hunt is played on: Tserriednich's apartment, deck 1.
 *
 * Eight rooms — servants' quarters and their WC, entrance hall, kitchen, dining
 * room, living room, bedroom, bathroom — every one of them `provenance: "panel"`,
 * which is to say every one of them is on a page of the manga rather than
 * inferred. The arena reads `blueprint.json` and adds nothing to it (I6): no
 * geometry is authored here, only selected.
 *
 * This also settles the open question of what happens at the arena's edge. It
 * does not arise: the eight spaces are the whole of tier `interior-room-1004`,
 * so the boundary of the arena is the apartment's own hull. No invisible walls,
 * no doors sealed by fiat — the player is stopped by the bulkheads the
 * reconstruction already draws, using the same collision the tour walks with.
 */
import { theShip } from '../tour/blueprint'
import type { Doorway, Space, WallSegment } from '../tour/types'

export const ARENA_TIER_ID = 'interior-room-1004'
export const ARENA_ROOM_COUNT = 8

export interface Arena {
  tierId: string
  spaces: Space[]
  walls: WallSegment[]
  doorways: Doorway[]
}

/**
 * Builds the arena and refuses to return a broken one. A subset that is not
 * connected is not a smaller arena, it is a game with a room nobody can reach,
 * and it has to fail here rather than in a patrol route twenty minutes later.
 */
export function buildArena(): Arena {
  const plan = theShip().plans.get(ARENA_TIER_ID)
  if (!plan) throw new Error(`Arena tier ${ARENA_TIER_ID} is not in the blueprint`)

  const spaces = plan.spaces.filter((space) => space.provenance === 'panel')
  if (spaces.length !== ARENA_ROOM_COUNT) {
    throw new Error(`Arena expects ${ARENA_ROOM_COUNT} attested spaces, found ${spaces.length}`)
  }

  const ids = new Set(spaces.map((space) => space.id))
  const doorways = plan.doorways.filter((door) => ids.has(door.a) && ids.has(door.b))
  const walls = plan.walls.filter((wall) => keepsWall(wall, ids, doorways))

  assertContiguous(spaces, doorways)
  return { tierId: ARENA_TIER_ID, spaces, walls, doorways }
}

/**
 * A jamb belongs to the doorway that cut it rather than to a room, and
 * `geometry.ts` keys it with `sealKey`, which sorts the pair — so the key can be
 * compared directly and does not need reversing.
 */
function keepsWall(wall: WallSegment, ids: Set<string>, doorways: Doorway[]): boolean {
  if (!wall.jambOf) return ids.has(wall.spaceId)
  return doorways.some((door) => wall.jambOf === [door.a, door.b].sort().join('|'))
}

function assertContiguous(spaces: Space[], doorways: Doorway[]): void {
  const reached = new Set<string>([spaces[0].id])
  const queue = [spaces[0].id]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const door of doorways) {
      const other = door.a === current ? door.b : door.b === current ? door.a : null
      if (other && !reached.has(other)) {
        reached.add(other)
        queue.push(other)
      }
    }
  }

  const stranded = spaces.filter((space) => !reached.has(space.id))
  if (stranded.length > 0) {
    throw new Error(`Arena is not contiguous: ${stranded.map((space) => space.id).join(', ')}`)
  }
}
