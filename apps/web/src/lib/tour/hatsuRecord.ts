/**
 * What the walk remembers about rooms and where the visitor is going.
 *
 * These are readings, not casts: they derive an identity, a distance, a verse
 * or a prediction from the immutable ship and the current TourWorld.
 */
import type { Ship } from './blueprint'
import { paceOf } from './cast/pain'
import type { Heading, Stood, TourWorld } from './cast/types'
import { distanceTo, pointInPolygon } from './geometry'
import type { Space, Vec2 } from './types'

/** A room as the walk should name it after soul or sign exchanges. */
export function identityOf(ship: Ship, world: TourWorld, space: Space): Space {
  for (const [a, b] of world.souls) {
    const other = space.id === a ? b : space.id === b ? a : null
    if (!other) continue
    const soul = ship.spaces.get(other)
    if (!soul) continue
    return {
      ...space,
      name: soul.name,
      nameFr: soul.nameFr,
      category: soul.category,
      provenance: soul.provenance,
      source: soul.source,
      sourceFr: soul.sourceFr,
    }
  }

  const sign = world.signs[space.id]
  const plate = sign ? ship.spaces.get(sign) : null
  return plate ? { ...space, name: plate.name, nameFr: plate.nameFr } : space
}

/** How the dial reads, from a hundred at the door to nothing across the ship. */
export function dialReading(ship: Ship, world: TourWorld, from: Stood) {
  const { at, standingIn } = from
  const wanted = world.dial ? ship.spaces.get(world.dial) : null
  if (!wanted) return null
  if (standingIn === wanted.id) return { spaceId: wanted.id, reading: 100 }
  const { metres, decks } = distanceTo(ship, wanted, { at, standingIn })
  const reading = Math.max(0, Math.round(100 - metres / 1.6 - decks * 12))
  return { spaceId: wanted.id, reading }
}

/** The catalogue lines automatic writing chooses from a room's own record. */
export function verseFor(ship: Ship, space: Space): number[] {
  const ways = ship.adjacency.get(space.id)?.length ?? 0
  const standing = ship.structures.filter((solid) => solid.spaceId === space.id).length
  return [
    ['panel', 'plan', 'map', 'inferred'].indexOf(space.provenance),
    ways === 0 ? 0 : ways === 1 ? 1 : ways < 4 ? 2 : 3,
    standing === 0 ? 0 : standing < 4 ? 1 : standing < 12 ? 2 : 3,
    space.tierId.length % 4,
  ]
}

/** The rooms the walk has not set foot in, nearest first. */
export function unwalked(ship: Ship, world: TourWorld, from: Stood) {
  return [...ship.spaces.values()]
    .filter((space) => !world.trail.includes(space.id))
    .map((space) => ({ space, ...distanceTo(ship, space, from) }))
    .sort((a, b) => a.metres + a.decks * 40 - (b.metres + b.decks * 40))
}

/** Where the visitor will be in ten seconds if they carry on as they are. */
export function tenSecondsOn(
  ship: Ship,
  world: TourWorld,
  from: Heading,
): { spaceId: string; at: Vec2 } | null {
  const { tierId, at, heading } = from
  const plan = ship.plans.get(tierId)
  if (!plan) return null
  const reach = 6 * paceOf(world.body) * 10
  const ahead: Vec2 = [at[0] - Math.sin(heading) * reach, at[1] - Math.cos(heading) * reach]
  const landing = plan.spaces.find((space) => pointInPolygon(ahead, space.footprint))
  const here = plan.spaces.find((space) => pointInPolygon(at, space.footprint))
  const space = landing ?? here
  return space ? { spaceId: space.id, at: landing ? ahead : at } : null
}
