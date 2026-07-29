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
import {
  blocksTheFloor,
  columnWalls,
  deriveDoorways,
  pointInPolygon,
  sealKey,
  structureFootprint,
  structureWalls,
  wallSegments,
} from './geometry'
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
  // On the doors between them.
  'chain-bind',
  'devour',
  'legal-defense',
  'tribunal',
  'heart-vow',
  'contract',
  'desire-trap',
  'snakes',
  'portal',
  'guardian',
  // On the visitor walking through them.
  'enhance',
  'vehicle',
  'projection',
  'transformation',
  'restoration',
  'healing',
  'rhythm',
  'mimicry',
  'melody',
  'predator',
  // On the record the walk keeps of itself.
  'surveillance',
  'future',
  'prophecy',
  'poetry',
  'divination',
  'blood-search',
  'resurrection',
  'curse',
  'arrow',
] as const satisfies readonly HatsuInteractionKind[]

/**
 * The techniques that work on the visitor rather than on the ship.
 *
 * They need nothing to aim at — the target is whoever is walking — so the
 * reticle is not consulted and the index offers nothing. Two of them are the
 * exception and say so in their own branch: the vehicle takes cargo, and
 * Metamorphosen needs a thing to take the shape of.
 */
export const BODY_HATSU_KINDS = new Set<HatsuInteractionKind>([
  'enhance',
  'vehicle',
  'projection',
  'transformation',
  'restoration',
  'healing',
  'rhythm',
  'mimicry',
  'melody',
  'predator',
])

export const worksOnTheBody = (profile: HatsuProfile | null) =>
  Boolean(profile) && BODY_HATSU_KINDS.has(profile!.kind)

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

  /**
   * Rooms whose doorways are shut.
   *
   * Not a flag on the renderer: the doorways of a deck are derived from the
   * walls its rooms share, so a shut room is one the derivation is told to
   * treat as sealed, and the opening stops being drawn and stops being
   * walkable in the same pass. What you cannot see through, you cannot cross.
   */
  shut: string[]
  /** Rooms whose guards put an intruder back where they came from. */
  guarded: string[]
  /** The room the visitor may not leave. */
  pinned: string | null
  /** The rule the visitor declared, which only punishes when it is broken. */
  vow: string | null
  /** The terms the visitor took on, which close when they are met. */
  pact: string | null
  /** Rooms the fish are in. Nothing shows until the visitor walks out. */
  devouring: string[]
  /** Cards laid on a room: 1 admitted, 2 restrained, 3 dismissed. */
  cards: Record<string, number>
  /** The double standing in a room, which takes one punishment and is spent. */
  double: string | null
  /** Fugetsu's tunnel: a pair, and how much it has been asked for. */
  worm: { a: string; b: string; crossings: number } | null
  /** The rooms the snakes are loose in, and whether they have had a victim. */
  snakes: { rooms: string[]; fed: boolean } | null
  /** The room the bait was materialized in, which closes once it is taken. */
  trap: string | null
  /** Where the visitor was standing before the room they are in now. */
  cameFrom: string | null

  /**
   * The walk's record of itself: every room set foot in, in order.
   *
   * The last noun, and the only one that is not in the ship at all. The walk
   * has always known where the visitor is; this is what it remembers of where
   * they have been, and what the techniques of the fourth wave read, write and
   * predict. It is kept whether or not anything is watching, because half of
   * them are about being able to look back.
   */
  trail: string[]
  /** The owl, which keeps what the trail would otherwise let go. */
  owl: boolean
  /** Where the ten-second vision says the visitor will be. It does not update. */
  foreseen: { spaceId: string; at: Vec2 } | null
  /** What the automatic writing has set down, newest first. */
  verses: { spaceId: string; lines: number[] }[]
  /** The three rooms of the poem, and how well they read as one. */
  poem: string[]
  /** The room the dial is set to, which it reads a distance off continuously. */
  dial: string | null
  /** Droplets out searching, and how many more arrivals they have left. */
  droplets: { spaceId: string; life: number }[]
  /** Rooms under Cat's Name: kill one and the counterattack answers. */
  ninelives: string[]
  /** The intended victim, and the sacrifice chosen among its own and hidden. */
  curse: { victim: string; sacrifice: string } | null
  /** Pairs of rooms whose identities the arrow exchanged. */
  souls: [string, string][]

  /**
   * What the techniques have made of the visitor themselves.
   *
   * The walk had two nouns — the room and the thing standing in it — and both
   * are out there in the ship. This is the third, and it is the only one on
   * this side of the eye: how fast you go, how tall you stand, how far the
   * aura carries, and whether you are still in your body at all.
   */
  body: TourBody
}

export interface TourBody {
  /** Aura committed to reinforcement: it buys speed and reach. */
  enhance: number
  /** Riding Kurton, and the solids riding with him. Capacity is five. */
  riding: boolean
  passengers: string[]
  /** Eye height in metres, or `null` for the walk's own. */
  eyes: number | null
  /** The sleeping body, left behind while the double goes on. */
  projected: { spaceId: string; at: Vec2 } | null
  /** Bars of the prologue played, which is what the other two pieces run on. */
  dance: number
  /** The solid Metamorphosen has taken the shape of. */
  mimic: string | null
  /** Music holding the senses open against anything that would seal them. */
  soothed: boolean
  /** The holds Predator has correctly named, which is what makes it stronger. */
  deduced: string[]
}

