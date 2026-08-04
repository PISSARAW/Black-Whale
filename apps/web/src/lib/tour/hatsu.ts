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
export const SOLID_CASTS: Partial<Record<HatsuInteractionKind, SolidCast>> = {
  // Bungee Gum on a solid. The filament goes out of the wrist and takes hold;
  // cast at the same thing again it contracts and the thing crosses the room,
  // because that is the gesture ch. 39 draws first. The arithmetic — where a
  // thing comes to rest, and how much the strand is holding — is `gum.ts`'s;
  // all that happens here is the ship's own objection, which is that a cabinet
  // cannot be dragged through a bulkhead.
  elastic: ({ world, ship, structure, hold, id, at, standingIn }) => {
    const now = solidNow(structure, hold)
    const act = aimGum({
      strand: world.gum,
      solidId: id,
      at,
      anchorAt: now.at,
      clearance: clearanceOf(now) + VISITOR_CLEARANCE,
      together: standingIn === structure.spaceId,
    })
    if (act.act === 'stick') {
      return {
        world: { ...world, gum: { solidId: id, rest: act.rest } },
        report: { kind: 'gum-set', solidId: id, metres: act.rest },
      }
    }
    if (act.act === 'taut') {
      return {
        world,
        report: { kind: 'gum-taut', solidId: id, tension: gumTension(world.gum!, act.metres) },
      }
    }
    if (act.act === 'reel') {
      const room = ship.spaces.get(structure.spaceId)
      const outline = structureFootprint({ ...now, at: act.landing })
      const fits = room && outline.every((corner) => pointInPolygon(corner, room.footprint))
      const drawn = Math.hypot(now.at[0] - at[0], now.at[1] - at[1])
      return {
        world: { ...withHold(world, id, fits ? { at: act.landing } : {}), gum: null },
        report: {
          kind: 'gum-reeled',
          solidId: id,
          metres: fits ? act.metres : 0,
          tension: gumTension(world.gum!, drawn),
        },
      }
    }
    // A second solid with the first still stuck: the strand joins the two and
    // lets go of the wrist, which is the other half of what ch. 39 draws.
    const anchorId = world.gum!.solidId
    const anchor = solidById(ship, world, anchorId)
    const reached = Math.hypot(now.at[0] - at[0], now.at[1] - at[1])
    if (!anchor) {
      return {
        world: { ...world, gum: { solidId: id, rest: reached } },
        report: { kind: 'gum-set', solidId: id, metres: reached },
      }
    }
    const anchorNow = solidNow(anchor, world.solids[anchorId])
    const landing = gumLanding({
      at: anchorNow.at,
      anchorAt: now.at,
      clearance: clearanceOf(anchorNow) + clearanceOf(now),
    })
    const room = ship.spaces.get(structure.spaceId)
    const outline = structureFootprint({ ...now, at: landing })
    const fits = room && outline.every((corner) => pointInPolygon(corner, room.footprint))
    return {
      world: { ...withHold(world, id, fits ? { at: landing } : {}), gum: null },
      report: { kind: 'gum-pulled', solidId: id, otherId: anchorId },
    }
  },

  // Only the look changes; the thing underneath goes on being what it was,
  // and goes on stopping you exactly where it did.
  //
  // And the change leaves nothing to find. The crate that becomes an armchair
  // in ch. 61 is an armchair to the room and to Gyo alike — see `texture.ts` —
  // so the hold carries the fact that this face is forged and the scene draws
  // no aura for it. What gives it away is the touch, which here is the solid
  // going on measuring, blocking and citing exactly what it always did.
  disguise: ({ world, structure, hold, id }) => {
    const next = nextForgery(hold?.kind ?? structure.kind)
    return {
      world: withHold(world, id, { kind: next, forged: true }),
      report: { kind: 'forged', solidId: id, as: next },
    }
  },

  pocket: ({ world, hold, id }) =>
    (hold?.scale ?? 1) < 0.5
      ? {
          world: withHold(world, id, { scale: 1, squash: 1 }),
          report: { kind: 'unwrapped', solidId: id },
        }
      : {
          world: withHold(world, id, { scale: 0.25, squash: 0.25 }),
          report: { kind: 'wrapped', solidId: id },
        },

  // The stamp is not a push: it is a 人 put on a head, and the thing wearing it
  // does what it is told afterwards. Three clicks, three states — stamp a solid
  // that has none, lock or unlock one that has, and once twenty are wearing it
  // a click on anything else is the order rather than a twenty-first stamp.
  command: ({ world, ship, structure, hold, id }) => {
    if (hold?.stamped) {
      const locked = !hold.locked
      const after = withHold(world, id, { locked })
      return {
        world: after,
        report: {
          kind: 'stamp-locked',
          solidId: id,
          locked,
          locks: lockedPuppets(after).length,
        },
      }
    }

    // The lock is what tells stamping from ordering: turn one and the crowd is
    // closed, so the next cast at anything else is where they are being sent
    // rather than a twenty-first head. Unlock them all and the stamp goes back
    // to taking heads. The walk holds to the web's rule here, because a visitor
    // who has learnt the technique on the archive has learnt it aboard as well.
    if (!lockedPuppets(world).length && stampedPuppets(world).length < STAMP_LIMIT) {
      const after = withHold(world, id, { stamped: true, locked: false })
      return {
        world: after,
        report: { kind: 'stamped', solidId: id, puppets: stampedPuppets(after).length },
      }
    }

    // Otherwise this cast is a place to send them, and the solid under the
    // reticle is the place. It is told the way a room is told.
    const room = ship.spaces.get(structure.spaceId)
    const to = solidNow(structure, hold).at
    return room
      ? orderThePuppets(world, room, to)
      : { world, report: { kind: 'no-lock', stamped: stampedPuppets(world).length } }
  },

  clone: ({ world, ship, structure, hold, id }) => {
    const now = solidNow(structure, hold)
    const beside = shove(ship, { structure, hold }, [clearanceOf(now) * 2, 0]) ?? now.at
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
  },

  puppet: ({ world, id }) => {
    if (world.puppet === id) {
      return {
        world: { ...world, puppet: null },
        report: { kind: 'puppet-released', solidId: id },
      }
    }
    return {
      world: { ...world, puppet: id },
      report: { kind: 'puppeted', solidId: id },
    }
  },

  impact: ({ world, id }) => ({
    world: withHold(world, id, { squash: 0.12 }),
    report: { kind: 'crushed', solidId: id },
  }),

  // A sustained volley: the thing is driven back, and the third burst is the
  // one that ends it.
  barrage: ({ world, ship, structure, hold, id, away }) => {
    const hits = (hold?.hits ?? 0) + 1
    if (hits >= 3) {
      return {
        world: withHold(world, id, { hits, gone: true }),
        report: { kind: 'shattered', solidId: id },
      }
    }
    const landing = shove(ship, { structure, hold }, away(2))
    return {
      world: withHold(world, id, landing ? { hits, at: landing } : { hits }),
      report: { kind: 'volley', solidId: id, hits },
    }
  },

  windup: ({ world, ship, structure, hold, id, away }) => {
    const metres = 3 + world.windup * 4
    const landing = shove(ship, { structure, hold }, away(metres))
    return {
      world: { ...withHold(world, id, landing ? { at: landing } : {}), windup: 0 },
      report: { kind: 'launched', solidId: id, metres: landing ? metres : 0 },
    }
  },

  staff: ({ world, ship, structure, hold, id, away }) => {
    const now = solidNow(structure, hold)
    const landing = shove(ship, { structure, hold }, away(1.5))
    return {
      world: withHold(world, id, {
        rotation: now.rotation + 25,
        ...(landing ? { at: landing } : {}),
      }),
      report: { kind: 'struck', solidId: id },
    }
  },

  // The chain is fixed to the hand and the weight is on the far end of it, so
  // what it does to a thing is what a whip does: the ball goes through it, it
  // is knocked back and spun by the blow, and the chain lets go again. Nothing
  // is held afterwards — a lash is over the moment it lands, and the count is
  // only so the read-out can say this is the fourth time you have hit it.
  dowsing: ({ world, ship, structure, hold, id, away, at, standingIn }) => {
    // Parer et frapper (ch. 76) : la chaîne pare le coup qui arrive puis claque
    // en retour. On ne pare que ce qui est dans la même pièce.
    if (standingIn === structure.spaceId) {
      const now = solidNow(structure, hold)
      const landing = shove(ship, { structure, hold }, away(2))
      return {
        world: withHold(world, id, {
          hits: (hold?.hits ?? 0) + 1,
          rotation: now.rotation + 40,
          ...(landing ? { at: landing } : {}),
        }),
        report: { kind: 'lashed', solidId: id, hits: (hold?.hits ?? 0) + 1 },
      }
    }

    // Sonder un objet perdu (ch. 369) : le solide perdu de vue est marqué
    // « probable » sur la carte, sans qu'on l'ait revu. La position devient
    // la salle dowsée, comme pour une salle.
    const targetRoom = ship.spaces.get(structure.spaceId)
    if (!targetRoom) return { world, report: { kind: 'no-target' } }

    const distance = distanceTo(ship, targetRoom, { at, standingIn })
    return {
      world: { ...world, dowsing: structure.spaceId },
      report: {
        kind: 'dowsed',
        spaceId: structure.spaceId,
        distance: distance.metres,
        decks: distance.decks,
      },
    }
  },

  // Two arms, two snakes, and no more than that. Letting one go is always
  // allowed — that is the hand opening — but a third catch has nothing left to
  // catch it with, so the cast is refused and says which two are busy.
  serpent: ({ world, hold, id }) => {
    if (hold?.bound) {
      return {
        world: withHold(world, id, { bound: false }),
        report: { kind: 'released', solidId: id },
      }
    }
    const held = boundSolidIds(world)
    if (held.length >= SNAKE_ARMS) {
      return { world, report: { kind: 'arms-full', solidIds: held } }
    }
    return { world: withHold(world, id, { bound: true }), report: { kind: 'bound', solidId: id } }
  },

  /**
   * Leorio strikes the deck under his own feet and the fist comes out where he
   * chose. Between the two, the aura runs in the surface — and only in it.
   *
   * The line is worked out first and everything else waits on it: a strike that
   * would have to cross an open well is refused with its rule rather than
   * quietly landing, which is the one thing about this ability that ch. 385 is
   * unambiguous about. A bulkhead in the way is not in the way — the panel is
   * a fist coming out of a closed door — so the run is stopped by the absence
   * of matter and by nothing else. See `punch.ts` and `onFloorOf`.
   *
   * Where it went *in* stays the visitor's own feet, which is what makes the
   * exit a decision rather than an accident: they choose the point, and the
   * ship decides whether there is anything joining the two.
   */
  'remote-strike': ({ world, ship, structure, hold, id, away, at }) => {
    const now = solidNow(structure, hold)
    const room = ship.spaces.get(structure.spaceId)
    if (!room) return { world, report: { kind: 'no-target' } }
    const through = punchRuns({ from: at, to: now.at, onFloor: onFloorOf(ship, room.tierId) })
    if (!through) return { world, report: { kind: 'punch-refused', spaceId: structure.spaceId } }
    const source =
      [...ship.structures, ...world.copies].find(
        (candidate) =>
          candidate.spaceId === structure.spaceId &&
          candidate.id !== id &&
          !world.solids[candidate.id]?.gone,
      ) ?? structure
    const landing = shove(ship, { structure, hold }, away(2.5))
    return {
      world: withHold(world, id, landing ? { at: landing } : { hits: (hold?.hits ?? 0) + 1 }),
      report: {
        kind: 'came-up-under',
        solidId: source.id,
        otherId: id,
        through,
        throughDoor: world.shut.includes(structure.spaceId),
      },
    }
  },

  // The thread that puts things back: the blueprint's own record, whatever
  // was done to it — crushed, shredded, swallowed, moved.
  stitch: ({ world, hold, id }) =>
    hold
      ? { world: dropHold(world, id), report: { kind: 'stitched', solidId: id } }
      : { world, report: { kind: 'nothing-to-stitch', solidId: id } },

  animate: ({ world, hold, id }) => ({
    world: withHold(world, id, { alive: !hold?.alive }),
    report: { kind: 'animated', solidId: id },
  }),

  shred: ({ world, id }) => ({
    world: { ...world, wound: id },
    report: { kind: 'shred-stuck', solidId: id },
  }),

  // Padaille: swing, and find out what the arm was.
  //
  // The one technique in the walk whose result the visitor has no say in. Every
  // other cast here is a decision — which room, which thing, which of two
  // hands, which of three airs — and this one is a decision to swing and
  // nothing more. So the tool is drawn before anything is read off the target,
  // and the three outcomes are three different things rather than three
  // strengths of one: driven into the deck, holed through, or in two pieces.
  //
  // The swing lands whatever it draws, including on something already dealt
  // with: a cupboard the hammer flattened can still be halved, and the halves
  // are half of what is left rather than half of what the blueprint had.
  'weapon-body': ({ world, ship, structure, hold, id }) => {
    const tool = toolFor(id, world.swings)
    const swung = { ...world, swings: world.swings + 1 }

    if (tool === 'hammer') {
      return {
        world: withHold(swung, id, { squash: HAMMERED_SQUASH }),
        report: { kind: 'hammered', solidId: id },
      }
    }

    if (tool === 'drill') {
      return {
        world: withHold(swung, id, { bored: true }),
        report: { kind: 'bored', solidId: id },
      }
    }

    // The axe. Two pieces where there was one, so the half that keeps the
    // blueprint's id stays put and the other is a copy set down beside it —
    // the same machinery Gallery Fake's forgery uses, because a half is a
    // solid the ship never had either. If the room has no space to lay the
    // second half in, the cut still happens and the halves stand in the same
    // place: an axe stopped by the width of a cabin would be an axe that
    // failed, and this one did not.
    const halved = Math.max(0.05, (hold?.scale ?? 1) * 0.5)
    const now = solidNow(structure, { ...hold, scale: halved })
    const beside = shove(ship, { structure, hold: { ...hold, scale: halved } }, [
      clearanceOf(now) * 1.2,
      0,
    ])
    const offcutId = `${id}::half${world.copies.length + 1}`
    const offcut: Structure = { ...now, id: offcutId, at: beside ?? now.at }
    return {
      world: {
        ...withHold(swung, id, { scale: halved }),
        copies: [...world.copies, offcut],
        solids: {
          ...withHold(swung, id, { scale: halved }).solids,
          [offcutId]: { copyOf: id },
        },
      },
      report: { kind: 'halved', solidId: id, apart: beside !== null },
    }
  },

  // Dramatic on a thing, and weak on anything Nen is already holding.
  growth: ({ world, hold, id }) => {
    if (hold?.bound || hold?.alive || hold?.copyOf) {
      return { world, report: { kind: 'growth-refused', solidId: id } }
    }
    return {
      world: withHold(world, id, { scale: Math.min(3, (hold?.scale ?? 1) * 1.8) }),
      report: { kind: 'grown', solidId: id },
    }
  },

  // Tserriednich's Guardian Spirit Beast, which is sent at a thing rather than
  // cast on one: it walks over, touches it, and what the touch does depends
  // only on how many have come before.
  //
  //   first   it shoves the thing, and that is all it does
  //   second  the green is on it, and stays on it
  //   third   whatever this was, it is not that any more
  //
  // The escalation is the ability, so the count is on the solid and not on the
  // world: the beast can be walked round a room marking three separate things
  // once each, and none of them is any nearer its third for the others. The
  // room the beast is standing in is wherever it last touched something.
  'lie-marks': ({ world, ship, structure, hold, id, away, at, heading, standingIn: here }) => {
    const lies = (hold?.lies ?? 0) + 1
    const beside = { ...world, chimera: structure.spaceId, summoned: calledUp(here, at, heading) }

    if (lies === 1) {
      const landing = shove(ship, { structure, hold }, away(1.4))
      return {
        world: withHold(beside, id, { lies, ...(landing ? { at: landing } : {}) }),
        report: { kind: 'lie-pushed', solidId: id, metres: landing ? 1.4 : 0 },
      }
    }

    if (lies === 2) {
      return {
        world: withHold(beside, id, { lies, aura: 'green' }),
        report: { kind: 'lie-greened', solidId: id },
      }
    }

    // The third, which takes the thing away and leaves the thing it became.
    // `gone` rather than a third appearance, because what stands there
    // afterwards is not a fitting of the ship at all: the deck stops drawing
    // it and `$lib/tour/apparitions` puts a beast where it was.
    return {
      world: withHold(beside, id, { lies, monster: true, gone: true }),
      report: { kind: 'lie-transformed', solidId: id },
    }
  },

  // The Sun and Moon: one hand puts the sun on, the other the moon, and which
  // hand cast is the visitor's own decision rather than a turn taken — the walk
  // gives them a key each. A marked thing wakes up and goes looking for its
  // opposite; what happens when it finds it is `polarityStep`'s.
  polarity: ({ world, id, mark }) => ({
    world: withHold(world, id, { mark, alive: true }),
    report: { kind: 'marked', solidId: id, mark },
  }),

  // The two exchange appearances, and nothing else: each stays where it is
  // and stays what it is.
  'identity-swap': ({ world, ship, structure, hold, id }) => {
    if (!world.pairing || world.pairing === id) {
      return { world: { ...world, pairing: id }, report: { kind: 'solid-paired', solidId: id } }
    }
    const other = solidById(ship, world, world.pairing)
    if (!other)
      return { world: { ...world, pairing: id }, report: { kind: 'solid-paired', solidId: id } }
    const mine = solidNow(structure, hold)
    const theirs = solidNow(other, world.solids[other.id])
    return {
      world: {
        ...withHold(withHold(world, id, { kind: theirs.kind }), other.id, { kind: mine.kind }),
        pairing: null,
      },
      report: { kind: 'swapped', solidId: id, otherId: other.id },
    }
  },

  relay: ({ world, id }) => ({
    world: { ...world, pairing: id },
    report: { kind: 'cargo-taken', solidId: id },
  }),

  // Into the bag, and the bag remembers the order. Blinky swallows what is not
  // alive and not Nen — a solid another technique has hold of is refused before
  // this is ever reached — and what he swallows is gone from the room until he
  // is asked for it back.
  vacuum: ({ world, id }) => ({
    world: {
      ...withHold(world, id, { gone: true }),
      hoover: [...world.hoover.filter((held) => held !== id), id],
    },
    report: { kind: 'swallowed', solidId: id, held: world.hoover.length + 1 },
  }),
}

