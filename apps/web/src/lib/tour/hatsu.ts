import type { RoomCast } from "./cast/types";
import { castOnTechniques, BOOK_HATSU_KINDS, pullBackTheBody, castWithoutARoom, stripTheRoom, orderThePuppets,  } from "./cast/techniques";
import { solidById, onFloorOf, strandTension, solidNow, heldSolidIds, SNAKE_ARMS, boundSolidIds, wanderOffset, toolFor, HAMMERED_SQUASH, looseTheFlock, calledUp, standingIn, settleTheRoom, FLOCK_BIRDS } from "./cast/beasts";
import { solidById, onFloorOf, strandTension, solidNow, heldSolidIds, SNAKE_ARMS, boundSolidIds, wanderOffset, toolFor, HAMMERED_SQUASH, looseTheFlock, calledUp, standingIn, settleTheRoom, FLOCK_BIRDS, detachedOn, withHold, dropHold, clearanceOf, VISITOR_CLEARANCE, shove } from "./cast/solids";
export * from './cast/types'
export * from "./cast/solids";
export * from "./cast/beasts";
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
import type { Polygon, Space, Structure, Vec2,  } from './types'
import type { HatsuInteractionKind, HatsuProfile } from '$lib/nen/hatsuRegistry'
import { acceptsFamily } from '$lib/nen/targeting'
import { SOLID_CASTS, castOnSolid } from "./cast/solids";
import { BODY_CASTS, castOnBody, paceOf, eyesOf } from "./cast/body";
import { BODY_KINDS } from './bodyKinds'
// The shapes the walk casts on live in `cast/types.ts`; line 1 re-exports them
// for everyone who reads them off `hatsu`, and this brings them into scope for
// the reducers below, which is a different thing and needs saying separately.
import {
  
  DOUBLE_MODES,
  
  EYE_MODES,
  OWL_MODES,
  type Aim,
    type Doors,
  type DoorOptions,
  type Heading,
      type Mark,
  type Perch,
  type Played,
  type Ray,
  type Scene,
  type SolidHold,
  type Stood,
  type TourBody,
  type TourBook,
  type TourCastInput,
  type TourCastResult,
  type TourDoubleMode,
  type TourEyeMode,
  type TourOwlMode,
  type TourReport,
  type TourWorld,
  type VowState,
} from './cast/types'
import { aimGum, gumLanding, gumTension } from './gum'
import { punchRuns } from './punch'
import { nextForgery } from './texture'

/**
 * The techniques that have something to take hold of in a reconstruction.
 *
 * The archive holds eighty-two, and most of them work on what a page *says*:
 * they seal a control, forge a heading, read a chapter that has not happened
 * yet. The walk has none of that — it has rooms, walls, doors, distance, a
 * visitor and the punishments it deals them — so a technique is carried across
 * only when one of those is what it is actually about. The rest stay inert here
 * and say so, which is honest: a technique that quietly did nothing would be
 * worse than one that tells you the walk is the wrong ground for it.
 */
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
  'puppet',
  'impact',
  'barrage',
  'windup',
  'staff',
  'serpent',
  'remote-strike',
  'stitch',
  'animate',
  'shred',
  'weapon-body',
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
  // The Guardian Spirit Beasts, which are a body in the room rather than an
  // effect on it. Everything else in this list is something done to the ship;
  // these two are something that turns up in it and then does something — so
  // what the walk had to learn for them is how to put an animal in a room and
  // let it act on its own. Camilla's raises everything standing there off the
  // deck; Zhang Lei's mints a coin and waits to see whether anyone takes it;
  // Tserriednich's marks one thing three times, and the third is the one there
  // is no coming back from; Tubeppa's fills the room with what it synthesized.
  'coercive-beast',
  'coin-growth',
  'lie-marks',
  'drug-synthesis',
  'aura-levy',
  'diffusive-smoke',
  'solicitation',
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
  'pain-armour',
  'sun-flare',
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
  // On the techniques themselves.
  'theft',
  'bookmark',
  'capture',
  'inherit',
  'chain-rule',
  'ability-loan',
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
  'puppet',
  // Feitan's pair is on this side of the eye too: the wrapping is worn, and the
  // sun is the visitor. Neither is aimed — the burst goes out from where they
  // stand, which is the only place the heat could come from.
  'pain-armour',
  'sun-flare',
  // Tyson's eye-wog attaches to a reader, not to a room: it comes up in front
  // of whoever is walking, takes what they have committed, and gives it back as
  // light. What it lights is the room they happen to be standing in, which is
  // read rather than aimed at — an eye-wog does not have to be pointed at the
  // dark to know it is in it.
  'aura-levy',
  'elastic', // Cast without target acts as Propulsion or Faux Tissu
  'heart-vow', // Cast on another person, or on the visitor themselves.
  'flock', // Cast without target asks the birds to survey, and is refused.
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
  'vacuum',
  'elastic',
  'disguise',
  'pocket',
  'command',
  'clone',
  'puppet',
  'impact',
  'barrage',
  'windup',
  'staff',
  'serpent',
  'remote-strike',
  'stitch',
  'animate',
  'shred',
  'weapon-body',
  'growth',
  'polarity',
  'identity-swap',
  'relay',
  // The chain has a ball on the end of it and the ball is swung: what it is
  // aimed at is a thing, and the room it points at is what it does with a
  // reticle that has nothing in it.
  'dowsing',
  // Tserriednich's beast is sent at one thing and marks that thing: a curse
  // that escalates on a target has to have a target to escalate on, and a room
  // cannot be caught in a second lie.
  'lie-marks',
])

/**
 * The three that are on both sides of the line, and let the reticle decide.
 *
 * Elastic Love is worn until something is aimed at, and the Dowsing Chain
 * strikes whatever is down the reticle and falls back to pointing at the room
 * when there is nothing there to strike. Black Voice is the needle: put it in a
 * thing and the visitor walks as that thing; put it in themselves and they walk
 * blind for ten seconds. Everything else in `SOLID_HATSU_KINDS` takes a thing
 * and only a thing.
 */
const EITHER_TARGET = new Set<HatsuInteractionKind>(['elastic', 'dowsing', 'puppet', 'flock'])

/**
 * The two of `EITHER_TARGET` whose other target is a *room* rather than a solid.
 *
 * Dowsing and the puppet strings are aimed at a thing under the reticle, so an
 * empty solid is enough to send them to the body. Bungee Gum is aimed at either
 * and Bird Manipulation only ever at a room — so for these, an aimed room has
 * to count as aimed too, or the self-cast would swallow every cast made while
 * standing anywhere.
 */
const ROOM_OR_BODY = new Set<HatsuInteractionKind>(['elastic', 'flock'])

export const aimsAtSolids = (profile: HatsuProfile | null) =>
  Boolean(profile) && SOLID_HATSU_KINDS.has(profile!.kind)

export type TourHatsuKind = (typeof TOUR_HATSU_KINDS)[number]

/**
 * Everything the walk performs: what acts on the ship, and what acts on the
 * people standing in it.
 *
 * The second list arrives from a leaf module rather than being written out
 * again here (ADR-004 §2.5): five of its kinds are techniques the walk could
 * not carry until it had bodies to aim them at, and the dock has to offer them
 * or they would remain unreachable from the one surface that can now perform
 * them. What they do to a body is decided in `cast/reach.ts`; this line only
 * says that they are no longer inert.
 */
const TOUR_KINDS = new Set<HatsuInteractionKind>([...TOUR_HATSU_KINDS, ...BODY_KINDS])

export function worksInTour(profile: HatsuProfile | null): profile is HatsuProfile {
  return Boolean(profile) && TOUR_KINDS.has(profile!.kind)
}

/** How the visitor points at a room: down the reticle, or from the index. */
export type TourAim = 'reticle' | 'index'