export const RESTING_BODY: TourBody = {
  enhance: 0,
  riding: false,
  passengers: [],
  eyes: null,
  projected: null,
  dance: 0,
  mimic: null,
  soothed: false,
  deduced: [],
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
  shut: [],
  guarded: [],
  pinned: null,
  vow: null,
  pact: null,
  devouring: [],
  cards: {},
  double: null,
  worm: null,
  snakes: null,
  trap: null,
  cameFrom: null,
  trail: [],
  owl: false,
  foreseen: null,
  verses: [],
  poem: [],
  dial: null,
  droplets: [],
  ninelives: [],
  curse: null,
  souls: [],
  body: RESTING_BODY,
}

/** The visitor as the walk was built for: their own legs, their own eyes. */
export const bodyIsRested = (body: TourBody): boolean =>
  !body.enhance &&
  !body.riding &&
  !body.passengers.length &&
  body.eyes === null &&
  !body.projected &&
  !body.dance &&
  !body.mimic &&
  !body.soothed &&
  !body.deduced.length

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
  !world.windup &&
  !world.shut.length &&
  !world.guarded.length &&
  !world.pinned &&
  !world.vow &&
  !world.pact &&
  !world.devouring.length &&
  !Object.keys(world.cards).length &&
  !world.double &&
  !world.worm &&
  !world.snakes &&
  !world.trap &&
  !world.owl &&
  !world.foreseen &&
  !world.verses.length &&
  !world.poem.length &&
  !world.dial &&
  !world.droplets.length &&
  !world.ninelives.length &&
  !world.curse &&
  !world.souls.length &&
  bodyIsRested(world.body)

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
  // On the doors.
  | { kind: 'jailed'; spaceId: string; doors: number }
  | { kind: 'jail-refused'; spaceId: string }
  | { kind: 'fish-loosed'; spaceId: string }
  | { kind: 'fish-fed'; spaceId: string; solidId: string }
  | { kind: 'guards-posted'; spaceId: string }
  | { kind: 'expelled'; spaceId: string; toId: string }
  | { kind: 'card-blue'; spaceId: string }
  | { kind: 'card-yellow'; spaceId: string }
  | { kind: 'card-red'; spaceId: string }
  | { kind: 'vow-declared'; spaceId: string }
  | { kind: 'vow-broken'; spaceId: string }
  | { kind: 'pact-taken'; spaceId: string }
  | { kind: 'pact-met'; spaceId: string; released: number }
  | { kind: 'bait-set'; spaceId: string }
  | { kind: 'trapped'; spaceId: string }
  | { kind: 'held-fast'; spaceId: string }
  | { kind: 'snakes-loosed'; rooms: number }
  | { kind: 'snakes-fed'; spaceId: string }
  | { kind: 'snakes-rebound' }
  | { kind: 'worm-set'; spaceId: string }
  | { kind: 'worm-open'; a: string; b: string }
  | { kind: 'worm-crossed'; spaceId: string; crossings: number }
  | { kind: 'worm-spent' }
  | { kind: 'double-posted'; spaceId: string }
  | { kind: 'double-spent'; spaceId: string }
  // On the visitor.
  | { kind: 'reinforced'; committed: number }
  | { kind: 'boarded'; passengers: number }
  | { kind: 'alighted'; spaceId: string | null; passengers: number }
  | { kind: 'loaded'; solidId: string; passengers: number }
  | { kind: 'hold-full' }
  | { kind: 'projected'; spaceId: string }
  | { kind: 'returned'; spaceId: string }
  | { kind: 'body-disturbed'; spaceId: string }
  | { kind: 'reshaped'; metres: number }
  | { kind: 'rested'; hours: number }
  | { kind: 'mended'; spaceId: string | null; solids: number }
  | { kind: 'dance-played'; bars: number }
  | { kind: 'dance-needed' }
  | { kind: 'mimicked'; solidId: string }
  | { kind: 'unmimicked' }
  | { kind: 'soothed'; opened: boolean }
  | { kind: 'deduced'; what: string; strength: number }
  | { kind: 'nothing-to-deduce' }
  // On the record.
  | { kind: 'owl-attached'; rooms: number }
  | { kind: 'owl-recalled'; rooms: number }
  | { kind: 'foreseen'; spaceId: string }
  | { kind: 'diverged'; spaceId: string; wentTo: string }
  | { kind: 'written'; spaceId: string }
  | { kind: 'line-taken'; spaceId: string; lines: number }
  | { kind: 'poem-read'; strength: number }
  | { kind: 'dial-set'; spaceId: string }
  | { kind: 'dial-read'; spaceId: string; reading: number }
  | { kind: 'droplet-sent'; spaceId: string; left: number }
  | { kind: 'droplets-dry' }
  | { kind: 'droplet-expired'; spaceId: string }
  | { kind: 'name-taken'; spaceId: string }
  | { kind: 'counterattack'; spaceId: string; released: number }
  | { kind: 'marked-victim'; spaceId: string }
  | { kind: 'sacrifice-found'; spaceId: string }
  | { kind: 'curse-fell'; victim: string; sacrifice: string }
  | { kind: 'souls-swapped'; a: string; b: string }
  | { kind: 'arrow-drawn'; spaceId: string }

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
  /** Where the visitor is, so anything Kurton is carrying rides along. */
  carrier?: Vec2,
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
    // Riding: set around the vehicle rather than where it was picked up.
    if (carrier && world.body.passengers.includes(id)) {
      const seat = world.body.passengers.indexOf(id)
      const angle = (seat * Math.PI * 2) / CAPACITY
      structure = {
        ...structure,
        at: [carrier[0] + Math.cos(angle) * 1.6, carrier[1] + Math.sin(angle) * 1.6],
      }
    }
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
  // What is being carried is not something to walk around: it moves with you.
  return detachedOn(ship, world, tierId, seconds)
    .filter(({ structure }) => !world.body.passengers.includes(structure.id))
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

  // Anything aimed at a solid while Kurton is being ridden loads it instead,
  // up to the five he carries: a vehicle passes what it is given to its hold.
  if (world.body.riding && structure && !world.body.passengers.includes(structure.id)) {
    if (world.body.passengers.length >= CAPACITY) {
      return { world, report: { kind: 'hold-full' } }
    }
    const passengers = [...world.body.passengers, structure.id]
    return {
      world: {
        ...withHold(world, structure.id, {}),
        body: { ...world.body, passengers },
      },
      report: { kind: 'loaded', solidId: structure.id, passengers: passengers.length },
    }
  }

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

