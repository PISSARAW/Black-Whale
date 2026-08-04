/**
 * The distribution: who the walk is allowed to draw, and what it knows of them.
 *
 * ADR-003 peoples the tour with the named characters of the canon and nobody
 * else. Everything in this folder is a projection of two things the archive
 * already holds — the world state `/ship` reads at the same event, and
 * `blueprint.json` — so nothing here declares a fact. The types below are the
 * seam between the two: what the server hands over, and what the walk makes of
 * it.
 *
 * A room the canon does not people stays empty. That is the whole doctrine, and
 * it is enforced by having no way to say otherwise: there is no "generic guard"
 * in any of these shapes.
 */
import type { Apparition } from '../apparitions'
import type { Vec2 } from '../types'
import type { CastDossier } from './dossier'

import type { Ship } from '../blueprint'
import type { Structure, StructureKind } from '../types'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { GumStrand } from '../gum'
import type { ScarletEyes } from '../emperor'

export const OWL_MODES = ['wander', 'shoulder', 'random'] as const
export const DOUBLE_MODES = ['follow', 'wander', 'scout'] as const
export const EYE_MODES = ['pilot', 'scout', 'film'] as const
export const TUNES = ['bloom', 'scatter', 'dance'] as const

export type TourTune = (typeof TUNES)[number]
export type TourOwlMode = (typeof OWL_MODES)[number]
export type TourDoubleMode = (typeof DOUBLE_MODES)[number]
export type TourEyeMode = (typeof EYE_MODES)[number]

/** The nine looks `humanProfiles.ts` draws. */
export type HumanRole = NonNullable<Apparition['human']>['role']

/** What a body is dressed in, when its role's own clothes are not the answer. */
export type Dress = 'civilian' | 'uniform' | 'suit' | 'combat' | 'ritual' | 'gown'

/** A look: the profile a body is drawn from, and what it is wearing. */
export interface Costume {
  role: HumanRole
  /** Omitted where the role's own clothing is already right. */
  dress?: Dress
}

/**
 * One body the world state puts aboard, trimmed to what the walk reads.
 *
 * Built on the server, from the same `getWorldState` projection `/ship` draws
 * its markers from — never re-derived from `mapTrajectory`, which is what keeps
 * a divergence between the map and the walk impossible rather than unlikely.
 *
 * `characterId` is the identity valid **at the reader's cap**: a body wearing
 * someone else's face travels under the face, because the cap is a reading
 * position and a revelation the reader has not reached is not a fact yet.
 */
export interface CastMember {
  characterId: string
  name: string
  /**
   * The catalogue location the body stands in, and every location under it.
   *
   * One slug is the common case. A sector — the political ward, say — resolves
   * to the rooms beneath it, and the walk picks one deterministically rather
   * than dropping the body or drawing it in a bulkhead.
   */
  locations: string[]
  /** `shipLocation.role`, verbatim: the string the wardrobe is keyed on. */
  role: string
  /** The chapter this position starts at, for the provenance card. */
  since: string | null
  /** Whether `data/` declares this person a Nen user. Nothing else grants aura. */
  nen: boolean
  /**
   * The techniques the canon gives this person, kept to the kinds the walk
   * already carries.
   *
   * Resolved on the server, from `abilities.json` by owner and the walk's own
   * `TOUR_HATSU_KINDS` — so the browser is never handed a technique the tour
   * could not perform, and the conduct has nothing to filter but the beasts.
   */
  hatsu: string[]
  /** The beast declared on this character, if any. See `beasts.ts`. */
  beast: CastBeast | null
}

/** A Guardian Spirit Beast, as declared in `data/` and placed by the walk. */
export interface CastBeast {
  /** The character the beast belongs to — not always the body it stands with. */
  ownerId: string
  ownerName: string
  silhouette: Apparition['kind']
  sourceChapterId: string
}

/** What the server hands the walk: the cast at one event, and which event. */
export interface CastPayload {
  eventId: string | null
  chapterNumber: number | null
  /** The reader's cap, or null when they have not set one. */
  spoilerLimit: number | null
  members: CastMember[]
  /** Beasts whose owner has no position and stands with somebody who has. */
  beasts: StandingBeast[]
  /**
   * What each body can be asked, by character id (ADR-004 §2.4).
   *
   * Built on the server and cut to the reader's chapter there, which is what
   * makes the cut enforceable: the browser cannot show what it was never sent,
   * so no amount of clicking — and no technique, Body and Soul included —
   * reaches past the cap. One entry per member, and members are already the
   * people the walk is allowed to draw.
   */
  dossiers: Record<string, CastDossier>
}

