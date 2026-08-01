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
import type { Polygon, Space, Structure, StructureKind, Vec2, WallSegment } from './types'
import type { HatsuInteractionKind, HatsuProfile } from '$lib/nen/hatsuRegistry'

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
const EITHER_TARGET = new Set<HatsuInteractionKind>(['elastic', 'dowsing', 'puppet'])

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
export const OWL_MODES = ['wander', 'shoulder', 'random'] as const
export const DOUBLE_MODES = ['follow', 'wander', 'scout'] as const
export const EYE_MODES = ['pilot', 'scout', 'film'] as const

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
export const TUNES = ['bloom', 'scatter', 'dance'] as const

/** Which air is being played, or was last played. */
export type TourTune = (typeof TUNES)[number]

/** Which bird was sent, which watch the double is under, what the insect is told. */
export type TourOwlMode = (typeof OWL_MODES)[number]
export type TourDoubleMode = (typeof DOUBLE_MODES)[number]
export type TourEyeMode = (typeof EYE_MODES)[number]

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
  /** The solid Black Voice is currently controlling. */
  puppet: string | null
  /**
   * What Blinky is holding, newest last.
   *
   * The vacuum is the one technique in the walk that gives anything back: what
   * goes into it comes out of it, and it comes out in the order a bag empties —
   * the last thing swallowed first. A stack, therefore, and not a set: the
   * order is the ability.
   */
  hoover: string[]
  /** Where the remote eye is parked, or `null` while it rides the visitor. */
  eye: string | null
  /**
   * What Sayird's insect is currently told to do.
   *
   * The eye used to be one switch: a room had it or it did not, and a second
   * cast on the same room took it home. That is the sphere posted and the
   * sphere recalled, which is two of the module's five verbs — so the other
   * three are here. Piloted, it goes where it is sent and stays. Scouting, it
   * takes a door on its own every few seconds, which is the ability's own
   * `scout`. Filming, it holds where it is and a cast on its own room records
   * that room instead of calling the insect in.
   */
  eyeMode: TourEyeMode
  /**
   * What the feed has recorded, in the order it recorded it.
   *
   * The corner already shows the room the insect is in; this is what it has
   * been through, which is what makes the technique an account of the ship
   * rather than a second window onto one room of it. Each frame carries what
   * was standing there when the insect passed, because a room filmed empty and
   * a room filmed full are not the same intelligence.
   */
  eyeFilm: { spaceId: string; seen: number }[]
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
   * How many times Padaille's arm has come down.
   *
   * A tally rather than a hold — nothing is being held, the count is only what
   * the next draw is read off — so `worldIsQuiet` does not consult it and Nen
   * Stitches has nothing here to put back. It exists because a technique whose
   * whole character is that you do not know what you will get has to give a
   * different answer to the same target twice.
   */
  swings: number

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
  /** The mode the double is operating in */
  doubleMode: TourDoubleMode
  /** Fugetsu's tunnel: a pair, and how much it has been asked for. */
  worm: { a: string; b: string; crossings: number } | null
  /** The rooms the snakes are loose in, and whether they have had a victim. */
  snakes: { rooms: string[]; fed: boolean } | null
  /** The room the bait was materialized in, which closes once it is taken. */
  trap: string | null
  /** Where the visitor was standing before the room they are in now. */
  cameFrom: string | null
  /**
   * Where the aura came down in each room it was cast on.
   *
   * Not a hold and not spent: it is the walk remembering that a card laid on
   * the promenade was laid *there*, twelve metres down the reticle, rather than
   * at the point a hundred-and-forty-metre room happens to average out to.
   */
  landed: Record<string, Vec2>

  /**
   * The technique the visitor currently has up, or `null` in Zetsu.
   *
   * Every other field here is something a cast *did*. This one is what is
   * being held, and it exists for the abilities that are passive: Voconte's
   * doors do not have to be aimed at anything to send someone somewhere — the
   * hideout is wired, and walking through a frame is the whole of the
   * activation. Without this the walk would have to ask the page what aura is
   * up, and the page would have to keep a rule of its own.
   */
  holding: HatsuInteractionKind | null

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
  /**
   * The room the owl is perched in, which keeps what the trail would otherwise
   * let go.
   *
   * A bird has to be somewhere. It was a flag when all it did was hold the
   * record open; now that the walk draws it, the technique has to say where it
   * was attached, and the answer is the room it was cast on.
   */
  owl: string | null
  /**
   * Which of Secret Window's three birds was sent, which is what decides where
   * "where it was cast" actually is.
   *
   * One owl, three ways of sending it: the free bird perches on the room down
   * the reticle and works its way through the ship on its own, the shoulder
   * bird stays on the visitor and moves room for room with them, and the third
   * is let go blind and lands wherever it lands. The mode is kept rather than
   * the cast because the difference outlives the cast: the room the bird is in
   * a minute later is a function of which bird it is.
   */
  owlMode: TourOwlMode
  /**
   * How much of its twenty seconds the bird has left, in seconds.
   *
   * The owl is materialized rather than attached: it holds for twenty seconds
   * and then it is not there any more. Counted down by the walk's own clock a
   * second at a time, because the scene is the only thing aboard that has one
   * — everything else in this world is a function of what was cast.
   */
  owlLife: number
  /**
   * What the bird brings back: where it was, second by second of its flight.
   *
   * Recorded whole while it is up and cut to the last ten seconds when it
   * goes, which is the whole of the technique's promise — not everything it
   * saw, the end of it. `second` is how far into the flight the bird arrived
   * there, so the walk can play the film back at the speed it happened.
   */
  owlFilm: { spaceId: string; second: number }[]
  /**
   * Rooms whose Hatsu Benjamin's baton has taken, which wear his palm star.
   *
   * The book already holds what was inherited; this is where it was inherited
   * from, which is the only part of it there is anything to see.
   */
  stars: string[]
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
   * Rooms the soft air put in flower, and rooms the sharp one left its notes
   * loose in.
   *
   * Two lists rather than one field with a value in it, because the airs do not
   * replace each other: a room can be in flower with the notes of the last
   * piece still hanging in it, which is what an instrument played twice into
   * the same room actually leaves behind. The lively air is not here — what it
   * takes hold of is the things standing in the room, so it is written on them.
   */
  flowered: string[]
  scattered: string[]

  /** The book, and what is in it. */
  book: TourBook

  /** What the techniques have made of the visitor themselves. */
  body: TourBody

  /** Rooms where a Bungee Gum trap is set. */
  gumTraps: string[]

  /**
   * The room Camilla's Guardian Spirit Beast is hanging in, or `null`.
   *
   * One room and one beast: the ability is a single animal, so raising it
   * somewhere else is that same animal moving rather than a second one. What it
   * does to the room it is in is written on the solids — see `adrift` — because
   * the beast is a body and the levitation is a hold, and the walk has always
   * kept those two apart.
   */
  medusa: string | null

  /**
   * The room Tserriednich's Guardian Spirit Beast is standing in, or `null`.
   *
   * It goes where it was last asked to touch something: the beast is what
   * delivers each of the three contacts, so it has to be beside the thing it is
   * marking. What the contacts did is on the solids themselves — see `lies` —
   * and this is only where the animal is.
   */
  chimera: string | null

  /**
   * Zhang Lei's Guardian Spirit Beast: where it hangs, and what is in its mouth.
   *
   * `coin` is the value of the coin currently hanging at the wheel's mouth,
   * which is the whole of the ability — one is produced, it is worth ten times
   * the last, and it is worth nothing to anyone until somebody takes it. There
   * is always one: the wheel mints the next the instant the last is taken, so
   * this is a number rather than a number-or-nothing.
   */
  wheel: { spaceId: string; coin: number } | null

  /**
   * The room Tubeppa's Guardian Spirit Beast is squatting in, or `null`.
   *
   * What it is doing there is on the solids — see `melting` — and it goes on
   * doing it after the cast: the gas is the one technique in the walk that
   * keeps working while nobody touches anything, so the scene ticks it the way
   * it ticks the fish. Move the beast and the room it left stops melting where
   * it had got to, which is what a gas that has stopped being made does.
   */
  toad: string | null

  /**
   * Rooms Tyson's eye-wogs have lit, which had no daylight of their own.
   *
   * The levy gives back in proportion to what it took, and what the walk has to
   * give back with is light: a room the blueprint put no window in is a room
   * lit by whatever the reconstruction hangs in it, and this is the list of the
   * ones an eye-wog has improved on. The bubble the visitor carries is the
   * other half of the same answer — see `TourBody.halo`.
   */
  lit: string[]

  /**
   * The room Luzurus's Guardian Spirit Beast is coiled in, or `null`.
   *
   * The bait was always the visible half of Desire Trap — see `trap` — and this
   * is the half that closes: the beast is what secretes over everything in the
   * room, what reels in what the secretion caught, and what eats it when it
   * arrives. The reeling is on the walk's clock rather than on a cast, like the
   * gas, because a trap that only worked while you kept pressing a key would be
   * a trap you could stand still and win.
   */
  centipede: string | null

  /**
   * Salé-salé's Guardian Spirit Beast: the room it is filling, and how full.
   *
   * `filled` is a count of the steps it has taken rather than a fraction,
   * because the walk has no continuous quantity in it anywhere — see the melt,
   * which keeps the same rule. It counts up to `SMOKE_FULL` on the walk's clock
   * and stops there, and stopping is the visible part: a beast whose mouths are
   * still open is a room that is still filling, and a room that is full is a
   * beast that has shut them.
   */
  smoke: { spaceId: string; filled: number } | null

  /**
   * The rooms Momoze's Guardian Spirit Beasts are loose in.
   *
   * The only one of the eight that is a crowd rather than an animal: what the
   * ability puts in the ship is a great many of them, of every size and shape,
   * and they do not keep to the room they were called into — they go through
   * the walls and carry on. So this is a list of rooms rather than one, and
   * what it means is "the flock is somewhere in here", which is as precise as
   * the ability ever gets.
   */
  menagerie: string[]

  /**
   * The room Marayam's Guardian Spirit Beast is standing in the doorway of.
   *
   * The isolation is already carried by `isolated` and the refusal to let
   * anyone out by `pinned`; this is the animal that is doing both, and it is
   * kept separately because it is a thing in the room rather than a rule about
   * one — the walk has to know where to draw it, and what to make roar at
   * somebody trying the door.
   */
  dragon: string | null

  /**
   * The room Camilla's other beast is in, breaking it up.
   *
   * Cat's Name was the one ability in the walk that was entirely a promise: a
   * room wore the name, and unless somebody killed it nothing was ever seen.
   * The cat is what makes the promise visible — it comes when the name is put
   * on a room and it takes that room apart while it waits, one thing at a time,
   * on the same clock the other beasts work on.
   */
  cat: string | null

  /**
   * Where the visitor was standing when a Guardian Spirit Beast was called up.
   *
   * Six of the ten are a body that turns up *with* you rather than one that
   * appears wherever you happened to be looking: the wheel puts a coin out
   * where you can reach it, the cat comes to the room you are in, the jellyfish
   * hangs over your head. Drawn at the reticle instead, they came up in the far
   * end of a hundred-and-forty-metre promenade, or in a bulkhead — which is a
   * beast nobody ever sees and a beast standing in the steel.
   *
   * So the walk remembers the caster's own spot, once, at the moment of the
   * cast. Not the visitor's live position: a beast that walked around after you
   * would be a familiar, and none of these is one. One field rather than one
   * per beast, because the walk hands out one aura at a time.
   *
   * The way they were facing is kept with the spot, because a point on its own
   * is not enough to put a beast where they can see it: stepped off along the
   * ship's own axes it came up behind the visitor as often as in front, and a
   * beast at your back is a beast that never appeared.
   */
  summoned: { spaceId: string; at: Vec2; heading: number } | null
}