/**
 * Anything aimed at a solid while Kurton is being ridden loads it instead, up
 * to the five he carries: a vehicle passes what it is given to its hold.
 */
function loadIntoHold(world: TourWorld, structure: Structure | null): TourCastResult | null {
  if (!world.body.riding || !structure) return null
  if (world.body.passengers.includes(structure.id)) return null
  if (world.body.passengers.length >= CAPACITY) return { world, report: { kind: 'hold-full' } }

  const passengers = [...world.body.passengers, structure.id]
  return {
    world: { ...withHold(world, structure.id, {}), body: { ...world.body, passengers } },
    report: { kind: 'loaded', solidId: structure.id, passengers: passengers.length },
  }
}

/**
 * The three casts that do not go to the solid the visitor is aiming at.
 *
 * Winding up needs nothing to hit, the confetti goes wherever it first stuck,
 * and Transport Portals asks for a room second. Each is answered before the
 * target is looked up, because for these the target is not where the cast goes.
 */
function castPastTheTarget(
  world: TourWorld,
  kind: HatsuInteractionKind,
  aimedAt: { input: TourCastInput; structure: Structure | null },
): TourCastResult | null {
  const { input, structure } = aimedAt
  const { ship } = input

  if (kind === 'windup' && !structure) {
    const turns = world.windup + 1
    return { world: { ...world, windup: turns }, report: { kind: 'wound-up', turns } }
  }

  if (kind === 'shred' && world.wound) return shredTheWound(world, ship, world.wound)

  // The aura runs along the floor and comes up wherever it was sent, and a
  // stretch of empty deck is somewhere it can be sent: the technique was
  // refusing every room the reticle happened to cross without a solid in it,
  // which from inside the walk was a punch that did nothing four casts in five.
  // Nothing is struck and nothing is moved — the floor answers, and that is the
  // whole of the report.
  // Nothing down the reticle, and something in the bag: the last thing in is
  // the first thing out, set down where the aura came down. An empty bag falls
  // back to what Blinky did before he had one — the room, swallowed whole.
  if (kind === 'vacuum' && !structure) {
    const room = input.targetId ? ship.spaces.get(input.targetId) : null
    if (!room) return { world, report: { kind: 'no-target' } }
    const last = world.hoover[world.hoover.length - 1]
    const coughed = solidById(ship, world, last ?? null)
    if (!coughed) {
      if (nenHeld(world).includes(room.id)) {
        return { world, report: { kind: 'refused', spaceId: room.id } }
      }
      if (world.emptied.includes(room.id)) {
        return { world, report: { kind: 'emptied', spaceId: room.id, structures: 0 } }
      }
      const structures = ship.structures.filter((solid) => solid.spaceId === room.id).length
      return {
        world: { ...world, emptied: [...world.emptied, room.id] },
        report: { kind: 'emptied', spaceId: room.id, structures },
      }
    }
    const hoover = world.hoover.slice(0, -1)
    return {
      world: {
        ...withHold(world, coughed.id, {
          gone: false,
          at: landingIn(room, { at: input.at, heading: input.heading })[room.id],
        }),
        hoover,
        // It comes out where it was put down, so it belongs to that room now.
        copies: world.copies.map((copy) =>
          copy.id === coughed.id ? { ...copy, spaceId: room.id } : copy,
        ),
      },
      report: { kind: 'coughed-up', solidId: coughed.id, spaceId: room.id, held: hoover.length },
    }
  }

  /**
   * Air Blow held on a thing, which is the one thing it is *not* recorded doing.
   *
   * The catalogue's entry is four sentences long and three of them say the same
   * thing: it comes out of the left palm, contact does not appear to be
   * required, and its precise functioning remains unknown. Nothing about a
   * rate, nothing about a reach, nothing about what a second gust adds to the
   * first. So the walk offers the sustained fire and refuses it with its
   * reason, which is more honest than inventing a cadence and quieter than
   * hiding the key: a reader who tries it learns what the archive does not say.
   */
  if (kind === 'blast' && structure) {
    return { world, report: { kind: 'blast-solid-refused', solidId: structure.id } }
  }

  // Order Stamp aimed at no solid is the order: the stamp is already on the
  // heads that matter, and this is the click that tells the locked ones where
  // to go. Nothing locked and the order is spoken into the room and ignored,
  // which is the whole point of the lock.
  if (kind === 'command' && !structure) {
    const room = input.targetId ? ship.spaces.get(input.targetId) : null
    if (!room) return { world, report: { kind: 'no-target' } }
    return orderThePuppets(
      world,
      room,
      landingIn(room, { at: input.at, heading: input.heading })[room.id],
    )
  }

  // The same blow with nothing under the reticle but deck: the exit is the
  // point the aura came down at in the room aimed at, and the rule is the same
  // rule — a room across an open well is a room the fist cannot reach.
  if (kind === 'remote-strike' && !structure) {
    const room = input.targetId ? ship.spaces.get(input.targetId) : null
    if (!room) return { world, report: { kind: 'no-target' } }
    const exit =
      landingIn(room, { at: input.at, heading: input.heading })[room.id] ?? centroid(room)
    const through = punchRuns({
      from: input.at,
      to: exit,
      onFloor: onFloorOf(ship, room.tierId),
    })
    if (!through) return { world, report: { kind: 'punch-refused', spaceId: room.id } }
    return { world, report: { kind: 'came-up-empty', spaceId: room.id, through } }
  }

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

  return null
}

