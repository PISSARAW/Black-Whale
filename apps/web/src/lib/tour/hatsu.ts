/**
 * Nen inside the walk: what a Hatsu does to the ship rather than to the page.
 *
 * Everywhere else on the archive a technique acts on the document — it hides a
 * section, steals a control, rewrites a heading. In the tour there is no
 * document to act on: the ship is geometry, and the page around it is a frame
 * holding a canvas. So the walk marks itself `data-hatsu-pass`, which stops the
 * DOM layer dead, and routes the technique through here instead. A Hatsu cast in
 * the walk touches the reconstruction and nothing else.
 *
 * Reach is the whole ship. A technique aimed from the promenade at a cell four
 * decks down is not blocked by four decks of steel: aura does not need line of
 * sight, and the walk would be the only place in the archive where a Hatsu had
 * to be next to what it works on. Where a rule of the technique itself limits
 * it — Blinky refusing to swallow Nen, an isolated room letting its occupants
 * out — that limit is kept, because it comes from the ability rather than from
 * the geometry.
 *
 * Nothing here imports three.js or touches the DOM: the world is a value, and
 * `TourScene` is the only thing that knows how to draw it.
 */
import { ceilingOf, type Ship, type TierPlan } from './blueprint'
import { blocksTheFloor, pointInPolygon, structureFootprint, structureWalls } from './geometry'
import type { Space, Structure, StructureKind, Vec2, WallSegment } from './types'
import type { HatsuInteractionKind, HatsuProfile } from '$lib/nen/hatsuRegistry'

/**
 * The techniques that have something to take hold of in a reconstruction.
 *
 * The archive holds eighty-two, and most of them work on what a page *says*:
 * they seal a control, forge a heading, read a chapter that has not happened
 * yet. The walk has none of that — it has rooms, walls, doors and distance —
 * so only the techniques that are about space are carried across. The rest stay
 * inert here and say so, which is honest: a technique that quietly did nothing
 * would be worse than one that tells you the walk is the wrong ground for it.
 */
export const TOUR_HATSU_KINDS = [
  // On the rooms.
  'teleport',
  'door-network',
  'spatial',
  'scout',
  'senses',
  'dowsing',
  'paper-spy',
  'room-isolation',
  'blast',
  'scarlet',
  'vacuum',
  'flock',
  // On what stands in them.
  'elastic',
  'disguise',
  'pocket',
  'command',
  'clone',
  'impact',
  'barrage',
  'windup',
  'staff',
  'serpent',
  'remote-strike',
  'stitch',
  'animate',
  'shred',
  'growth',
  'polarity',
  'identity-swap',
  'relay',
] as const satisfies readonly HatsuInteractionKind[]

/**
 * The techniques whose target is a solid rather than a room.
 *
 * A room is a volume you stand in and a solid is a thing you can pick up,
 * crush or push, and almost every technique that is about force rather than
 * about space wants the second. The reticle finds both on every frame; this is
 * what decides which one a cast reads.
 */
export const SOLID_HATSU_KINDS = new Set<HatsuInteractionKind>([
  'elastic',
  'disguise',
  'pocket',
  'command',
  'clone',
  'impact',
  'barrage',
  'windup',
  'staff',
  'serpent',
  'remote-strike',
  'stitch',
  'animate',
  'shred',
  'growth',
  'polarity',
  'identity-swap',
  'relay',
])

export const aimsAtSolids = (profile: HatsuProfile | null) =>
  Boolean(profile) && SOLID_HATSU_KINDS.has(profile!.kind)

export type TourHatsuKind = (typeof TOUR_HATSU_KINDS)[number]

const TOUR_KINDS = new Set<HatsuInteractionKind>(TOUR_HATSU_KINDS)

export function worksInTour(profile: HatsuProfile | null): profile is HatsuProfile {
  return Boolean(profile) && TOUR_KINDS.has(profile!.kind)
}

/** How the visitor points at a room: down the reticle, or from the index. */
export type TourAim = 'reticle' | 'index'

/**
 * What Nen is currently doing to the ship.
 *
 * One flat value rather than a store per technique: the scene rebuilds from it,
 * the tests assert on it, and releasing the aura is `EMPTY_WORLD` again.
 */
export interface TourWorld {
  /** Every room on every deck held open at once — Emperor Time. */
  laidOpen: boolean
  /**
   * The protected room, and whether the visitor was standing in it when the
   * boundary went up. An occupant keeps the real room and may walk out of it;
   * anyone arriving from outside gets the empty copy.
   */
  isolated: { spaceId: string; occupant: boolean } | null
  /** The frames Voconte's doors join: one armed, or the pair. */
  doors: string[]
  /** Rooms Blinky has swallowed the contents of. */
  emptied: string[]
  /** Where the remote eye is parked, or `null` while it rides the visitor. */
  eye: string | null
  /** 0 nothing · 1 sight · 2 sight and hearing · 3 all three. */
  sealed: number
  /** Whether the visitor is passing through walls. */
  phasing: boolean
  /** Rooms a paper doll is counting arrivals in. */
  watched: { spaceId: string; visits: number }[]
  /** What the flock has carried back, newest first. */
  dispatches: string[]
  /** The room the chain is swinging towards. */
  dowsing: string | null