export interface TourBook {
  /** Techniques taken and kept. Only an open page can be cast. */
  pages: HatsuInteractionKind[]
  /** The page Skill Hunter has the book open on. */
  open: HatsuInteractionKind | null
  /** The second page Double Face keeps live beside it. */
  bookmark: HatsuInteractionKind | null
  /** Culdcept's cards: acquired without taking, and spent on use. */
  cards: HatsuInteractionKind[]
  /** Rooms Steal Chain has drained: no technique reaches them until it returns. */
  zetsu: string[]
  /** The page the dolphin has lent out, which the next cast consumes. */
  loan: HatsuInteractionKind | null
}

export const CLOSED_BOOK: TourBook = {
  pages: [],
  open: null,
  bookmark: null,
  cards: [],
  zetsu: [],
  loan: null,
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
  /**
   * The air currently coming out of the flute, or `null` while it is down.
   *
   * What it is for is the flute itself: an instrument held at the lips is being
   * played and one held at the side is not, and that is the difference a
   * visitor can see. It is the last air played rather than a count of them,
   * because the pieces do not stack — see `flowered`.
   */
  playing: TourTune | null
  /** The holds Predator has correctly named, which is what makes it stronger. */
  deduced: string[]

  /**
   * What Pain Packer has packed away, or `null` while the wrapping is off.
   *
   * The walk cannot injure anyone, but it does punish: a guard puts an intruder
   * back, a room refuses to let go, a declared rule is broken. Those are the
   * only blows it deals, so they are what the wrapping takes — and it takes
   * them by keeping them rather than by cancelling them, which is why the count
   * matters and nothing is given back until the sun rises on it.
   */
  packed: number | null
  /**
   * The timestamp when the automatic pilot (Black Voice self-cast) ends, or null if not active.
   */
  autopilotUntil: number | null

  /**
   * What the visitor has taken off Zhang Lei's wheel, as one number.
   *
   * The coin accumulates Nen and the Nen is the whole of what it is worth, so
   * what a coin in the pocket looks like is aura: nought while nothing has been
   * taken, and the value of everything taken once something has. The scene
   * reads it as a light around the visitor and the panel reads it as a figure;
   * neither of them has to know that a coin was involved.
   */
  gilded: number

  /**
   * How bright the bubble Tyson's eye-wog left round the visitor is.
   *
   * Nought while there is none. It goes up when the levy has nowhere dark to
   * spend itself — a room with daylight in it, or one an eye-wog has already
   * been through — because the happiness is returned either way, and if it
   * cannot go into the room it goes onto the reader.
   */
  halo: number
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
  playing: null,
  deduced: [],
  packed: null,
  autopilotUntil: null,
  gilded: 0,
  halo: 0,
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
  /**
   * Padaille's drill went through it.
   *
   * The walk bakes a solid as a box and has nowhere to put a hole in one, so
   * what it draws is not the bore but the consequence of it: a thing with a
   * hole through it stops being a thing you have to walk around. It stands
   * exactly where it stood and the visitor goes straight through where the
   * drill was, which is the only part of a bore the ship can actually feel.
   */
  bored?: boolean
  /** The Sun and Moon's two marks. */
  mark?: 'sun' | 'moon'
  /**
   * The lively air has it: it is dancing where it stands.
   *
   * A hold like any other, so a dancing coffin is lifted out of the baked deck
   * and drawn by the walk — but the only one that changes nothing about the
   * thing. It stands where it stood, it stops the visitor where it stopped
   * them, and every other technique still finds it exactly where it was.
   */
  dancing?: boolean
  /**
   * Camilla's beast has it: it is off the deck, turning over in the air.
   *
   * Unlike the lively air's hold, this one changes something — a thing in the
   * air is not a thing you walk into, so `solidWalls` drops it and the room's
   * floor is clear for as long as the beast is up. That is the difference
   * between a table dancing on the spot and a table two metres over your head.
   */
  adrift?: boolean
  /**
   * How many times Tserriednich's beast has touched this one: 1, 2 or 3.
   *
   * The escalation is the ability, so it is a count rather than three flags:
   * the first contact shoves the thing, the second leaves the green on it, and
   * the third is the one there is no fourth after — the solid is `gone` and a
   * `monster` stands where it was.
   */
  lies?: number
  /** The third contact landed: what is here now is not what was here. */
  monster?: boolean
  /**
   * How far Tubeppa's gas has got through this one: 1, 2, 3, and then nothing.
   *
   * A stage rather than a rate, because the walk has no continuous quantity in
   * it anywhere else: each tick of the gas takes every solid in the room one
   * step further down, `squash` carries what that looks like, and the fourth
   * step is `gone`. Nothing is given back — a thing that has melted has melted,
   * and only Nen Stitches argues with that.
   */
  melting?: number
  /**
   * Luzurus's secretion is on this one: it is being reeled in, and then eaten.
   *
   * The number is how many steps it has taken towards whoever set the trap, and
   * the reason it is a count rather than a flag is that it is the only hold in
   * the walk that has somewhere to arrive: at the end of it the thing is not
   * moved, it is `gone`, because the beast has closed on it.
   */
  glued?: number
  /** Order Stamp has put its 人 on this one: it is a puppet now. */
  stamped?: boolean
  /**
   * The puppet is locked, and locked is what an order is addressed to.
   *
   * Twenty can wear the stamp at once, which is far too many to speak to as a
   * crowd, so the stamp keeps a second state on top of it: an order goes to the
   * locked ones only, and an order given with none locked is spoken to nobody.
   */
  locked?: boolean
  /** Volleys landed, for the techniques that reward commitment. */
  hits?: number
  /** A Gallery Fake copy, and the solid it is a copy of. */
  copyOf?: string
  /** Aura color applied by a hatsu, such as pink for Texture Surprise */
  aura?: string
}

export const EMPTY_WORLD: TourWorld = {
  laidOpen: false,
  isolated: null,
  doors: [],
  emptied: [],
  puppet: null,
  hoover: [],
  eye: null,
  eyeMode: 'pilot',
  eyeFilm: [],
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
  swings: 0,
  shut: [],
  guarded: [],
  pinned: null,
  vow: null,
  pact: null,
  devouring: [],
  cards: {},
  double: null,
  doubleMode: 'follow',
  worm: null,
  snakes: null,
  trap: null,
  cameFrom: null,
  landed: {},
  holding: null,
  trail: [],
  owl: null,
  owlMode: 'wander',
  owlLife: 0,
  owlFilm: [],
  stars: [],
  foreseen: null,
  verses: [],
  poem: [],
  dial: null,
  droplets: [],
  ninelives: [],
  curse: null,
  souls: [],
  flowered: [],
  scattered: [],
  book: CLOSED_BOOK,
  body: RESTING_BODY,
  gumTraps: [],
  medusa: null,
  chimera: null,
  wheel: null,
  toad: null,
  lit: [],
  centipede: null,
  smoke: null,
  menagerie: [],
  dragon: null,
  cat: null,
  summoned: null,
}