/**
 * The three birds Secret Window can send, the three watches Kacho's double can
 * be set to, and the three orders Little Eye's insect takes, each in the order
 * R walks through them.
 *
 * All three are one technique with a manner rather than three techniques: the
 * dock hands the walk a single profile, and R cycles what it is doing. They are
 * listed rather than merely typed so the key has something to walk round.
 *
 * Little Eye's are the module's own verbs — Sayird's sphere is piloted, sent
 * scouting, or told to film — and they are the whole of the ability: the aura
 * costs nothing and does nothing except carry what the insect sees back.
 */

/**
 * The three airs Enchanting Music has, in the order the three keys play them.
 *
 * Melody's whole ability is what a piece does to whoever hears it, and the walk
 * had only the soothing: a technique with a flute in it that never materialized
 * the flute. So the flute is in the hand for as long as the aura is up, and
 * what it plays is a choice made at the moment of playing rather than a mode
 * cycled beforehand — R for the soft air, C for the sharp one, F for the lively
 * one. Each is heard by the room the visitor is standing in and by nothing
 * else, because that is how far a flute carries.
 */

/** Which air is being played, or was last played. */

/** Which bird was sent, which watch the double is under, what the insect is told. */

/** The next of each, wrapping — which is all R has to decide. */
export const nextOwlMode = (mode: TourOwlMode | null): TourOwlMode =>
  OWL_MODES[(OWL_MODES.indexOf(mode ?? 'wander') + 1) % OWL_MODES.length]
export const nextDoubleMode = (mode: TourDoubleMode | null): TourDoubleMode =>
  DOUBLE_MODES[(DOUBLE_MODES.indexOf(mode ?? 'follow') + 1) % DOUBLE_MODES.length]
export const nextEyeMode = (mode: TourEyeMode | null): TourEyeMode =>
  EYE_MODES[(EYE_MODES.indexOf(mode ?? 'pilot') + 1) % EYE_MODES.length]

/**
 * How long one bird holds, in seconds, and how much of it comes back.
 *
 * Secret Window materializes an owl rather than lending you one: it is there
 * for twenty seconds, and what it hands over when it goes is the last ten of
 * what it saw. Both numbers are the technique's own; the walk's clock is the
 * only thing aboard that reads them.
 */
export const OWL_SECONDS = 20
export const OWL_FILM_SECONDS = 10

/** Nothing taken, nothing open, nothing drained. */
export const bookIsShut = (book: TourBook): boolean =>
  !book.pages.length && !book.cards.length && !book.zetsu.length && !book.loan

/** The visitor as the walk was built for: their own legs, their own eyes. */
const BODY_REST_PREDICATES: ((body: TourBody) => boolean)[] = [
  (b) => !b.enhance,
  (b) => !b.riding,
  (b) => !b.passengers.length,
  (b) => b.eyes === null,
  (b) => !b.projected,
  (b) => !b.dance,
  (b) => !b.mimic,
  (b) => !b.soothed,
  (b) => !b.playing,
  (b) => !b.deduced.length,
  (b) => b.packed === null,
  (b) => !b.gilded,
  (b) => !b.halo,
  (b) => !b.vowed,
]

export const bodyIsRested = (body: TourBody): boolean =>
  BODY_REST_PREDICATES.every((pred) => pred(body))

const WORLD_QUIET_PREDICATES: ((world: TourWorld) => boolean)[] = [
  (w) => !w.laidOpen,
  (w) => !w.isolated,
  (w) => !w.doors.length,
  (w) => !w.emptied.length,
  (w) => !w.hoover.length,
  (w) => !w.eye,
  (w) => !w.sealed,
  (w) => !w.phasing,
  (w) => !w.watched.length,
  (w) => !w.dispatches.length,
  (w) => !w.flock,
  (w) => !w.dowsing,
  (w) => !Object.keys(w.solids).length,
  (w) => !w.copies.length,
  (w) => !w.pairing,
  (w) => !w.gum,
  (w) => !w.wound,
  (w) => !w.windup,
  (w) => !w.shut.length,
  (w) => !w.guarded.length,
  (w) => !w.pinned,
  (w) => !Object.keys(w.vows).length,
  (w) => !w.pact,
  (w) => !w.devouring.length,
  (w) => !Object.keys(w.cards).length,
  (w) => !w.double,
  (w) => !w.worm,
  (w) => !w.snakes,
  (w) => !w.trap,
  (w) => !w.owl,
  (w) => !w.stars.length,
  (w) => !w.foreseen,
  (w) => !w.verses.length,
  (w) => !w.poem.length,
  (w) => !w.dial,
  (w) => !w.droplets.length,
  (w) => !w.ninelives.length,
  (w) => !w.curse,
  (w) => !w.souls.length,
  (w) => !w.gumTraps.length,
  (w) => !w.flowered.length,
  (w) => !w.scattered.length,
  (w) => !w.medusa,
  (w) => !w.chimera,
  (w) => !w.wheel,
  (w) => !w.toad,
  (w) => !w.lit.length,
  (w) => !w.centipede,
  (w) => !w.smoke,
  (w) => !w.menagerie.length,
  (w) => !w.dragon,
  (w) => !w.cat,
  (w) => !w.summoned,
  (w) => !Object.values(w.solids).some((hold) => hold.vowed),
  (w) => bookIsShut(w.book),
  (w) => bodyIsRested(w.body),
]

/** Nothing in the world is being held by aura. */
export const worldIsQuiet = (world: TourWorld): boolean =>
  WORLD_QUIET_PREDICATES.every((pred) => pred(world))

/**
 * Everything one cast against a solid works with.
 *
 * Gathered once by `castOnSolid` so the roster below can be flat: every entry
 * takes the same shape, and none of them has to find its target again.
 */
type SolidCastContext = {
  world: TourWorld
  ship: Ship
  /** The solid as the blueprint has it, before anything the aura did to it. */
  structure: Structure
  /** What the aura has already done to it, if anything. */
  hold: SolidHold | undefined
  id: string
  heading: number
  /** A push of `metres` straight away from where the visitor stands. */
  away: (metres: number) => Vec2
  /** Which of The Sun and Moon's two hands cast. Only that one reads it. */
  mark: 'sun' | 'moon'
  /** Where the visitor stands, and in what: the beasts come up beside them. */
  at: Vec2
  standingIn: string | null
}

type SolidCast = (ctx: SolidCastContext) => TourCastResult

