/**
 * The shape of what Nen is doing to the ship.
 *
 * Split out of `types.ts` under ADR-002; the façade there still re-exports it,
 * so no import outside this folder changes. Pure declarations — the pieces it
 * is built from, and the empty value, live in `worldPieces.ts`.
 */
import type { Vec2, Structure } from '../types'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { TourEyeMode, TourDoubleMode, TourOwlMode } from './modes'
import type { Decipher, Fabrication } from '../decipher'
import type { GumStrand } from '../gum'
import type { ScarletEyes } from '../emperor'
import type { SolidHold, TourBook, TourBody, VowState } from './worldPieces'

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
   * Seconds of forced Zetsu still to run, or nought.
   *
   * The second half of ch. 380's own sentence — a year consumed, five minutes
   * without Nen — and the only refusal in the walk that nothing can be cast
   * through, including the technique that caused it. Counted down by the page's
   * second, like the owl's life, because the walk is the only thing aboard with
   * a clock.
   */
  forcedZetsu: number
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
   * What Furykov's console is reading, and what it is building.
   *
   * Two fields rather than one record with a flag, because the two halves of
   * the menu behave in opposite ways and `decipher.ts` is where that is argued:
   * the reading banks co-presence and survives being walked away from, and the
   * build is destroyed by the same walk. Keeping them apart is what stops a
   * later change from accidentally giving the build the reading's memory.
   */
  decipher: Decipher | null
  fabrication: Fabrication | null
  /**
   * What the console's alert triangle is showing, or `null` when it is quiet.
   *
   * Every concealed Nen attack aimed at the visitor raises it at once — the
   * curse and the mark are the two the walk carries — and it lists whoever else
   * is carrying the same thing. An aura signature it cannot read is a `null`
   * inside the list rather than a guess, which the panel draws as a `?`.
   */
  alarm: { attack: string; affected: (string | null)[] } | null
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
   * How many turns each posted body has wound into its own arm, by character id.
   *
   * `windup` above is the visitor's. This is everybody else's, and it exists
   * because the conduct casts through the same door the visitor does: Phinks
   * walking the lower decks towards the hunt with his arm already turning was
   * winding up the *reader's* arm, since there was one counter for the whole
   * ship. A gauge on his card is a gauge that has to be his.
   */
  winding: Record<string, number>

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
   * The doors whose plaque has been made to read another room's number.
   *
   * Keyed by the room whose sign it is, valued by the room whose number it now
   * shows. A mask and nothing more: what the room *is* does not change, its
   * card does not change, and the archive goes on knowing which room this is —
   * `identityOf` copies the name across and leaves the category, the provenance
   * and the source alone. That asymmetry is the ability. The arrow above swaps
   * two rooms' identities; this only ever repaints a plate.
   */
  signs: Record<string, string>

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
  /**
   * Environmental damages that have occurred up to the cap.
   */
  vestiges: Record<string, import('./types').TourVestige[]>
}
