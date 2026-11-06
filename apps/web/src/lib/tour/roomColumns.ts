import { columnPositions, columnWalls } from './geometry'
import type { Space, Vec2, WallSegment } from './types'
import { CASINO_SPACE, casinoColumnPositions } from './casinoLayout'

/**
 * The inaugural hall has lateral column ranks, not a post on the throne axis.
 * Their metric spacing remains an estimate inside the reconstructed plan.
 */
export function roomColumnPositions(space: Space): Vec2[] {
  if (space.id === CASINO_SPACE) return casinoColumnPositions()
  if (space.id !== 'tier-1-banquet-hall') return columnPositions(space.footprint)
  const xs = space.footprint.map(([x]) => x)
  const minZ = Math.min(...space.footprint.map(([, z]) => z))
  return [Math.min(...xs) + 7, Math.max(...xs) - 7].flatMap((x) =>
    Array.from({ length: 4 }, (_, index): Vec2 => [x, minZ + 11.5 + index * 12]),
  )
}

/** The visual facing and the collision walls always share these centres. */
export function columnsForRooms(
  spaces: readonly Space[],
  walls: WallSegment[],
): Map<string, Vec2[]> {
  const columns = new Map<string, Vec2[]>()
  for (const space of spaces) {
    const centres = roomColumnPositions(space)
    if (!centres.length) continue
    columns.set(space.id, centres)
    for (const centre of centres) walls.push(...columnWalls(space.id, centre))
  }
  return columns
}