/** Nothing taken, nothing open, nothing drained. */
export const bookIsShut = (book: TourBook): boolean =>
  !book.pages.length && !book.cards.length && !book.zetsu.length && !book.loan

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
  !body.playing &&
  !body.deduced.length &&
  body.packed === null &&
  !body.gilded &&
  !body.halo

/** Nothing in the world is being held by aura. */
export const worldIsQuiet = (world: TourWorld): boolean =>
  !world.laidOpen &&
  !world.isolated &&
  !world.doors.length &&
  !world.emptied.length &&
  !world.hoover.length &&
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
  !world.stars.length &&
  !world.foreseen &&
  !world.verses.length &&
  !world.poem.length &&
  !world.dial &&
  !world.droplets.length &&
  !world.ninelives.length &&
  !world.curse &&
  !world.souls.length &&
  !world.gumTraps.length &&
  !world.flowered.length &&
  !world.scattered.length &&
  !world.medusa &&
  !world.chimera &&
  !world.wheel &&
  !world.toad &&
  !world.lit.length &&
  !world.centipede &&
  !world.smoke &&
  !world.menagerie.length &&
  !world.dragon &&
  !world.cat &&
  !world.summoned &&
  bookIsShut(world.book) &&
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
  | { kind: 'eye-recalled'; rooms: number }
  | { kind: 'eye-mode-changed'; mode: TourEyeMode }
  | { kind: 'eye-piloted'; spaceId: string }
  | { kind: 'eye-flown'; spaceId: string }
  | { kind: 'eye-filmed'; spaceId: string; seen: number }
  | { kind: 'sealed'; stage: number }
  | { kind: 'dowsed'; spaceId: string; distance: number; decks: number }
  | { kind: 'watching'; spaceId: string }
  | { kind: 'isolated'; spaceId: string; occupant: boolean }
  | { kind: 'stripped'; spaceId: string; count: number }
  | { kind: 'laid-open'; spaces: number; decks: number }
  | { kind: 'emptied'; spaceId: string; structures: number }
  | { kind: 'swallowed'; solidId: string; held: number }
  | { kind: 'coughed-up'; solidId: string; spaceId: string; held: number }
  | { kind: 'bag-empty' }
  | { kind: 'refused'; spaceId: string }
  | { kind: 'dispatched'; spaceId: string }
  | { kind: 'double-mode-changed'; mode: TourDoubleMode }
  | { kind: 'owl-mode-changed'; mode: TourOwlMode }
  | { kind: 'owl-flown'; spaceId: string }
  | { kind: 'owl-expired'; rooms: number }
  // On the solids.
  | { kind: 'no-solid' }
  | { kind: 'bound-fast'; solidId: string }
  | { kind: 'gum-set'; solidId: string }
  | { kind: 'gum-pulled'; solidId: string; otherId: string }
  | { kind: 'forged'; solidId: string; as: StructureKind }
  | { kind: 'wrapped'; solidId: string }
  | { kind: 'unwrapped'; solidId: string }
  | { kind: 'pushed'; solidId: string; metres: number }
  // Order Stamp, which is three states rather than one: stamped, locked, told.
  | { kind: 'stamped'; solidId: string; puppets: number }
  | { kind: 'stamp-locked'; solidId: string; locked: boolean; locks: number }
  | { kind: 'ordered'; spaceId: string; puppets: number }
  | { kind: 'no-lock'; stamped: number }
  | { kind: 'copied'; solidId: string }
  | { kind: 'crushed'; solidId: string }
  | { kind: 'volley'; solidId: string; hits: number }
  | { kind: 'shattered'; solidId: string }
  | { kind: 'wound-up'; turns: number }
  | { kind: 'launched'; solidId: string; metres: number }
  | { kind: 'struck'; solidId: string }
  /** The ball on the end of the Dowsing Chain, brought down on a thing. */
  | { kind: 'lashed'; solidId: string; hits: number }
  | { kind: 'bound'; solidId: string }
  | { kind: 'released'; solidId: string }
  /** Both arms are already round something, so there is nothing to catch with. */
  | { kind: 'arms-full'; solidIds: string[] }
  | { kind: 'came-up-under'; solidId: string; otherId: string }
  | { kind: 'came-up-empty'; spaceId: string }
  | { kind: 'stitched'; solidId: string }
  | { kind: 'nothing-to-stitch'; solidId: string }
  | { kind: 'animated'; solidId: string }
  | { kind: 'shred-stuck'; solidId: string }
  | { kind: 'shred-cut'; solidId: string; left: number }
  // Padaille's three, which are three reports rather than one with a tool on
  // it: what the visitor wants to read is what happened, and finding out which
  // tool it was is the same sentence.
  | { kind: 'hammered'; solidId: string }
  | { kind: 'bored'; solidId: string }
  | { kind: 'halved'; solidId: string; apart: boolean }
  | { kind: 'grown'; solidId: string }
  | { kind: 'growth-refused'; solidId: string }
  | { kind: 'marked'; solidId: string; mark: 'sun' | 'moon' }
  | { kind: 'detonated'; solidId: string; otherId: string }
  | { kind: 'swapped'; solidId: string; otherId: string }
  | { kind: 'cargo-taken'; solidId: string }
  | { kind: 'cargo-landed'; solidId: string; spaceId: string }
  | { kind: 'puppeted'; solidId: string }
  | { kind: 'puppet-released'; solidId: string }
  | { kind: 'autopilot-started' }
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
  // The Guardian Spirit Beasts.
  | { kind: 'beast-raised'; spaceId: string; solids: number }
  | { kind: 'beast-dismissed'; spaceId: string; solids: number }
  | { kind: 'wheel-raised'; spaceId: string; coin: number }
  | { kind: 'wheel-dismissed'; spaceId: string }
  | { kind: 'coin-taken'; spaceId: string; value: number; gilded: number }
  | { kind: 'lie-pushed'; solidId: string; metres: number }
  | { kind: 'lie-greened'; solidId: string }
  | { kind: 'lie-transformed'; solidId: string }
  | { kind: 'gas-loosed'; spaceId: string; solids: number }
  | { kind: 'gas-lifted'; spaceId: string }
  | { kind: 'melted'; spaceId: string; melting: number; gone: number }
  | { kind: 'room-brightened'; spaceId: string; levied: number }
  | { kind: 'halo-raised'; spaceId: string; levied: number; halo: number }
  | { kind: 'reeled'; spaceId: string; pulled: number; eaten: number }
  | { kind: 'smoke-loosed'; spaceId: string }
  | { kind: 'smoke-lifted'; spaceId: string; filled: number }
  | { kind: 'smoke-spread'; spaceId: string; filled: number; full: boolean }
  | { kind: 'flock-loosed'; rooms: number; beasts: number }
  | { kind: 'flock-called-in'; rooms: number }
  | { kind: 'isolation-lifted'; spaceId: string }
  | { kind: 'crushed-one'; spaceId: string; solidId: string; left: number }
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
  /**
   * One air played into one room. `on` is false when the same air was played
   * into the same room again, which is what takes the piece back off it, and
   * `solids` is what the lively one got moving — nought for the other two.
   */
  | { kind: 'tune-played'; tune: TourTune; spaceId: string; on: boolean; solids: number }
  | { kind: 'deduced'; what: string; strength: number }
  | { kind: 'nothing-to-deduce' }
  | { kind: 'armour-worn' }
  | { kind: 'armour-holding'; packed: number }
  | { kind: 'packed-away'; spaceId: string; packed: number }
  | { kind: 'sun-risen'; metres: number; solids: number }
  // On the record.
  | { kind: 'owl-attached'; rooms: number }
  | { kind: 'owl-recalled'; rooms: number }
  | { kind: 'foreseen'; spaceId: string }
  | { kind: 'vision-ended' }
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
  // On the techniques.
  | { kind: 'nothing-to-steal'; spaceId: string }
  | { kind: 'taken-into-the-book'; spaceId: string; technique: HatsuInteractionKind }
  | { kind: 'needs-two-pages' }
  | { kind: 'bookmarked'; technique: HatsuInteractionKind }
  | { kind: 'acquisition-failed'; spaceId: string }
  | { kind: 'carded'; spaceId: string; technique: HatsuInteractionKind }
  | { kind: 'not-eligible'; spaceId: string }
  | { kind: 'inherited'; spaceId: string; technique: HatsuInteractionKind }
  | { kind: 'drained'; spaceId: string; technique: HatsuInteractionKind }
  | { kind: 'needs-emperor-time' }
  | { kind: 'nothing-to-lend' }
  | { kind: 'lent'; technique: HatsuInteractionKind }
  | { kind: 'page-spent'; technique: HatsuInteractionKind }
  | { kind: 'in-zetsu'; spaceId: string }
  // Bungee Gum
  | { kind: 'gum-trap-set'; spaceId: string }
  | { kind: 'gum-rebound'; spaceId: string }
  | { kind: 'gum-propulsion' }
  | { kind: 'gum-healed'; healed: number }

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
  /**
   * Which of The Sun and Moon's two hands is casting.
   *
   * Genthru puts the sun on with one hand and the moon with the other, and
   * which one he uses is his own decision rather than a turn taken — so the
   * walk gives the two marks two keys, and this is which of them was pressed.
   * Nothing else in the roster reads it.
   */
  mark?: 'sun' | 'moon'
  /**
   * Which of Enchanting Music's three airs is being played.
   *
   * The same shape as the hand above and for the same reason: three keys, and
   * which one was pressed is the whole of what the walk has to carry across.
   * Absent, the flute is not raised at all and the technique does what it did
   * before it had one — it soothes.
   */
  tune?: TourTune
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
const FORGERIES: StructureKind[] = [
  'painting',
  'cabinet',
  'bars',
  'basin',
  'casket',
  'bed',
  'seat',
  'table',
  'spring',
  'platform',
  'counter',
  'window',
  'pillar',
  'manacle',
  'camera',
  'telephone',
  'duct',
  'vent',
]

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
    aura: hold.aura ?? structure.aura,
  }
}