// ── The body ──────────────────────────────────────────────────────────────
//
// The third noun, and the only one on this side of the eye. Nothing here is
// aimed: the target is whoever is walking.

/** How fast the visitor goes, as a multiplier on the walk's own pace. */
export function paceOf(body: TourBody): number {
  const committed = 1 + body.enhance * 0.35
  // Kurton is fuelled by his passengers: an empty vehicle is barely a vehicle.
  const carried = body.riding ? 1.6 + body.passengers.length * 0.35 : 1
  return committed * carried
}

/** Where the visitor's eyes are, in metres off the floor of the deck. */
export function eyesOf(body: TourBody, standing = 1.7): number {
  if (body.eyes !== null) return body.eyes
  if (body.riding) return standing + 0.9
  return standing
}

/** How far the aura carries down the reticle. */
export const reachOf = (body: TourBody): number => 90 * (1 + body.enhance * 0.4)

/** The five things Kurton can carry, taken from the room he was boarded in. */
export const CAPACITY = 5

/**
 * Whether the visitor goes through walls rather than around them.
 *
 * Two techniques ask for it and mean different things by it — Luini steps
 * through, Hanzo's double was never solid in the first place — but the walk
 * has one answer to give.
 */
export const walksThroughWalls = (world: TourWorld): boolean =>
  world.phasing || Boolean(world.body.projected)

/** Everything the aura is holding, named plainly, for Predator to work through. */
export function holdsInWorld(world: TourWorld): string[] {
  return [
    ...(world.laidOpen ? ['laidOpen'] : []),
    ...(world.isolated ? [`isolated:${world.isolated.spaceId}`] : []),
    ...world.doors.map((id) => `door:${id}`),
    ...world.emptied.map((id) => `emptied:${id}`),
    ...(world.eye ? [`eye:${world.eye}`] : []),
    ...(world.sealed ? [`sealed:${world.sealed}`] : []),
    ...(world.phasing ? ['phasing'] : []),
    ...world.watched.map((doll) => `doll:${doll.spaceId}`),
    ...(world.dowsing ? [`dowsing:${world.dowsing}`] : []),
    ...Object.keys(world.solids).map((id) => `solid:${id}`),
    ...world.shut.map((id) => `shut:${id}`),
    ...world.guarded.map((id) => `guarded:${id}`),
    ...(world.pinned ? [`pinned:${world.pinned}`] : []),
    ...(world.vow ? [`vow:${world.vow}`] : []),
    ...(world.pact ? [`pact:${world.pact}`] : []),
    ...world.devouring.map((id) => `fish:${id}`),
    ...Object.keys(world.cards).map((id) => `card:${id}`),
    ...(world.double ? [`double:${world.double}`] : []),
    ...(world.worm ? [`worm:${world.worm.a}`] : []),
    ...(world.snakes ? ['snakes'] : []),
    ...(world.trap ? [`trap:${world.trap}`] : []),
  ]
}

/**
 * One cast on the visitor themselves.
 *
 * The two that do take a target say so here rather than in the roster: Kurton
 * loads a solid while he is being ridden, and Metamorphosen needs a thing to
 * take the shape of.
 */