/** A beast that keeps another body's position, resolved to that body. */
export interface StandingBeast extends CastBeast {
  /** The character whose position the animal keeps. */
  standsWithId: string
}

/** Where one body actually stands, once the geometry has had its say. */
export interface Post {
  member: CastMember
  spaceId: string
  tierId: string
  at: Vec2
  /** Which way it faces, or absent to turn to whoever is looking. */
  heading?: number
  costume: Costume
  /**
   * Whether this is the body's place on the interior level of its room, rather
   * than on the deck the room is a box on. Both are the same room.
   */
  inside?: boolean
}

/** An empty payload: what the walk shows before the server has answered. */
export const NO_CAST: CastPayload = {
  eventId: null,
  chapterNumber: null,
  spoilerLimit: null,
  members: [],
  beasts: [],
  dossiers: {},
}

/**
 * Where the visitor is standing: the point, and the room that point falls in.
 *
 * The pair is named because nothing here can use one without the other — a
 * distance needs the point, and the deck it is measured across needs the room —
 * and because passing them apart is how they get passed the wrong way round.
 */
export interface Stood {
  at: Vec2
  standingIn: string | null
}

/** Where the visitor is standing and what they are pointing at from there. */
export interface Aim {
  at: Vec2
  /** Bearing in radians, as the walk's own movement code has it. */
  heading: number
  /** How far down the line to look, in metres. Each caller has its own reach. */
  range?: number
}

/** A deck at a moment of the walk's clock. */
export interface DeckMoment {
  tierId: string
  seconds?: number
}

/** That same deck, plus the visitor, so anything carried rides along. */
export interface LoadedDeck extends DeckMoment {
  /** Where the visitor is, so anything Kurton is carrying moves with them. */
  carrier?: Vec2
}

/** A deck, a point on it, and the way the visitor is facing. */
export interface Heading {
  tierId: string
  at: Vec2
  heading: number
}

/** The reconstruction, and what the techniques have done to it. */
export interface Scene {
  ship: Ship
  world: TourWorld
}

/** One solid and the hold a technique currently has on it. */
export interface HeldSolid {
  structure: Structure
  hold: SolidHold | undefined
}

/** A ray cast across a deck: where it starts, and the way it runs. */
export interface Ray {
  at: Vec2
  dx: number
  dz: number
}

/** A tune, and the room it is played in. */
export interface Played {
  tune: TourTune
  spaceId: string
}

/** The pair of doors a step is taken between. */
export interface Doors {
  spaceId: string | null
  arrivedFrom: string | null
}

/** What the paired doors need beyond themselves, when they need anything. */
export interface DoorOptions {
  ship?: Ship
  random?: () => number
}

/** Which room the owl is sent to, and how one is picked when it is at random. */
export interface Perch {
  targetId: string
  standingIn: string | null
  random: () => number
}

/** One marked solid, read at a moment of the walk's clock. */
export interface Mark {
  id: string
  hold: SolidHold
  seconds: number
}

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
   * Whose eyes are scarlet, and what it has cost them so far.
   *
   * Kept beside `laidOpen` rather than folded into it because the two say
   * different things: the ship being open is a fact about the ship, and this is
   * a fact about whoever is holding it open — which of them it is, and how much
   * of a life the hold has burnt. `null` whenever nobody's eyes are red.
   */
  scarlet: ScarletEyes | null
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
  /**
   * Where Cluck's birds are gathered, and how many of them came.
   *
   * The walk carried this ability as a list of errands and nothing else: the
   * birds existed in the read-out and nowhere in the room. What ch. 320 draws
   * is the opposite — a flock converging on the woman who called it, thick
   * enough to be a weather event — so the gathering is its own state, held as
   * a room rather than as a count of rooms. `null` while they are out.
   *
   * The count rides along because every bird is a thread of aura back to its
   * user, and a bundle you cannot count is not what Gyo shows you.
   */
  flock: { spaceId: string; birds: number } | null
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
  /**
   * The filament out of the visitor's wrist, and what it is stuck to.
   *
   * Its own field rather than another user of `pairing`, because it is not a
   * pairing: the far end is a thing and the near end is the visitor, which is
   * what Bungee Gum has been since the first time it was drawn. The length it
   * stuck at rides along with it — see `gum.ts`, where the tension is worked
   * out — so that backing away from what you stuck is a thing the walk can
   * measure rather than a thing it has to be told.
   */
  gum: GumStrand | null
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
  /**
   * The Judgment Chain vows sworn on hearts: keyed by subject id ('self' or a
   * character id). Each carries its rules and whether the sentence has been
   * triggered.
   */
  vows: Record<string, VowState>
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

