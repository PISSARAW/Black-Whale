/**
 * The pieces `TourWorld` is built from, and the world with none of them set.
 *
 * Split out of `types.ts` under ADR-002; the façade there still re-exports
 * these, so no import outside this folder changes.
 */
import type { Vec2, StructureKind } from '../types'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { TourTune } from './modes'
import type { TourWorld } from './world'

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
  /**
   * The person the thumb took an ability off, and has not given it back to.
   *
   * One at a time — the finger is taken while it holds one, which is the
   * condition the ability states — so this is a name rather than a list. It is
   * what keeps that body in Zetsu (`Situation.drained`) and what turns a second
   * cast at the same person into the return rather than a refusal.
   */
  stolenFrom: string | null
  /** The page the dolphin has lent out, which the next cast consumes. */
  loan: HatsuInteractionKind | null
}

export const CLOSED_BOOK: TourBook = {
  pages: [],
  open: null,
  bookmark: null,
  cards: [],
  zetsu: [],
  stolenFrom: null,
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
  /**
   * Which tool the visitor's arm currently is, or `null` for a human one.
   *
   * The half of ch. 383 the walk had no room for: it forged tools as solids
   * standing in the room, when what the chapter draws is Padaille's own body
   * becoming one. Which tool is not chosen — `toolFor` draws it, and the draw
   * is the ability — and there is only ever one, because a limb at a time is
   * the limit stated with the technique.
   */
  armed: string | null
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
  armed: null,
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
   * Seconds of the walk a Gallery Fake copy has left, or absent for a real
   * thing.
   *
   * The one canon limit on the technique and the one the walk had none of: a
   * copy lasts a day, and the day is up whether or not anybody is looking. The
   * second of the walk is worth an hour — `emperor.ts` states the exchange and
   * this is the second user of it — so twenty-four of them are a day, and a
   * reader who makes a copy can watch the archive take it back.
   */
  life?: number
  /**
   * Texture Surprise is over this face.
   *
   * A record and not a tell: the walk keeps it so that Nen Stitches has
   * something to undo and so a test can ask, and the scene draws nothing for
   * it. An aura the layer left behind would be a detector the manga is explicit
   * about not having — ch. 61 works precisely because there is nothing to see.
   */
  forged?: boolean
  /**
   * Whether Fun Fun Cloth has this thing folded away.
   *
   * A pocketed solid is in nobody's room: it left with whoever wrapped it, and
   * `standingIn` skips it for that reason rather than because it was destroyed.
   * `spaceId` below is where it comes back out — not where it went in.
   */
  pocketed?: boolean
  /**
   * The room this solid is in *now*, when that is not the room the blueprint
   * drew it in.
   *
   * The one hold that moves a thing between rooms rather than within one. The
   * walk could push a coffin across a chamber and never out of it, because a
   * solid's room was the blueprint's and nothing could say otherwise — which
   * made ch. 372's whole gesture, carrying furniture out and setting it down
   * elsewhere, undrawable.
   */
  spaceId?: string
  /** Aura color applied by a hatsu, such as pink for Texture Surprise */
  aura?: string
}

export const EMPTY_WORLD: TourWorld = {
  laidOpen: false,
  isolated: null,
  scarlet: null,
  forcedZetsu: 0,
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
  decipher: null,
  fabrication: null,
  alarm: null,
  flock: null,
  dowsing: null,
  solids: {},
  copies: [],
  pairing: null,
  gum: null,
  wound: null,
  windup: 0,
  swings: 0,
  winding: {},
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
  signs: {},
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