/** Solids the aura has lifted out of their deck, so the baked mesh drops them. */
export const heldSolidIds = (world: TourWorld): string[] => Object.keys(world.solids)

/**
 * How many things Snake Arm can hold at once, which is how many arms there are.
 *
 * The technique is not a field the visitor sets on a room: it is a limb, sent
 * out and wrapped round something, and while it is round that thing it is not
 * available for anything else. Two of them is the whole budget.
 */
export const SNAKE_ARMS = 2

/**
 * What the arms currently have, in the order the world records them.
 *
 * The order is what says which arm: first the left, then the right. It is the
 * record order rather than the order they were caught in, which is stable for
 * as long as the holds stand and is all the scene needs to keep a snake on the
 * same shoulder from one frame to the next.
 */
export const boundSolidIds = (world: TourWorld): string[] =>
  Object.entries(world.solids)
    .filter(([, hold]) => hold.bound && !hold.gone)
    .map(([id]) => id)

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
  const angle = seconds * 0.6 + (phase * Math.PI) / 180
  return [Math.cos(angle) * 1.4, Math.sin(angle) * 1.4]
}

/**
 * Where a solid the lively air took hold of is, this instant.
 *
 * A hop and a small sway about where it stands, computed rather than stored for
 * the reason the wander is, and off the same hash — so two things dancing in
 * one room are never in step, and the same thing dances the same way twice.
 *
 * The sway is deliberately narrower than a hand: the collision test does not
 * read this, so a dancing table still stops the visitor exactly where the table
 * stands, and anything wider would be a thing that had left its own floor.
 */
export function danceOffset(id: string, seconds: number): [number, number, number] {
  let phase = 0
  for (let i = 0; i < id.length; i++) phase = (phase * 31 + id.charCodeAt(i)) % 360
  const beat = seconds * 3.4 + (phase * Math.PI) / 180
  // Off the floor and down again — the rise is `abs`, because a thing that
  // dropped as far below its floor as it rose above it is a thing falling
  // through the deck.
  return [Math.sin(beat * 0.5) * 0.12, Math.abs(Math.sin(beat)) * 0.24, Math.cos(beat * 0.5) * 0.12]
}

/**
 * Where a thing the jellyfish has off the deck is, this instant.
 *
 * Nothing like the dance, which is a hop on the spot: this is a thing with no
 * floor under it any more, so it climbs, drifts and turns, and the three are on
 * periods that do not divide into each other — a room the beast has hold of
 * never comes back round to the arrangement it started in.
 *
 * The rise is the tell. A quarter of a metre of hop reads as dancing; a metre
 * and a half of it, with the thing turning as it goes, reads as a room whose
 * contents have stopped obeying the deck. The phase is off the id, as
 * everywhere else here, so twenty things in one room go up in their own time
 * and the same room lifts the same way twice.
 *
 * The fourth number is the turn, in radians: `driftSolids` needs it, and a
 * levitating table that kept its bearing would be a table on an invisible lift.
 */
export function driftOffset(id: string, seconds: number): [number, number, number, number] {
  let phase = 0
  for (let i = 0; i < id.length; i++) phase = (phase * 31 + id.charCodeAt(i)) % 360
  const own = (phase * Math.PI) / 180
  // Up and held up: the rise is an offset sine about a metre off the deck
  // rather than one that touches down, because a thing that came back to the
  // floor every few seconds is a thing being bounced rather than one adrift.
  const rise = 1.05 + Math.sin(seconds * 0.5 + own) * 0.45
  return [
    Math.sin(seconds * 0.37 + own) * 0.9,
    rise,
    Math.sin(seconds * 0.29 + own * 1.7) * 0.9,
    seconds * 0.33 + own,
  ]
}

/**
 * The three things Padaille's arm can turn out to be.
 *
 * Ordered as the swing finds them rather than by what they do: the visitor
 * does not choose, so there is nothing here for them to walk round. Every
 * other three-way technique in the walk — the flute's airs, the owl's watches,
 * the eye's orders — is a manner the visitor sets and can set back. This one
 * is the opposite of that, and the list exists only so the draw has something
 * to land on.
 */
export const PADAILLE_TOOLS = ['hammer', 'drill', 'axe'] as const
export type PadailleTool = (typeof PADAILLE_TOOLS)[number]

/**
 * Which of the three the arm became, this swing.
 *
 * Off the hash of the target and the tally, for the reason the wander and the
 * dance are: the walk has no die in it anywhere, and a technique that rolled
 * `Math.random` would be the one thing in here that answered differently on a
 * replay of the same walk. Reading the tally as well as the id is what stops
 * the same cupboard from being hammered forever — hit it twice and the second
 * swing is drawn again, not remembered.
 */
export function toolFor(id: string, swings: number): PadailleTool {
  let phase = 0
  for (let i = 0; i < id.length; i++) phase = (phase * 31 + id.charCodeAt(i)) % 997
  return PADAILLE_TOOLS[(phase + swings * 7) % PADAILLE_TOOLS.length]
}

/** How flat the hammer leaves a thing it has driven into the deck. */
export const HAMMERED_SQUASH = 0.16

/** Everything the beast has off the deck, which is what the panel counts. */
export const adriftSolidIds = (world: TourWorld): string[] =>
  Object.entries(world.solids)
    .filter(([, hold]) => hold.adrift && !hold.gone)
    .map(([id]) => id)

/**
 * Momoze's flock, out over the rooms nearest wherever the visitor is.
 *
 * Not a cast. Everything else in the walk that puts something in the ship is
 * aimed at a room, and this one has nothing to aim: what the ability does is
 * ask, endlessly, wherever it happens to be, and the beasts are the asking. So
 * the page looses them the moment the aura goes up — see the passive branch in
 * `/tour` — and this is what it calls.
 *
 * They are loosed over the ten rooms nearest the visitor, which is the snakes'
 * own reach and deliberately the same number: it is the walk's established
 * answer to "near where you are standing", and a flock spread over three
 * hundred rooms is a flock nobody ever meets. `null` when they are already out,
 * so raising the aura twice does not re-roll where they are.
 */