/** One more volley into whatever the confetti is already stuck to. */
function shredTheWound(world: TourWorld, ship: Ship, woundId: string): TourCastResult {
  const wounded = solidById(ship, world, woundId)
  const hold = world.solids[woundId]
  if (!wounded || hold?.gone) {
    return { world: { ...world, wound: null }, report: { kind: 'no-solid' } }
  }
  const left = (hold?.scale ?? 1) * 0.7
  if (left < 0.2) {
    return {
      world: { ...withHold(world, woundId, { gone: true }), wound: null },
      report: { kind: 'shattered', solidId: woundId },
    }
  }
  return {
    world: withHold(world, woundId, { scale: left }),
    report: { kind: 'shred-cut', solidId: woundId, left: Math.round(left * 100) },
  }
}

/**
 * One cast on the solid.
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

  const elsewhere =
    loadIntoHold(world, structure) ?? castPastTheTarget(world, kind, { input, structure })
  if (elsewhere) return elsewhere

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

  // What may be aimed at a solid is the module's declaration, not this table's
  // shape: the table says how the cast looks, the manifest says whether it is
  // allowed at all. The two agree for the eighty-two — `targeting.test.ts`
  // holds them to it — so this refuses nothing the walk used to do.
  const cast = acceptsFamily(kind, 'solid') ? SOLID_CASTS[kind] : undefined
  return cast
    ? cast({
        world,
        ship,
        structure,
        hold,
        id,
        heading,
        away,
        mark: input.mark ?? 'sun',
        at,
        standingIn: input.standingIn,
      })
    : { world, report: { kind: 'inert' } }
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
 * How far the sun reaches per punishment packed away.
 *
 * Zazan's burst was answered by the damage taken first, so the walk keeps that
 * relation rather than a figure of its own: four metres is a stride or two, and
 * an armour that took one blow clears the furniture beside the visitor rather
 * than the deck.
 */