/**
 * What each technique does to a solid, one entry per kind.
 *
 * A table rather than one long switch: these eighteen share a target and
 * nothing else, so there is no order between them to read and no state carried
 * from one to the next. A kind with no entry here is inert on a solid.
 */
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
export function dialReading(ship: Ship, world: TourWorld, from: Stood) {
  const { at, standingIn } = from
  const wanted = world.dial ? ship.spaces.get(world.dial) : null
  if (!wanted) return null
  if (standingIn === wanted.id) return { spaceId: wanted.id, reading: 100 }
  const { metres, decks } = distanceTo(ship, wanted, { at, standingIn })
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
export function unwalked(ship: Ship, world: TourWorld, from: Stood) {
  return [...ship.spaces.values()]
    .filter((space) => !world.trail.includes(space.id))
    .map((space) => ({ space, ...distanceTo(ship, space, from) }))
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

export const ROOM_CASTS: Partial<Record<HatsuInteractionKind, RoomCast>> = {
  'door-network': ({ world, target }) => {
    // Two frames and no more. Arming a third starts a new pair rather than
    // opening a network onto everywhere, which is the rule the hideout keeps.
    if (world.doors.length >= 2) {
      return {
        world: { ...world, doors: [target.id] },
        report: { kind: 'doors-rearmed', spaceId: target.id },
      }
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
  },

  // Sayird's sphere, which is the one technique in the walk whose whole body is
  // somewhere else. A cast is read against where the insect already is and what
  // it was last told:
  //
  //   nothing out       → the sphere goes on a host in the room aimed at
  //   aimed elsewhere   → it is flown there, which is the module's `pilot`
  //   aimed at its room → it is called in, or, told to film, it records instead
  //
  // Every room it reaches goes on the film with what was standing in it. A new
  // attachment opens a new film: two flights are not one recording, exactly as
  // the owl has it.
  scout: ({ world, ship, target }) => {
    const frame = frameOf(ship, world, target.id)
    if (world.eye === target.id) {
      if (world.eyeMode === 'film') {
        return {
          world: { ...world, eyeFilm: [...world.eyeFilm, frame] },
          report: { kind: 'eye-filmed', spaceId: target.id, seen: frame.seen },
        }
      }
      return {
        world: { ...world, eye: null },
        report: { kind: 'eye-recalled', rooms: roomsFilmed(world.eyeFilm) },
      }
    }
    if (!world.eye) {
      return {
        world: { ...world, eye: target.id, eyeFilm: [frame] },
        report: { kind: 'eye-sent', spaceId: target.id },
      }
    }
    return {
      world: { ...world, eye: target.id, eyeFilm: [...world.eyeFilm, frame] },
      report: { kind: 'eye-piloted', spaceId: target.id },
    }
  },

  // The chain with nothing down the reticle to hit: it swings, and where it
  // settles is a room and how far off it is. Aim it at a thing instead and it
  // is the whip it also is — see `SOLID_CASTS`.
  dowsing: ({ world, ship, target, at, standingIn }) => {
    const distance = distanceTo(ship, target, { at, standingIn })
    return {
      world: { ...world, dowsing: target.id },
      report: {
        kind: 'dowsed',
        spaceId: target.id,
        distance: distance.metres,
        decks: distance.decks,
      },
    }
  },

  'paper-spy': ({ world, target }) => {
    if (world.watched.some((doll) => doll.spaceId === target.id)) {
      return { world, report: { kind: 'watching', spaceId: target.id } }
    }
    return {
      world: { ...world, watched: [...world.watched, { spaceId: target.id, visits: 0 }] },
      report: { kind: 'watching', spaceId: target.id },
    }
  },

  // Marayam's, which used to be a boundary and nothing else: the room went
  // behind a wall nobody could see and the visitor was left standing outside
  // it. The beast is what actually does that, and it does it the way the
  // drawing has it — it takes you into the room and then it is between you and
  // the door.
  //
  // So the cast delivers rather than describes. The visitor is put inside, which
  // makes them the occupant whatever they were before, and `pinned` is what
  // holds them: the walk's own answer to a room that will not let go, already
  // enforced by `arriveInTour`. Cast again on the room you are shut in and the
  // beast stands down.
  'room-isolation': ({ world, target }) => {
    if (world.dragon === target.id) {
      return {
        world: { ...world, dragon: null, isolated: null, pinned: null },
        report: { kind: 'isolation-lifted', spaceId: target.id },
      }
    }
    return {
      world: {
        ...world,
        isolated: { spaceId: target.id, occupant: true },
        dragon: target.id,
        pinned: target.id,
      },
      travelTo: target.id,
      report: { kind: 'isolated', spaceId: target.id, occupant: true },
    }
  },

  blast: stripTheRoom,

  // ── The doors ────────────────────────────────────────────────────────
  //
  // A shut room is not a room with a locked door drawn on it: the deck's
  // doorways are derived from the walls its rooms share, and these tell the
  // derivation to treat those walls as blind. The opening stops being drawn
  // and stops being walkable in the same pass.

  // Chain Jail is absolute, and it is only ever used on a Spider. In the
  // walk the Spider is the technique: a room nothing is holding is a room
  // Kurapika has no business chaining, and the chain refuses it.
  'chain-bind': ({ world, ship, target }) => {
    if (!nenHeld(world).includes(target.id) && !world.emptied.includes(target.id)) {
      return { world, report: { kind: 'jail-refused', spaceId: target.id } }
    }
    const doors = ship.adjacency.get(target.id)?.length ?? 0
    return {
      world: { ...world, shut: [...new Set([...world.shut, target.id])] },
      report: { kind: 'jailed', spaceId: target.id, doors },
    }
  },

  // The fish only eat inside a closed room, and the room they are loosed in is
  // the room they stay in — which is how the walk keeps that rule. It is not
  // kept by chaining the doorways shut: that takes the openings out of the
  // geometry, and a shoal that arrives and the doors that leave with it reads
  // as fish eating the doors. It is not kept by refusing the cast either, which
  // is what it used to do — in a walk that hands out one aura at a time, a
  // technique that first needs Kurapika's chain can never be used at all.
  devour: ({ world, target }) => ({
    world: { ...world, devouring: [...new Set([...world.devouring, target.id])] },
    report: { kind: 'fish-loosed', spaceId: target.id },
  }),

  'legal-defense': ({ world, target }) => ({
    world: { ...world, guarded: [...new Set([...world.guarded, target.id])] },
    report: { kind: 'guards-posted', spaceId: target.id },
  }),

  // Blue admits, yellow restrains — and the restraint is only ever applied
  // to someone already warned — red dismisses and shuts the room behind them.
  tribunal: ({ world, target, standingIn }) => {
    const card = Math.min(3, (world.cards[target.id] ?? 0) + 1)
    const cards = { ...world.cards, [target.id]: card }
    if (card === 1) {
      return { world: { ...world, cards }, report: { kind: 'card-blue', spaceId: target.id } }
    }
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
  },

  contract: ({ world, target }) => ({
    world: { ...world, pact: target.id },
    report: { kind: 'pact-taken', spaceId: target.id },
  }),

  // The bait is what the victim wanted: a copy of something out of the room
  // they are standing in, stood in the trap. Coercion comes after it is taken.
  'desire-trap': ({ world, ship, target, at, input, standingIn }) => {
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
    // And the beast that closes it. The bait was always the visible half of the
    // technique; this is the half that was missing — it coils in the room it
    // baited and secretes over everything standing there, the copy included,
    // because a trap that spares the bait is a trap with a way out of it.
    for (const solid of [...ship.structures, ...copies]) {
      if (solid.spaceId !== target.id || solids[solid.id]?.gone) continue
      if (solids[solid.id]?.glued === undefined) {
        solids[solid.id] = { ...solids[solid.id], glued: 0 }
      }
    }
    return {
      world: {
        ...world,
        copies,
        solids,
        trap: target.id,
        centipede: target.id,
        summoned: calledUp(standingIn, at, input.heading),
      },
      report: { kind: 'bait-set', spaceId: target.id },
    }
  },

  // Ten rooms in range, four snakes, and a curse that comes back on the user
  // if it is dismissed without a victim.
  snakes: ({ world, ship, target, at, standingIn }) => {
    const here = standingIn ? ship.spaces.get(standingIn) : null
    const rooms = [...ship.spaces.values()]
      .filter((space) => space.tierId === (here?.tierId ?? target.tierId))
      .map((space) => ({ space, distance: distanceTo(ship, space, { at, standingIn }).metres }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
      .map((near) => near.space.id)
    return {
      world: { ...world, snakes: { rooms, fed: false } },
      report: { kind: 'snakes-loosed', rooms: rooms.length },
    }
  },

  // The tunnel works once a night. Asking it again is what exhausts it.
  portal: ({ world, target }) => {
    if (world.worm && !world.worm.b) {
      const worm = { ...world.worm, b: target.id }
      return { world: { ...world, worm }, report: { kind: 'worm-open', a: worm.a, b: worm.b } }
    }
    return {
      world: { ...world, worm: { a: target.id, b: '', crossings: 0 } },
      report: { kind: 'worm-set', spaceId: target.id },
    }
  },

  guardian: ({ world, target }) => ({
    world: { ...world, double: target.id, doubleMode: world.doubleMode ?? 'follow' },
    report: { kind: 'double-posted', spaceId: target.id },
  }),

  // ── The Guardian Spirit Beasts ─────────────────────────────────────────
  //
  // Three animals, and one rule between them: there is one of each, so a cast
  // on the room it is already in puts it down, and a cast anywhere else is that
  // same animal walking there. What each of them does to the room it arrives in
  // is written on the solids standing in it, and what it leaves behind when it
  // goes is exactly as much as the ability says it leaves.

  // Camilla's, which is the whole room at once: it hangs under the deckhead,
  // works its tentacles, and everything standing on the floor stops standing on
  // it. Dismissed, the room settles — the floating was the beast's doing and
  // there is nothing left of it once the beast is not there.
  'coercive-beast': ({ world, ship, target, at, input, standingIn: here }) => {
    const lifted = standingIn(ship, world, target.id).length

    if (world.medusa === target.id) {
      return {
        world: { ...settleTheRoom(world, ship, target.id), medusa: null, summoned: null },
        report: { kind: 'beast-dismissed', spaceId: target.id, solids: lifted },
      }
    }

    // Raised somewhere new: whatever the last room had in the air comes down,
    // because there is one beast and it has left.
    const settled = world.medusa ? settleTheRoom(world, ship, world.medusa) : world
    const solids = { ...settled.solids }
    for (const solid of standingIn(ship, settled, target.id)) {
      solids[solid.id] = { ...solids[solid.id], adrift: true }
    }
    return {
      world: { ...settled, solids, medusa: target.id, summoned: calledUp(here, at, input.heading) },
      report: { kind: 'beast-raised', spaceId: target.id, solids: lifted },
    }
  },

  // Zhang Lei's, which does nothing to the room at all: it hangs there and puts
  // a coin out of its mouth, and whether that is worth anything is entirely a
  // question of whether somebody walks up and takes it. Taking is not a cast —
  // see `takeTheCoin` — so the only two things a cast can do here are raise it
  // and put it down.
  'coin-growth': ({ world, target, at, input, standingIn: here }) => {
    if (world.wheel?.spaceId === target.id) {
      return {
        world: { ...world, wheel: null, summoned: null },
        report: { kind: 'wheel-dismissed', spaceId: target.id },
      }
    }
    // Moved rather than minted afresh: the coin at its mouth is worth what it
    // was worth in the last room, because it is the same wheel and the same
    // day's coin. Only taking one advances the value.
    const coin = world.wheel?.coin ?? 1
    return {
      world: {
        ...world,
        wheel: { spaceId: target.id, coin },
        summoned: calledUp(here, at, input.heading),
      },
      report: { kind: 'wheel-raised', spaceId: target.id, coin },
    }
  },

  // Tubeppa's, which synthesizes and then simply lets it out: the gas fills the
  // room and what is standing in the room goes down in it. The cast only opens
  // the tap — `gasStep` is what actually melts anything, on the walk's clock,
  // so a room left with the beast in it goes on melting after you have walked
  // out of it.
  'drug-synthesis': ({ world, ship, target }) => {
    if (world.toad === target.id) {
      return { world: { ...world, toad: null }, report: { kind: 'gas-lifted', spaceId: target.id } }
    }
    const standing = standingIn(ship, world, target.id)
    const solids = { ...world.solids }
    // Nothing is melted by the cast itself: what it does is start them at
    // stage nought, which is the room having gas in it and nothing yet showing.
    for (const solid of standing) {
      if (!solids[solid.id]?.melting) solids[solid.id] = { ...solids[solid.id], melting: 0 }
    }
    return {
      world: { ...world, solids, toad: target.id },
      report: { kind: 'gas-loosed', spaceId: target.id, solids: standing.length },
    }
  },

  // Salé-salé's, which does nothing to the things in the room and everything to
  // the room: every mouth on it opens, each with its own colour coming out, and
  // the room takes them a part at a time until there is no part of it left to
  // take. Then the mouths close — `smokeStep` is what actually fills it, on the
  // walk's clock, so being full is something that arrives rather than something
  // the cast declares.
  'diffusive-smoke': ({ world, target, at, input, standingIn: here }) => {
    if (world.smoke?.spaceId === target.id) {
      return {
        world: { ...world, smoke: null, summoned: null },
        report: { kind: 'smoke-lifted', spaceId: target.id, filled: world.smoke.filled },
      }
    }
    // One beast: sent to a second room, it starts that room empty. What it had
    // already put into the last one goes with it, because what was filling that
    // room was the mouths and the mouths have left.
    return {
      world: {
        ...world,
        smoke: { spaceId: target.id, filled: 0 },
        summoned: calledUp(here, at, input.heading),
      },
      report: { kind: 'smoke-loosed', spaceId: target.id },
    }
  },

  // Momoze's, which is the odd one of the eight: not an animal but a great
  // many, of every size and shape, and none of them stays where it was put.
  // They are loosed over the rooms nearest the cast — the same reach the snakes
  // take, and for the same reason: a flock spread over three hundred rooms is a
  // flock nobody ever meets — and from there they go through the walls, which
  // is the one thing about them the walk has to be careful to actually draw.
  // Cast again anywhere in their range and they are called back in.
  solicitation: ({ world, ship, at, standingIn }) =>
    looseTheFlock(world, ship, { at, standingIn }) ?? {
      world: { ...world, menagerie: [] },
      report: { kind: 'flock-called-in', rooms: world.menagerie.length },
    },

  // ── The record ─────────────────────────────────────────────────────────

  // The owl retains what was recorded earlier, for later review. The trail
  // is kept either way; what the owl adds is that you can look back at it,
  // and that it holds the rooms open through the hull while it does.
  //
  // It is one bird: attaching it somewhere else moves it rather than making a
  // second. Called back by aiming at the room it is already in, which is the
  // only place it can be recalled from.
  //
  // Where it goes on the way up is the mode's to say, and only the free bird
  // takes the room down the reticle: the shoulder bird is sent to the visitor
  // and stays there, and the third is let go without being aimed at all.
  //
  // Twenty seconds, whichever bird it is, and the last ten of them come back
  // as a film. Calling it in early is still a disappearance: what it managed
  // to record is handed over exactly as it would have been at twenty.
  surveillance: ({ world, ship, target, standingIn, input }) => {
    if (world.owl === target.id) {
      return {
        world: {
          ...world,
          owl: null,
          owlLife: 0,
          owlFilm: lastTenSeconds(world.owlFilm, OWL_SECONDS - world.owlLife),
        },
        report: { kind: 'owl-recalled', rooms: world.trail.length },
      }
    }
    const perch = perchFor(world, ship, {
      targetId: target.id,
      standingIn,
      random: input.random ?? Math.random,
    })
    return {
      world: {
        ...world,
        owl: perch,
        owlLife: OWL_SECONDS,
        // A new bird opens a new film: what the last one brought back has
        // been seen, and two flights are not one recording.
        owlFilm: [{ spaceId: perch, second: 0 }],
      },
      report: { kind: 'owl-attached', rooms: world.trail.length },
    }
  },

  // Ten seconds on, taken once. The vision does not revise itself: that is
  // what makes diverging from it worth anything.
  future: ({ world, ship, target, at, input }) => {
    const seen = tenSecondsOn(ship, world, {
      tierId: target.tierId,
      at,
      heading: input.heading ?? 0,
    })
    if (!seen) return { world, report: { kind: 'no-target' } }
    return {
      world: { ...world, foreseen: seen },
      report: { kind: 'foreseen', spaceId: seen.spaceId },
    }
  },

  prophecy: ({ world, ship, target }) => {
    const verses = [
      { spaceId: target.id, lines: verseFor(ship, identityOf(ship, world, target)) },
      ...world.verses.filter((verse) => verse.spaceId !== target.id),
    ].slice(0, 6)
    return { world: { ...world, verses }, report: { kind: 'written', spaceId: target.id } }
  },

  // Three lines make the poem, and the poem is only as strong as the three
  // read together: rooms that actually adjoin carry it.
  poetry: ({ world, ship, target }) => {
    if (world.poem.length >= 3) {
      return {
        world: { ...world, poem: [target.id] },
        report: { kind: 'line-taken', spaceId: target.id, lines: 1 },
      }
    }
    const poem = [...new Set([...world.poem, target.id])]
    if (poem.length < 3) {
      return {
        world: { ...world, poem },
        report: { kind: 'line-taken', spaceId: target.id, lines: poem.length },
      }
    }
    const strength = poem.reduce(
      (total, room, index) =>
        total + (ship.adjacency.get(room)?.includes(poem[(index + 1) % poem.length]) ? 1 : 0),
      0,
    )
    return { world: { ...world, poem }, report: { kind: 'poem-read', strength } }
  },

  divination: ({ world, ship, target, at, standingIn }) => {
    const reading = dialReading(ship, { ...world, dial: target.id }, { at, standingIn })
    return {
      world: { ...world, dial: target.id },
      report: reading
        ? { kind: 'dial-read', spaceId: target.id, reading: reading.reading }
        : { kind: 'dial-set', spaceId: target.id },
    }
  },

  // Her own blood and nothing else: each droplet goes and finds the nearest
  // room the walk has never set foot in, and expires a few arrivals later.
  'blood-search': ({ world, ship, at, standingIn }) => {
    const found = unwalked(ship, world, { at, standingIn })[0]
    if (!found) return { world, report: { kind: 'droplets-dry' } }
    const droplets = [
      { spaceId: found.space.id, life: 3 },
      ...world.droplets.filter((drop) => drop.spaceId !== found.space.id),
    ].slice(0, 4)
    return {
      world: { ...world, droplets },
      report: { kind: 'droplet-sent', spaceId: found.space.id, left: found.metres },
    }
  },

  // The name goes on the room, and the cat comes with it. The counterattack is
  // unchanged — kill a room wearing the name and `answerForTheCat` answers —
  // but the waiting is no longer invisible: the animal is in the room, and it
  // breaks the room up a piece at a time while it waits. `catStep` does that,
  // on the walk's clock.
  resurrection: ({ world, target, at, input, standingIn: here }) => ({
    world: {
      ...world,
      ninelives: [...new Set([...world.ninelives, target.id])],
      cat: target.id,
      summoned: calledUp(here, at, input.heading),
    },
    report: { kind: 'name-taken', spaceId: target.id },
  }),

  // The victim is chosen openly and the sacrifice is chosen among its own and
  // hidden. Emperor Time is the Gyo that finds it.
  curse: ({ world, ship, target }) => {
    const own = ship.adjacency.get(target.id) ?? []
    const sacrifice = own[target.id.length % Math.max(1, own.length)] ?? target.id
    return {
      world: { ...world, curse: { victim: target.id, sacrifice } },
      report: { kind: 'marked-victim', spaceId: target.id },
    }
  },

  // The bow is drawn, the arrow is loosed, and the two bodies it names exchange
  // places: the one that shot it and the one it fell on. So the visitor goes
  // where the arrow went, which is what the exchange looks like from inside the
  // head that made it. It pierces every defence, so a shut or isolated room is
  // no reason for it to be refused — and it needs no second cast to pair
  // anything, because the first of the two rooms is wherever the archer stands.
  arrow: ({ world, target, standingIn }) => {
    const from = standingIn ?? world.cameFrom
    if (!from || from === target.id) {
      return { world, report: { kind: 'arrow-drawn', spaceId: target.id } }
    }
    return {
      world: { ...world, pairing: null, souls: [...world.souls, [from, target.id]] },
      report: { kind: 'souls-swapped', a: from, b: target.id },
      travelTo: target.id,
    }
  },

  /**
   * Bird Manipulation, which is two gestures with one key and the reticle
   * decides which.
   *
   * Aimed across the ship, it is what the walk already did: a bird goes to that
   * room and comes back with what the room rests on. Aimed at the room the
   * visitor is standing in, it is ch. 320 — the birds converge on the person
   * who called them, and go on circling her until she sends them off again. So
   * a second call in the same room disperses rather than doubling the flock: a
   * count that climbed every time the key was pressed would be a claim about
   * how many birds Cluck has, and the archive does not give one.
   */
  flock: ({ world, target, standingIn }) => {
    if (standingIn === target.id) {
      if (world.flock?.spaceId === target.id) {
        return {
          world: { ...world, flock: null },
          report: { kind: 'flock-dispersed', spaceId: target.id },
        }
      }
      return {
        world: { ...world, flock: { spaceId: target.id, birds: FLOCK_BIRDS } },
        report: { kind: 'flock-gathered', spaceId: target.id, birds: FLOCK_BIRDS },
      }
    }
    const dispatches = [target.id, ...without(world.dispatches, (id) => id === target.id)].slice(
      0,
      8,
    )
    return { world: { ...world, dispatches }, report: { kind: 'dispatched', spaceId: target.id } }
  },

  elastic: ({ world, target }) => ({
    world: { ...world, gumTraps: [...new Set([...world.gumTraps, target.id])] },
    report: { kind: 'gum-trap-set', spaceId: target.id },
  }),
}

export function runCast(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult {
  const { ship, targetId, standingIn, at } = input

  const pulledBack = pullBackTheBody(world)
  if (pulledBack) return pulledBack

  // The body goes first, because most of what is worn is only ever worn. The
  // ones in `EITHER_TARGET` are the exception: a thing under the reticle takes
  // the cast instead, and the body only gets it when the reticle is empty.
  if (
    BODY_HATSU_KINDS.has(kind) &&
    (!EITHER_TARGET.has(kind) ||
      (!input.targetSolidId && (!ROOM_OR_BODY.has(kind) || !input.targetId)))
  ) {
    return castOnBody(world, kind, input)
  }
  if (SOLID_HATSU_KINDS.has(kind) && (!EITHER_TARGET.has(kind) || input.targetSolidId)) {
    return castOnSolid(world, kind, input)
  }

  const untargeted = castWithoutARoom(world, kind, input)
  if (untargeted) return untargeted

  const target = targetId ? (ship.spaces.get(targetId) ?? null) : null
  if (!target) return { world, report: { kind: 'no-target' } }

  // Steal Chain leaves the room it drained with no aura to reach: nothing
  // touches it again until the book gives the ability back.
  if (world.book.zetsu.includes(target.id) && kind !== 'theft') {
    return { world, report: { kind: 'in-zetsu', spaceId: target.id } }
  }

  if (BOOK_HATSU_KINDS.has(kind)) return castOnTechniques(world, kind, target)

  const cast = acceptsFamily(kind, 'room') ? ROOM_CASTS[kind] : undefined
  if (!cast) return { world, report: { kind: 'inert' } }

  const result = cast({ world, ship, target, input, at, standingIn })
  // Where the aura actually landed in the room, remembered for whatever the
  // technique leaves standing there.
  //
  // A room is a hundred and forty metres of promenade as readily as it is a
  // cabin, and everything the walk hangs in one used to hang at its centroid —
  // which from where the cast was made was as often as not behind a bulkhead,
  // sixty metres off and forty centimetres wide. The technique landed and
  // nothing appeared to have happened. What is kept here is the point down the
  // reticle, so the card is laid where it was aimed.
  return {
    ...result,
    world: {
      ...result.world,
      landed: landingIn(target, { at, heading: input.heading }, result.world.landed),
    },
  }
}

/**
 * The point in a room the aura came down on.
 *
 * Walked along the aim ray rather than measured: the first step that is inside
 * the room's own footprint is where it landed. A cast made from inside the room
 * lands a few paces ahead of the visitor, which is where they were looking; one
 * made from outside it lands at the near edge, which is the part of the room
 * they can see. Falls back to the middle when the ray does not reach — an
 * unaimed cast from the index of rooms has no reticle to read.
 */
function landingIn(
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
  from: Stood,
): { metres: number; decks: number } {
  const { at, standingIn } = from
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
export function aimedSpace(plan: TierPlan, aim: Aim): Space | null {
  const { at, heading, range = 90 } = aim
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
export function aimedSolid(scene: Scene, plan: TierPlan, aim: Aim): Structure | null {
  const { ship, world } = scene
  const { at, heading, range = 40 } = aim
  const dx = -Math.sin(heading)
  const dz = -Math.cos(heading)

  // What Nen is holding moves every frame, so its outline is never cached.
  // There are a handful of those at most, against the hundred and twenty-odd
  // the deck itself stands.
  const targets = bakedTargets(ship, world, plan).concat(
    detachedOn(ship, world, { tierId: plan.tier.id }).map((held) => targetOf(held.structure)),
  )

  let nearest: Structure | null = null
  let distance = Infinity
  for (const target of targets) {
    // Each hit tightens the ray for the ones after it: past the nearest solid
    // found so far, nothing can win.
    const hit = rayReaches(target, { at, dx, dz }, Math.min(range, distance))
    if (hit === null || hit >= distance) continue
    distance = hit
    nearest = target.structure
  }
  return nearest
}

/**
 * A solid's outline with the box around it, so the reticle can dismiss it in
 * four comparisons instead of walking its edges.
 */
interface SolidTarget {
  structure: Structure
  outline: Polygon
  minX: number
  minZ: number
  maxX: number
  maxZ: number
}

function targetOf(structure: Structure): SolidTarget {
  const outline = structureFootprint(structure)
  let minX = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxZ = -Infinity
  for (const [x, z] of outline) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  return { structure, outline, minX, minZ, maxX, maxZ }
}

/**
 * The outlines of everything standing on a deck, kept between frames.
 *
 * `structureFootprint` turns a centre, a size and a rotation into a polygon,
 * and the deck stands a hundred and twenty-four of them. Rebuilding all of them
 * for every poll of the reticle — six times a second, for as long as a
 * technique is up — was the single most expensive thing in the walk. They only
 * change when a technique empties a room or lifts a solid out of the deck, so
 * that is what the key is. Keyed by the plan object as well, so a deck rebuilt
 * from different data never reads a previous deck's outlines.
 */
const bakedTargets = (() => {
  const cache = new WeakMap<TierPlan, { key: string; targets: SolidTarget[] }>()

  return (ship: Ship, world: TourWorld, plan: TierPlan): SolidTarget[] => {
    const emptied = emptiedOn(world, plan.tier.id, ship).slice().sort()
    const held = heldSolidIds(world).slice().sort()
    const key = `${emptied.join(',')}::${held.join(',')}`

    const kept = cache.get(plan)
    if (kept?.key === key) return kept.targets

    const gone = new Set(emptied)
    const lifted = new Set(held)
    const targets = plan.structures
      .filter((structure) => !gone.has(structure.spaceId) && !lifted.has(structure.id))
      .map(targetOf)
    cache.set(plan, { key, targets })
    return targets
  }
})()

/**
 * How far along the ray the solid is, or `null` if the ray misses it.
 *
 * The reticle used to be marched out in steps of 0.4 m and tested against every
 * outline at every step — fourteen thousand point-in-polygon tests for one
 * poll, and a solid narrower than the step could still be walked straight past.
 * This is the segment-against-polygon test that was meant all along: the box
 * rejects nearly everything, and what survives is one crossing test per edge.
 */
function rayReaches(target: SolidTarget, ray: Ray, range: number): number | null {
  const { at, dx, dz } = ray
  let near = 0
  let far = range

  // Slab test, one axis at a time. A ray running parallel to a pair of sides
  // either starts between them or never meets them.
  const slab = (origin: number, direction: number, [low, high]: readonly [number, number]) => {
    if (Math.abs(direction) < 1e-9) return origin >= low && origin <= high
    const first = (low - origin) / direction
    const second = (high - origin) / direction
    near = Math.max(near, Math.min(first, second))
    far = Math.min(far, Math.max(first, second))
    return near <= far
  }
  if (!slab(at[0], dx, [target.minX, target.maxX])) return null
  if (!slab(at[1], dz, [target.minZ, target.maxZ])) return null

  // Standing inside it — under a mezzanine, under a run of ducting — is aiming
  // at it, which is what marching from the first step out already did.
  if (pointInPolygon(at, target.outline)) return 0

  let nearest: number | null = null
  const outline = target.outline
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]
    const b = outline[(i + 1) % outline.length]
    const ex = b[0] - a[0]
    const ez = b[1] - a[1]
    const denominator = dx * ez - dz * ex
    if (Math.abs(denominator) < 1e-9) continue

    const px = a[0] - at[0]
    const pz = a[1] - at[1]
    const along = (px * ez - pz * ex) / denominator
    if (along < 0 || along > range || (nearest !== null && along >= nearest)) continue
    const across = (px * dz - pz * dx) / denominator
    if (across < 0 || across > 1) continue
    nearest = along
  }
  return nearest
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

  /**
   * Pain Packer keeps what would have landed instead of cancelling it: the
   * punishment does not happen, and the count of what it is holding goes up.
   */
  const pack = (spaceId: string) => {
    if (next.body.packed === null) return false
    const packed = next.body.packed + 1
    next = { ...next, body: { ...next.body, packed } }
    report = { kind: 'packed-away', spaceId, packed }
    return true
  }

  /**
   * Who takes the blow, in the order the canon puts them: Kacho's double is a
   * body of its own standing in the way, so it is hit before the wrapping the
   * visitor is wearing ever sees anything.
   */
  const absorb = (spaceId: string) => intercept() || pack(spaceId)

  // What was left behind, before what was entered.
  if (leaving && next.devouring.includes(leaving)) {
    const eaten = ship.structures.find(
      (solid) => solid.spaceId === leaving && !next.solids[solid.id]?.gone,
    )
    if (eaten) {
      next = {
        ...next,
        solids: { ...next.solids, [eaten.id]: { ...next.solids[eaten.id], gone: true } },
      }
      report = { kind: 'fish-fed', spaceId: leaving, solidId: eaten.id }
    }
  }

  // Held fast: the yellow card, and the trap that has already closed.
  const heldIn = next.pinned ?? (leaving && next.cards[leaving] === 2 ? leaving : null)
  if (heldIn && leaving === heldIn && spaceId !== heldIn && !absorb(heldIn)) {
    return {
      world: { ...world, cameFrom: heldIn },
      travelTo: heldIn,
      report: { kind: 'held-fast', spaceId: heldIn },
    }
  }

  if (!spaceId) return { world: next, report, travelTo, punished }

  // The walk remembers where it has been, watched or not.
  next = { ...next, trail: [...next.trail, spaceId].slice(-200) }

  // The shoulder bird is on the visitor rather than on a room, so the room it
  // is recorded in is whichever one they have just walked into. It is the only
  // bird that travels without flying: the free one works its way through the
  // doors on the clock, and the third stays where it was thrown.
  if (next.owl && next.owlMode === 'shoulder' && next.owl !== spaceId) {
    next = { ...next, owl: spaceId, owlFilm: filmed(next, spaceId) }
  }

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

  // A Judgment Chain vow sleeps until its rule is broken. Walking into the room
  // the vow was sworn on is the break, and the heart is pierced unless another
  // punishment takes the blow first.
  for (const vow of Object.values(next.vows)) {
    if (vow.subjectId === 'self' || vow.violated || spaceId !== vow.subjectId) continue
    if (!absorb(spaceId)) {
      const violated = { ...vow, violated: true }
      next = {
        ...next,
        vows: { ...next.vows, [vow.subjectId]: violated },
      }
      report = { kind: 'vow-broken', subjectId: vow.subjectId }
      punished = true
    } else {
      next = {
        ...next,
        vows: { ...next.vows, [vow.subjectId]: { ...vow, violated: true } },
      }
    }
    break
  }

  if (next.snakes && !next.snakes.fed && next.snakes.rooms.includes(spaceId)) {
    next = { ...next, snakes: { ...next.snakes, fed: true } }
    report = { kind: 'snakes-fed', spaceId }
  }

  // Bungee Gum trap causes a Rebound: the visitor is snapped back to where they came from.
  if (next.gumTraps.includes(spaceId) && leaving && leaving !== spaceId) {
    if (!absorb(spaceId)) {
      return {
        world: { ...next, cameFrom: leaving },
        travelTo: leaving,
        report: { kind: 'gum-rebound', spaceId },
      }
    }
  }

  // The guards expel an intruder without injuring them: back where they came
  // from, and no further.
  if (next.guarded.includes(spaceId) && leaving && leaving !== spaceId) {
    if (!absorb(spaceId)) {
      return {
        world: { ...next, cameFrom: leaving },
        travelTo: leaving,
        report: { kind: 'expelled', spaceId, toId: leaving },
      }
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
export function doorExit(world: TourWorld, through: Doors, options: DoorOptions = {}) {
  const { spaceId, arrivedFrom } = through
  const { ship, random = Math.random } = options
  if (!spaceId || spaceId === arrivedFrom) return null
  if (world.doors.length === 2) {
    const [a, b] = world.doors
    if (spaceId === a) return b
    if (spaceId === b) return a
    return null
  }

  // The hideout is wired whether or not a route has been prepared in it: with
  // the aura up and no pair armed, every frame in the ship is one of Voconte's,
  // and what is on the other side of it is not where you were going. Passive by
  // construction — nothing is aimed and nothing is cast, so the only way to
  // stop coming out somewhere else is to put the technique down.
  if (world.holding !== 'door-network' || !ship) return null
  const elsewhere = [...ship.spaces.keys()].filter((id) => id !== spaceId)
  if (!elsewhere.length) return null
  return elsewhere[Math.min(elsewhere.length - 1, Math.floor(random() * elsewhere.length))]
}

/**
 * One bite. The fish eat what is in the room, a thing at a time.
 *
 * The technique's own rule is that the victim feels nothing while it lasts, so
 * for a long time nothing was taken until the visitor walked out — which from
 * inside the room meant a sealed room and no fish. They are drawn now, and a
 * fish that swims through a coffin and leaves it standing is not eating: this
 * is the walk letting them feed while you watch, on whatever the scene's clock
 * says. Everything else about them is unchanged, including that they only ever
 * eat inside a room that has been shut.
 */
export function fishBite(
  world: TourWorld,
  ship: Ship,
  spaceId: string | null,
): TourCastResult | null {
  if (!spaceId || !world.devouring.includes(spaceId)) return null
  const eaten = [...ship.structures, ...world.copies].find(
    (solid) => solid.spaceId === spaceId && !world.solids[solid.id]?.gone,
  )
  if (!eaten) return null
  return {
    world: {
      ...world,
      solids: { ...world.solids, [eaten.id]: { ...world.solids[eaten.id], gone: true } },
    },
    report: { kind: 'fish-fed', spaceId, solidId: eaten.id },
  }
}

/**
 * Where the bird actually lands, which the technique decides and the reticle
 * only sometimes.
 *
 * The free bird is the one the aim is for. The shoulder bird belongs to the
 * visitor and is put in the room they are standing in — aiming across the ship
 * with it up sends it no further than your own shoulder. The third is thrown
 * without looking, so it is given the ship and not the target.
 */
function perchFor(world: TourWorld, ship: Ship, choice: Perch): string {
  const { targetId, standingIn, random } = choice
  if (world.owlMode === 'shoulder') return standingIn ?? targetId
  if (world.owlMode === 'random') {
    const rooms = [...ship.spaces.keys()]
    if (!rooms.length) return targetId
    return rooms[Math.min(rooms.length - 1, Math.floor(random() * rooms.length))]
  }
  return targetId
}

/**
 * One hop of the free bird, which is the only one that moves on its own.
 *
 * It goes through a door rather than through the hull: the ship's own
 * adjacency is the list of where it may go next, and a room the chain has shut
 * is shut to a bird as much as to a visitor. A perch with nothing open off it
 * keeps the bird where it is, and says nothing.
 */
export function flyTheOwl(
  world: TourWorld,
  ship: Ship,
  random: () => number = Math.random,
): TourCastResult | null {
  if (!world.owl || world.owlMode !== 'wander') return null
  const ways = (ship.adjacency.get(world.owl) ?? []).filter(
    (id) => ship.spaces.has(id) && linkIsOpen(world, id),
  )
  if (!ways.length) return null
  const spaceId = ways[Math.min(ways.length - 1, Math.floor(random() * ways.length))]
  return {
    world: { ...world, owl: spaceId, owlFilm: filmed(world, spaceId) },
    report: { kind: 'owl-flown', spaceId },
  }
}

/**
 * One hop of the insect, which moves on its own only when it is scouting.
 *
 * The same rule as the bird's, and for the same reason: it goes through a door
 * rather than through the hull, and a room the chain has shut is shut to a
 * cockroach as much as to a visitor. Piloted or filming, it stays where it was
 * put — those are the two orders that mean "do not wander off".
 */
export function flyTheEye(
  world: TourWorld,
  ship: Ship,
  random: () => number = Math.random,
): TourCastResult | null {
  if (!world.eye || world.eyeMode !== 'scout') return null
  const ways = (ship.adjacency.get(world.eye) ?? []).filter(
    (id) => ship.spaces.has(id) && linkIsOpen(world, id),
  )
  if (!ways.length) return null
  const spaceId = ways[Math.min(ways.length - 1, Math.floor(random() * ways.length))]
  return {
    world: { ...world, eye: spaceId, eyeFilm: [...world.eyeFilm, frameOf(ship, world, spaceId)] },
    report: { kind: 'eye-flown', spaceId },
  }
}

/**
 * One frame of the feed: a room, and how much was standing in it.
 *
 * Counted as the aura currently leaves the room rather than as the blueprint
 * has it — a coffin Blinky swallowed is not something the insect can film — so
 * the film says what was actually there to see.
 */
function frameOf(ship: Ship, world: TourWorld, spaceId: string): { spaceId: string; seen: number } {
  // A room Blinky has been through is a room with nothing in it to film,
  // whatever the blueprint still says stands there.
  if (world.emptied.includes(spaceId)) return { spaceId, seen: 0 }
  const seen = [...ship.structures, ...world.copies].filter(
    (solid) => solid.spaceId === spaceId && !world.solids[solid.id]?.gone,
  ).length
  return { spaceId, seen }
}

/** How many rooms the film covers, however many times it passed through them. */
const roomsFilmed = (film: TourWorld['eyeFilm']): number =>
  new Set(film.map((frame) => frame.spaceId)).size

/**
 * The film, with the room the bird has just reached written into it.
 *
 * Stamped with how far into the flight it got there, which is what the walk
 * plays the ten seconds back against. Kept whole while the bird is up: the cut
 * is made when it goes, because until then there is no telling which second
 * will turn out to be the last.
 */
function filmed(world: TourWorld, spaceId: string): TourWorld['owlFilm'] {
  const second = Math.max(0, OWL_SECONDS - world.owlLife)
  return [...world.owlFilm, { spaceId, second }]
}

/**
 * The last ten seconds of a flight, as the bird hands them over.
 *
 * Everything from the cut on, and the room it was in *at* the cut — a film
 * that started in the middle of a corridor would open on nothing, so the
 * entry that was still running is kept and moved up to the cut itself.
 */
function lastTenSeconds(film: TourWorld['owlFilm'], flown: number): TourWorld['owlFilm'] {
  const cut = Math.max(0, flown - OWL_FILM_SECONDS)
  const after = film.filter((frame) => frame.second >= cut)
  const running = [...film].reverse().find((frame) => frame.second < cut)
  const kept = running ? [{ spaceId: running.spaceId, second: cut }, ...after] : after
  // Told from zero, so the film is ten seconds long rather than the tail of a
  // twenty-second one: what is handed back is a recording, not a timestamp.
  return kept.map((frame) => ({ ...frame, second: frame.second - cut }))
}

/**
 * One second of the twenty, and what is left of the bird after it.
 *
 * The only part of Secret Window that runs on the walk's clock rather than on
 * a cast: the owl is materialized for twenty seconds and then it is not there.
 * What it leaves behind is the last ten, cut to length and handed over — which
 * is the whole of what the technique promises and all it promises.
 */
export function ageTheOwl(
  world: TourWorld,
  seconds = 1,
): { world: TourWorld; report: TourReport | null } | null {
  if (!world.owl) return null
  const left = world.owlLife - seconds
  if (left > 0) return { world: { ...world, owlLife: left }, report: null }

  const film = lastTenSeconds(world.owlFilm, OWL_SECONDS)
  return {
    world: { ...world, owl: null, owlLife: 0, owlFilm: film },
    report: { kind: 'owl-expired', rooms: new Set(film.map((frame) => frame.spaceId)).size },
  }
}

/** How fast a marked thing crosses its room towards its opposite, in m/s. */
const POLARITY_PACE = 0.9
/** How near the two have to come, in metres, before the pair goes off. */
export const POLARITY_CONTACT = 1.2

/** Where a marked solid is this instant: where it was put, plus its own drift. */
function markedAt(
  ship: Ship,
  world: TourWorld,
  mark: Mark,
): { spaceId: string; base: Vec2; at: Vec2 } | null {
  const { id, hold, seconds } = mark
  const original = solidById(ship, world, id)
  if (!original) return null
  const base = solidNow(original, hold).at
  const drift = hold.alive ? wanderOffset(id, seconds) : ([0, 0] as Vec2)
  return { spaceId: original.spaceId, base, at: [base[0] + drift[0], base[1] + drift[1]] }
}

/**
 * The sun and the moon walking towards each other, and what happens when they meet.
 *
 * Genthru's pair does nothing on its own: the bomb is the mark, and the mark is
 * spent when the two touch. In a walk where nothing else is moving, that would
 * be a payoff nobody ever sees — so a marked thing wakes up and goes looking
 * for its opposite, at a walking pace, and the room it is in is as far as it
 * will go. Two marks in two rooms sit there marked, which is the honest answer:
 * they never touch.
 *
 * Called on the walk's clock rather than on a cast. `delta` is how much of a
 * second went by since the last call; `seconds` is the same clock the scene
 * draws the drift off, so what is seen touching is what detonates.
 */
export function polarityStep(
  world: TourWorld,
  ship: Ship,
  step: { seconds: number; delta: number },
): { world: TourWorld; report: TourReport | null } | null {
  const { seconds, delta } = step
  const suns: string[] = []
  const moons: string[] = []
  for (const [id, hold] of Object.entries(world.solids)) {
    if (hold.gone) continue
    if (hold.mark === 'sun') suns.push(id)
    if (hold.mark === 'moon') moons.push(id)
  }
  if (!suns.length || !moons.length) return null

  const solids = { ...world.solids }
  /** Everything already blown this tick: a thing goes off once and is not there after. */
  const spent = new Set<string>()
  let report: TourReport | null = null

  for (const sunId of suns) {
    if (spent.has(sunId)) continue
    const sun = markedAt(ship, world, { id: sunId, hold: world.solids[sunId], seconds })
    if (!sun) continue
    const room = ship.spaces.get(sun.spaceId)
    if (!room) continue

    // The nearest opposite in the same room. Nothing reaches through a bulkhead
    // or through a deck: `at` is measured on the level it stands on, so two
    // things four decks apart share coordinates and share nothing else.
    let nearest: { id: string; base: Vec2; at: Vec2; away: number; apart: number } | null = null
    for (const moonId of moons) {
      if (spent.has(moonId)) continue
      const moon = markedAt(ship, world, { id: moonId, hold: world.solids[moonId], seconds })
      if (!moon || moon.spaceId !== sun.spaceId) continue
      const away = Math.hypot(sun.at[0] - moon.at[0], sun.at[1] - moon.at[1])
      const apart = Math.hypot(sun.base[0] - moon.base[0], sun.base[1] - moon.base[1])
      if (!nearest || away < nearest.away) nearest = { id: moonId, ...moon, away, apart }
    }
    if (!nearest) continue

    // Touching: both go, and the marks go with them. The first pair to meet is
    // the one the walk speaks of — a second explosion in the same tenth of a
    // second would talk over it.
    //
    // Two measurements rather than one, and either will do it. Where the things
    // are drawn is the one a visitor can see, and it is what a near miss is
    // decided on; but a living thing's drift is a ring it never leaves, and two
    // rings of the same size can turn about the same point forever without the
    // gap between them ever closing. So the things themselves arriving at the
    // same place counts as having met, whatever the drift is doing over it.
    if (nearest.away < POLARITY_CONTACT || nearest.apart < POLARITY_CONTACT) {
      solids[sunId] = { ...solids[sunId], gone: true, alive: false, mark: undefined }
      solids[nearest.id] = { ...solids[nearest.id], gone: true, alive: false, mark: undefined }
      spent.add(sunId)
      spent.add(nearest.id)
      report ??= { kind: 'detonated', solidId: sunId, otherId: nearest.id }
      continue
    }

    // Not touching yet: each takes a step towards the other, and neither leaves
    // the room it was marked in.
    const dx = nearest.base[0] - sun.base[0]
    const dz = nearest.base[1] - sun.base[1]
    const span = Math.hypot(dx, dz) || 1
    const stride = Math.min(POLARITY_PACE * delta, span / 2)
    const walk = (from: Vec2, towards: 1 | -1): Vec2 => {
      const to: Vec2 = [
        from[0] + (dx / span) * stride * towards,
        from[1] + (dz / span) * stride * towards,
      ]
      return pointInPolygon(to, room.footprint) ? to : from
    }
    solids[sunId] = { ...solids[sunId], at: walk(sun.base, 1) }
    solids[nearest.id] = { ...solids[nearest.id], at: walk(nearest.base, -1) }
  }

  return { world: { ...world, solids }, report }
}

/**
 * Which kinds the walk has a cast written for, by the thing it is aimed at.
 *
 * Exported so the invariant can be tested rather than trusted: what the walk
 * renders must be a subset of what the modules declare in their interaction
 * manifests, or the gate standing in front of each of these tables would
 * refuse a cast the walk used to perform. `nen/targeting.test.ts` holds it.
 */
export const TOUR_CAST_KINDS: Record<'solid' | 'body' | 'room', Set<HatsuInteractionKind>> = {
  solid: new Set(Object.keys(SOLID_CASTS) as HatsuInteractionKind[]),
  body: new Set(Object.keys(BODY_CASTS) as HatsuInteractionKind[]),
  room: new Set(Object.keys(ROOM_CASTS) as HatsuInteractionKind[]),
}

/**
 * Put on the face of the body down the reticle, or take it off again.
 *
 * Cast at the same person twice and the layer comes off, because the walk has
 * no other gesture for taking it off and a mask that could only ever go on
 * would be a claim the manga does not make. Nothing is written about the person
 * the face was copied from: `cast/reach.ts` gives them back unchanged, and this
 * is the whole of what the technique does to the world.
 */
export const wearTheMask = (world: TourWorld, characterId: string): TourWorld => ({
  ...world,
  body: { ...world.body, masked: world.body.masked === characterId ? null : characterId },
})