  /**
   * What has been done to the solids, by structure id.
   *
   * A solid the aura has touched is lifted out of its deck: the baked mesh
   * stops drawing it and the walk draws it on its own, so a coffin pushed
   * across the burial chamber does not cost a re-extrusion of the chamber. The
   * override is the whole of what was done to it, so releasing is deleting.
   */
  solids: Record<string, SolidHold>
  /** Solids that were not in the blueprint: Gallery Fake's copies. */
  copies: Structure[]
  /** The first of two solids a paired technique is waiting to join. */
  pairing: string | null
  /** Where the paper confetti stuck, which every later volley converges on. */
  wound: string | null
  /** Rotations wound into the next punch. */
  windup: number
}

/**
 * What a technique has done to one solid.
 *
 * Everything here is a modifier on the blueprint's own record rather than a
 * rewrite of it: the ship on disk is never the thing that changed, and Nen
 * Stitches undoes any of it by deleting the entry.
 */
export interface SolidHold {
  /** Moved, in the coordinates of the level it stands on. */
  at?: Vec2
  /** Turned about its own centre, in degrees, replacing its own rotation. */
  rotation?: number
  /** Multiplier on the footprint. */
  scale?: number
  /** Multiplier on the height. */
  squash?: number
  /** What it looks like. Texture Surprise changes this and nothing else. */
  kind?: StructureKind
  /** Swallowed, blown apart, or shredded down to nothing. */
  gone?: boolean
  /** Snake Arm has it: no other technique moves it until it is released. */
  bound?: boolean
  /** Biohazard: it wanders its room, still as solid as it was. */
  alive?: boolean
  /** The Sun and Moon's two marks. */
  mark?: 'sun' | 'moon'
  /** Volleys landed, for the techniques that reward commitment. */
  hits?: number
  /** A Gallery Fake copy, and the solid it is a copy of. */
  copyOf?: string
}

export const EMPTY_WORLD: TourWorld = {
  laidOpen: false,
  isolated: null,
  doors: [],
  emptied: [],
  eye: null,
  sealed: 0,
  phasing: false,
  watched: [],
  dispatches: [],
  dowsing: null,
  solids: {},
  copies: [],
  pairing: null,
  wound: null,
  windup: 0,
}

/** Nothing in the world is being held by aura. */
export const worldIsQuiet = (world: TourWorld): boolean =>
  !world.laidOpen &&
  !world.isolated &&
  !world.doors.length &&
  !world.emptied.length &&
  !world.eye &&
  !world.sealed &&
  !world.phasing &&
  !world.watched.length &&
  !world.dispatches.length &&
  !world.dowsing &&
  !Object.keys(world.solids).length &&
  !world.copies.length &&
  !world.pairing &&
  !world.wound &&
  !world.windup

/**
 * What the technique did, as data. The component turns it into a sentence in
 * the visitor's language; nothing here knows English from French.
 */
export type TourReport =
  | { kind: 'no-target' }
  | { kind: 'inert' }
  | { kind: 'teleported'; spaceId: string }
  | { kind: 'door-armed'; spaceId: string }
  | { kind: 'doors-paired'; spaceId: string; otherId: string }
  | { kind: 'doors-rearmed'; spaceId: string }
  | { kind: 'phasing'; on: boolean }
  | { kind: 'eye-sent'; spaceId: string }
  | { kind: 'eye-recalled' }
  | { kind: 'sealed'; stage: number }
  | { kind: 'dowsed'; spaceId: string; distance: number; decks: number }
  | { kind: 'watching'; spaceId: string }
  | { kind: 'isolated'; spaceId: string; occupant: boolean }
  | { kind: 'stripped'; spaceId: string; count: number }
  | { kind: 'laid-open'; spaces: number; decks: number }
  | { kind: 'emptied'; spaceId: string; structures: number }
  | { kind: 'refused'; spaceId: string }
  | { kind: 'dispatched'; spaceId: string }
  // On the solids.
  | { kind: 'no-solid' }
  | { kind: 'bound-fast'; solidId: string }
  | { kind: 'gum-set'; solidId: string }
  | { kind: 'gum-pulled'; solidId: string; otherId: string }
  | { kind: 'forged'; solidId: string; as: StructureKind }
  | { kind: 'wrapped'; solidId: string }
  | { kind: 'unwrapped'; solidId: string }
  | { kind: 'pushed'; solidId: string; metres: number }
  | { kind: 'copied'; solidId: string }
  | { kind: 'crushed'; solidId: string }
  | { kind: 'volley'; solidId: string; hits: number }
  | { kind: 'shattered'; solidId: string }
  | { kind: 'wound-up'; turns: number }
  | { kind: 'launched'; solidId: string; metres: number }
  | { kind: 'struck'; solidId: string }
  | { kind: 'bound'; solidId: string }
  | { kind: 'released'; solidId: string }
  | { kind: 'came-up-under'; solidId: string; otherId: string }
  | { kind: 'stitched'; solidId: string }
  | { kind: 'nothing-to-stitch'; solidId: string }
  | { kind: 'animated'; solidId: string }
  | { kind: 'shred-stuck'; solidId: string }
  | { kind: 'shred-cut'; solidId: string; left: number }
  | { kind: 'grown'; solidId: string }
  | { kind: 'growth-refused'; solidId: string }
  | { kind: 'marked'; solidId: string; mark: 'sun' | 'moon' }
  | { kind: 'detonated'; solidId: string; otherId: string }
  | { kind: 'swapped'; solidId: string; otherId: string }
  | { kind: 'cargo-taken'; solidId: string }
  | { kind: 'cargo-landed'; solidId: string; spaceId: string }

