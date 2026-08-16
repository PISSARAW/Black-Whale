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
  EPSILON,
  columnPositions,
  columnWalls,
  deriveDoorways,
  doorJambs,
  interiorPoint,
  longestSharedWall,
  MIN_DOOR_WIDTH,
  STEP_UP,
  lanternRect,
  sealKey,
  polygonArea,
  polygonContains,
  polygonsOverlap,
  pointInPolygon,
  blocksTheFloor,
  structureFootprint,
  structureWalls,
  wallSegments,
} from './geometry'
import type {
  Blueprint,
  DoorOverride,
  Doorway,
  Link,
  Seal,
  Space,
  Structure,
  Tier,
  Vec2,
  WallSegment,
} from './types'

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
  /** The solids standing on this level: springs, coffins, stages. */
  structures: Structure[]
  /**
   * The pairs on this level whose opening is placed by hand rather than derived
   * from the shared wall, keyed by `sealKey`.
   *
   * Everything else about a doorway follows from geometry, which is what makes
   * an unreachable room a test failure. These are the exceptions, and an
   * exception is a claim about the ship — so the walk can show which openings
   * it authored instead of leaving them indistinguishable from the derived ones.
   */
  declared: Set<string>
  /**
   * The stretch of wall each seal keeps blind, resolved on this level.
   *
   * A seal is stored as a pair of rooms; the wall it applies to is derived, the
   * same way a doorway is. Resolving it here is what lets a blind wall be shown
   * as one, with the reason it was declared for.
   */
  blind: BlindWall[]
}

/** A wall two rooms share with nothing through it, and why. */
export interface BlindWall {
  seal: Seal
  start: Vec2
  end: Vec2
}

export interface Ship {
  blueprint: Blueprint
  /** Every level: the decks, plus the interiors drawn at their own scale. */
  tiers: Tier[]
  /** The decks alone, in the order the cross-section stacks them. */
  decks: Tier[]
  spaces: Map<string, Space>
  plans: Map<string, TierPlan>
  links: Link[]
  seals: Seal[]
  doors: DoorOverride[]
  structures: Structure[]
  /** Space id → the spaces it opens onto, across doorways and vertical links. */
  adjacency: Map<string, string[]>
}

/** The height of a space, falling back to its tier's default. */
export function ceilingOf(space: Space, tier: Tier): number {
  return space.ceiling ?? tier.ceiling
}

/**
 * Where the floor of a space actually is, in world metres.
 *
 * A deck is one plane wherever nothing says otherwise, so this is the tier's
 * elevation for all but a handful of rooms. Where a panel draws a room in two
 * levels, the lower one carries the step in `floor` and everything that reads a
 * floor — the geometry, the light, the visitor's own eyes — reads it from here
 * rather than from the deck.
 */
export function floorOf(space: Space, tier: Tier): number {
  return tier.elevation + (space.floor ?? 0)
}