function castOnBody(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult {
  const { ship, targetSolidId, standingIn, at } = input
  const body = world.body
  const withBody = (patch: Partial<TourBody>): TourWorld => ({
    ...world,
    body: { ...body, ...patch },
  })

  switch (kind) {
    // Reinforcement in proportion to the aura committed, and it is committed a
    // handful at a time.
    case 'enhance': {
      const committed = Math.min(6, body.enhance + 1)
      return { world: withBody({ enhance: committed }), report: { kind: 'reinforced', committed } }
    }

    // Kurton carries five, and what he carries is what fuels him. Boarding
    // takes the room's own solids up; alighting sets them down where you stop.
    case 'vehicle': {
      if (body.riding) {
        // Aimed at something he is not already carrying, Kurton loads it; aimed
        // at nothing, he sets down what he has and lets the visitor off.
        const aimed = solidById(ship, world, targetSolidId ?? null)
        if (aimed && !body.passengers.includes(aimed.id)) return castOnSolid(world, kind, input)

        const room = standingIn ? ship.spaces.get(standingIn) : null
        const solids = { ...world.solids }
        for (const id of body.passengers) {
          const carried = solidById(ship, world, id)
          if (!carried || !room) continue
          solids[id] = { ...solids[id], at: spawnPointNear(room, at) }
        }
        return {
          world: {
            ...world,
            solids,
            copies: world.copies.map((copy) =>
              body.passengers.includes(copy.id) && room ? { ...copy, spaceId: room.id } : copy,
            ),
            body: { ...body, riding: false, passengers: [] },
          },
          report: { kind: 'alighted', spaceId: standingIn, passengers: body.passengers.length },
        }
      }
      return { world: withBody({ riding: true }), report: { kind: 'boarded', passengers: 0 } }
    }

    // Hanzo leaves the body where it is and goes on without it. The double
    // walks through the ship; the body is a place you have to come back to.
    case 'projection': {
      if (body.projected) {
        return {
          world: withBody({ projected: null }),
          report: { kind: 'returned', spaceId: body.projected.spaceId },
        }
      }
      if (!standingIn) return { world, report: { kind: 'no-target' } }
      return {
        world: withBody({ projected: { spaceId: standingIn, at } }),
        report: { kind: 'projected', spaceId: standingIn },
      }
    }

    // The body changes radically and the identity underneath does not: a child's
    // eyes, the walk's own, and something that sees over the bulkheads.
    case 'transformation': {
      // The walk's own eyes, the girl she goes about as, and what she actually
      // is. Cycling from `null` rather than from a height keeps the visitor's
      // ordinary body first in the ring, where it belongs.
      const cycle: (number | null)[] = [null, 0.95, 3.4]
      const eyes = cycle[(cycle.indexOf(body.eyes) + 1) % cycle.length]
      return { world: withBody({ eyes }), report: { kind: 'reshaped', metres: eyes ?? 1.7 } }
    }

    // Cookie compresses hours of rest into a short treatment. What the walk has
    // to be rested of is the exhaustion its own techniques wrote down: the
    // tunnel that has been asked too often, and the aura committed to force.
    case 'restoration': {
      const hours = 24
      return {
        world: {
          ...world,
          worm: world.worm ? { ...world.worm, crossings: 0 } : null,
          body: { ...body, enhance: 0, dance: 0 },
        },
        report: { kind: 'rested', hours },
      }
    }

    // The chain that heals: what has been crushed, shredded or swallowed in one
    // room is mended, and under Emperor Time the whole ship is.
    case 'healing': {
      const whole = world.laidOpen
      const solids = { ...world.solids }
      let mended = 0
      for (const id of Object.keys(solids)) {
        const hurt = solids[id]
        if (hurt.copyOf) continue
        const room = solidById(ship, world, id)?.spaceId
        if (!whole && room !== standingIn) continue
        if (!hurt.gone && !hurt.squash && !hurt.scale) continue
        delete solids[id]
        mended++
      }
      return {
        world: { ...world, solids },
        report: { kind: 'mended', spaceId: whole ? null : standingIn, solids: mended },
      }
    }

    case 'rhythm': {
      const bars = body.dance + 1
      return { world: withBody({ dance: bars }), report: { kind: 'dance-played', bars } }
    }

    // Metamorphosen runs on the prologue: without the music there is nothing to
    // change shape with.
    case 'mimicry': {
      if (!body.dance) return { world, report: { kind: 'dance-needed' } }
      if (body.mimic) return { world: withBody({ mimic: null, eyes: null }), report: { kind: 'unmimicked' } }
      const shape = solidById(ship, world, targetSolidId ?? null)
      if (!shape) return { world, report: { kind: 'no-solid' } }
      const worn = solidNow(shape, world.solids[shape.id])
      return {
        world: withBody({ mimic: shape.id, eyes: Math.max(0.4, worn.base + worn.height) }),
        report: { kind: 'mimicked', solidId: shape.id },
      }
    }

    // Music carried straight into the listener. What it soothes here is the
    // only thing in the walk that can be done to a sense: it opens the three
    // the monkeys sealed, and holds them open.
    case 'melody': {
      const opened = world.sealed > 0
      return {
        world: { ...world, sealed: 0, body: { ...body, soothed: !body.soothed || opened } },
        report: { kind: 'soothed', opened },
      }
    }

    // Predator gets stronger by correctly naming what it is up against. There
    // is exactly one thing in the walk to be up against: the aura's own holds.
    case 'predator': {
      const unnamed = holdsInWorld(world).find((hold) => !body.deduced.includes(hold))
      if (!unnamed) return { world, report: { kind: 'nothing-to-deduce' } }
      const deduced = [...body.deduced, unnamed]
      return {
        world: withBody({ deduced, enhance: Math.min(6, body.enhance + 1) }),
        report: { kind: 'deduced', what: unnamed, strength: deduced.length },
      }
    }

    default:
      return { world, report: { kind: 'inert' } }
  }
}

/** A clear spot in a room to set something down, near where the visitor is. */
function spawnPointNear(room: Space, at: Vec2): Vec2 {
  return pointInPolygon(at, room.footprint) ? at : centroid(room)
}

// ── The record ────────────────────────────────────────────────────────────
//
// The fourth noun is the only one that is not in the ship: what the walk
// remembers of itself. Half of these techniques read it, the other half write
// to it or predict it, and two of them are about what a room *is* rather than
// where it stands.

/**
 * A room as the walk should name it.
 *
 * Grimmel's arrow exchanges two souls, and the only thing a room has that
 * could be called one is its identity: what it is called, what stands behind
 * that claim, and how strong the claim is. The walls stay where they were —
 * this is not a room that moved, it is a room that woke up as another.
 */
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
  return space
}

/** How the dial reads, from a hundred at the door to nothing across the ship. */
export function dialReading(ship: Ship, world: TourWorld, at: Vec2, standingIn: string | null) {
  const wanted = world.dial ? ship.spaces.get(world.dial) : null
  if (!wanted) return null
  if (standingIn === wanted.id) return { spaceId: wanted.id, reading: 100 }
  const { metres, decks } = distanceTo(ship, wanted, at, standingIn)
  const reading = Math.max(0, Math.round(100 - metres / 1.6 - decks * 12))
  return { spaceId: wanted.id, reading }
}

