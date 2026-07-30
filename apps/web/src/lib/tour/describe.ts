/**
 * A room said in words, for whoever is not looking at it.
 *
 * The walk is a WebGL canvas and a plan drawn in SVG: to a screen reader it is
 * a rectangle that never changes. Everything needed to say what a room is has
 * been in the blueprint all along — the footprint gives its size, `ceilingOf`
 * its height, `adjacency` how many ways out it has, the structures what stands
 * in it, and every one of them is named in both languages and carries a source.
 * This assembles that into one sentence, so arriving somewhere can be announced
 * rather than merely rendered.
 *
 * It is a projection of the same data the geometry is built from, not a second
 * description to keep in step: a room whose footprint is edited says its new
 * size the next time it is entered.
 */
import { ceilingOf, type Ship } from './blueprint'
import { blocksTheFloor } from './geometry'
import type { Space, Structure, StructureKind, Vec2 } from './types'

/** How the sentence is worded, in the language being read. */
export interface RoomWords {
  nameOf: (entity: { name: string; nameFr: string }) => string
  /** The deck, and the room this one is inside. `search.ts` builds it. */
  placeOf: (space: Space) => string
  /** "157 × 25 m under 9 m" */
  size: (long: number, wide: number, ceiling: number) => string
  /** "4 exits" */
  exits: (count: number) => string
  /** "72 tables", by the kind of solid. One entry per `StructureKind`. */
  solids: Record<StructureKind, (count: number) => string>
  /** How a room with nothing drawn in it is described. */
  bare: string
}

/** A run of solids of one kind, or a single one under its own name. */
export interface SolidTally {
  kind: StructureKind
  count: number
  /** Set when the run is short enough to name its members one by one. */
  name: string | null
}

/**
 * Past this many of a kind, a room says how many rather than naming each.
 *
 * The banquet hall holds seventy-two tables numbered one to seventy-two, and
 * reading that list out is not a description of the room. Two of a kind is
 * different — the stage and the throne dais are both platforms, and calling
 * them "2 platforms" throws away the only interesting thing about them.
 */
export const NAMED_UP_TO = 2

/**
 * What stands in a room, gathered by kind, in the order the blueprint lists it.
 *
 * Only what is on the floor counts: ducting hung under the deckhead is walked
 * under rather than around, and a room is not described by its services.
 */
export function solidsIn(ship: Ship, space: Space): SolidTally[] {
  const standing = ship.structures.filter(
    (structure) => structure.spaceId === space.id && blocksTheFloor(structure),
  )

  const order: StructureKind[] = []
  const byKind = new Map<StructureKind, Structure[]>()
  for (const structure of standing) {
    const held = byKind.get(structure.kind)
    if (held) held.push(structure)
    else {
      byKind.set(structure.kind, [structure])
      order.push(structure.kind)
    }
  }

  return order.flatMap((kind): SolidTally[] => {
    const group = byKind.get(kind)!
    if (group.length > NAMED_UP_TO) return [{ kind, count: group.length, name: null }]
    return group.map((structure) => ({ kind, count: 1, name: structure.id }))
  })
}

/** The bounding box of a footprint: its long side and its short side, in metres. */
export function extentOf(footprint: readonly Vec2[]): { long: number; wide: number } {
  const xs = footprint.map((point) => point[0])
  const zs = footprint.map((point) => point[1])
  const across = Math.max(...xs) - Math.min(...xs)
  const along = Math.max(...zs) - Math.min(...zs)
  return { long: Math.max(across, along), wide: Math.min(across, along) }
}

/** How many ways there are out of a room: doorways and vertical links alike. */
export function exitsFrom(ship: Ship, space: Space): number {
  return ship.adjacency.get(space.id)?.length ?? 0
}

/**
 * One room, in one sentence.
 *
 * "Banquet Hall, Tier 1, 157 × 25 m under 9 m, 4 exits, 72 tables, a stage, a
 * throne dais." The clauses are dropped rather than padded when the ship has
 * nothing to say: a room with no solids in it says so once, and a room the
 * blueprint gives no way out of does not claim zero exits.
 */
export function describeSpace(ship: Ship, space: Space, words: RoomWords): string {
  const tier = ship.tiers.find((candidate) => candidate.id === space.tierId)
  const { long, wide } = extentOf(space.footprint)
  const exits = exitsFrom(ship, space)

  const clauses = [words.nameOf(space), words.placeOf(space)]
  if (tier) {
    clauses.push(words.size(Math.round(long), Math.round(wide), Math.round(ceilingOf(space, tier))))
  }
  if (exits) clauses.push(words.exits(exits))

  const standing = solidsIn(ship, space)
  if (standing.length) {
    for (const tally of standing) {
      const named = tally.name ? ship.structures.find((s) => s.id === tally.name) : null
      clauses.push(named ? words.nameOf(named) : words.solids[tally.kind](tally.count))
    }
  } else {
    clauses.push(words.bare)
  }

  return `${clauses.join(', ')}.`
}
