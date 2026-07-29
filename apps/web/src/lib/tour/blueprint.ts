/**
 * Reads `data/ship/blueprint.json` into the indexed form the tour walks, and
 * states the invariants the reconstruction has to hold.
 *
 * The validator is not decoration. The blueprint is meant to be hand-edited,
 * doorways are derived from geometry rather than declared, and a footprint
 * nudged by two metres can silently seal a room off. `validateBlueprint` turns
 * that into a failing test instead of a room nobody can reach.
 */
import blueprintJson from '../../../../../data/ship/blueprint.json'
import {
  COLUMN_HALF_WIDTH,
  COLUMN_SPACING,
  columnPositions,
  columnWalls,
  deriveDoorways,
  interiorPoint,
  polygonArea,
  polygonsOverlap,
  pointInPolygon,
  wallSegments,
} from './geometry'
import type { Blueprint, Doorway, Link, Space, Tier, Vec2, WallSegment } from './types'

export const blueprint = blueprintJson as unknown as Blueprint

/** One deck, resolved: its spaces, the doorways between them, its walls. */
export interface TierPlan {
  tier: Tier
  spaces: Space[]
  doorways: Doorway[]
  /** Room walls and column faces alike: everything the visitor bumps into. */
  walls: WallSegment[]
  /** Column centres, by space id, for the renderer to raise pillars on. */
  columns: Map<string, Vec2[]>
}

export interface Ship {
  blueprint: Blueprint
  tiers: Tier[]
  spaces: Map<string, Space>
  plans: Map<string, TierPlan>
  links: Link[]
  /** Space id → the spaces it opens onto, across doorways and vertical links. */
  adjacency: Map<string, string[]>
}

/** The height of a space, falling back to its tier's default. */
export function ceilingOf(space: Space, tier: Tier): number {
  return space.ceiling ?? tier.ceiling
}

export function buildShip(source: Blueprint = blueprint): Ship {
  const tiers = source.tiers
  const spaces = new Map(source.spaces.map((space) => [space.id, space]))
  const plans = new Map<string, TierPlan>()
  const adjacency = new Map<string, string[]>()

  const connect = (from: string, to: string) => {
    const existing = adjacency.get(from)
    if (existing) existing.push(to)
    else adjacency.set(from, [to])
  }

  for (const tier of tiers) {
    const tierSpaces = source.spaces.filter((space) => space.tierId === tier.id)
    const doorways = deriveDoorways(tierSpaces)
    const walls = tierSpaces.flatMap((space) => wallSegments(space, doorways))

    const columns = new Map<string, Vec2[]>()
    for (const space of tierSpaces) {
      const centres = columnPositions(space.footprint)
      if (!centres.length) continue
      columns.set(space.id, centres)
      for (const centre of centres) walls.push(...columnWalls(space.id, centre))
    }

    plans.set(tier.id, { tier, spaces: tierSpaces, doorways, walls, columns })

    for (const space of tierSpaces) if (!adjacency.has(space.id)) adjacency.set(space.id, [])
    for (const door of doorways) {
      connect(door.a, door.b)
      connect(door.b, door.a)
    }
  }

  for (const link of source.links) {
    connect(link.from, link.to)
    connect(link.to, link.from)
  }

  return { blueprint: source, tiers, spaces, plans, links: source.links, adjacency }
}

/** The space a point falls in on a given tier, or `null` out in the hull. */
export function spaceAt(plan: TierPlan, point: Vec2): Space | null {
  return plan.spaces.find((space) => pointInPolygon(point, space.footprint)) ?? null
}

/**
 * Where the visitor stands when they arrive on a tier or jump to a space.
 *
 * The natural centre of a large room is exactly where a column tends to be, so
 * a spawn that lands on one is nudged clear rather than dropping the visitor
 * inside a pillar.
 */
export function spawnPoint(space: Space): Vec2 {
  const point = interiorPoint(space.footprint)
  const clearance = COLUMN_HALF_WIDTH + 1.2

  for (const centre of columnPositions(space.footprint)) {
    const dx = point[0] - centre[0]
    const dz = point[1] - centre[1]
    if (Math.abs(dx) > clearance || Math.abs(dz) > clearance) continue
    const shifted: Vec2 = [centre[0] + COLUMN_SPACING / 2, centre[1]]
    return pointInPolygon(shifted, space.footprint) ? shifted : [centre[0], centre[1] + clearance]
  }

  return point
}

/**
 * Which way to face on arriving in a space, as a camera yaw in radians.
 *
 * Dropping in on a fixed bearing tends to put the visitor's nose against
 * whichever wall happens to be north, so this looks down the room's long axis,
 * towards the far end of it. It matches how you actually enter a hall.
 */
