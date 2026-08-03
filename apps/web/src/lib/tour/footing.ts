/**
 * What the deck is made of, under a foot.
 *
 * The walk already puts a footstep on the ground at every pace and already sends
 * it into the room the visitor is standing in, so the hold and a cabin are
 * unmistakably two different places. What it did not have was two different
 * *floors*: every step on board was a boot on bare steel plate, from the King's
 * living room to the grating over the springs.
 *
 * Nothing in `data/ship/blueprint.json` says what a floor is surfaced with, and
 * nothing should — it is the same kind of claim as a lamp on a ceiling or a
 * pillar under a hall, true of the ship rather than of the drawing. So it is
 * derived from the two facts that are declared: what the room is for, and how
 * high up it is. A stateroom on Tier 1 is carpeted and the identical room five
 * decks down is not, because that is what the ship is — the same argument the
 * lighting grid makes in `light.ts`, made again in the channel that carries it
 * faster than the eye does.
 *
 * Pure and free of the audio graph, so it can be read without an `AudioContext`
 * — the whole tone table is checkable, and `$lib/audio/steps` only has to play
 * what it is handed.
 */
import type { SpaceCategory } from './types'

/** One kind of floor, as the few numbers a footstep is synthesised from. */
export interface Footing {
  /**
   * Where the noise burst of the sole is filtered, in hertz, and how tightly.
   *
   * High and narrow is a hard surface struck — grating, plate, stone. Low and
   * broad is something that absorbs the strike before it can ring.
   */
  band: number
  q: number
  /** How the burst is shaped, in seconds: the strike, and the tail after it. */
  attack: number
  decay: number
  /** The note the floor itself rings at under the boot, in hertz, and how loud. */
  ring: number
  ringLevel: number
  /** How loud the step is overall. Carpet is quiet; that is most of what it is. */
  level: number
}

/**
 * Bare steel plate: the ship as built, and what the whole of it used to sound
 * like. Kept as the fallback for the same reason it is the commonest floor.
 */
const PLATE: Footing = {
  band: 2100,
  q: 0.9,
  attack: 0.006,
  decay: 0.16,
  ring: 100,
  ringLevel: 0.16,
  level: 1,
}

/**
 * Open grating over machinery: a hard bright rattle with nothing under it to
 * damp the strike, and it is heard as the deck being a surface you can see
 * through. The loudest floor on the ship, in the part of it nobody was meant to
 * hear anything in.
 */
const GRATING: Footing = {
  band: 2900,
  q: 1.6,
  attack: 0.004,
  decay: 0.19,
  ring: 148,
  ringLevel: 0.1,
  level: 1.1,
}

/** Poured concrete: dead, dry and hard at once. A cell has no furnishing in it. */
const CONCRETE: Footing = {
  band: 1500,
  q: 0.8,
  attack: 0.005,
  decay: 0.1,
  ring: 84,
  ringLevel: 0.2,
  level: 0.95,
}

/**
 * Stone flag: the one floor with a tail of its own, before the room adds any.
 * The reception hall and the burial chamber are meant to be heard walking into.
 */
const STONE: Footing = {
  band: 1200,
  q: 0.7,
  attack: 0.007,
  decay: 0.26,
  ring: 72,
  ringLevel: 0.22,
  level: 0.9,
}

/**
 * Carpet: almost nothing, which is the whole of it.
 *
 * A step on a rug is a low broadband thump that is over before the room can do
 * anything with it, and the effect of walking from a corridor into a stateroom
 * is that the ship goes quiet around you. On a ship whose every other surface is
 * a hard one, that silence is the most expensive thing on board.
 */
const CARPET: Footing = {
  band: 380,
  q: 0.6,
  attack: 0.008,
  decay: 0.07,
  ring: 62,
  ringLevel: 0.09,
  level: 0.5,
}

const BY_CATEGORY: Record<SpaceCategory, Footing> = {
  infrastructure: GRATING,
  storage: GRATING,
  evacuation: GRATING,
  prison: CONCRETE,
  military: CONCRETE,
  ceremonial: STONE,
  administrative: STONE,
  public: STONE,
  medical: PLATE,
  mafia: PLATE,
  corridor: PLATE,
  room: PLATE,
  quarters: CARPET,
  residential: CARPET,
}

/**
 * The decks a room has to be on for anyone to have carpeted it.
 *
 * Tier 2 and above: the King, the princes and the VIPs. A cabin on Tier 3 is a
 * cabin the same as a cabin on Tier 1 — the blueprint gives them the same
 * category and the same size — and the difference between them is not in the
 * drawing at all, it is that one of them was fitted out. This is that difference,
 * stated once, in the same place as everything else derived about a floor.
 */
export const CARPET_ELEVATION = 96

/** What this room's floor is, from what it is for and how high up it is. */
export function footingOf(category: SpaceCategory, elevation: number): Footing {
  const surface = BY_CATEGORY[category] ?? PLATE
  if (surface === CARPET && elevation < CARPET_ELEVATION) return PLATE
  return surface
}

export { CARPET, CONCRETE, GRATING, PLATE, STONE }
