/**
 * Which techniques the walk performs at all, and on what.
 *
 * The gate in front of every cast table: three sets naming what the walk has
 * written a cast for, by the noun it is aimed at, plus the handful of
 * predicates that answer "is anything holding this world open at all". None of
 * it reduces a world or builds a report — it only says what is admissible,
 * which is why it can sit under everything else without importing any of it.
 */
import type { HatsuInteractionKind, HatsuProfile } from '$lib/nen/hatsuRegistry'
import { BODY_KINDS } from '../bodyKinds'
import {
  DOUBLE_MODES,
  EYE_MODES,
  OWL_MODES,
  type TourBody,
  type TourBook,
  type TourDoubleMode,
  type TourEyeMode,
  type TourOwlMode,
  type TourWorld,
} from './types'

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
  // Combo Master. On a room because that is where the co-presence is measured:
  // the console counts the days the visitor spends in the same compartment as
  // whatever it is reading.
  'decipher',
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
  'decipher', // Cast without target opens the console: SELECT, then the menu.
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
export const EITHER_TARGET = new Set<HatsuInteractionKind>([
  'elastic',
  'dowsing',
  'puppet',
  'flock',
])

/**
 * The two of `EITHER_TARGET` whose other target is a *room* rather than a solid.
 *
 * Dowsing and the puppet strings are aimed at a thing under the reticle, so an
 * empty solid is enough to send them to the body. Bungee Gum is aimed at either
 * and Bird Manipulation only ever at a room — so for these, an aimed room has
 * to count as aimed too, or the self-cast would swallow every cast made while
 * standing anywhere.
 */
export const ROOM_OR_BODY = new Set<HatsuInteractionKind>(['elastic', 'flock'])

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
export const TOUR_KINDS = new Set<HatsuInteractionKind>([...TOUR_HATSU_KINDS, ...BODY_KINDS])

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