export const SUN_FLARE_METRES_PER_HIT = 4

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
    // A gathered flock is a bird's worth of aura times however many came, all
    // of it still being spent — which is exactly what Predator names one at a
    // time and what the panel has to count.
    ...(world.flock ? [`birds:${world.flock.spaceId}`] : []),
    ...Object.keys(world.solids).map((id) => `solid:${id}`),
    ...world.shut.map((id) => `shut:${id}`),
    ...world.guarded.map((id) => `guarded:${id}`),
    ...(world.pinned ? [`pinned:${world.pinned}`] : []),
    ...Object.keys(world.vows).map((id) => `vow:${id}`),
    ...(world.pact ? [`pact:${world.pact}`] : []),
    ...world.devouring.map((id) => `fish:${id}`),
    ...Object.keys(world.cards).map((id) => `card:${id}`),
    ...(world.double ? [`double:${world.double}`] : []),
    ...(world.worm ? [`worm:${world.worm.a}`] : []),
    ...(world.snakes ? ['snakes'] : []),
    ...(world.trap ? [`trap:${world.trap}`] : []),
    ...world.gumTraps.map((id) => `gum:${id}`),
    ...(world.gum ? [`strand:${world.gum.solidId}`] : []),
    ...world.flowered.map((id) => `flowered:${id}`),
    ...world.scattered.map((id) => `scattered:${id}`),
    // The Guardian Spirit Beasts. Each is a hold like any other: something the
    // aura is doing to the ship that would stop if it were let go of — which is
    // what this list answers, and what Predator names one at a time.
    ...(world.medusa ? [`beast:${world.medusa}`] : []),
    ...(world.chimera ? [`chimera:${world.chimera}`] : []),
    ...(world.toad ? [`gas:${world.toad}`] : []),
    ...(world.centipede ? [`secretion:${world.centipede}`] : []),
    ...(world.cat ? [`cat:${world.cat}`] : []),
    ...(world.dragon ? [`dragon:${world.dragon}`] : []),
    ...(world.wheel ? [`wheel:${world.wheel.spaceId}`] : []),
    ...(world.smoke ? [`smoke:${world.smoke.spaceId}`] : []),
    ...world.menagerie.map((id) => `flock:${id}`),
    ...world.lit.map((id) => `lit:${id}`),
  ]
}