export function looseTheFlock(
  world: TourWorld,
  ship: Ship,
  standingIn: string | null,
  at: Vec2,
): TourCastResult | null {
  if (world.menagerie.length) return null
  const here = standingIn ? ship.spaces.get(standingIn) : null
  const rooms = [...ship.spaces.values()]
    .filter((space) => space.tierId === (here?.tierId ?? ship.tiers[0].id))
    .map((space) => ({ space, distance: distanceTo(ship, space, at, standingIn).metres }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, FLOCK_ROOMS)
    .map((near) => near.space.id)
  return {
    world: { ...world, menagerie: rooms },
    report: { kind: 'flock-loosed', rooms: rooms.length, beasts: rooms.length * FLOCK_PER_ROOM },
  }
}

/**
 * Where a Guardian Spirit Beast comes up: in front of the visitor, or nowhere.
 *
 * The spot and the way they were facing together, because the apparition layer
 * needs both to put the body where it will be seen.
 *
 * `null` when the walk does not know what room the caster is in — cast from the
 * index rather than from the deck — and the apparition layer then falls back to
 * the room the beast was sent to, which is the only other honest answer.
 */
const calledUp = (spaceId: string | null, at: Vec2, heading = 0) =>
  spaceId ? { spaceId, at, heading } : null

/**
 * Everything actually standing in a room, the aura's own copies included.
 *
 * What "in the room" means to a technique that works on a whole room at once:
 * the blueprint's fittings and Gallery Fake's copies together, less whatever
 * has already been swallowed, shredded or transformed out of existence.
 */
export const standingIn = (ship: Ship, world: TourWorld, spaceId: string): Structure[] =>
  [...ship.structures, ...world.copies].filter(
    (solid) => solid.spaceId === spaceId && !world.solids[solid.id]?.gone,
  )

/**
 * A room the jellyfish has let go of: everything in it back on its own floor.
 *
 * Only the levitation is taken off. A thing that was pushed, grown or stamped
 * before the beast got hold of it keeps all of that — the beast lifted it, it
 * did not repair it — and a thing the walk was holding *only* because it was in
 * the air is let go of entirely, or the empty hold would keep it out of the
 * deck's own mesh for good.
 */
export function settleTheRoom(world: TourWorld, ship: Ship, spaceId: string): TourWorld {
  const solids = { ...world.solids }
  for (const solid of standingIn(ship, world, spaceId)) {
    const hold: SolidHold = { ...solids[solid.id] }
    delete hold.adrift
    if (Object.keys(hold).length) solids[solid.id] = hold
    else delete solids[solid.id]
  }
  return { ...world, solids }
}

/**
 * How many steps of the gas a thing survives, and how far down each one takes it.
 *
 * Four stages counting the one the cast starts them at: gas in the room and
 * nothing showing yet, then two-thirds of its own height, then a third, then a
 * puddle, and then it is not there. The numbers are `squash` multipliers, so
 * the melt costs the walk nothing it was not already able to draw.
 */
export const MELT_STAGES = [1, 0.62, 0.3, 0.12]

/**
 * One tick of Tubeppa's gas, on the walk's clock rather than on a cast.
 *
 * The scene asks for this every couple of seconds while the beast is up, the
 * way it asks for the fish. Everything in the beast's room that has not
 * finished melting goes down one stage; anything that has reached the bottom is
 * gone. Rooms the beast has left are not touched — the gas stopped being made
 * the moment it walked out, and what it had already taken it keeps.
 */
export function gasStep(world: TourWorld, ship: Ship): TourCastResult | null {
  if (!world.toad) return null
  const solids = { ...world.solids }
  let melting = 0
  let gone = 0
  for (const solid of standingIn(ship, world, world.toad)) {
    const hold = solids[solid.id]
    if (hold?.melting === undefined) continue
    const stage = hold.melting + 1
    if (stage >= MELT_STAGES.length) {
      solids[solid.id] = { ...hold, melting: stage, gone: true }
      gone++
      continue
    }
    solids[solid.id] = { ...hold, melting: stage, squash: MELT_STAGES[stage] }
    melting++
  }
  if (!melting && !gone) return null
  return {
    world: { ...world, solids },
    report: { kind: 'melted', spaceId: world.toad, melting, gone },
  }
}

/**
 * How many steps Salé-salé's beast takes to fill a room.
 *
 * Six, which at the walk's own tick is somewhere near a quarter of a minute:
 * long enough that the filling is something you stand and watch happen, short
 * enough that nobody has to wait for the mouths to close.
 */
export const SMOKE_FULL = 6

/**
 * How far Momoze's flock spreads, and how thick it is where it has spread.
 *
 * Ten rooms is the snakes' own reach and is kept deliberately: it is the walk's
 * established answer to "near where you are standing" and a second number for
 * the same idea would be a second rule. Four to a room is a crowd without being
 * a census — forty beasts across a deck is plenty to walk into one, and the
 * fortieth says nothing the fourth did not.
 */
export const FLOCK_ROOMS = 10
export const FLOCK_PER_ROOM = 4

/**
 * One step of the smoke, on the walk's clock rather than on a cast.
 *
 * The room takes one more part of what is coming out of the mouths, and when it
 * has taken the last one the beast shuts them: that is the whole of the
 * technique's shape, and it is the reason this counts up rather than simply
 * being on — a room that filled instantly would have no moment of being full.
 */
export function smokeStep(world: TourWorld): TourCastResult | null {
  const smoke = world.smoke
  if (!smoke || smoke.filled >= SMOKE_FULL) return null
  const filled = smoke.filled + 1
  return {
    world: { ...world, smoke: { ...smoke, filled } },
    report: {
      kind: 'smoke-spread',
      spaceId: smoke.spaceId,
      filled,
      full: filled >= SMOKE_FULL,
    },
  }
}

/**
 * How far one step of Luzurus's secretion drags a thing, and how close is eaten.
 *
 * A metre and a half a step is a thing being pulled rather than a thing sliding
 * — you can watch it come — and a metre and a half of clearance is where the
 * beast takes it: near enough to be at the visitor, far enough that the walk
 * never has to draw a table inside their head.
 */
export const REEL_METRES = 1.5
export const REEL_REACH = 1.5

/**
 * One step of the reeling, on the walk's clock rather than on a cast.
 *
 * Everything the secretion caught comes a step nearer whoever set the trap, and
 * what arrives is eaten. Only things in the beast's own room move: the reach of
 * a secretion is the room it was spat over, and a trap that pulled the whole
 * ship towards you would be a different ability.
 *
 * `at` is where the visitor is standing, which is what they are pulled towards.
 * Nothing here reads the room's walls — a thing being dragged to somebody by an
 * animal that has hold of it does not stop at the furniture.
 */
export function reelStep(world: TourWorld, ship: Ship, at: Vec2): TourCastResult | null {
  if (!world.centipede) return null
  const solids = { ...world.solids }
  let pulled = 0
  let eaten = 0
  for (const solid of standingIn(ship, world, world.centipede)) {
    const hold = solids[solid.id]
    if (hold?.glued === undefined) continue
    const now = solidNow(solid, hold)
    const dx = at[0] - now.at[0]
    const dz = at[1] - now.at[1]
    const gap = Math.hypot(dx, dz)
    if (gap <= REEL_REACH) {
      solids[solid.id] = { ...hold, glued: hold.glued + 1, gone: true }
      eaten++
      continue
    }
    const step = Math.min(REEL_METRES, gap - REEL_REACH)
    solids[solid.id] = {
      ...hold,
      glued: hold.glued + 1,
      at: [now.at[0] + (dx / gap) * step, now.at[1] + (dz / gap) * step],
    }
    pulled++
  }
  if (!pulled && !eaten) return null
  return {
    world: { ...world, solids },
    report: { kind: 'reeled', spaceId: world.centipede, pulled, eaten },
  }
}

/**
 * One thing broken up by Camilla's cat, on the walk's clock.
 *
 * One at a time and never more: the whole of what makes it read as an animal
 * with a room to get through rather than as a blast is that you can watch it
 * work. Its own room only, and it stops when there is nothing left standing —
 * a cat with an empty room sits in it, which is what the ability is doing
 * anyway. What it takes is `gone`, because a thing a cat that size has had its
 * paws on is not a thing anybody puts back.
 */
export function catStep(world: TourWorld, ship: Ship): TourCastResult | null {
  if (!world.cat) return null
  const standing = standingIn(ship, world, world.cat)
  const next = standing[0]
  if (!next) return null
  return {
    world: {
      ...world,
      solids: { ...world.solids, [next.id]: { ...world.solids[next.id], gone: true } },
    },
    report: {
      kind: 'crushed-one',
      spaceId: world.cat,
      solidId: next.id,
      left: standing.length - 1,
    },
  }
}

/**
 * The coin off Zhang Lei's wheel, taken by walking into it.
 *
 * Not a cast: the coin is a thing hanging in a room, and what the ability asks
 * is whether anybody goes and picks it up. What it is worth goes onto the
 * visitor as aura, and the wheel immediately has the next one at its mouth,
 * worth ten times this one — which is the ability's own arithmetic, and the
 * reason the second coin is worth going back for.
 */
export function takeTheCoin(world: TourWorld): TourCastResult | null {
  const wheel = world.wheel
  if (!wheel) return null
  const gilded = world.body.gilded + wheel.coin
  return {
    world: {
      ...world,
      wheel: { ...wheel, coin: wheel.coin * 10 },
      body: { ...world.body, gilded },
    },
    report: { kind: 'coin-taken', spaceId: wheel.spaceId, value: wheel.coin, gilded },
  }
}

/** Everything one air took hold of, which is what the panel counts. */
export const dancingSolidIds = (world: TourWorld): string[] =>
  Object.entries(world.solids)
    .filter(([, hold]) => hold.dancing && !hold.gone)
    .map(([id]) => id)

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
  // Nor is what is over your head — a room Camilla's beast has hold of has
  // nothing on its floor, and that is most of what the technique feels like
  // from inside it.
  return detachedOn(ship, world, tierId, seconds)
    .filter(({ structure }) => !world.body.passengers.includes(structure.id))
    .filter(({ structure }) => !world.solids[structure.id]?.adrift)
    // And what the drill went through is not either: the hole is the whole of
    // what the walk can show of a bore, so it has to be a hole you can use.
    .filter(({ structure }) => !world.solids[structure.id]?.bored)
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
  return {
    ...world,
    solids,
    copies: world.copies.filter((copy) => copy.id !== id),
    // A thing put back is a thing out of the bag: Nen Stitches undoes being
    // swallowed like it undoes everything else, and Blinky cannot then be asked
    // for something that is standing in the room again.
    hoover: world.hoover.filter((held) => held !== id),
  }
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

// ── Order Stamp ───────────────────────────────────────────────────────────
//
// The one technique in the walk that keeps a crowd rather than a target, so
// its three pieces of bookkeeping live together here rather than inside the
// roster below.

/** How many heads the stamp can be on at once. */
export const STAMP_LIMIT = 20

/** Everything wearing the 人, whether or not it is being spoken to. */
export const stampedPuppets = (world: TourWorld): string[] =>
  Object.entries(world.solids)
    .filter(([, hold]) => hold.stamped && !hold.gone)
    .map(([id]) => id)

/** The puppets an order would actually reach. */
export const lockedPuppets = (world: TourWorld): string[] =>
  Object.entries(world.solids)
    .filter(([, hold]) => hold.stamped && hold.locked && !hold.gone)
    .map(([id]) => id)

/**
 * The order itself: one simple instruction, and it goes to the locked only.
 *
 * They are set down in a ring around the point that was pointed at, because
 * twenty puppets sent to one spot would be twenty puppets inside each other.
 * The stamp is not spent by being obeyed — they stay stamped and stay locked,
 * so the next order finds the same crowd.
 */
function orderThePuppets(world: TourWorld, room: Space, to: Vec2): TourCastResult {
  const locked = lockedPuppets(world)
  if (!locked.length) {
    return { world, report: { kind: 'no-lock', stamped: stampedPuppets(world).length } }
  }

  const solids = { ...world.solids }
  locked.forEach((id, index) => {
    const angle = (index * Math.PI * 2) / locked.length
    const ring = locked.length > 1 ? 1.4 : 0
    const stood: Vec2 = [to[0] + Math.cos(angle) * ring, to[1] + Math.sin(angle) * ring]
    // A puppet told to go somewhere goes somewhere inside the room: a ring wide
    // enough to keep twenty apart is wide enough to put one through a bulkhead,
    // and a solid standing in the steel is a wall the visitor cannot get past.
    solids[id] = { ...solids[id], at: pointInPolygon(stood, room.footprint) ? stood : to }
  })

  return {
    world: {
      ...world,
      solids,
      // A puppet that walked into another room stands in that room now, the
      // same way a relay's cargo does.
      copies: world.copies.map((copy) =>
        locked.includes(copy.id) ? { ...copy, spaceId: room.id } : copy,
      ),
    },
    report: { kind: 'ordered', spaceId: room.id, puppets: locked.length },
  }
}

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
const SOLID_CASTS: Partial<Record<HatsuInteractionKind, SolidCast>> = {
  // Bungee Gum: the first cast sets the strand, the second brings the other
  // end to it. Tension is what the technique is, so the pull is towards the
  // thing already stuck rather than towards the visitor.
  elastic: ({ world, ship, structure, hold, id }) => {
    if (!world.pairing || world.pairing === id) {
      return { world: { ...world, pairing: id }, report: { kind: 'gum-set', solidId: id } }
    }
    const anchor = solidById(ship, world, world.pairing)
    if (!anchor)
      return { world: { ...world, pairing: id }, report: { kind: 'gum-set', solidId: id } }
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
  },

  // Only the look changes; the thing underneath goes on being what it was,
  // and goes on stopping you exactly where it did.
  disguise: ({ world, structure, hold, id }) => {
    const current = hold?.kind ?? structure.kind
    const next = FORGERIES[(FORGERIES.indexOf(current) + 1) % FORGERIES.length]
    return {
      world: withHold(world, id, { kind: next, aura: 'pink' }),
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
    const landing = shove(ship, world, structure, hold, away(2))
    return {
      world: withHold(world, id, landing ? { hits, at: landing } : { hits }),
      report: { kind: 'volley', solidId: id, hits },
    }
  },

  windup: ({ world, ship, structure, hold, id, away }) => {
    const metres = 3 + world.windup * 4
    const landing = shove(ship, world, structure, hold, away(metres))
    return {
      world: { ...withHold(world, id, landing ? { at: landing } : {}), windup: 0 },
      report: { kind: 'launched', solidId: id, metres: landing ? metres : 0 },
    }
  },

  staff: ({ world, ship, structure, hold, id, away }) => {
    const now = solidNow(structure, hold)
    const landing = shove(ship, world, structure, hold, away(1.5))
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
  dowsing: ({ world, ship, structure, hold, id, away }) => {
    const now = solidNow(structure, hold)
    const landing = shove(ship, world, structure, hold, away(2))
    return {
      world: withHold(world, id, {
        hits: (hold?.hits ?? 0) + 1,
        rotation: now.rotation + 40,
        ...(landing ? { at: landing } : {}),
      }),
      report: { kind: 'lashed', solidId: id, hits: (hold?.hits ?? 0) + 1 },
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

  // The aura runs along the floor and comes up under something else in the
  // same room: you strike here and the room is hit there.
  // The aura goes into the floor somewhere else in the room and comes up under
  // what the reticle is on — that way round, because the fist has to appear
  // where the visitor is looking. Where it went *in* is the flavour; where it
  // comes *out* is the technique. A room with one thing in it is a room where
  // it went in under the same thing, rather than a cast refused.
  'remote-strike': ({ world, ship, structure, hold, id, away }) => {
    const source =
      [...ship.structures, ...world.copies].find(
        (candidate) =>
          candidate.spaceId === structure.spaceId &&
          candidate.id !== id &&
          !world.solids[candidate.id]?.gone,
      ) ?? structure
    const landing = shove(ship, world, structure, hold, away(2.5))
    return {
      world: withHold(world, id, landing ? { at: landing } : { hits: (hold?.hits ?? 0) + 1 }),
      report: { kind: 'came-up-under', solidId: source.id, otherId: id },
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
    const beside = shove(ship, world, structure, { ...hold, scale: halved }, [
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
      const landing = shove(ship, beside, structure, hold, away(1.4))
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
      return { world: { ...world, pairing: id }, report: { kind: 'gum-set', solidId: id } }
    }
    const other = solidById(ship, world, world.pairing)
    if (!other)
      return { world: { ...world, pairing: id }, report: { kind: 'gum-set', solidId: id } }
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
  input: TourCastInput,
  structure: Structure | null,
): TourCastResult | null {
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
          at: landingIn(room, input.at, input.heading)[room.id],
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

  // Order Stamp aimed at no solid is the order: the stamp is already on the
  // heads that matter, and this is the click that tells the locked ones where
  // to go. Nothing locked and the order is spoken into the room and ignored,
  // which is the whole point of the lock.
  if (kind === 'command' && !structure) {
    const room = input.targetId ? ship.spaces.get(input.targetId) : null
    if (!room) return { world, report: { kind: 'no-target' } }
    return orderThePuppets(world, room, landingIn(room, input.at, input.heading)[room.id])
  }

  if (kind === 'remote-strike' && !structure) {
    const room = input.targetId ? ship.spaces.get(input.targetId) : null
    if (!room) return { world, report: { kind: 'no-target' } }
    return { world, report: { kind: 'came-up-empty', spaceId: room.id } }
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
    loadIntoHold(world, structure) ?? castPastTheTarget(world, kind, input, structure)
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

  const cast = SOLID_CASTS[kind]
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
    ...world.gumTraps.map((id) => `gum:${id}`),
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
function playTheTune(
  world: TourWorld,
  ship: Ship,
  tune: TourTune,
  spaceId: string,
): TourCastResult {
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
      world: { ...world, solids, body: { ...world.body, playing: already ? null : tune } },
      report: { kind: 'tune-played', tune, spaceId, on: !already, solids: inRoom.length },
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
      body: { ...world.body, playing: on ? tune : null },
    },
    report: { kind: 'tune-played', tune, spaceId, on, solids: 0 },
  }
}

/** What each technique does to the visitor, one entry per kind. */
const BODY_CASTS: Partial<Record<HatsuInteractionKind, BodyCast>> = {
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

  // Music carried straight into the listener. What it soothes is the only
  // thing in the walk that can be done to a sense: it opens the three the
  // monkeys sealed, and holds them open. That much happens whatever is played,
  // and it is all that happens when nothing is — a cast off the book, where
  // there is no flute in the hand and no key to choose an air with.
  melody: ({ world, ship, body, input }) => {
    const opened = world.sealed > 0
    const heard: TourWorld = {
      ...world,
      sealed: 0,
      body: { ...body, soothed: !body.soothed || opened },
    }
    if (!input.tune) return { world: heard, report: { kind: 'soothed', opened } }
    // A flute is heard where it is played: the reticle is never consulted, and
    // a piece with nowhere to land is a piece nobody was in the room for.
    if (!input.standingIn) return { world: heard, report: { kind: 'no-target' } }
    return playTheTune(heard, ship, input.tune, input.standingIn)
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

  // Bungee Gum on the body (no target):
  // Faux Tissu heals the punishment if any is packed.
  // Otherwise, Propulsion increases the walking pace.
  elastic: ({ body, withBody }) => {
    if (body.packed !== null && body.packed > 0) {
      return {
        world: withBody({ packed: body.packed - 1 }),
        report: { kind: 'gum-healed', healed: 1 },
      }
    }
    const committed = Math.min(6, body.enhance + 1)
    return { world: withBody({ enhance: committed }), report: { kind: 'gum-propulsion' } }
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

  const cast = BODY_CASTS[kind]
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

// ── The book ──────────────────────────────────────────────────────────────
//
// Nothing new in the ship: what these six need is for the walk to be able to
// hold two techniques at once. What they take, they take off the ship — from
// whatever technique is currently holding a room, which is the only other Nen
// user the reconstruction has.

/**
 * The technique holding a room, if any.
 *
 * This is what Skill Hunter reads. It is deliberately the same list the panel
 * shows: a hold you can see listed is a hold you can steal, and one that is
 * not is not there to be taken.
 */
export function techniqueHolding(world: TourWorld, spaceId: string): HatsuInteractionKind | null {
  if (world.isolated?.spaceId === spaceId) return 'room-isolation'
  if (world.shut.includes(spaceId)) return 'chain-bind'
  if (world.devouring.includes(spaceId)) return 'devour'
  if (world.guarded.includes(spaceId)) return 'legal-defense'
  if (world.cards[spaceId]) return 'tribunal'
  if (world.doors.includes(spaceId)) return 'door-network'
  if (world.emptied.includes(spaceId)) return 'vacuum'
  if (world.eye === spaceId) return 'scout'
  if (world.watched.some((doll) => doll.spaceId === spaceId)) return 'paper-spy'
  if (world.double === spaceId) return 'guardian'
  if (world.owl === spaceId) return 'surveillance'
  if (world.worm?.a === spaceId || world.worm?.b === spaceId) return 'portal'
  if (world.trap === spaceId) return 'desire-trap'
  if (world.ninelives.includes(spaceId)) return 'resurrection'
  if (world.curse?.victim === spaceId) return 'curse'
  if (world.dial === spaceId) return 'divination'
  if (world.poem.includes(spaceId)) return 'poetry'
  if (world.droplets.some((drop) => drop.spaceId === spaceId)) return 'blood-search'
  if (world.verses.some((verse) => verse.spaceId === spaceId)) return 'prophecy'
  if (world.souls.some(([a, b]) => a === spaceId || b === spaceId)) return 'arrow'
  if (world.foreseen?.spaceId === spaceId) return 'future'
  if (world.dowsing === spaceId) return 'dowsing'
  return null
}

/**
 * Takes one hold off a room.
 *
 * A stolen ability cannot be used by its owner while it is held, so what the
 * book takes it also lets go of: the room comes back, and the technique is in
 * the book instead of on the ship.
 */
export function releaseHold(world: TourWorld, spaceId: string): TourWorld {
  return {
    ...world,
    isolated: world.isolated?.spaceId === spaceId ? null : world.isolated,
    shut: world.shut.filter((id) => id !== spaceId),
    devouring: world.devouring.filter((id) => id !== spaceId),
    guarded: world.guarded.filter((id) => id !== spaceId),
    cards: Object.fromEntries(Object.entries(world.cards).filter(([id]) => id !== spaceId)),
    doors: world.doors.filter((id) => id !== spaceId),
    emptied: world.emptied.filter((id) => id !== spaceId),
    eye: world.eye === spaceId ? null : world.eye,
    watched: world.watched.filter((doll) => doll.spaceId !== spaceId),
    double: world.double === spaceId ? null : world.double,
    owl: world.owl === spaceId ? null : world.owl,
    worm: world.worm?.a === spaceId || world.worm?.b === spaceId ? null : world.worm,
    trap: world.trap === spaceId ? null : world.trap,
    ninelives: world.ninelives.filter((id) => id !== spaceId),
    curse: world.curse?.victim === spaceId ? null : world.curse,
    dial: world.dial === spaceId ? null : world.dial,
    poem: world.poem.filter((id) => id !== spaceId),
    droplets: world.droplets.filter((drop) => drop.spaceId !== spaceId),
    verses: world.verses.filter((verse) => verse.spaceId !== spaceId),
    souls: world.souls.filter(([a, b]) => a !== spaceId && b !== spaceId),
    foreseen: world.foreseen?.spaceId === spaceId ? null : world.foreseen,
    dowsing: world.dowsing === spaceId ? null : world.dowsing,
  }
}

/**
 * What a page costs to use.
 *
 * A stolen page stays in the book and can be cast again; a Culdcept card is
 * spent by being played, and so is the dolphin's loan. Nothing else about the
 * cast changes, so this is applied after it rather than woven into it.
 */
export function spendPage(world: TourWorld, kind: HatsuInteractionKind): TourWorld {
  const book = world.book
  if (book.loan === kind) return { ...world, book: { ...book, loan: null } }
  const card = book.cards.indexOf(kind)
  if (card < 0) return world
  return {
    ...world,
    book: { ...book, cards: book.cards.filter((_, index) => index !== card) },
  }
}

/** The pages the visitor may actually cast from, in the order the panel lists them. */
export function castablePages(book: TourBook): HatsuInteractionKind[] {
  return [
    ...(book.open ? [book.open] : []),
    ...(book.bookmark && book.bookmark !== book.open ? [book.bookmark] : []),
    ...book.cards,
    ...(book.loan ? [book.loan] : []),
  ]
}

/**
 * What Chrollo has already stolen by the time the walk begins.
 *
 * Double Face is not a theft — it is the bookmark, and a bookmark is worthless
 * without two pages under it. The walk cannot make the visitor steal twice
 * before the ability does anything, so the book is handed over already holding
 * a pair, drawn from what the archive has Chrollo carrying. Every one of them
 * is a technique the walk can actually cast, because a page that turned out to
 * be inert would be half the ability doing nothing.
 */
export const DOUBLE_FACE_PAGES: readonly HatsuInteractionKind[] = [
  'devour',
  'pocket',
  'teleport',
  'polarity',
  'command',
  'identity-swap',
  'divination',
  'prophecy',
  'clone',
]

/**
 * A book with two of them in it: one on the open page, one under the bookmark.
 *
 * Which two is the walk's own roll rather than the archive's — Chrollo's book
 * held over a hundred, and the two he has to hand at any moment is exactly the
 * kind of thing no record of the Black Whale settles.
 */
export function openTheBook(random: () => number = Math.random): TourBook {
  const left = DOUBLE_FACE_PAGES[Math.floor(random() * DOUBLE_FACE_PAGES.length)]
  const rest = DOUBLE_FACE_PAGES.filter((page) => page !== left)
  const right = rest[Math.floor(random() * rest.length)]
  return { ...CLOSED_BOOK, pages: [left, right], open: left, bookmark: right }
}

/** The open page and the bookmarked one, in the order the two keys play them. */
export function twoPages(book: TourBook): [HatsuInteractionKind, HatsuInteractionKind] | null {
  if (!book.open || !book.bookmark || book.open === book.bookmark) return null
  return [book.open, book.bookmark]
}

/** The book with the ribbon moved to the other page, which swaps the two keys. */
export function turnTheBook(book: TourBook): TourBook {
  const pair = twoPages(book)
  return pair ? { ...book, open: pair[1], bookmark: pair[0] } : book
}

/**
 * The techniques cast with two hands rather than one.
 *
 * Genthru puts the sun on with one hand and the moon with the other, and the
 * walk has one key per technique to say it with. So the key alternates: the
 * first press is the sun, the next is the moon, and the pair the ability needs
 * is two presses of the same key rather than two keys the visitor has to be
 * told about. Nothing else in the roster casts twice like this yet — the set
 * is here so that when something does, the key already knows how.
 */
export const TWO_HANDED_KINDS = new Set<HatsuInteractionKind>(['polarity'])

/** The other hand. */
export const otherHand = (mark: 'sun' | 'moon'): 'sun' | 'moon' => (mark === 'sun' ? 'moon' : 'sun')

/**
 * One cast on the techniques rather than on the ship.
 */
function castOnTechniques(
  world: TourWorld,
  kind: HatsuInteractionKind,
  target: Space,
): TourCastResult {
  const book = world.book
  const held = techniqueHolding(world, target.id)
  const withBook = (patch: Partial<TourBook>): TourWorld => ({
    ...world,
    book: { ...book, ...patch },
  })

  switch (kind) {
    // What is taken is let go of: the owner cannot use it while the book has it.
    case 'theft': {
      if (!held) return { world, report: { kind: 'nothing-to-steal', spaceId: target.id } }
      const pages = [...new Set([...book.pages, held])]
      return {
        world: { ...releaseHold(world, target.id), book: { ...book, pages, open: held } },
        report: { kind: 'taken-into-the-book', spaceId: target.id, technique: held },
      }
    }

    // The bookmark is what makes two at once possible at all.
    case 'bookmark': {
      if (book.pages.length < 2) return { world, report: { kind: 'needs-two-pages' } }
      const other = book.pages.find((page) => page !== book.open) ?? null
      return {
        world: withBook({ bookmark: other }),
        report: { kind: 'bookmarked', technique: other! },
      }
    }

    // Culdcept acquires without taking — and the arrow it cannot pierce is the
    // arrow that has already been through the room.
    case 'capture': {
      if (world.souls.some(([a, b]) => a === target.id || b === target.id)) {
        return { world, report: { kind: 'acquisition-failed', spaceId: target.id } }
      }
      if (!held) return { world, report: { kind: 'nothing-to-steal', spaceId: target.id } }
      return {
        world: withBook({ cards: [...book.cards, held] }),
        report: { kind: 'carded', spaceId: target.id, technique: held },
      }
    }

    // Only the dead pass anything on. A room that has been killed — emptied, or
    // chained shut — is the walk's only corpse, and what it hands over is
    // whatever killed it.
    case 'inherit': {
      const killed = world.emptied.includes(target.id)
        ? ('vacuum' as HatsuInteractionKind)
        : world.shut.includes(target.id)
          ? ('chain-bind' as HatsuInteractionKind)
          : null
      if (!killed) return { world, report: { kind: 'not-eligible', spaceId: target.id } }
      const pages = [...new Set([...book.pages, killed])]
      return {
        world: {
          ...withBook({ pages, open: book.open ?? killed }),
          // The star is what the baton leaves behind: the room it was taken
          // from wears it, so the inheritance is somewhere other than the book.
          stars: [...new Set([...world.stars, target.id])],
        },
        report: { kind: 'inherited', spaceId: target.id, technique: killed },
      }
    }

    // The chain drains as it takes: nothing reaches that room again until the
    // book gives it back.
    case 'chain-rule': {
      if (!held) return { world, report: { kind: 'nothing-to-steal', spaceId: target.id } }
      const pages = [...new Set([...book.pages, held])]
      return {
        world: {
          ...releaseHold(world, target.id),
          book: { ...book, pages, open: held, zetsu: [...new Set([...book.zetsu, target.id])] },
        },
        report: { kind: 'drained', spaceId: target.id, technique: held },
      }
    }

    // The dolphin only exists during Emperor Time, and what it does is explain
    // a captured ability and open it to someone who could not otherwise use it.
    case 'ability-loan': {
      if (!world.laidOpen) return { world, report: { kind: 'needs-emperor-time' } }
      const lent = book.open ?? book.pages[0]
      if (!lent) return { world, report: { kind: 'nothing-to-lend' } }
      return { world: withBook({ loan: lent }), report: { kind: 'lent', technique: lent } }
    }

    default:
      return { world, report: { kind: 'inert' } }
  }
}

const BOOK_HATSU_KINDS = new Set<HatsuInteractionKind>([
  'theft',
  'bookmark',
  'capture',
  'inherit',
  'chain-rule',
  'ability-loan',
])

/** Whether a technique reads the book rather than the ship. */
export const worksOnTechniques = (profile: HatsuProfile | null) =>
  Boolean(profile) && BOOK_HATSU_KINDS.has(profile!.kind)

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

/**
 * The sleeping body has to be somewhere the walk still leaves alone.
 *
 * Shut it, guard it or empty it and Hanzo is pulled back into it, whatever he
 * was in the middle of — so this is answered before the cast is even read.
 */
function pullBackTheBody(world: TourWorld): TourCastResult | null {
  if (!world.body.projected) return null
  const where = world.body.projected.spaceId
  const disturbed =
    world.shut.includes(where) || world.guarded.includes(where) || world.emptied.includes(where)
  if (!disturbed) return null
  return {
    world: { ...world, body: { ...world.body, projected: null } },
    travelTo: where,
    report: { kind: 'body-disturbed', spaceId: where },
  }
}

/**
 * The four casts that need nothing to aim at.
 *
 * Emperor Time sweeps the whole ship, the monkeys work on the visitor's own
 * senses, phasing is a state rather than a place, and Chrollo's teleport draws
 * its destination rather than being pointed at one.
 */
function castWithoutARoom(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult | null {
  const { ship, standingIn } = input

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

  if (kind === 'teleport') {
    const random = input.random ?? Math.random
    const elsewhere = [...ship.spaces.keys()].filter((id) => id !== standingIn)
    if (!elsewhere.length) return { world, report: { kind: 'no-target' } }
    const spaceId =
      elsewhere[Math.min(elsewhere.length - 1, Math.floor(random() * elsewhere.length))]
    return { world, report: { kind: 'teleported', spaceId }, travelTo: spaceId }
  }

  return null
}

/** Everything one cast against a room works with, gathered once by `runCast`. */
type RoomCastContext = {
  world: TourWorld
  ship: Ship
  /** The room aimed at, already resolved and known to exist. */
  target: Space
  input: TourCastInput
  at: Vec2
  standingIn: string | null
}

type RoomCast = (ctx: RoomCastContext) => TourCastResult

/**
 * Air Blow strips what another technique put on a room, from any distance, and
 * moves nothing: the room comes back as the blueprint has it.
 */
function stripTheRoom({ world, ship, target }: RoomCastContext): TourCastResult {
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
  // What the later waves hung in a room is hung on it just as much as a doll
  // is: the bird is blown off its perch, the cards off the table, the star off
  // the ceiling, the double out of the corner, the mark off the victim and the
  // near mouth of the tunnel shut.
  if (next.owl === target.id) {
    next.owl = null
    count++
  }
  if (next.stars.includes(target.id)) {
    next.stars = without(next.stars, (id) => id === target.id)
    count++
  }
  if (next.cards[target.id]) {
    const cards = { ...next.cards }
    delete cards[target.id]
    next.cards = cards
    next.pinned = next.pinned === target.id ? null : next.pinned
    count++
  }
  if (next.double === target.id) {
    next.double = null
    count++
  }
  if (next.curse?.victim === target.id) {
    next.curse = null
    count++
  }
  if (next.worm && (next.worm.a === target.id || next.worm.b === target.id)) {
    next.worm = null
    count++
  }
  // And any Guardian Spirit Beast standing in it. A blast that put out a beast
  // and left the room floating would be a blast that had not finished: the
  // solids below are cleared wholesale, which takes the levitation and the melt
  // off with everything else.
  if (next.medusa === target.id) {
    next.medusa = null
    count++
  }
  if (next.chimera === target.id) {
    next.chimera = null
    count++
  }
  if (next.toad === target.id) {
    next.toad = null
    count++
  }
  if (next.centipede === target.id) {
    next.centipede = null
    count++
  }
  if (next.smoke?.spaceId === target.id) {
    next.smoke = null
    count++
  }
  if (next.cat === target.id) {
    next.cat = null
    count++
  }
  if (next.dragon === target.id) {
    next.dragon = null
    next.pinned = next.pinned === target.id ? null : next.pinned
    count++
  }
  if (next.menagerie.includes(target.id)) {
    next.menagerie = without(next.menagerie, (id) => id === target.id)
    count++
  }
  if (next.wheel?.spaceId === target.id) {
    next.wheel = null
    count++
  }
  if (next.lit.includes(target.id)) {
    next.lit = without(next.lit, (id) => id === target.id)
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
    next.hoover = next.hoover.filter((held) => !inside.includes(held))
    next.copies = next.copies.filter((copy) => !inside.includes(copy.id))
    count += inside.length
  }
  return { world: next, report: { kind: 'stripped', spaceId: target.id, count } }
}

/**
 * What each technique does to a room, one entry per kind.
 *
 * A table rather than one long switch: twenty-seven techniques that share a
 * target and nothing else. The order they are written in is the order the panel
 * lists them, which is the only order they have.
 */
const ROOM_CASTS: Partial<Record<HatsuInteractionKind, RoomCast>> = {
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
    const distance = distanceTo(ship, target, at, standingIn)
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

  // The chain through the heart does nothing at all until the rule it names
  // is knowingly broken. Declaring it is the whole of the cast.
  'heart-vow': ({ world, target }) => ({
    world: { ...world, vow: target.id },
    report: { kind: 'vow-declared', spaceId: target.id },
  }),

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
      .map((space) => ({ space, distance: distanceTo(ship, space, at, standingIn).metres }))
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
    looseTheFlock(world, ship, standingIn, at) ?? {
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
    const perch = perchFor(world, ship, target.id, standingIn, input.random ?? Math.random)
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
    const seen = tenSecondsOn(ship, world, target.tierId, at, input.heading ?? 0)
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
    const reading = dialReading(ship, { ...world, dial: target.id }, at, standingIn)
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

  flock: ({ world, target }) => {
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

function runCast(
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
    (!EITHER_TARGET.has(kind) || (!input.targetSolidId && (kind !== 'elastic' || !input.targetId)))
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

  const cast = ROOM_CASTS[kind]
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
      landed: landingIn(target, at, input.heading, result.world.landed),
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
  at: Vec2,
  heading = 0,
  landed: Record<string, Vec2> = {},
): Record<string, Vec2> {
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

  // What Nen is holding moves every frame, so its outline is never cached.
  // There are a handful of those at most, against the hundred and twenty-odd
  // the deck itself stands.
  const targets = bakedTargets(ship, world, plan).concat(
    detachedOn(ship, world, plan.tier.id).map((held) => targetOf(held.structure)),
  )

  let nearest: Structure | null = null
  let distance = Infinity
  for (const target of targets) {
    // Each hit tightens the ray for the ones after it: past the nearest solid
    // found so far, nothing can win.
    const hit = rayReaches(target, at, dx, dz, Math.min(range, distance))
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
function rayReaches(
  target: SolidTarget,
  at: Vec2,
  dx: number,
  dz: number,
  range: number,
): number | null {
  let near = 0
  let far = range

  // Slab test, one axis at a time. A ray running parallel to a pair of sides
  // either starts between them or never meets them.
  const slab = (origin: number, direction: number, low: number, high: number) => {
    if (Math.abs(direction) < 1e-9) return origin >= low && origin <= high
    const first = (low - origin) / direction
    const second = (high - origin) / direction
    near = Math.max(near, Math.min(first, second))
    far = Math.min(far, Math.max(first, second))
    return near <= far
  }
  if (!slab(at[0], dx, target.minX, target.maxX)) return null
  if (!slab(at[1], dz, target.minZ, target.maxZ)) return null

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

  // The chain only ever punishes a rule that was knowingly broken.
  if (next.vow === spaceId) {
    if (!absorb(spaceId)) {
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
export function doorExit(
  world: TourWorld,
  spaceId: string | null,
  arrivedFrom: string | null,
  ship?: Ship,
  random: () => number = Math.random,
) {
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
function perchFor(
  world: TourWorld,
  ship: Ship,
  targetId: string,
  standingIn: string | null,
  random: () => number,
): string {
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
  id: string,
  hold: SolidHold,
  seconds: number,
): { spaceId: string; base: Vec2; at: Vec2 } | null {
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
  seconds: number,
  delta: number,
): { world: TourWorld; report: TourReport | null } | null {
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
    const sun = markedAt(ship, world, sunId, world.solids[sunId], seconds)
    if (!sun) continue
    const room = ship.spaces.get(sun.spaceId)
    if (!room) continue

    // The nearest opposite in the same room. Nothing reaches through a bulkhead
    // or through a deck: `at` is measured on the level it stands on, so two
    // things four decks apart share coordinates and share nothing else.
    let nearest: { id: string; base: Vec2; at: Vec2; away: number; apart: number } | null = null
    for (const moonId of moons) {
      if (spent.has(moonId)) continue
      const moon = markedAt(ship, world, moonId, world.solids[moonId], seconds)
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