export interface TourCastResult {
  world: TourWorld
  report: TourReport
  /** A space the visitor is moved to, if the technique moves them. */
  travelTo?: string
}

export interface TourCastInput {
  ship: Ship
  /** The room the technique is aimed at, or `null` when it is aimed at nothing. */
  targetId: string | null
  /** The solid down the reticle, for the techniques that work on solids. */
  targetSolidId?: string | null
  /** The room the visitor is standing in. */
  standingIn: string | null
  /** Where they stand, on their own deck. */
  at: Vec2
  /** Which way they face: a push goes where they are looking. */
  heading?: number
  /** Deterministic in tests; Chrollo's teleport is the only caller. */
  random?: () => number
}

const without = <T>(list: T[], predicate: (item: T) => boolean) => list.filter((i) => !predicate(i))

/** Rooms whose contents the aura is holding, which Blinky will not swallow. */
export function nenHeld(world: TourWorld): string[] {
  return [
    ...(world.isolated ? [world.isolated.spaceId] : []),
    ...world.doors,
    ...world.watched.map((doll) => doll.spaceId),
    ...(world.eye ? [world.eye] : []),
  ]
}

// ── The solids ────────────────────────────────────────────────────────────
//
// Everything from here to `castInTour` is the second noun the walk learned:
// the thing standing in the room, as opposed to the room. It is deliberately
// the same shape as the first — a value in `TourWorld`, a pure reducer, and a
// renderer that knows nothing but how to draw what it is handed.

/** Appearances Texture Surprise cycles a surface through. */
const FORGERIES: StructureKind[] = ['painting', 'cabinet', 'bars', 'basin', 'casket']

/** The blueprint's record for a solid, or the Gallery Fake copy standing in for one. */
export function solidById(ship: Ship, world: TourWorld, id: string | null): Structure | null {
  if (!id) return null
  return (
    ship.structures.find((structure) => structure.id === id) ??
    world.copies.find((copy) => copy.id === id) ??
    null
  )
}

/**
 * The solid as the aura currently leaves it.
 *
 * The blueprint's own record is never edited: what is stored is a modifier,
 * and this is where the two are put together, so `/tour/sources` and the
 * validator go on reading the ship as it was drawn.
 */
export function solidNow(structure: Structure, hold: SolidHold | undefined): Structure {
  if (!hold) return structure
  const scale = hold.scale ?? 1
  return {
    ...structure,
    at: hold.at ?? structure.at,
    rotation: hold.rotation ?? structure.rotation,
    size: [structure.size[0] * scale, structure.size[1] * scale],
    height: structure.height * (hold.squash ?? 1),
    kind: hold.kind ?? structure.kind,
    // A copy has none of the original's standing: it is drawn cold, like every
    // other thing in the walk that no page supports.
    provenance: hold.copyOf ? 'inferred' : structure.provenance,
  }
}

/** Solids the aura has lifted out of their deck, so the baked mesh drops them. */
export const heldSolidIds = (world: TourWorld): string[] => Object.keys(world.solids)

/**
 * A solid Biohazard woke up does not stand still.
 *
 * The drift is a circle, and it is computed rather than stored so the collision
 * test and the renderer can each ask for it at the same instant and get the
 * same answer. The phase comes off the id, so two animated solids in one room
 * are never in step.
 */
export function wanderOffset(id: string, seconds: number): Vec2 {
  let phase = 0
  for (let i = 0; i < id.length; i++) phase = (phase * 31 + id.charCodeAt(i)) % 360
  const angle = (seconds * 0.6) + (phase * Math.PI) / 180
  return [Math.cos(angle) * 1.4, Math.sin(angle) * 1.4]
}

/** Everything the walk has to draw itself on one deck, ready to extrude. */
export function detachedOn(
  ship: Ship,
  world: TourWorld,
  tierId: string,
  seconds = 0,
): { structure: Structure; room: Space }[] {
  const emptied = new Set(emptiedOn(world, tierId, ship))
  const out: { structure: Structure; room: Space }[] = []

  for (const [id, hold] of Object.entries(world.solids)) {
    if (hold.gone) continue
    const original = solidById(ship, world, id)
    if (!original) continue
    const room = ship.spaces.get(original.spaceId)
    if (!room || room.tierId !== tierId || emptied.has(room.id)) continue

    let structure = solidNow(original, hold)
    if (hold.alive) {
      const drift = wanderOffset(id, seconds)
      structure = { ...structure, at: [structure.at[0] + drift[0], structure.at[1] + drift[1]] }
    }
    out.push({ structure, room })
  }
  return out
}

