import type { Ship } from './blueprint'
import type { Link, Space, Vec2 } from './types'

/**
 * A vertical join as it appears on one level: where it is in that level's
 * coordinates, where it leads, and how far up or down.
 *
 * The blueprint stores a link once, from one end, and a stairwell's `at` is read
 * in the coordinates of whichever end you are standing on. Anything that has to
 * *draw* the joins on a level — the plan, and eventually the geometry — needs
 * them the other way round: all the crossings that touch this level, already
 * resolved. Four stairwells and one bulkhead serve a hundred and seventeen deck
 * spaces, and until they are drawn the only way to find one is to walk into it.
 */
export interface Crossing {
  link: Link
  /** Where it is, in this level's coordinates. */
  at: Vec2
  /** The space it leads to from here. */
  to: string
  /** Metres gained by taking it: up is positive, and a door across is zero. */
  rise: number
}

export function crossingsOn(ship: Ship, tierId: string): Crossing[] {
  const elevationOf = (space: Space) =>
    (ship.tiers.find((candidate) => candidate.id === space.tierId)?.elevation ?? 0) +
    (space.floor ?? 0)
  const crossings: Crossing[] = []

  for (const link of ship.links) {
    const from = ship.spaces.get(link.from)
    const to = ship.spaces.get(link.to)
    if (!from || !to) continue
    if (from.tierId === tierId) {
      crossings.push({ link, at: link.at, to: link.to, rise: elevationOf(to) - elevationOf(from) })
    } else if (to.tierId === tierId) {
      crossings.push({
        link,
        at: link.atTo ?? link.at,
        to: link.from,
        rise: elevationOf(from) - elevationOf(to),
      })
    }
  }

  return crossings
}