/**
 * One cast on the visitor themselves.
 *
 * The two that do take a target say so here rather than in the roster: Kurton
 * loads a solid while he is being ridden, and Metamorphosen needs a thing to
 * take the shape of.
 */
/** Everything one cast on the visitor works with, gathered once by `castOnBody`. */
type BodyCastContext = {
  world: TourWorld
  ship: Ship
  body: TourBody
  /** The cast as it came in — the two that take a target read it from here. */
  kind: HatsuInteractionKind
  input: TourCastInput
  /** The same world with the visitor changed and nothing else. */
  withBody: (patch: Partial<TourBody>) => TourWorld
}

type BodyCast = (ctx: BodyCastContext) => TourCastResult

/**
 * Kurton carries five, and what he carries is what fuels him.
 *
 * Boarding takes the room's own solids up; alighting sets them down where the
 * visitor stops. Aimed at something he is not already carrying, he loads it.
 */
function boardOrAlight({
  world,
  ship,
  body,
  kind,
  input,
  withBody,
}: BodyCastContext): TourCastResult {
  if (!body.riding) {
    return { world: withBody({ riding: true }), report: { kind: 'boarded', passengers: 0 } }
  }

  const aimed = solidById(ship, world, input.targetSolidId ?? null)
  if (aimed && !body.passengers.includes(aimed.id)) return castOnSolid(world, kind, input)

  const room = input.standingIn ? ship.spaces.get(input.standingIn) : null
  const solids = { ...world.solids }
  for (const id of body.passengers) {
    const carried = solidById(ship, world, id)
    if (!carried || !room) continue
    solids[id] = { ...solids[id], at: spawnPointNear(room, input.at) }
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
    report: { kind: 'alighted', spaceId: input.standingIn, passengers: body.passengers.length },
  }
}

