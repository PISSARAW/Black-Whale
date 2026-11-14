/** How Nen changes the deck plan presented to rendering and collision. */
import type { Ship, TierPlan } from './blueprint'
import type { TourWorld } from './cast/types'
import {
  blocksTheFloor,
  centroid,
  columnWalls,
  deriveDoorways,
  pointInPolygon,
  sealKey,
  structureWalls,
  wallSegments,
} from './geometry'
import type { Space, Vec2 } from './types'

type VestigeMap = TourWorld['vestiges']

function vestigeKeys(vestiges: VestigeMap | undefined, type: 'door_broken' | 'wall_cut') {
  const keys = new Set<string>()
  for (const [locationId, locationVestiges] of Object.entries(vestiges ?? {})) {
    for (const vestige of locationVestiges) {
      if (vestige.type === type && vestige.metadata?.target) {
        keys.add(sealKey(locationId, String(vestige.metadata.target)))
      }
    }
  }
  return keys
}

function sealedDoorKeys({
  ship,
  plan,
  closed,
  brokenDoors,
}: {
  ship: Ship
  plan: TierPlan
  closed: Set<string>
  brokenDoors: Set<string>
}) {
  return new Set(
    [
      ...ship.seals.map((seal) => sealKey(seal.a, seal.b)),
      ...plan.doorways
        .filter((door) => closed.has(door.a) || closed.has(door.b))
        .map((door) => sealKey(door.a, door.b)),
    ].filter((key) => !brokenDoors.has(key)),
  )
}

function doorOverrides(ship: Ship, closed: Set<string>, brokenDoors: Set<string>) {
  return new Map(
    ship.doors
      .filter(
        (door) =>
          (!closed.has(door.a) && !closed.has(door.b)) || brokenDoors.has(sealKey(door.a, door.b)),
      )
      .map((door) => [sealKey(door.a, door.b), door] as const),
  )
}

function rebuiltWalls(plan: TierPlan, doorways: TierPlan['doorways']) {
  const walls = plan.spaces.flatMap((space) => wallSegments(space, doorways))
  for (const [spaceId, centres] of plan.columns) {
    for (const centre of centres) walls.push(...columnWalls(spaceId, centre))
  }
  for (const structure of plan.structures) {
    if (blocksTheFloor(structure)) walls.push(...structureWalls(structure))
  }
  return walls
}

/** Solids the aura has lifted out of their deck, so the baked mesh drops them. */
export const heldSolidIds = (world: TourWorld): string[] => Object.keys(world.solids)

/**
 * The point in a room the aura came down on.
 *
 * Walked along the aim ray rather than measured: the first step that is inside
 * the room's own footprint is where it landed. Falls back to the middle when
 * the ray does not reach.
 */
export function landingIn(
  target: Space,
  aim: { at: Vec2; heading?: number },
  landed: Record<string, Vec2> = {},
): Record<string, Vec2> {
  const { at, heading = 0 } = aim
  const sin = Math.sin(heading)
  const cos = Math.cos(heading)
  for (let metres = 1.5; metres <= 120; metres += 1.5) {
    const point: Vec2 = [at[0] - sin * metres, at[1] - cos * metres]
    if (pointInPolygon(point, target.footprint)) return { ...landed, [target.id]: point }
  }
  return { ...landed, [target.id]: centroid(target) }
}

/** The deck with a room's doorways shut. */
export function planSealed(
  ship: Ship,
  plan: TierPlan,
  options: {
    shut: readonly string[]
    vestiges?: TourWorld['vestiges']
  },
): TierPlan {
  const closed = new Set(options.shut.filter((id) => ship.spaces.get(id)?.tierId === plan.tier.id))
  if (!closed.size) return plan

  const brokenDoors = vestigeKeys(options.vestiges, 'door_broken')
  const sealed = sealedDoorKeys({ ship, plan, closed, brokenDoors })
  const overrides = doorOverrides(ship, closed, brokenDoors)
  const cutWalls = vestigeKeys(options.vestiges, 'wall_cut')
  const doorways = deriveDoorways(plan.spaces, { sealed, overrides, cutWalls })
  return { ...plan, doorways, walls: rebuiltWalls(plan, doorways) }
}

/** The deck as the visitor meets it: shut, emptied, and with held solids lifted out. */
export function walkedPlan(ship: Ship, world: TourWorld, tierId: string): TierPlan {
  const plan = ship.plans.get(tierId)
  if (!plan) throw new Error(`no plan for ${tierId}`)
  return planWithout(
    planSealed(ship, plan, { shut: world.shut, vestiges: world.vestiges }),
    emptiedOn(world, tierId, ship),
    heldSolidIds(world),
  )
}

/** The deck as it stands once emptied rooms and held solids have been removed. */
export function planWithout(
  plan: TierPlan,
  emptied: readonly string[],
  held: readonly string[] = [],
): TierPlan {
  if (!emptied.length && !held.length) return plan
  const gone = new Set(emptied)
  const lifted = new Set(held)
  const structures = plan.structures.filter(
    (structure) => !gone.has(structure.spaceId) && !lifted.has(structure.id),
  )
  if (structures.length === plan.structures.length) return plan

  const standing = new Set(structures.map((structure) => structure.id))
  return {
    ...plan,
    structures,
    walls: plan.walls.filter((wall) => !wall.structureId || standing.has(wall.structureId)),
  }
}

/** Which rooms this deck should draw as emptied. */
export function emptiedOn(world: TourWorld, tierId: string, ship: Ship): string[] {
  const ids = [...world.emptied]
  if (world.isolated && !world.isolated.occupant) ids.push(world.isolated.spaceId)
  return [...new Set(ids)].filter((id) => ship.spaces.get(id)?.tierId === tierId)
}

/** Rooms drawn as aura shells, wherever they are in the ship. */
export function shellsFor(world: TourWorld, ship: Ship): string[] {
  if (world.laidOpen) return [...ship.spaces.keys()]
  const ids = [
    ...world.doors,
    ...world.watched.map((doll) => doll.spaceId),
    ...world.emptied,
    ...world.dispatches,
    ...(world.eye ? [world.eye] : []),
    ...(world.dowsing ? [world.dowsing] : []),
    ...(world.isolated ? [world.isolated.spaceId] : []),
    ...(world.owl ? world.trail : []),
    ...(world.foreseen ? [world.foreseen.spaceId] : []),
    ...world.poem,
    ...world.droplets.map((drop) => drop.spaceId),
    ...(world.dial ? [world.dial] : []),
    ...world.ninelives,
    ...(world.curse ? [world.curse.victim] : []),
    ...world.souls.flat(),
    ...(world.body.projected ? [world.body.projected.spaceId] : []),
  ]
  return [...new Set(ids)].filter((id) => ship.spaces.has(id))
}