/**
 * A Judgment Chain vow sworn on a heart.
 *
 * The subject is either the visitor ('self') or a character id. The rules are
 * spoken aloud at activation; the sentence stays dormant until one of them is
 * broken, then it becomes triggered.
 */
export interface VowState {
  /** Whose heart the chain is in: 'self' or a character id. */
  subjectId: string
  /** The rules declared at activation, shown in the registry. */
  rules: string[]
  /** Whether the sentence has been triggered. */
  violated: boolean
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
   * Whose face the visitor is wearing, or `null` for their own.
   *
   * Texture Surprise puts a layer on its own user and leaves the person it was
   * copied from untouched — see `cast/reach.ts` — so what it changes is here
   * and nowhere in `bodies`.
   */
  masked?: string | null
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
  /** The Judgment Chain vow sworn on the visitor's own heart, dormant or triggered. */
  vowed?: VowState
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
  masked: null,
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
  /** The Judgment Chain vow sworn on this solid. */
  vowed?: { rules: string[]; violated: boolean }
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
  /**
   * Texture Surprise is over this face.
   *
   * A record and not a tell: the walk keeps it so that Nen Stitches has
   * something to undo and so a test can ask, and the scene draws nothing for
   * it. An aura the layer left behind would be a detector the manga is explicit
   * about not having — ch. 61 works precisely because there is nothing to see.
   */
  forged?: boolean
  /** Aura color applied by a hatsu, such as pink for Texture Surprise */
  aura?: string
}

export const EMPTY_WORLD: TourWorld = {
  laidOpen: false,
  isolated: null,
  scarlet: null,
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
  flock: null,
  dowsing: null,
  solids: {},
  copies: [],
  pairing: null,
  gum: null,
  wound: null,
  windup: 0,
  swings: 0,
  shut: [],
  guarded: [],
  pinned: null,
  vows: {},
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
  /** The birds converge on the room the visitor is standing in. */
  | { kind: 'flock-gathered'; spaceId: string; birds: number }
  /** They were already here: the flock is told to disperse instead. */
  | { kind: 'flock-dispersed'; spaceId: string }
  /**
   * What the flock sees below it is not filed.
   *
   * The one use of this ability the walk shows itself refusing. Cluck's birds
   * carry — that is every panel there is of them — and a reconstruction that
   * quietly began sourcing rooms from a survey nobody drew would be inventing
   * evidence under a real person's name. So the refusal is shown, which is the
   * only honest form the use can take here.
   */
  | { kind: 'flock-survey-refused' }
  | { kind: 'double-mode-changed'; mode: TourDoubleMode }
  | { kind: 'owl-mode-changed'; mode: TourOwlMode }
  | { kind: 'owl-flown'; spaceId: string }
  | { kind: 'owl-expired'; rooms: number }
  // On the solids.
  | { kind: 'no-solid' }
  | { kind: 'bound-fast'; solidId: string }
  /**
   * A solid taken hold of, waiting for the second one the technique joins it to.
   *
   * Gallery Fake's swap and Convert Hands' relay both work on a pair, and
   * neither of them is gum: they get their own word so the panel does not
   * announce a filament the visitor has not cast.
   */
  | { kind: 'solid-paired'; solidId: string }
  /** The filament went out and took hold, at the metres it reached to do it. */
  | { kind: 'gum-set'; solidId: string; metres: number }
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
  | { kind: 'vow-declared'; subjectId: string; rules: string[] }
  | { kind: 'vow-broken'; subjectId: string }
  | { kind: 'vow-locked'; subjectId: string }
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
  | { kind: 'gum-healed'; healed: number }
  /**
   * The strand contracted, and what it was stuck to came across the room.
   *
   * `tension` rides along because the force is the whole ability — the panel
   * reads the gauge off the report rather than recomputing a stretch nobody
   * else kept — and `metres` is how far the thing actually travelled.
   */
  | { kind: 'gum-reeled'; solidId: string; metres: number; tension: number }
  /** Cast across a bulkhead: the filament holds, and nothing moves. */
  | { kind: 'gum-taut'; solidId: string; tension: number }
  /** The filament let go of the wrist and out onto somebody walking past. */
  | { kind: 'gum-stuck-on'; characterId: string }
  /** The visitor anchored above the gap and pulled themselves across it. */
  | { kind: 'gum-propulsion'; tension: number }
  | { kind: 'jail-self-refused' }

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
  /**
   * The two rules spoken aloud by Judgment Chain. Kept in the world so the
   * registry can show them exactly as they were declared.
   */
  rules?: string[]
  /** Deterministic in tests; Chrollo's teleport is the only caller. */
  random?: () => number
}

export interface TourCastResult {
  world: TourWorld
  report: TourReport
  /** A space the visitor is moved to, if the technique moves them. */
  travelTo?: string
}