/**
 * The chain that heals: what has been crushed, shredded or swallowed in one
 * room is mended, and under Emperor Time the whole ship is.
 */
function mendWhatWasHurt({ world, ship, input }: BodyCastContext): TourCastResult {
  const whole = world.laidOpen
  const solids = { ...world.solids }
  let mended = 0
  for (const id of Object.keys(solids)) {
    const hurt = solids[id]
    if (hurt.copyOf) continue
    const room = solidById(ship, world, id)?.spaceId
    if (!whole && room !== input.standingIn) continue
    if (!hurt.gone && !hurt.squash && !hurt.scale) continue
    delete solids[id]
    mended++
  }
  return {
    world: { ...world, solids },
    report: { kind: 'mended', spaceId: whole ? null : input.standingIn, solids: mended },
  }
}

/**
 * The sun rises on what the armour kept and on nothing else, so an empty
 * wrapping is a refusal rather than a weak burst.
 *
 * It goes out from where the visitor stands, on their own deck, and it does not
 * pick what it catches: a solid Snake Arm was holding fast burns with the rest.
 */
function raiseTheSun({ world, ship, body, input }: BodyCastContext): TourCastResult {
  const packed = body.packed ?? 0
  const room = input.standingIn ? ship.spaces.get(input.standingIn) : null
  if (!room) return { world, report: { kind: 'no-target' } }

  // The sun rises whether or not the wrapping had anything in it. What Pain
  // Packer buys is how far it reaches — the technique used to refuse outright
  // without it, which in a walk that hands out one aura at a time meant Feitan
  // could never raise it at all.
  const metres = Math.max(SUN_FLARE_METRES_PER_HIT, packed * SUN_FLARE_METRES_PER_HIT)
  const solids = { ...world.solids }
  let burnt = 0
  for (const structure of [...ship.structures, ...world.copies]) {
    const space = ship.spaces.get(structure.spaceId)
    if (!space || space.tierId !== room.tierId) continue
    const hold = solids[structure.id]
    if (hold?.gone) continue
    const standing = solidNow(structure, hold)
    if (Math.hypot(standing.at[0] - input.at[0], standing.at[1] - input.at[1]) > metres) continue
    solids[structure.id] = { ...hold, gone: true, bound: false }
    burnt++
  }
  return {
    world: { ...world, solids, body: { ...body, packed: null } },
    report: { kind: 'sun-risen', metres, solids: burnt },
  }
}

/**
 * One air, played into the room the visitor is standing in.
 *
 * Each of the three is a toggle on that room rather than something that stacks:
 * the flute is still in the hand when the piece ends, and playing the same air
 * into the same room again is how it is taken back off. Which room is never
 * aimed — the walk is standing in the only room that can hear it.
 *
 * The soft air puts the room in flower, the sharp one leaves its notes loose in
 * the air, and the lively one gets everything standing there dancing. All three
 * are written down and nothing here is drawn: `$lib/tour/apparitions` decides
 * what a room in flower looks like, exactly as it does for a room with fish in.
 */
function playTheTune(world: TourWorld, ship: Ship, played: Played): TourCastResult {
  const { tune, spaceId } = played
  if (tune === 'dance') {
    // Everything the room has in it, the aura's own copies included: a room
    // dances with what is standing in it, whoever put it there.
    const solids = { ...world.solids }
    const inRoom = [...ship.structures, ...world.copies].filter(
      (solid) => solid.spaceId === spaceId && !solids[solid.id]?.gone,
    )
    const already = inRoom.some((solid) => solids[solid.id]?.dancing)
    for (const solid of inRoom) {
      const hold: SolidHold = { ...solids[solid.id] }
      if (already) delete hold.dancing
      else hold.dancing = true
      // A thing the walk was only holding because it was dancing is let go of
      // entirely when the music stops: an empty hold is not a hold, and one
      // left behind would keep the solid out of the deck's own mesh for good.
      if (Object.keys(hold).length) solids[solid.id] = hold
      else delete solids[solid.id]
    }
    return {
      world: {
        ...world,
        solids,
        body: { ...world.body, playing: already ? null : tune, soothed: !already },
      },
      report: already
        ? { kind: 'flute-lowered', tune, spaceId }
        : { kind: 'tune-played', tune, spaceId, on: true, solids: inRoom.length },
    }
  }

  const rooms = tune === 'bloom' ? world.flowered : world.scattered
  const on = !rooms.includes(spaceId)
  const next = on ? [...rooms, spaceId] : rooms.filter((id) => id !== spaceId)
  return {
    world: {
      ...world,
      flowered: tune === 'bloom' ? next : world.flowered,
      scattered: tune === 'scatter' ? next : world.scattered,
      // The flute goes up with the piece and comes down with it, and the senses
      // it was holding open come down with the flute. See `soothed`.
      body: { ...world.body, playing: on ? tune : null, soothed: on },
    },
    report: on
      ? { kind: 'tune-played', tune, spaceId, on, solids: 0 }
      : { kind: 'flute-lowered', tune, spaceId },
  }
}