/**
 * The verse the automatic writing sets down about a room.
 *
 * Numbers rather than text: which of the catalogue's lines were drawn, and the
 * page reads them out in the visitor's own language. Cryptic, but never false —
 * every line is chosen off the room's own record, which is the point of a
 * prophecy that has to come true.
 */
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
export function unwalked(ship: Ship, world: TourWorld, at: Vec2, standingIn: string | null) {
  return [...ship.spaces.values()]
    .filter((space) => !world.trail.includes(space.id))
    .map((space) => ({ space, ...distanceTo(ship, space, at, standingIn) }))
    .sort((a, b) => a.metres + a.decks * 40 - (b.metres + b.decks * 40))
}

/**
 * Where the visitor will be in ten seconds if they carry on as they are.
 *
 * The prediction is taken once and never revised, which is the whole of the
 * technique: everyone else goes on seeing it even when the real walk diverges.
 */
export function tenSecondsOn(
  ship: Ship,
  world: TourWorld,
  tierId: string,
  at: Vec2,
  heading: number,
): { spaceId: string; at: Vec2 } | null {
  const plan = ship.plans.get(tierId)
  if (!plan) return null
  const reach = 6 * paceOf(world.body) * 10
  const ahead: Vec2 = [at[0] - Math.sin(heading) * reach, at[1] - Math.cos(heading) * reach]
  const landing = plan.spaces.find((space) => pointInPolygon(ahead, space.footprint))
  const here = plan.spaces.find((space) => pointInPolygon(at, space.footprint))
  const space = landing ?? here
  return space ? { spaceId: space.id, at: landing ? ahead : at } : null
}

/**
 * Runs one cast against the world and returns the next one.
 *
 * Pure, and total: an unhandled kind reports `inert` rather than throwing, so a
 * technique picked from the dock can never break the walk.
 *
 * The cast itself is `runCast`; this is where Cat's Name gets to answer it,
 * because a counterattack is by definition something that happens *because* of
 * what another technique just did.
 */