/** What those solids stop the visitor with, since they are no longer in the deck. */
export function solidWalls(
  ship: Ship,
  world: TourWorld,
  tierId: string,
  seconds = 0,
): WallSegment[] {
  return detachedOn(ship, world, tierId, seconds)
    .filter(({ structure }) => blocksTheFloor(structure))
    .flatMap(({ structure }) => structureWalls(structure))
}

const withHold = (world: TourWorld, id: string, patch: SolidHold): TourWorld => ({
  ...world,
  solids: { ...world.solids, [id]: { ...world.solids[id], ...patch } },
})

const dropHold = (world: TourWorld, id: string): TourWorld => {
  const solids = { ...world.solids }
  delete solids[id]
  return { ...world, solids, copies: world.copies.filter((copy) => copy.id !== id) }
}

/** Half the diagonal of a solid: how far off its centre you have to stand. */
const clearanceOf = (structure: Structure) => Math.hypot(structure.size[0], structure.size[1]) / 2

/**
 * Moves a solid, but never out through the wall of the room it stands in.
 *
 * A bed shoved through the party wall would be a claim about the ship rather
 * than about the technique, so a push that would leave the room is spent
 * against it and the solid stays where it is.
 */
function shove(
  ship: Ship,
  world: TourWorld,
  structure: Structure,
  hold: SolidHold | undefined,
  delta: Vec2,
): Vec2 | null {
  const now = solidNow(structure, hold)
  const room = ship.spaces.get(structure.spaceId)
  if (!room) return null
  const target: Vec2 = [now.at[0] + delta[0], now.at[1] + delta[1]]
  const outline = structureFootprint({ ...now, at: target })
  return outline.every((corner) => pointInPolygon(corner, room.footprint)) ? target : null
}

/**
 * One cast against a solid.
 *
 * Split out of `castInTour` because the two halves share nothing but the world:
 * a room is a place and a solid is a thing, and the rules that bind them —
 * Snake Arm holding one fast, Nen Stitches putting one back — are all here.
 */