/** What each technique does to the visitor, one entry per kind. */
export const BODY_CASTS: Partial<Record<HatsuInteractionKind, BodyCast>> = {
  // Reinforcement in proportion to the aura committed, and it is committed a
  // handful at a time.
  enhance: ({ body, withBody }) => {
    const committed = Math.min(6, body.enhance + 1)
    const eyes = committed > 0 ? null : body.eyes
    return {
      world: withBody({ enhance: committed, eyes }),
      report: { kind: 'reinforced', committed },
    }
  },

  puppet: ({ withBody }) => {
    return {
      world: withBody({ autopilotUntil: Date.now() + 10000 }),
      report: { kind: 'autopilot-started' },
    }
  },

  vehicle: boardOrAlight,

  // Hanzo leaves the body where it is and goes on without it. The double
  // walks through the ship; the body is a place you have to come back to.
  projection: ({ world, body, input, withBody }) => {
    if (body.projected) {
      return {
        world: withBody({ projected: null }),
        report: { kind: 'returned', spaceId: body.projected.spaceId },
      }
    }
    if (!input.standingIn) return { world, report: { kind: 'no-target' } }
    return {
      world: withBody({ projected: { spaceId: input.standingIn, at: input.at } }),
      report: { kind: 'projected', spaceId: input.standingIn },
    }
  },

  // The body changes radically and the identity underneath does not: a child's
  // eyes, the walk's own, and something that sees over the bulkheads.
  transformation: ({ body, withBody }) => {
    // The walk's own eyes, the girl she goes about as, and what she actually
    // is. Cycling from `null` rather than from a height keeps the visitor's
    // ordinary body first in the ring, where it belongs.
    const cycle: (number | null)[] = [null, 0.95, 3.4]
    const eyes = cycle[(cycle.indexOf(body.eyes) + 1) % cycle.length]
    return { world: withBody({ eyes }), report: { kind: 'reshaped', metres: eyes ?? 1.7 } }
  },

  // Cookie compresses hours of rest into a short treatment. What the walk has
  // to be rested of is the exhaustion its own techniques wrote down: the
  // tunnel that has been asked too often, and the aura committed to force.
  restoration: ({ world, body }) => ({
    world: {
      ...world,
      worm: world.worm ? { ...world.worm, crossings: 0 } : null,
      body: { ...body, enhance: 0, dance: 0 },
    },
    report: { kind: 'rested', hours: 24 },
  }),

  healing: mendWhatWasHurt,

  rhythm: ({ body, withBody }) => {
    const bars = body.dance + 1
    return { world: withBody({ dance: bars }), report: { kind: 'dance-played', bars } }
  },

  // Metamorphosen runs on the prologue: without the music there is nothing to
  // change shape with.
  mimicry: ({ world, ship, body, input, withBody }) => {
    if (!body.dance) return { world, report: { kind: 'dance-needed' } }
    if (body.mimic) {
      return { world: withBody({ mimic: null, eyes: null }), report: { kind: 'unmimicked' } }
    }
    const shape = solidById(ship, world, input.targetSolidId ?? null)
    if (!shape) return { world, report: { kind: 'no-solid' } }
    const worn = solidNow(shape, world.solids[shape.id])
    return {
      world: withBody({ mimic: shape.id, eyes: Math.max(0.4, worn.base + worn.height) }),
      report: { kind: 'mimicked', solidId: shape.id },
    }
  },

  /**
   * Music carried straight into the listener.
   *
   * What it soothes is the only thing in the walk that can be done to a sense:
   * it holds open the three the monkeys sealed. **Held open, not opened** — the
   * seal is another technique's hold and Melody does not undo it, she plays
   * over it, which is why `sealed` survives the piece and `soothed` is what the
   * muffle actually reads. Put the flute down and the ship closes over again,
   * and that difference is the whole of ch. 45's ending.
   *
   * The refusal first, because it is the one thing about her that a
   * reconstruction has to be careful with. Her ear reaches further than the
   * walk draws — that is attested and it is why the refusal is worded as a
   * refusal rather than as a failure — but a room the visitor is not standing
   * in has a bulkhead in front of it, and a walk that started reporting the
   * contents of the next compartment would be sourcing rooms off a sense
   * nobody can check.
   */
  melody: ({ world, ship, body, input }) => {
    if (input.targetId && input.standingIn && input.targetId !== input.standingIn) {
      return { world, report: { kind: 'ear-refused', spaceId: input.targetId } }
    }
    // Off the book there is no flute in the hand and no key to choose an air
    // with: the music is still hers, and it is still what holds a sense open.
    const opened = world.sealed > 0
    const heard: TourWorld = { ...world, body: { ...body, soothed: true } }
    if (!input.tune) return { world: heard, report: { kind: 'soothed', opened } }
    // A flute is heard where it is played: the reticle is never consulted for
    // *which* room, and a piece with nowhere to land is one nobody was in for.
    if (!input.standingIn) return { world: heard, report: { kind: 'no-target' } }
    return playTheTune(heard, ship, { tune: input.tune, spaceId: input.standingIn })
  },

  // Tyson's eye-wog, which is the one Guardian Spirit Beast in the walk that
  // comes up in front of its own user rather than being sent anywhere. It takes
  // what they have committed — the levy is the whole of the cost, and it takes
  // it whether or not there was any — and gives it back as light, in proportion
  // to what it got. Where the light goes is not a choice:
  //
  //   the room is dark    it goes into the room, and stays there
  //   the room is not     it goes onto the reader, as a bubble they carry
  //
  // Dark means what the blueprint says it means: a room the ship put no window
  // in. Nothing else aboard has an opinion about brightness, and inventing a
  // second one would be the walk making a claim it cannot support.
  'aura-levy': ({ world, ship, body, input }) => {
    const here = input.standingIn ? ship.spaces.get(input.standingIn) : null
    if (!here) return { world, report: { kind: 'no-target' } }
    const levied = body.enhance
    const daylight = ship.structures.some(
      (solid) => solid.spaceId === here.id && solid.kind === 'window',
    )
    if (!daylight && !world.lit.includes(here.id)) {
      return {
        world: { ...world, lit: [...world.lit, here.id], body: { ...body, enhance: 0 } },
        report: { kind: 'room-brightened', spaceId: here.id, levied },
      }
    }
    const halo = body.halo + 1 + levied
    return {
      world: { ...world, body: { ...body, enhance: 0, halo } },
      report: { kind: 'halo-raised', spaceId: here.id, levied, halo },
    }
  },

  // Predator gets stronger by correctly naming what it is up against. There
  // is exactly one thing in the walk to be up against: the aura's own holds.
  predator: ({ world, body, withBody }) => {
    const unnamed = holdsInWorld(world).find((hold) => !body.deduced.includes(hold))
    if (!unnamed) return { world, report: { kind: 'nothing-to-deduce' } }
    const deduced = [...body.deduced, unnamed]
    return {
      world: withBody({ deduced, enhance: Math.min(6, body.enhance + 1) }),
      report: { kind: 'deduced', what: unnamed, strength: deduced.length },
    }
  },

  // The wrapping neither heals nor deflects: while it is on, what the walk
  // would have done to the visitor is packed away inside it and stays there.
  // Cast on an armour already worn, it reads out what it is holding — taking
  // it off is not offered, because the damage in it has to go somewhere.
  'pain-armour': ({ world, body, withBody }) =>
    body.packed === null
      ? { world: withBody({ packed: 0 }), report: { kind: 'armour-worn' } }
      : { world, report: { kind: 'armour-holding', packed: body.packed } },

  'sun-flare': raiseTheSun,

  /**
   * Bird Manipulation with the reticle empty: have the flock survey the ship
   * and file what it sees. The walk will not.
   *
   * Every panel of this ability is a bird carrying something to somebody. Not
   * one of them is a bird looking, and a reconstruction that started sourcing
   * rooms from a survey no chapter draws would be manufacturing evidence under
   * the name of a real character — the exact thing `/tour/sources` exists to
   * make impossible. So the use is offered, refused, and the refusal says why:
   * that is a fact about the technique, and hiding the key would have hidden
   * the fact.
   */
  flock: ({ world }) => ({ world, report: { kind: 'flock-survey-refused' } }),

  // Judgment Chain plants a rule in a heart. Cast on a room, the heart is the
  // person standing there; cast with no target, the heart is the visitor's own.
  // The rules are spoken aloud at activation and never amended afterwards.
  'heart-vow': ({ world, ship, input }) => {
    const subjectId = input.targetId ?? 'self'
    if (subjectId !== 'self' && !ship.spaces.has(subjectId)) {
      return { world, report: { kind: 'no-target' } }
    }
    if (world.vows[subjectId]) {
      return { world, report: { kind: 'vow-locked', subjectId } }
    }
    const rules = input.rules ?? [
      subjectId === 'self'
        ? 'while the rule holds, Chain Jail is certain'
        : `do not enter ${subjectId}`,
      subjectId === 'self'
        ? 'to break the oath is to pierce your own heart'
        : `do not lay a hand on ${subjectId}`,
    ]
    const vow: VowState = { subjectId, rules, violated: false }
    return {
      world: {
        ...world,
        vows: { ...world.vows, [subjectId]: vow },
        body: subjectId === 'self' ? { ...world.body, vowed: vow } : world.body,
      },
      report: { kind: 'vow-declared', subjectId, rules },
    }
  },

  /**
   * Bungee Gum turned on its own user, which the manga does two ways.
   *
   * With a punishment packed away, it is Faux Tissu closing what was opened.
   * With nothing packed, it is the propulsion of ch. 39: the strand is anchored
   * and the visitor is pulled towards the anchor rather than the anchor towards
   * them. What that is worth rises with the stretch, because the force does —
   * a propulsion that gave the same shove from one metre and from nine would be
   * a winch, and this aura is not one. With nothing stuck, the gum still has
   * the visitor's own frame to contract against, and that is the floor.
   */
  elastic: ({ world, ship, body, input, withBody }) => {
    if (body.packed !== null && body.packed > 0) {
      return {
        world: withBody({ packed: body.packed - 1 }),
        report: { kind: 'gum-healed', healed: 1 },
      }
    }
    const tension = strandTension(world, ship, input.at)
    const committed = Math.min(6, body.enhance + 1 + Math.round(tension * 2))
    return { world: withBody({ enhance: committed }), report: { kind: 'gum-propulsion', tension } }
  },
}

function castOnBody(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult {
  const body = world.body
  const withBody = (patch: Partial<TourBody>): TourWorld => ({
    ...world,
    body: { ...body, ...patch },
  })

  const cast = acceptsFamily(kind, 'body') ? BODY_CASTS[kind] : undefined
  return cast
    ? cast({ world, ship: input.ship, body, kind, input, withBody })
    : { world, report: { kind: 'inert' } }
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