export function buildShip(source: Blueprint = blueprint): Ship {
  const tiers = source.tiers
  const spaces = new Map(source.spaces.map((space) => [space.id, space]))
  const plans = new Map<string, TierPlan>()
  const adjacency = new Map<string, string[]>()
  const sealed = new Set((source.seals ?? []).map((seal) => sealKey(seal.a, seal.b)))
  const overrides = new Map<string, DoorOverride>(
    (source.doors ?? []).map((door) => [sealKey(door.a, door.b), door]),
  )

  const connect = (from: string, to: string) => {
    const existing = adjacency.get(from)
    if (existing) existing.push(to)
    else adjacency.set(from, [to])
  }

  const allStructures = source.structures ?? []

  for (const tier of tiers) {
    const tierSpaces = source.spaces.filter((space) => space.tierId === tier.id)
    const onThisTier = new Set(tierSpaces.map((space) => space.id))
    const doorways = deriveDoorways(tierSpaces, { sealed, overrides })
    const walls = tierSpaces.flatMap((space) => wallSegments(space, doorways))

    // The cheeks of every opening. `wallSegments` has just cut the gaps; this is
    // what stands in them, and it is in the collision list for the same reason a
    // coffin's faces are — the doorway pass in `mesh.ts` draws exactly these.
    for (const door of doorways) walls.push(...doorJambs(door))

    const columns = new Map<string, Vec2[]>()
    for (const space of tierSpaces) {
      const centres = columnPositions(space.footprint)
      if (!centres.length) continue
      columns.set(space.id, centres)
      for (const centre of centres) walls.push(...columnWalls(space.id, centre))
    }

    // A structure's faces join the room's own walls, so the collision test and
    // the renderer read one list and cannot disagree about what is solid —
    // except for what is hung above head height, which is drawn where it hangs
    // and walked under rather than around.
    const structures = allStructures.filter((structure) => onThisTier.has(structure.spaceId))
    for (const structure of structures) {
      if (blocksTheFloor(structure)) walls.push(...structureWalls(structure))
    }

    // What the walk authored on this level, resolved once so it can be shown
    // rather than merely obeyed: the openings placed by hand, and the stretch
    // of wall each seal keeps blind.
    const declared = new Set(
      doorways.map((door) => sealKey(door.a, door.b)).filter((key) => overrides.has(key)),
    )

    const blind: BlindWall[] = []
    for (const seal of source.seals ?? []) {
      const a = spaces.get(seal.a)
      const b = spaces.get(seal.b)
      if (!a || !b || a.tierId !== tier.id) continue
      const shared = longestSharedWall(a.footprint, b.footprint)
      if (!shared) continue
      const { a1, unit, from, to } = shared
      blind.push({
        seal,
        start: [a1[0] + unit[0] * from, a1[1] + unit[1] * from],
        end: [a1[0] + unit[0] * to, a1[1] + unit[1] * to],
      })
    }

    plans.set(tier.id, {
      tier,
      spaces: tierSpaces,
      doorways,
      walls,
      columns,
      structures,
      declared,
      blind,
    })

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

  return {
    blueprint: source,
    tiers,
    decks: tiers.filter((tier) => tier.kind === 'deck'),
    spaces,
    plans,
    links: source.links,
    seals: source.seals ?? [],
    doors: source.doors ?? [],
    structures: allStructures,
    adjacency,
  }
}

/**
 * The ship, built once and handed out.
 *
 * `buildShip` derives every doorway on every level from the walls the rooms
 * share, cuts the openings out of those walls, lays the column grids and folds
 * in what stands in the rooms: some eighteen milliseconds warm, and four to six
 * times that on a phone. It was being called from the top of two page
 * components, and a Svelte component's script runs once per instance — so the
 * ship was derived again on the server for every request, again in the browser
 * on hydration, and again every time the visitor navigated back to `/tour`.
 *
 * Nothing mutates a `Ship`: the techniques in `$lib/tour/hatsu` return new
 * plans rather than editing these, which is what makes sharing one safe.
 */
let shared: Ship | null = null

export function theShip(): Ship {
  shared ??= buildShip()
  return shared
}

/** The deck a level belongs to: itself, or the deck its room stands on. */
export function deckOf(ship: Ship, tierId: string): Tier | null {
  const tier = ship.tiers.find((candidate) => candidate.id === tierId)
  if (!tier) return null
  if (tier.kind === 'deck') return tier
  const parent = tier.parentSpaceId ? ship.spaces.get(tier.parentSpaceId) : null
  return parent ? (ship.tiers.find((candidate) => candidate.id === parent.tierId) ?? null) : null
}

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
  const elevationOf = (id: string) =>
    ship.tiers.find((candidate) => candidate.id === id)?.elevation ?? 0
  const here = elevationOf(tierId)
  const crossings: Crossing[] = []

  for (const link of ship.links) {
    const from = ship.spaces.get(link.from)
    const to = ship.spaces.get(link.to)
    if (!from || !to) continue
    if (from.tierId === tierId) {
      crossings.push({ link, at: link.at, to: link.to, rise: elevationOf(to.tierId) - here })
    } else if (to.tierId === tierId) {
      crossings.push({
        link,
        at: link.atTo ?? link.at,
        to: link.from,
        rise: elevationOf(from.tierId) - here,
      })
    }
  }

  return crossings
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
 * inside a pillar. The same holds for anything else standing in the room: the
 * middle of the burial chamber is the middle of the reliquary, and the middle
 * of the spring bay is a spring.
 */
export function spawnPoint(space: Space, structures: Structure[] = []): Vec2 {
  const point = interiorPoint(space.footprint)
  const clearance = COLUMN_HALF_WIDTH + 1.2

  let candidate = point
  for (const centre of columnPositions(space.footprint)) {
    const dx = point[0] - centre[0]
    const dz = point[1] - centre[1]
    if (Math.abs(dx) > clearance || Math.abs(dz) > clearance) continue
    const shifted: Vec2 = [centre[0] + COLUMN_SPACING / 2, centre[1]]
    candidate = pointInPolygon(shifted, space.footprint)
      ? shifted
      : [centre[0], centre[1] + clearance]
    break
  }

  const solids = structures
    .filter((structure) => structure.spaceId === space.id && blocksTheFloor(structure))
    .map((structure) => structureFootprint(structure))
  const clear = (at: Vec2) =>
    pointInPolygon(at, space.footprint) && !solids.some((solid) => pointInPolygon(at, solid))
  if (clear(candidate)) return candidate

  // Step outwards in a ring until the floor is free. Rooms with something in
  // the middle are exactly the ones worth arriving in facing it.
  for (const distance of [2, 4, 6, 8, 12]) {
    for (let step = 0; step < 8; step++) {
      const angle = (step * Math.PI) / 4
      const at: Vec2 = [
        candidate[0] + Math.cos(angle) * distance,
        candidate[1] + Math.sin(angle) * distance,
      ]
      if (clear(at)) return at
    }
  }

  return candidate
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

/**
 * The room to walk into for a catalogued location — the bridge from `/ship` to
 * `/tour`.
 *
 * The map answers who is where and the walk answers how the ship is built, and
 * the two have deliberately never shared state: nothing about a chapter or a
 * passenger gets into the reconstruction. A link is not shared state, though.
 * This is the whole of it — a location id in, the space to open the walk at out
 * — so `/ship` can offer to go there on foot without the walk learning anything.
 *
 * A location may claim several spaces: the apartment claims its box on the deck
 * and all seven rooms of its interior. The one to arrive in is the box, because
 * that is the door you would come to; failing that, the largest.
 */
export function spaceForLocation(ship: Ship, locationId: string | null): Space | null {
  if (!locationId) return null
  const kindOf = (space: Space) =>
    ship.tiers.find((tier) => tier.id === space.tierId)?.kind ?? 'interior'

  const exact = ship.blueprint.spaces.filter((space) => space.locationId === locationId)
  // The deck SVGs name their regions in their own vocabulary, and `/ship`
  // resolves those to catalogue ids; a suffix match is the last resort for the
  // handful the two spellings still disagree about.
  const claimed = exact.length
    ? exact
    : ship.blueprint.spaces.filter((space) => space.locationId?.endsWith(`-${locationId}`))
  if (!claimed.length) return null

  const onDeck = claimed.filter((space) => kindOf(space) === 'deck')
  const pool = onDeck.length ? onDeck : claimed
  return pool.reduce((best, space) =>
    polygonArea(space.footprint) > polygonArea(best.footprint) ? space : best,
  )
}

const PROVENANCES = new Set(['panel', 'plan', 'map', 'inferred'])
const LINK_KINDS = new Set(['stair', 'lift', 'bulkhead', 'door'])
const STRUCTURE_KINDS = new Set([
  'spring',
  'casket',
  'platform',
  'counter',
  'table',
  'bed',
  'seat',
  'cabinet',
  'basin',
  'painting',
  'window',
  'lifeboat',
  'pillar',
  'bars',
  'manacle',
  'camera',
  'telephone',
  'mobile',
  'duct',
  'vent',
])

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
    if (!tier.source.trim()) issues.push(`tier ${tier.id}: missing source`)
    if (!tier.sourceFr.trim()) issues.push(`tier ${tier.id}: missing French source`)

    // An interior is the inside of one room on a deck, and the only way in is
    // the door that joins them. Without both, it is a level nobody can reach.
    if (tier.kind === 'interior') {
      const parent = source.spaces.find((space) => space.id === tier.parentSpaceId)
      if (!parent) {
        issues.push(`level ${tier.id}: names no room on a deck it is the inside of`)
      } else if (
        source.tiers.find((candidate) => candidate.id === parent.tierId)?.kind !== 'deck'
      ) {
        issues.push(`level ${tier.id}: its room is not on a deck`)
      }
      const joined = source.links.some(
        (link) => link.from === tier.parentSpaceId || link.to === tier.parentSpaceId,
      )
      if (!joined) issues.push(`level ${tier.id}: no door joins it to its room`)
    } else if (tier.parentSpaceId !== null) {
      issues.push(`level ${tier.id}: a deck cannot be the inside of a room`)
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
    if (!space.sourceFr.trim()) issues.push(`space ${space.id}: missing French source`)
    if (!space.nameFr.trim()) issues.push(`space ${space.id}: missing French name`)

    // A step is a step. A floor the visitor would have to climb to reach is a
    // storey, and a storey is a link with a stair on it.
    if (space.floor !== undefined && Math.abs(space.floor) > 3) {
      issues.push(
        `space ${space.id}: a floor ${space.floor} m off the deck is a storey, not a step`,
      )
    }

    if (space.lantern) {
      if (space.lantern.rise <= 0) {
        issues.push(`space ${space.id}: a lantern rising ${space.lantern.rise} m is a flat ceiling`)
      }
      // The ceiling is cut into a border and a panel, which wants the room to be
      // the rectangle a lantern is drawn in.
      if (space.footprint.length !== 4) {
        issues.push(`space ${space.id}: a lantern needs a rectangular ceiling to be cut out of`)
      }
      if (!lanternRect(space.lantern).every((corner) => pointInPolygon(corner, space.footprint))) {
        issues.push(`space ${space.id}: its lantern hangs outside the room`)
      }
    }
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

  const sealedPairs = new Set((source.seals ?? []).map((seal) => sealKey(seal.a, seal.b)))

  // A seal that names a wall the two rooms do not actually share is stale:
  // someone moved a footprint and the seal is now silently doing nothing.
  for (const seal of source.seals ?? []) {
    const a = source.spaces.find((space) => space.id === seal.a)
    const b = source.spaces.find((space) => space.id === seal.b)
    if (!a || !b) {
      issues.push(`seal ${seal.a} | ${seal.b}: names a space that does not exist`)
      continue
    }
    if (!seal.reason.trim()) issues.push(`seal ${seal.a} | ${seal.b}: missing reason`)
    if (!seal.reasonFr.trim()) issues.push(`seal ${seal.a} | ${seal.b}: missing French reason`)
    const shared = longestSharedWall(a.footprint, b.footprint)
    if (!shared || shared.to - shared.from < MIN_DOOR_WIDTH) {
      issues.push(`seal ${seal.a} | ${seal.b}: these spaces share no wall to seal`)
    }
  }

  // A declared door has to name a wall that exists, or it silently does
  // nothing and an envelope ends up with no way in.
  for (const door of source.doors ?? []) {
    const a = source.spaces.find((space) => space.id === door.a)
    const b = source.spaces.find((space) => space.id === door.b)
    if (!a || !b) {
      issues.push(`door ${door.a} | ${door.b}: names a space that does not exist`)
      continue
    }
    if (!door.reason.trim()) issues.push(`door ${door.a} | ${door.b}: missing reason`)
    if (!door.reasonFr.trim()) issues.push(`door ${door.a} | ${door.b}: missing French reason`)
    if (door.width < MIN_DOOR_WIDTH) {
      issues.push(`door ${door.a} | ${door.b}: ${door.width} m is too narrow to pass`)
    }
    const shared = longestSharedWall(a.footprint, b.footprint)
    if (!shared || shared.to - shared.from < MIN_DOOR_WIDTH) {
      issues.push(`door ${door.a} | ${door.b}: these spaces share no wall to open`)
    }
    if (sealedPairs.has(sealKey(door.a, door.b))) {
      issues.push(`door ${door.a} | ${door.b}: the same pair is also sealed`)
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
    if (!link.source.trim()) issues.push(`link ${link.from} → ${link.to}: missing source`)
    if (!link.sourceFr.trim()) {
      issues.push(`link ${link.from} → ${link.to}: missing French source`)
    }
  }

  // A structure is solid, so it has to stand somewhere real, stay inside the
  // room it belongs to, and leave that room walkable: one planted half in a
  // wall, or on the very spot the visitor arrives at, is a room you cannot
  // enter rather than a room with something in it.
  const structureIds = new Set<string>()
  const byRoom = new Map<string, Structure[]>()
  for (const structure of source.structures ?? []) {
    const id = `structure ${structure.id}`
    if (structureIds.has(structure.id)) issues.push(`${id}: duplicate id`)
    structureIds.add(structure.id)

    if (!STRUCTURE_KINDS.has(structure.kind)) issues.push(`${id}: unknown kind "${structure.kind}"`)
    if (!PROVENANCES.has(structure.provenance)) {
      issues.push(`${id}: unknown provenance "${structure.provenance}"`)
    }
    if (!structure.source.trim()) issues.push(`${id}: missing source`)
    if (!structure.sourceFr.trim()) issues.push(`${id}: missing French source`)
    if (!structure.nameFr.trim()) issues.push(`${id}: missing French name`)
    if (structure.height <= 0) issues.push(`${id}: stands no higher than the floor`)
    if (structure.base < 0) issues.push(`${id}: hangs below the floor`)
    if (
      structure.colour !== undefined &&
      (!Number.isInteger(structure.colour) || structure.colour < 0 || structure.colour > 0xffffff)
    ) {
      issues.push(`${id}: colour must be a 24-bit integer`)
    }
    if (structure.sides !== null && structure.sides < 3) {
      issues.push(`${id}: ${structure.sides} sides cannot enclose anything`)
    }

    const room = source.spaces.find((space) => space.id === structure.spaceId)
    if (!room) {
      issues.push(`${id}: stands in "${structure.spaceId}", which does not exist`)
      continue
    }
    byRoom.set(structure.spaceId, [...(byRoom.get(structure.spaceId) ?? []), structure])

    const outline = structureFootprint(structure)
    if (polygonArea(outline) < 0.25) issues.push(`${id}: has no usable footprint`)
    if (!outline.every((corner) => pointInPolygon(corner, room.footprint))) {
      issues.push(`${id}: sticks out of ${room.id}`)
    }

    const tier = source.tiers.find((candidate) => candidate.id === room.tierId)
    if (tier && structure.base + structure.height > ceilingOf(room, tier) + EPSILON) {
      issues.push(`${id}: goes through the ceiling of ${room.id}`)
    }
  }

  for (const [spaceId, standing] of byRoom) {
    const room = source.spaces.find((space) => space.id === spaceId)!
    for (let i = 0; i < standing.length; i++) {
      for (let j = i + 1; j < standing.length; j++) {
        const a = structureFootprint(standing[i])
        const b = structureFootprint(standing[j])
        // One wholly inside the other is a post on its plinth, which the
        // panels do draw; anything else is two solids on the same floor.
        if (polygonsOverlap(a, b) && !polygonContains(a, b) && !polygonContains(b, a)) {
          issues.push(`structures ${standing[i].id} and ${standing[j].id} stand in each other`)
        }
      }
      for (const centre of columnPositions(room.footprint)) {
        if (pointInPolygon(centre, structureFootprint(standing[i]))) {
          issues.push(`structure ${standing[i].id}: stands on a column of ${room.id}`)
        }
      }
    }

    const arrival = spawnPoint(room, standing)
    for (const structure of standing) {
      // Hung clear of the head, it is something you arrive *under*: the service
      // run crossing the princes' court passes over the point the visitor lands
      // on, and standing under a duct is not standing inside one. Same rule as
      // the doorway pass above, and the same one `spawnPoint` itself applies.
      if (!blocksTheFloor(structure)) continue
      if (pointInPolygon(arrival, structureFootprint(structure))) {
        issues.push(`structure ${structure.id}: the visitor arrives inside it`)
      }
    }
  }

  // The whole ship has to be one connected space, or part of the
  // reconstruction is scenery the visitor can see but never enter.
  const ship = buildShip(source)

  // A doorway is derived from a shared wall, so nothing in the room knows it is
  // there. A solid set down in front of one leaves an opening that is drawn,
  // walked through by the connectivity check, and shut in the visitor's face.
  for (const plan of ship.plans.values()) {
    for (const doorway of plan.doorways) {
      const middle: Vec2 = [
        (doorway.start[0] + doorway.end[0]) / 2,
        (doorway.start[1] + doorway.end[1]) / 2,
      ]
      const along = Math.hypot(doorway.end[0] - doorway.start[0], doorway.end[1] - doorway.start[1])
      if (along < EPSILON) continue
      const normal: Vec2 = [
        -(doorway.end[1] - doorway.start[1]) / along,
        (doorway.end[0] - doorway.start[0]) / along,
      ]

      for (const structure of plan.structures) {
        if (structure.spaceId !== doorway.a && structure.spaceId !== doorway.b) continue
        // Only what stands on the floor can shut a door. A solid hung clear of
        // the head is the case `blocksTheFloor` already exists for: the casino
        // mezzanine over its shops, the marquee over the police-station doors.
        if (!blocksTheFloor(structure)) continue
        const outline = structureFootprint(structure)
        for (const step of [-1.2, 1.2]) {
          const at: Vec2 = [middle[0] + normal[0] * step, middle[1] + normal[1] * step]
          if (pointInPolygon(at, outline)) {
            issues.push(
              `structure ${structure.id}: stands in the doorway ${doorway.a} | ${doorway.b}`,
            )
          }
        }
      }
    }
  }
  // Two floors at different heights may share a doorway, so long as the
  // difference is one the visitor takes in stride. Past that it is a fall
  // dressed as a door.
  for (const plan of ship.plans.values()) {
    for (const doorway of plan.doorways) {
      const a = ship.spaces.get(doorway.a)!
      const b = ship.spaces.get(doorway.b)!
      const rise = Math.abs((a.floor ?? 0) - (b.floor ?? 0))
      if (rise > STEP_UP + EPSILON) {
        issues.push(`doorway ${doorway.a} | ${doorway.b}: ${rise} m is a climb, not a step`)
      }
    }
  }

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