function castOnSolid(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult {
  const { ship, targetSolidId, at, heading = 0 } = input
  const structure = solidById(ship, world, targetSolidId ?? null)

  // Winding up needs nothing to hit: the turns are the whole of the technique
  // until there is something to spend them on.
  if (kind === 'windup' && !structure) {
    const turns = world.windup + 1
    return { world: { ...world, windup: turns }, report: { kind: 'wound-up', turns } }
  }

  // The confetti has already stuck somewhere: every later volley goes there,
  // wherever you aim. That is the ability, so it is checked before the target.
  if (kind === 'shred' && world.wound) {
    const wounded = solidById(ship, world, world.wound)
    const hold = world.solids[world.wound]
    if (!wounded || hold?.gone) return { world: { ...world, wound: null }, report: { kind: 'no-solid' } }
    const left = (hold?.scale ?? 1) * 0.7
    if (left < 0.2) {
      return {
        world: { ...withHold(world, world.wound, { gone: true }), wound: null },
        report: { kind: 'shattered', solidId: world.wound },
      }
    }
    return {
      world: withHold(world, world.wound, { scale: left }),
      report: { kind: 'shred-cut', solidId: world.wound, left: Math.round(left * 100) },
    }
  }

  // Transport Portals is the one technique whose second pick is a room: the
  // cargo first, then the relay it comes out at.
  if (kind === 'relay' && world.pairing) {
    const cargoId = world.pairing
    const cargo = solidById(ship, world, cargoId)
    const room = input.targetId ? ship.spaces.get(input.targetId) : null
    if (!cargo || !room) return { world, report: { kind: 'no-target' } }
    return {
      world: {
        ...withHold(world, cargoId, { at: centroid(room) }),
        pairing: null,
        // The cargo now stands in the far relay, so it belongs to that room.
        copies: world.copies.map((copy) =>
          copy.id === cargoId ? { ...copy, spaceId: room.id } : copy,
        ),
      },
      report: { kind: 'cargo-landed', solidId: cargoId, spaceId: room.id },
    }
  }

  if (!structure) return { world, report: { kind: 'no-solid' } }
  const id = structure.id
  const hold = world.solids[id]

  // Snake Arm holds a thing fast. Only the chain that undoes damage, and the
  // blast that strips holds off a room, get past it.
  if (hold?.bound && kind !== 'serpent' && kind !== 'stitch') {
    return { world, report: { kind: 'bound-fast', solidId: id } }
  }
  if (hold?.gone && kind !== 'stitch') return { world, report: { kind: 'no-solid' } }

  const away = (metres: number): Vec2 => {
    const now = solidNow(structure, hold)
    const dx = now.at[0] - at[0]
    const dz = now.at[1] - at[1]
    const length = Math.hypot(dx, dz) || 1
    return [(dx / length) * metres, (dz / length) * metres]
  }

  switch (kind) {
    // Bungee Gum: the first cast sets the strand, the second brings the other
    // end to it. Tension is what the technique is, so the pull is towards the
    // thing already stuck rather than towards the visitor.
    case 'elastic': {
      if (!world.pairing || world.pairing === id) {
        return { world: { ...world, pairing: id }, report: { kind: 'gum-set', solidId: id } }
      }
      const anchor = solidById(ship, world, world.pairing)
      if (!anchor) return { world: { ...world, pairing: id }, report: { kind: 'gum-set', solidId: id } }
      const anchorNow = solidNow(anchor, world.solids[world.pairing])
      const now = solidNow(structure, hold)
      const dx = now.at[0] - anchorNow.at[0]
      const dz = now.at[1] - anchorNow.at[1]
      const length = Math.hypot(dx, dz) || 1
      const gap = clearanceOf(anchorNow) + clearanceOf(now)
      const landing: Vec2 = [
        anchorNow.at[0] + (dx / length) * gap,
        anchorNow.at[1] + (dz / length) * gap,
      ]
      const room = ship.spaces.get(structure.spaceId)
      const outline = structureFootprint({ ...now, at: landing })
      const fits = room && outline.every((corner) => pointInPolygon(corner, room.footprint))
      return {
        world: { ...withHold(world, id, fits ? { at: landing } : {}), pairing: null },
        report: { kind: 'gum-pulled', solidId: id, otherId: world.pairing },
      }
    }

    // Only the look changes; the thing underneath goes on being what it was,
    // and goes on stopping you exactly where it did.
    case 'disguise': {
      const current = hold?.kind ?? structure.kind
      const next = FORGERIES[(FORGERIES.indexOf(current) + 1) % FORGERIES.length]
      return { world: withHold(world, id, { kind: next }), report: { kind: 'forged', solidId: id, as: next } }
    }

    case 'pocket': {
      const wrapped = (hold?.scale ?? 1) < 0.5
      return wrapped
        ? { world: withHold(world, id, { scale: 1, squash: 1 }), report: { kind: 'unwrapped', solidId: id } }
        : {
            world: withHold(world, id, { scale: 0.25, squash: 0.25 }),
            report: { kind: 'wrapped', solidId: id },
          }
    }

    // The stamp moves a thing as a thing, which is all the walk has: it is
    // pushed the way the visitor is looking.
    case 'command': {
      const push: Vec2 = [-Math.sin(heading) * 3, -Math.cos(heading) * 3]
      const landing = shove(ship, world, structure, hold, push)
      return landing
        ? { world: withHold(world, id, { at: landing }), report: { kind: 'pushed', solidId: id, metres: 3 } }
        : { world, report: { kind: 'pushed', solidId: id, metres: 0 } }
    }

    case 'clone': {
      const now = solidNow(structure, hold)
      const beside = shove(ship, world, structure, hold, [clearanceOf(now) * 2, 0]) ?? now.at
      const copyId = `${id}::fake${world.copies.length + 1}`
      const copy: Structure = { ...now, id: copyId, at: beside }
      return {
        world: {
          ...world,
          copies: [...world.copies, copy],
          solids: { ...world.solids, [copyId]: { copyOf: id } },
        },
        report: { kind: 'copied', solidId: id },
      }
    }

    case 'impact':
      return { world: withHold(world, id, { squash: 0.12 }), report: { kind: 'crushed', solidId: id } }

    // A sustained volley: the thing is driven back, and the third burst is the
    // one that ends it.
    case 'barrage': {
      const hits = (hold?.hits ?? 0) + 1
      if (hits >= 3) {
        return { world: withHold(world, id, { hits, gone: true }), report: { kind: 'shattered', solidId: id } }
      }
      const landing = shove(ship, world, structure, hold, away(2))
      return {
        world: withHold(world, id, landing ? { hits, at: landing } : { hits }),
        report: { kind: 'volley', solidId: id, hits },
      }
    }

    case 'windup': {
      const metres = 3 + world.windup * 4
      const landing = shove(ship, world, structure, hold, away(metres))
      return {
        world: { ...withHold(world, id, landing ? { at: landing } : {}), windup: 0 },
        report: { kind: 'launched', solidId: id, metres: landing ? metres : 0 },
      }
    }

    case 'staff': {
      const now = solidNow(structure, hold)
      const landing = shove(ship, world, structure, hold, away(1.5))
      return {
        world: withHold(world, id, { rotation: now.rotation + 25, ...(landing ? { at: landing } : {}) }),
        report: { kind: 'struck', solidId: id },
      }
    }

    case 'serpent':
      return hold?.bound
        ? { world: withHold(world, id, { bound: false }), report: { kind: 'released', solidId: id } }
        : { world: withHold(world, id, { bound: true }), report: { kind: 'bound', solidId: id } }

    // The aura runs along the floor and comes up under something else in the
    // same room: you strike here and the room is hit there.
    case 'remote-strike': {
      const neighbour = ship.structures.find(
        (candidate) => candidate.spaceId === structure.spaceId && candidate.id !== id,
      )
      if (!neighbour) return { world, report: { kind: 'no-solid' } }
      const landing = shove(ship, world, neighbour, world.solids[neighbour.id], away(2.5))
      return {
        world: withHold(world, neighbour.id, landing ? { at: landing } : { hits: 1 }),
        report: { kind: 'came-up-under', solidId: id, otherId: neighbour.id },
      }
    }

    // The thread that puts things back: the blueprint's own record, whatever
    // was done to it — crushed, shredded, swallowed, moved.
    case 'stitch':
      return hold
        ? { world: dropHold(world, id), report: { kind: 'stitched', solidId: id } }
        : { world, report: { kind: 'nothing-to-stitch', solidId: id } }

    case 'animate':
      return {
        world: withHold(world, id, { alive: !hold?.alive }),
        report: { kind: 'animated', solidId: id },
      }

    case 'shred':
      return { world: { ...world, wound: id }, report: { kind: 'shred-stuck', solidId: id } }

    // Dramatic on a thing, and weak on anything Nen is already holding.
    case 'growth': {
      if (hold?.bound || hold?.alive || hold?.copyOf) {
        return { world, report: { kind: 'growth-refused', solidId: id } }
      }
      return {
        world: withHold(world, id, { scale: Math.min(3, (hold?.scale ?? 1) * 1.8) }),
        report: { kind: 'grown', solidId: id },
      }
    }

    // Opposite marks, and the pair goes off when they meet.
    case 'polarity': {
      if (!world.pairing || world.pairing === id) {
        return {
          world: { ...withHold(world, id, { mark: 'sun' }), pairing: id },
          report: { kind: 'marked', solidId: id, mark: 'sun' },
        }
      }
      const other = world.pairing
      return {
        world: {
          ...withHold(withHold(world, id, { mark: 'moon', gone: true }), other, { gone: true }),
          pairing: null,
        },
        report: { kind: 'detonated', solidId: id, otherId: other },
      }
    }

    // The two exchange appearances, and nothing else: each stays where it is
    // and stays what it is.
    case 'identity-swap': {
      if (!world.pairing || world.pairing === id) {
        return { world: { ...world, pairing: id }, report: { kind: 'gum-set', solidId: id } }
      }
      const other = solidById(ship, world, world.pairing)
      if (!other) return { world: { ...world, pairing: id }, report: { kind: 'gum-set', solidId: id } }
      const mine = solidNow(structure, hold)
      const theirs = solidNow(other, world.solids[other.id])
      return {
        world: {
          ...withHold(withHold(world, id, { kind: theirs.kind }), other.id, { kind: mine.kind }),
          pairing: null,
        },
        report: { kind: 'swapped', solidId: id, otherId: other.id },
      }
    }

    case 'relay':
      return { world: { ...world, pairing: id }, report: { kind: 'cargo-taken', solidId: id } }

    default:
      return { world, report: { kind: 'inert' } }
  }
}

/**
 * Runs one cast against the world and returns the next one.
 *
 * Pure, and total: an unhandled kind reports `inert` rather than throwing, so a
 * technique picked from the dock can never break the walk.
 */
export function castInTour(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult {
  const { ship, targetId, standingIn, at } = input
  if (SOLID_HATSU_KINDS.has(kind)) return castOnSolid(world, kind, input)

  const target = targetId ? (ship.spaces.get(targetId) ?? null) : null

  // Emperor Time sweeps the whole ship and needs nothing to aim at; every other
  // technique here works on a room.
  if (kind === 'scarlet') {
    return {
      world: { ...world, laidOpen: true },
      report: { kind: 'laid-open', spaces: ship.spaces.size, decks: ship.tiers.length },
    }
  }

  if (kind === 'senses') {
    const sealed = (world.sealed + 1) % 4
    return { world: { ...world, sealed }, report: { kind: 'sealed', stage: sealed } }
  }

  if (kind === 'spatial') {
    const phasing = !world.phasing
    return { world: { ...world, phasing }, report: { kind: 'phasing', on: phasing } }
  }

  // Chrollo does not choose where the target lands, and neither do you: the
  // destination is drawn from the whole ship, decks included.
  if (kind === 'teleport') {
    const random = input.random ?? Math.random
    const elsewhere = [...ship.spaces.keys()].filter((id) => id !== standingIn)
    if (!elsewhere.length) return { world, report: { kind: 'no-target' } }
    const spaceId = elsewhere[Math.min(elsewhere.length - 1, Math.floor(random() * elsewhere.length))]
    return { world, report: { kind: 'teleported', spaceId }, travelTo: spaceId }
  }

  if (!target) return { world, report: { kind: 'no-target' } }

  switch (kind) {
    case 'door-network': {
      // Two frames and no more. Arming a third starts a new pair rather than
      // opening a network onto everywhere, which is the rule the hideout keeps.
      if (world.doors.length >= 2) {
        return { world: { ...world, doors: [target.id] }, report: { kind: 'doors-rearmed', spaceId: target.id } }
      }
      if (world.doors.includes(target.id)) {
        return { world, report: { kind: 'door-armed', spaceId: target.id } }
      }
      const doors = [...world.doors, target.id]
      return {
        world: { ...world, doors },
        report:
          doors.length === 2
            ? { kind: 'doors-paired', spaceId: doors[0], otherId: doors[1] }
            : { kind: 'door-armed', spaceId: target.id },
      }
    }

    case 'scout': {
      if (world.eye === target.id) return { world: { ...world, eye: null }, report: { kind: 'eye-recalled' } }
      return { world: { ...world, eye: target.id }, report: { kind: 'eye-sent', spaceId: target.id } }
    }

    case 'dowsing': {
      const distance = distanceTo(ship, target, at, standingIn)
      return {
        world: { ...world, dowsing: target.id },
        report: { kind: 'dowsed', spaceId: target.id, distance: distance.metres, decks: distance.decks },
      }
    }

    case 'paper-spy': {
      if (world.watched.some((doll) => doll.spaceId === target.id)) {
        return { world, report: { kind: 'watching', spaceId: target.id } }
      }
      return {
        world: { ...world, watched: [...world.watched, { spaceId: target.id, visits: 0 }] },
        report: { kind: 'watching', spaceId: target.id },
      }
    }

    case 'room-isolation': {
      const occupant = standingIn === target.id
      return {
        world: { ...world, isolated: { spaceId: target.id, occupant } },
        report: { kind: 'isolated', spaceId: target.id, occupant },
      }
    }

    // Air Blow strips what another technique put on a room, from any distance,
    // and moves nothing: the room comes back as the blueprint has it.
    case 'blast': {
      let count = 0
      const next = { ...world }
      if (next.isolated?.spaceId === target.id) {
        next.isolated = null
        count++
      }
      if (next.doors.includes(target.id)) {
        next.doors = without(next.doors, (id) => id === target.id)
        count++
      }
      if (next.emptied.includes(target.id)) {
        next.emptied = without(next.emptied, (id) => id === target.id)
        count++
      }
      if (next.watched.some((doll) => doll.spaceId === target.id)) {
        next.watched = without(next.watched, (doll) => doll.spaceId === target.id)
        count++
      }
      if (next.eye === target.id) {
        next.eye = null
        count++
      }
      if (next.dowsing === target.id) {
        next.dowsing = null
        count++
      }
      // And every solid in the room that another technique was holding: the
      // blast is what puts a crushed coffin or a bound bed back where it was.
      const inside = Object.keys(next.solids).filter(
        (id) => solidById(ship, next, id)?.spaceId === target.id,
      )
      if (inside.length) {
        const solids = { ...next.solids }
        for (const id of inside) delete solids[id]
        next.solids = solids
        next.copies = next.copies.filter((copy) => !inside.includes(copy.id))
        count += inside.length
      }
      return { world: next, report: { kind: 'stripped', spaceId: target.id, count } }
    }

    // Blinky swallows what is not alive and not Nen. A room another technique
    // is holding refuses to go in, and the refusal is the reading: it is how
    // Shizuku finds the trap.
    case 'vacuum': {
      if (nenHeld(world).includes(target.id)) {
        return { world, report: { kind: 'refused', spaceId: target.id } }
      }
      if (world.emptied.includes(target.id)) {
        return { world, report: { kind: 'emptied', spaceId: target.id, structures: 0 } }
      }
      const structures = ship.structures.filter((solid) => solid.spaceId === target.id).length
      return {
        world: { ...world, emptied: [...world.emptied, target.id] },
        report: { kind: 'emptied', spaceId: target.id, structures },
      }
    }

    case 'flock': {
      const dispatches = [target.id, ...without(world.dispatches, (id) => id === target.id)].slice(0, 8)
      return { world: { ...world, dispatches }, report: { kind: 'dispatched', spaceId: target.id } }
    }

    default:
      return { world, report: { kind: 'inert' } }
  }
}

/**
 * Straight-line distance to a room, and how many levels lie between.
 *
 * Two decks are two grids in the same coordinates, so the plan distance is
 * meaningful across them; the level count is reported beside it rather than
 * folded in, because "forty metres, three decks down" is what a visitor needs.
 */
export function distanceTo(
  ship: Ship,
  target: Space,
  at: Vec2,
  standingIn: string | null,
): { metres: number; decks: number } {
  const centre = centroid(target)
  const here = standingIn ? ship.spaces.get(standingIn) : null
  const fromTier = here ? ship.tiers.findIndex((tier) => tier.id === here.tierId) : -1
  const toTier = ship.tiers.findIndex((tier) => tier.id === target.tierId)
  return {
    metres: Math.round(Math.hypot(centre[0] - at[0], centre[1] - at[1])),
    decks: fromTier < 0 || toTier < 0 ? 0 : Math.abs(toTier - fromTier),
  }
}

/** The mean of a footprint's corners: close enough to aim a chain at. */
export function centroid(space: Space): Vec2 {
  const sum = space.footprint.reduce<[number, number]>(
    (total, point) => [total[0] + point[0], total[1] + point[1]],
    [0, 0],
  )
  return [sum[0] / space.footprint.length, sum[1] / space.footprint.length]
}

/**
 * The room the visitor is looking at, found by walking the reticle out across
 * the deck plan.
 *
 * Deliberately not a three.js raycast against the mesh. Aura is not light: the
 * technique reaches the room whether or not a wall stands between, and the walk
 * out over the floor plan is the reading of "what you are facing" that matches
 * that. It also keeps the whole targeting path testable without a GPU.
 *
 * The first room that is not the one underfoot wins; if the ray only ever
 * crosses the room the visitor is standing in, that room is the target.
 */
export function aimedSpace(plan: TierPlan, at: Vec2, heading: number, range = 90): Space | null {
  // The camera looks along (-sin yaw, -cos yaw), as the walk's own movement
  // code has it.
  const dx = -Math.sin(heading)
  const dz = -Math.cos(heading)
  const here = plan.spaces.find((space) => pointInPolygon(at, space.footprint)) ?? null

  const STEP = 0.5
  for (let travelled = STEP; travelled <= range; travelled += STEP) {
    const point: Vec2 = [at[0] + dx * travelled, at[1] + dz * travelled]
    const space = plan.spaces.find((candidate) => pointInPolygon(point, candidate.footprint))
    if (space && space.id !== here?.id) return space
  }
  return here
}

/**
 * The solid down the reticle, found the same way the room is.
 *
 * Walked out over the floor plan rather than raycast against the mesh, for the
 * same reason: aura reaches what it is aimed at, and a coffin behind a coffin
 * is still something you can name. The nearest one along the ray wins, and its
 * current outline is what is tested, so a solid Nen has moved is where the
 * technique put it and not where the blueprint drew it.
 */
export function aimedSolid(
  ship: Ship,
  world: TourWorld,
  plan: TierPlan,
  at: Vec2,
  heading: number,
  range = 40,
): Structure | null {
  const dx = -Math.sin(heading)
  const dz = -Math.cos(heading)

  const standing = planWithout(plan, emptiedOn(world, plan.tier.id, ship), heldSolidIds(world))
  const candidates = [
    ...standing.structures,
    ...detachedOn(ship, world, plan.tier.id).map((held) => held.structure),
  ]
  const outlines = candidates.map(
    (structure) => [structure, structureFootprint(structure)] as const,
  )

  const STEP = 0.4
  for (let travelled = STEP; travelled <= range; travelled += STEP) {
    const point: Vec2 = [at[0] + dx * travelled, at[1] + dz * travelled]
    for (const [structure, outline] of outlines) {
      if (pointInPolygon(point, outline)) return structure
    }
  }
  return null
}

/**
 * The deck as it stands once Nen has been through it.
 *
 * Emptied rooms lose what stands in them — both the solids the renderer raises
 * and the faces the collision test reads, so a swallowed coffin stops being
 * something to walk around at the same moment it stops being something to see.
 */
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

/**
 * Which rooms this deck should draw as emptied.
 *
 * Blinky's rooms always; the isolated room too, but only for an outsider — its
 * occupant keeps the real one until they walk out of it.
 */
export function emptiedOn(world: TourWorld, tierId: string, ship: Ship): string[] {
  const ids = [...world.emptied]
  if (world.isolated && !world.isolated.occupant) ids.push(world.isolated.spaceId)
  return [...new Set(ids)].filter((id) => ship.spaces.get(id)?.tierId === tierId)
}

/**
 * The rooms drawn as aura shells: an outline the hull does not hide, wherever
 * in the ship they are.
 *
 * This is the whole of "no matter where I am" made visible — a doll four decks
 * down keeps its outline, and Emperor Time lights every room at once.
 */
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
  ]
  return [...new Set(ids)].filter((id) => ship.spaces.has(id))
}

/** Eye height inside a room, for the remote eye's camera. */
export function eyeHeightIn(space: Space, ship: Ship): number {
  const tier = ship.tiers.find((candidate) => candidate.id === space.tierId)
  if (!tier) return 1.7
  return tier.elevation + Math.min(2.2, ceilingOf(space, tier) - 0.4)
}

/**
 * Where the hideout doors put someone who steps into one of the pair.
 *
 * Walking past does nothing — this is only ever asked when the visitor has
 * just arrived in a room — and a pair that is only half armed does nothing
 * either. `arrivedFrom` is the room the last crossing delivered them to, so
 * stepping out of one door does not immediately fall back through the other.
 */
export function doorExit(world: TourWorld, spaceId: string | null, arrivedFrom: string | null) {
  if (world.doors.length !== 2 || !spaceId || spaceId === arrivedFrom) return null
  const [a, b] = world.doors
  if (spaceId === a) return b
  if (spaceId === b) return a
  return null
}