export function spawnFacing(space: Space, at: Vec2): number {
  const xs = space.footprint.map((point) => point[0])
  const zs = space.footprint.map((point) => point[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)

  let dx = 0
  let dz = 0
  if (maxX - minX >= maxZ - minZ) {
    dx = at[0] - minX > maxX - at[0] ? minX - at[0] : maxX - at[0]
  } else {
    dz = at[1] - minZ > maxZ - at[1] ? minZ - at[1] : maxZ - at[1]
  }

  // The camera looks along (-sin yaw, -cos yaw).
  return Math.atan2(-dx, -dz)
}

/**
 * The space to drop the visitor into when they arrive on a deck.
 *
 * A tour that opens in a service corridor tells you nothing, so this prefers a
 * public room — the banquet hall, the screening room, the observation deck —
 * then whatever a panel actually shows, and only then falls back on size.
 */
export function entrySpace(plan: TierPlan): Space {
  const largest = (candidates: Space[]) =>
    candidates.reduce((best, space) =>
      polygonArea(space.footprint) > polygonArea(best.footprint) ? space : best,
    )

  const publicRooms = plan.spaces.filter((space) => space.category === 'public')
  if (publicRooms.length) return largest(publicRooms)

  const shown = plan.spaces.filter((space) => space.provenance === 'panel')
  if (shown.length) return largest(shown)

  return largest(plan.spaces)
}

const PROVENANCES = new Set(['panel', 'plan', 'inferred'])
const LINK_KINDS = new Set(['stair', 'lift', 'bulkhead'])

/**
 * Every rule the reconstruction has to satisfy, as a list of failures. An empty
 * array means the ship is walkable end to end.
 */
export function validateBlueprint(source: Blueprint = blueprint): string[] {
  const issues: string[] = []
  const tierIds = new Set(source.tiers.map((tier) => tier.id))
  const seen = new Set<string>()

  for (const tier of source.tiers) {
    if (polygonArea(tier.hull) <= 0) issues.push(`tier ${tier.id}: hull has no area`)
    if (!PROVENANCES.has(tier.provenance)) {
      issues.push(`tier ${tier.id}: unknown provenance "${tier.provenance}"`)
    }
  }

  for (const space of source.spaces) {
    if (seen.has(space.id)) issues.push(`space ${space.id}: duplicate id`)
    seen.add(space.id)

    if (!tierIds.has(space.tierId)) {
      issues.push(`space ${space.id}: unknown tier "${space.tierId}"`)
    }
    if (!PROVENANCES.has(space.provenance)) {
      issues.push(`space ${space.id}: unknown provenance "${space.provenance}"`)
    }
    if (space.footprint.length < 3) {
      issues.push(`space ${space.id}: footprint needs at least three points`)
    } else if (polygonArea(space.footprint) < 1) {
      issues.push(`space ${space.id}: footprint has no usable area`)
    }
    if (!space.source.trim()) issues.push(`space ${space.id}: missing source`)
    if (!space.nameFr.trim()) issues.push(`space ${space.id}: missing French name`)
  }

  // No two spaces on a deck may share floor: an overlap means the visitor can
  // stand in two rooms at once, and the walls of one cut through the other.
  for (const tier of source.tiers) {
    const tierSpaces = source.spaces.filter((space) => space.tierId === tier.id)
    for (let i = 0; i < tierSpaces.length; i++) {
      for (let j = i + 1; j < tierSpaces.length; j++) {
        if (polygonsOverlap(tierSpaces[i].footprint, tierSpaces[j].footprint)) {
          issues.push(`spaces ${tierSpaces[i].id} and ${tierSpaces[j].id} overlap`)
        }
      }
    }
  }

  for (const link of source.links) {
    const from = source.spaces.find((space) => space.id === link.from)
    const to = source.spaces.find((space) => space.id === link.to)
    if (!from) issues.push(`link ${link.from} → ${link.to}: unknown space "${link.from}"`)
    if (!to) issues.push(`link ${link.from} → ${link.to}: unknown space "${link.to}"`)
    if (from && to && from.tierId === to.tierId) {
      issues.push(`link ${link.from} → ${link.to}: both spaces are on ${from.tierId}`)
    }
    if (!LINK_KINDS.has(link.kind)) {
      issues.push(`link ${link.from} → ${link.to}: unknown kind "${link.kind}"`)
    }
  }

  // The whole ship has to be one connected space, or part of the
  // reconstruction is scenery the visitor can see but never enter.
  const ship = buildShip(source)
  const start = source.spaces[0]
  if (start) {
    const reached = new Set<string>([start.id])
    const queue = [start.id]
    while (queue.length) {
      for (const next of ship.adjacency.get(queue.shift()!) ?? []) {
        if (reached.has(next)) continue
        reached.add(next)
        queue.push(next)
      }
    }
    for (const space of source.spaces) {
      if (!reached.has(space.id)) issues.push(`space ${space.id}: unreachable from ${start.id}`)
    }
  }

  return issues
}