export function castInTour(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult {
  return answerForTheCat(world, runCast(world, kind, input))
}

/**
 * A room under Cat's Name that is killed strikes back at whoever killed it.
 *
 * Only direct death counts: emptying a room or chaining it shut is a killing,
 * and everything short of that — moving what stands in it, watching it,
 * walking through its walls — passes the ability by, exactly as refusing to
 * kill does. What the counterattack takes is everything the aura was holding.
 */
function answerForTheCat(before: TourWorld, result: TourCastResult): TourCastResult {
  const killed = before.ninelives.find(
    (id) =>
      (result.world.emptied.includes(id) && !before.emptied.includes(id)) ||
      (result.world.shut.includes(id) && !before.shut.includes(id)),
  )
  if (!killed) return result

  const released = holdsInWorld(before).length
  return {
    world: {
      ...EMPTY_WORLD,
      // What the walk remembers of itself is not a hold, and is not taken.
      trail: result.world.trail,
      cameFrom: result.world.cameFrom,
    },
    report: { kind: 'counterattack', spaceId: killed, released },
  }
}

function runCast(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult {
  const { ship, targetId, standingIn, at } = input

  // The sleeping body has to be somewhere the walk still leaves alone. Shut it,
  // guard it or empty it and Hanzo is pulled back into it, whatever he was in
  // the middle of.
  if (world.body.projected) {
    const where = world.body.projected.spaceId
    const disturbed =
      world.shut.includes(where) || world.guarded.includes(where) || world.emptied.includes(where)
    if (disturbed) {
      return {
        world: { ...world, body: { ...world.body, projected: null } },
        travelTo: where,
        report: { kind: 'body-disturbed', spaceId: where },
      }
    }
  }

  if (BODY_HATSU_KINDS.has(kind)) return castOnBody(world, kind, input)
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

    // ── The doors ────────────────────────────────────────────────────────
    //
    // A shut room is not a room with a locked door drawn on it: the deck's
    // doorways are derived from the walls its rooms share, and these tell the
    // derivation to treat those walls as blind. The opening stops being drawn
    // and stops being walkable in the same pass.

    // Chain Jail is absolute, and it is only ever used on a Spider. In the
    // walk the Spider is the technique: a room nothing is holding is a room
    // Kurapika has no business chaining, and the chain refuses it.
    case 'chain-bind': {
      if (!nenHeld(world).includes(target.id) && !world.emptied.includes(target.id)) {
        return { world, report: { kind: 'jail-refused', spaceId: target.id } }
      }
      const doors = ship.adjacency.get(target.id)?.length ?? 0
      return {
        world: { ...world, shut: [...new Set([...world.shut, target.id])] },
        report: { kind: 'jailed', spaceId: target.id, doors },
      }
    }

    // The fish only eat inside a closed room, and the victim feels nothing
    // while it lasts: nothing is taken until the visitor walks out again.
    case 'devour': {
      if (!world.shut.includes(target.id)) {
        return { world, report: { kind: 'jail-refused', spaceId: target.id } }
      }
      return {
        world: { ...world, devouring: [...new Set([...world.devouring, target.id])] },
        report: { kind: 'fish-loosed', spaceId: target.id },
      }
    }

    case 'legal-defense':
      return {
        world: { ...world, guarded: [...new Set([...world.guarded, target.id])] },
        report: { kind: 'guards-posted', spaceId: target.id },
      }

    // Blue admits, yellow restrains — and the restraint is only ever applied
    // to someone already warned — red dismisses and shuts the room behind them.
    case 'tribunal': {
      const card = Math.min(3, (world.cards[target.id] ?? 0) + 1)
      const cards = { ...world.cards, [target.id]: card }
      if (card === 1) return { world: { ...world, cards }, report: { kind: 'card-blue', spaceId: target.id } }
      if (card === 2) {
        return {
          world: { ...world, cards, pinned: standingIn === target.id ? target.id : world.pinned },
          report: { kind: 'card-yellow', spaceId: target.id },
        }
      }
      return {
        world: {
          ...world,
          cards,
          pinned: world.pinned === target.id ? null : world.pinned,
          shut: [...new Set([...world.shut, target.id])],
          guarded: [...new Set([...world.guarded, target.id])],
        },
        report: { kind: 'card-red', spaceId: target.id },
      }
    }

    // The chain through the heart does nothing at all until the rule it names
    // is knowingly broken. Declaring it is the whole of the cast.
    case 'heart-vow':
      return { world: { ...world, vow: target.id }, report: { kind: 'vow-declared', spaceId: target.id } }

    case 'contract':
      return { world: { ...world, pact: target.id }, report: { kind: 'pact-taken', spaceId: target.id } }

    // The bait is what the victim wanted: a copy of something out of the room
    // they are standing in, stood in the trap. Coercion comes after it is taken.
    case 'desire-trap': {
      const wanted = ship.structures.find((solid) => solid.spaceId === standingIn)
      const copies = wanted
        ? [
            ...world.copies,
            {
              ...wanted,
              id: `${wanted.id}::bait${world.copies.length + 1}`,
              spaceId: target.id,
              at: centroid(target),
            },
          ]
        : world.copies
      const solids = wanted
        ? { ...world.solids, [copies[copies.length - 1].id]: { copyOf: wanted.id } }
        : world.solids
      return {
        world: { ...world, copies, solids, trap: target.id },
        report: { kind: 'bait-set', spaceId: target.id },
      }
    }

    // Ten rooms in range, four snakes, and a curse that comes back on the user
    // if it is dismissed without a victim.
    case 'snakes': {
      const here = standingIn ? ship.spaces.get(standingIn) : null
      const rooms = [...ship.spaces.values()]
        .filter((space) => space.tierId === (here?.tierId ?? target.tierId))
        .map((space) => ({ space, distance: distanceTo(ship, space, at, standingIn).metres }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10)
        .map((near) => near.space.id)
      return {
        world: { ...world, snakes: { rooms, fed: false } },
        report: { kind: 'snakes-loosed', rooms: rooms.length },
      }
    }

    // The tunnel works once a night. Asking it again is what exhausts it.
    case 'portal': {
      if (!world.worm) {
        return { world: { ...world, worm: { a: target.id, b: '', crossings: 0 } }, report: { kind: 'worm-set', spaceId: target.id } }
      }
      if (!world.worm.b) {
        const worm = { ...world.worm, b: target.id }
        return { world: { ...world, worm }, report: { kind: 'worm-open', a: worm.a, b: worm.b } }
      }
      return { world: { ...world, worm: { a: target.id, b: '', crossings: 0 } }, report: { kind: 'worm-set', spaceId: target.id } }
    }

    case 'guardian':
      return { world: { ...world, double: target.id }, report: { kind: 'double-posted', spaceId: target.id } }

    // ── The record ───────────────────────────────────────────────────────

    // The owl retains what was recorded earlier, for later review. The trail
    // is kept either way; what the owl adds is that you can look back at it,
    // and that it holds the rooms open through the hull while it does.
    case 'surveillance':
      return world.owl
        ? { world: { ...world, owl: false }, report: { kind: 'owl-recalled', rooms: world.trail.length } }
        : { world: { ...world, owl: true }, report: { kind: 'owl-attached', rooms: world.trail.length } }

    // Ten seconds on, taken once. The vision does not revise itself: that is
    // what makes diverging from it worth anything.
    case 'future': {
      const seen = tenSecondsOn(ship, world, target.tierId, at, input.heading ?? 0)
      if (!seen) return { world, report: { kind: 'no-target' } }
      return { world: { ...world, foreseen: seen }, report: { kind: 'foreseen', spaceId: seen.spaceId } }
    }

    case 'prophecy': {
      const verses = [
        { spaceId: target.id, lines: verseFor(ship, identityOf(ship, world, target)) },
        ...world.verses.filter((verse) => verse.spaceId !== target.id),
      ].slice(0, 6)
      return { world: { ...world, verses }, report: { kind: 'written', spaceId: target.id } }
    }

    // Three lines make the poem, and the poem is only as strong as the three
    // read together: rooms that actually adjoin carry it.
    case 'poetry': {
      if (world.poem.length >= 3) {
        return { world: { ...world, poem: [target.id] }, report: { kind: 'line-taken', spaceId: target.id, lines: 1 } }
      }
      const poem = [...new Set([...world.poem, target.id])]
      if (poem.length < 3) {
        return { world: { ...world, poem }, report: { kind: 'line-taken', spaceId: target.id, lines: poem.length } }
      }
      const strength = poem.reduce(
        (total, room, index) =>
          total + (ship.adjacency.get(room)?.includes(poem[(index + 1) % poem.length]) ? 1 : 0),
        0,
      )
      return { world: { ...world, poem }, report: { kind: 'poem-read', strength } }
    }

    case 'divination': {
      const reading = dialReading(ship, { ...world, dial: target.id }, at, standingIn)
      return {
        world: { ...world, dial: target.id },
        report: reading
          ? { kind: 'dial-read', spaceId: target.id, reading: reading.reading }
          : { kind: 'dial-set', spaceId: target.id },
      }
    }

    // Her own blood and nothing else: each droplet goes and finds the nearest
    // room the walk has never set foot in, and expires a few arrivals later.
    case 'blood-search': {
      const found = unwalked(ship, world, at, standingIn)[0]
      if (!found) return { world, report: { kind: 'droplets-dry' } }
      const droplets = [
        { spaceId: found.space.id, life: 3 },
        ...world.droplets.filter((drop) => drop.spaceId !== found.space.id),
      ].slice(0, 4)
      return {
        world: { ...world, droplets },
        report: { kind: 'droplet-sent', spaceId: found.space.id, left: found.metres },
      }
    }

    case 'resurrection':
      return {
        world: { ...world, ninelives: [...new Set([...world.ninelives, target.id])] },
        report: { kind: 'name-taken', spaceId: target.id },
      }

    // The victim is chosen openly and the sacrifice is chosen among its own and
    // hidden. Emperor Time is the Gyo that finds it.
    case 'curse': {
      const own = ship.adjacency.get(target.id) ?? []
      const sacrifice = own[target.id.length % Math.max(1, own.length)] ?? target.id
      return {
        world: { ...world, curse: { victim: target.id, sacrifice } },
        report: { kind: 'marked-victim', spaceId: target.id },
      }
    }

    // The arrow pierces every defence, so it is not refused by a shut or an
    // isolated room, and what it exchanges is what a room is.
    case 'arrow': {
      if (!world.pairing) {
        return { world: { ...world, pairing: target.id }, report: { kind: 'arrow-drawn', spaceId: target.id } }
      }
      const first = world.pairing
      if (first === target.id) return { world, report: { kind: 'arrow-drawn', spaceId: target.id } }
      return {
        world: { ...world, pairing: null, souls: [...world.souls, [first, target.id]] },
        report: { kind: 'souls-swapped', a: first, b: target.id },
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
 * The deck with a room's doorways shut.
 *
 * The reconstruction derives its doorways from the walls two rooms share, and
 * takes a list of pairs to treat as blind — which is exactly what a technique
 * that shuts a room needs. So this is not a lock drawn over an opening: it is
 * the same derivation, told that these walls have no door in them, and the
 * opening stops being drawn and stops being walkable in one pass.
 *
 * A stairwell is not a doorway and is not closed by this. That is deliberate:
 * `linkUnderfoot` is what offers a stair, and the walk refuses that separately
 * for a room that is shut.
 */
export function planSealed(ship: Ship, plan: TierPlan, shut: readonly string[]): TierPlan {
  const closed = new Set(shut.filter((id) => ship.spaces.get(id)?.tierId === plan.tier.id))
  if (!closed.size) return plan

  const sealed = new Set([
    ...ship.seals.map((seal) => sealKey(seal.a, seal.b)),
    ...plan.doorways
      .filter((door) => closed.has(door.a) || closed.has(door.b))
      .map((door) => sealKey(door.a, door.b)),
  ])
  // A declared door would re-open the wall the seal just closed, so the ones
  // into a shut room are dropped with it.
  const overrides = new Map(
    ship.doors
      .filter((door) => !closed.has(door.a) && !closed.has(door.b))
      .map((door) => [sealKey(door.a, door.b), door] as const),
  )

  const doorways = deriveDoorways(plan.spaces, { sealed, overrides })
  const walls = plan.spaces.flatMap((space) => wallSegments(space, doorways))
  for (const [spaceId, centres] of plan.columns) {
    for (const centre of centres) walls.push(...columnWalls(spaceId, centre))
  }
  for (const structure of plan.structures) {
    if (blocksTheFloor(structure)) walls.push(...structureWalls(structure))
  }
  return { ...plan, doorways, walls }
}

/**
 * The deck as the visitor actually meets it: shut, emptied, and with whatever
 * the aura is holding lifted out of it.
 *
 * One place, so the renderer and the collision test cannot end up reading two
 * different ships.
 */
export function walkedPlan(ship: Ship, world: TourWorld, tierId: string): TierPlan {
  const plan = ship.plans.get(tierId)
  if (!plan) throw new Error(`no plan for ${tierId}`)
  return planWithout(
    planSealed(ship, plan, world.shut),
    emptiedOn(world, tierId, ship),
    heldSolidIds(world),
  )
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
    // The record, drawn where it happened: what the owl kept, what was
    // foreseen, what the poem strung together, what the droplets found.
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

/** Eye height inside a room, for the remote eye's camera. */
export function eyeHeightIn(space: Space, ship: Ship): number {
  const tier = ship.tiers.find((candidate) => candidate.id === space.tierId)
  if (!tier) return 1.7
  return tier.elevation + Math.min(2.2, ceilingOf(space, tier) - 0.4)
}

/**
 * What happens because the visitor set foot somewhere.
 *
 * Every technique in the third wave is about a threshold rather than about a
 * room, so none of them does anything at the moment it is cast: the guards are
 * posted, the rule is declared, the fish are loosed, and then the walk goes on
 * as before until someone crosses a line. This is that crossing, in one place,
 * so the page has no rules of its own to keep in step.
 */
export interface TourArrival {
  world: TourWorld
  /** Where the walk has to put the visitor instead, if anywhere. */
  travelTo?: string
  report?: TourReport
  /** Whether the archive's own penalty — forced Zetsu — has been incurred. */
  punished?: boolean
}

export function arriveInTour(world: TourWorld, ship: Ship, spaceId: string | null): TourArrival {
  const leaving = world.cameFrom
  if (spaceId === leaving) return { world }

  let next: TourWorld = { ...world, cameFrom: spaceId }
  let report: TourReport | undefined
  let travelTo: string | undefined
  let punished = false

  /** The double takes one punishment and is spent doing it. */
  const intercept = () => {
    if (!next.double) return false
    report = { kind: 'double-spent', spaceId: next.double }
    next = { ...next, double: null }
    return true
  }

  // What was left behind, before what was entered.
  if (leaving && next.devouring.includes(leaving)) {
    const eaten = ship.structures.find(
      (solid) => solid.spaceId === leaving && !next.solids[solid.id]?.gone,
    )
    if (eaten) {
      next = { ...next, solids: { ...next.solids, [eaten.id]: { ...next.solids[eaten.id], gone: true } } }
      report = { kind: 'fish-fed', spaceId: leaving, solidId: eaten.id }
    }
  }

  // Held fast: the yellow card, and the trap that has already closed.
  const heldIn = next.pinned ?? (leaving && next.cards[leaving] === 2 ? leaving : null)
  if (heldIn && leaving === heldIn && spaceId !== heldIn && !intercept()) {
    return {
      world: { ...world, cameFrom: heldIn },
      travelTo: heldIn,
      report: { kind: 'held-fast', spaceId: heldIn },
    }
  }

  if (!spaceId) return { world: next, report, travelTo, punished }

  // The walk remembers where it has been, watched or not.
  next = { ...next, trail: [...next.trail, spaceId].slice(-200) }

  // A droplet lasts a few arrivals and then dries up.
  if (next.droplets.length) {
    const aged = next.droplets.map((drop) => ({ ...drop, life: drop.life - 1 }))
    const spent = aged.find((drop) => drop.life <= 0)
    next = { ...next, droplets: aged.filter((drop) => drop.life > 0) }
    if (spent) report = { kind: 'droplet-expired', spaceId: spent.spaceId }
  }

  // The poem is a route: stepping into one of its three lines carries you to
  // the next, and it carries better the better the three read together.
  const line = next.poem.indexOf(spaceId)
  if (next.poem.length === 3 && line >= 0 && spaceId !== leaving) {
    const onward = next.poem[(line + 1) % 3]
    if (onward !== leaving) {
      return { world: { ...next, cameFrom: onward }, travelTo: onward, report }
    }
  }

  // The sacrifice was chosen among the victim's own and hidden. Walking into
  // it is what spends it.
  if (next.curse && spaceId === next.curse.sacrifice) {
    const victim = next.curse.victim
    return {
      world: {
        ...next,
        curse: null,
        emptied: [...new Set([...next.emptied, victim])],
      },
      report: { kind: 'curse-fell', victim, sacrifice: spaceId },
    }
  }

  if (next.watched.some((doll) => doll.spaceId === spaceId)) {
    next = {
      ...next,
      watched: next.watched.map((doll) =>
        doll.spaceId === spaceId ? { ...doll, visits: doll.visits + 1 } : doll,
      ),
    }
  }
  if (next.isolated?.occupant && next.isolated.spaceId !== spaceId) {
    next = { ...next, isolated: { ...next.isolated, occupant: false } }
  }

  // The bait has been taken, so the coercion starts.
  if (next.trap === spaceId) {
    next = { ...next, trap: null, pinned: spaceId }
    report = { kind: 'trapped', spaceId }
  }

  // The terms are met, and a contract that closes releases what it was
  // weighed against: every door another technique had shut.
  if (next.pact === spaceId) {
    const released = next.shut.length + next.guarded.length
    next = { ...next, pact: null, shut: [], guarded: [], cards: {} }
    report = { kind: 'pact-met', spaceId, released }
  }

  if (next.snakes && !next.snakes.fed && next.snakes.rooms.includes(spaceId)) {
    next = { ...next, snakes: { ...next.snakes, fed: true } }
    report = { kind: 'snakes-fed', spaceId }
  }

  // The guards expel an intruder without injuring them: back where they came
  // from, and no further.
  if (next.guarded.includes(spaceId) && leaving && leaving !== spaceId) {
    if (!intercept()) {
      return {
        world: { ...next, cameFrom: leaving },
        travelTo: leaving,
        report: { kind: 'expelled', spaceId, toId: leaving },
      }
    }
  }

  // The chain only ever punishes a rule that was knowingly broken.
  if (next.vow === spaceId) {
    if (!intercept()) {
      punished = true
      report = { kind: 'vow-broken', spaceId }
    }
  }

  return { world: next, travelTo, report, punished }
}

/**
 * Where Fugetsu's tunnel puts someone who steps into one of its two ends.
 *
 * Unlike the hideout doors it wears out: the route is meant to be walked once
 * a night, and asking it again and again is what exhausts the worm. The third
 * crossing is the last, and the pair collapses behind it.
 */
export function wormExit(
  world: TourWorld,
  spaceId: string | null,
  arrivedFrom: string | null,
): { to: string; world: TourWorld; report: TourReport } | null {
  const worm = world.worm
  if (!worm?.b || !spaceId || spaceId === arrivedFrom) return null
  const to = spaceId === worm.a ? worm.b : spaceId === worm.b ? worm.a : null
  if (!to) return null

  const crossings = worm.crossings + 1
  if (crossings >= 3) {
    return { to, world: { ...world, worm: null }, report: { kind: 'worm-spent' } }
  }
  return {
    to,
    world: { ...world, worm: { ...worm, crossings } },
    report: { kind: 'worm-crossed', spaceId: to, crossings },
  }
}

/**
 * Whether a stairwell may be taken from where the visitor stands.
 *
 * A shut room is shut: its doorways are gone from the geometry, and the stair
 * out of it has to be refused separately, since a link carries its own
 * position and no wall stands between the visitor and it.
 */
export const linkIsOpen = (world: TourWorld, spaceId: string | null): boolean =>
  !spaceId || (!world.shut.includes(spaceId) && world.pinned !== spaceId)

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
