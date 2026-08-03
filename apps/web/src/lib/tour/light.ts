/**
 * What lights a room: how close its lamps hang, what colour they burn, and how
 * hard.
 *
 * On the Black Whale the light *is* the class system. Tier 1 is the King and his
 * princes, Tier 3 the ordinary passengers, Tier 5 the hold and the springs — and
 * until this file existed all five decks were lit identically, which is a false
 * claim about the ship in the same way a wall with no thickness is. A single
 * spacing and a single filament colour said that a cell on Tier 5 and the King's
 * living room are the same room with different furniture in them.
 *
 * Nothing in `data/ship/blueprint.json` says how a room is lit, and nothing
 * should: the plans no more draw a lamp than they draw a pillar. So this is
 * derived, exactly as `columnPositions` is — a hall of that span would be built
 * on pillars, a hundred-metre corridor would be lit, and a royal deck would be
 * lit warmer and closer than the hold. The derivation is a pure function of two
 * declared facts, the deck's elevation and the space's category, which is what
 * keeps it out of the data.
 *
 * Read by the bake in `mesh.ts` and by the quads it draws for the lamps
 * themselves, so a fitting you can see is the fitting lighting the floor under
 * it — the same bargain `fittingHeight` settles for the ceiling.
 */
import type { Polygon, Space, SpaceCategory, Tier, Vec2 } from './types'
import { ceilingLamps } from './geometry'

/** A colour in the renderer's working space, linear, `[r, g, b]`. */
export type Rgb = readonly [number, number, number]

/**
 * The colours below are written the way a stylesheet writes them — sRGB, the
 * space the eye and the deck plans agree on. A vertex colour attribute is read
 * by three.js as already linear, so the transfer function has to be undone here
 * or every surface arrives about five times too light: `0x4a4038` is an albedo
 * of 0.058, not of 0.290, and at 0.290 the walls come out a flat grey.
 */
const toLinear = (channel: number): number =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

export const hex = (value: number): Rgb => [
  toLinear(((value >> 16) & 255) / 255),
  toLinear(((value >> 8) & 255) / 255),
  toLinear((value & 255) / 255),
]

/**
 * How a deck is lit, by the one figure the blueprint gives about it: its
 * elevation above the keel.
 *
 * Keyed on elevation rather than on a tier id for the reason `HULL_DECKS` is in
 * `$lib/tour/atmosphere` — an interior carries the elevation of the deck it is
 * inside, so the inside of a prince's suite is lit like Tier 1 without anything
 * having to say so, and a level between two decks is interpolated rather than
 * guessed.
 *
 * `spacing` is in metres, `temperature` an sRGB colour standing for a colour
 * temperature — 2 700 K at the top of the ship, 6 500 K at the bottom of it —
 * and `power` a multiplier on what one lamp throws. The direction of all three is
 * the argument: as you go down the ship the lamps get further apart, colder and
 * weaker, which is what a class system looks like when it is made of light.
 *
 * `dead` is the fraction of the lamps that are simply out. Nobody is replacing
 * the tubes in the hold.
 */
export interface DeckLight {
  elevation: number
  spacing: number
  temperature: number
  power: number
  dead: number
}

export const DECK_LIGHT: readonly DeckLight[] = [
  { elevation: 0, spacing: 16, temperature: 0xd8e4f0, power: 0.55, dead: 1 / 12 },
  { elevation: 31.5, spacing: 13, temperature: 0xe4ecf4, power: 0.7, dead: 0 },
  { elevation: 63, spacing: 11, temperature: 0xf0f0e8, power: 0.85, dead: 0 },
  { elevation: 96, spacing: 8, temperature: 0xffdcb8, power: 1.05, dead: 0 },
  { elevation: 128, spacing: 7, temperature: 0xffd2a0, power: 1.15, dead: 0 },
]

/**
 * How a room is lit on top of its deck, by what it is for.
 *
 * `spacing` and `power` are multipliers on the deck's, and `hue` is the lamp the
 * room is fitted with — met halfway with the deck's own temperature, because a
 * ward on Tier 1 and a ward on Tier 5 are the same fitting under different
 * mains. The categories are where the ship stops being five bands and becomes a
 * place: an infirmary is cold and even and shadowless, which is the worst light
 * on board; a banquet hall is one source and a great deal of dark; a casino is
 * lit to dazzle. None of that is in the blueprint and all of it is true of the
 * rooms the blueprint names.
 */
export interface CategoryLight {
  spacing: number
  hue: number
  power: number
}

export const CATEGORY_LIGHT: Record<SpaceCategory, CategoryLight> = {
  /** Dense and warm: somewhere a person sleeps. */
  quarters: { spacing: 0.8, hue: 0xffd0a0, power: 1.1 },
  /** One source and the rest in the dark, which is what ceremony is lit like. */
  ceremonial: { spacing: 1.6, hue: 0xffe0a8, power: 0.5 },
  /** The casino, the cineplex: lit to dazzle rather than to see by. */
  public: { spacing: 0.9, hue: 0xffc98a, power: 1.3 },
  /** Cold, even, without a shadow anywhere in it — and that is the worst of it. */
  medical: { spacing: 0.7, hue: 0xe8f4ee, power: 1.2 },
  /** Hard pools with black between them. */
  prison: { spacing: 1.4, hue: 0xcfd8e0, power: 0.9 },
  mafia: { spacing: 1.5, hue: 0xd8a464, power: 0.5 },
  corridor: { spacing: 1, hue: 0xdfe8f0, power: 0.8 },
  /** Sodium, high ceilings, columns of light. */
  infrastructure: { spacing: 1.5, hue: 0xffb050, power: 0.7 },
  storage: { spacing: 1.7, hue: 0xffb050, power: 0.6 },
  /** The red of an emergency, which is the only reason anyone is in here. */
  evacuation: { spacing: 1.2, hue: 0xff8040, power: 0.8 },
  military: { spacing: 1, hue: 0xf2f4f0, power: 0.9 },
  administrative: { spacing: 1, hue: 0xf2f4f0, power: 0.9 },
  residential: { spacing: 1.2, hue: 0xf0e8dc, power: 0.8 },
  room: { spacing: 1.1, hue: 0xf0e8dc, power: 0.9 },
}

/**
 * How wide a lamp's pool is on the floor, as a multiple of how far apart the
 * lamps hang.
 *
 * Not a constant in metres, and that is load-bearing twice over. It keeps the
 * *pattern* of light the same wherever the grid is coarse or fine — the dip
 * between two lamps is the same dip on Tier 1 and in the hold, so `power` is left
 * as the only thing that says which deck is darker, and a sparse grid does not
 * quietly become an unwalkable one.
 *
 * And it is exactly the ratio `RoomLight.pool` searches its grid on: a lamp sits
 * at the centre of its cell, so with a reach of 1,125 cells nothing in range can
 * be further than the window that loop already looks in. Raise this and the bake
 * silently starts missing lamps.
 */
export const REACH_RATIO = 1.125

/**
 * How far a lamp may throw whatever the grid, in metres.
 *
 * Past this a lamp contributes less than a thousandth and is only a loop. It also
 * bounds what the categories can do to a coarse deck: `storage` at 1,7 on the
 * hold's 16 m grid is a 27 m spacing, and a 30 m reach is a lamp lighting the far
 * side of the warehouse it stands in the middle of.
 */
export const MAX_SPACING = 22

/** What the brightest lamp on the ship burns at, linear, above white. */
export const LAMP_PEAK = 2.4

/** How lit a room is, everything the bake and the lamp quads both need. */
export interface Lamplight {
  /** How far apart the lamps hang, in metres. */
  spacing: number
  /**
   * How wide one of their pools is, in metres, measured along the floor.
   *
   * A radius on the plan and not a distance in space — see `lampFalloff`. A
   * ceiling fitting throws down a disc of this radius whether it hangs in a
   * cabin 2,6 m high or over an atrium of sixteen metres, which is the one
   * thing that keeps the height of a room out of the class system.
   */
  reach: number
  /** What one burns at — above 1, so the filmic curve rolls it off. */
  glow: Rgb
  /** What its pool on a surface is worth against a lamp of the old flat grid. */
  power: number
  /** The share of this room's lamps that are out. */
  dead: number
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)

const mix = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * The deck's light at an elevation, interpolated between the decks around it.
 *
 * Flat outside the range, the way `hullRumble` is: there is nothing below the
 * hold and nothing above Tier 1.
 */
export function deckLight(elevation: number): Omit<DeckLight, 'elevation'> {
  const first = DECK_LIGHT[0]
  const last = DECK_LIGHT[DECK_LIGHT.length - 1]
  if (!(elevation > first.elevation)) return first
  if (elevation >= last.elevation) return last

  for (let i = 1; i < DECK_LIGHT.length; i++) {
    const above = DECK_LIGHT[i]
    if (elevation > above.elevation) continue
    const below = DECK_LIGHT[i - 1]
    const t = (elevation - below.elevation) / (above.elevation - below.elevation)
    return {
      spacing: mix(below.spacing, above.spacing, t),
      // Mixed in sRGB, which is where these were picked: the two ends of any
      // step of this ladder are a few hundred kelvin apart, and the shortest
      // path between them in either space is the same warm-to-cold line.
      temperature: mixHex(below.temperature, above.temperature, t),
      power: mix(below.power, above.power, t),
      dead: mix(below.dead, above.dead, t),
    }
  }
  return last
}

/** Two packed sRGB colours met part way, channel by channel. */
function mixHex(a: number, b: number, t: number): number {
  let out = 0
  for (const shift of [16, 8, 0]) {
    const channel = Math.round(mix((a >> shift) & 255, (b >> shift) & 255, t))
    out |= channel << shift
  }
  return out
}

/**
 * How this room is lit: its deck's light, modulated by what the room is for.
 *
 * The deck sets the register and the category inflects it — a corridor on Tier 1
 * is a Tier 1 corridor and not a corridor anywhere. Which is why the two tables
 * multiply rather than one overriding the other: there is no room on this ship
 * whose lighting is not first of all a statement about which deck it is on.
 */
export function lamplightOf(space: Space, tier: Tier): Lamplight {
  const deck = deckLight(tier.elevation)
  const category = CATEGORY_LIGHT[space.category]
  const spacing = Math.min(MAX_SPACING, deck.spacing * category.spacing)
  const power = deck.power * category.power
  const colour = hex(mixHex(deck.temperature, category.hue, 0.5))
  // Normalised on its brightest channel and then taken above white, so what the
  // colour decides is the *cast* of the lamp and `power` alone decides how hard
  // it burns. Picked the other way round, a cold lamp would read as a dim one.
  const peak = Math.max(...colour) || 1
  const burn = (LAMP_PEAK * power) / peak
  return {
    spacing,
    reach: spacing * REACH_RATIO,
    glow: [colour[0] * burn, colour[1] * burn, colour[2] * burn],
    power,
    dead: clamp01(deck.dead),
  }
}

/**
 * What one lamp is worth at a point: how far that point lies from under it, and
 * how far below it stands.
 *
 * The cut-off is on `plan` alone, and that is the whole correction. A fitting
 * used to be cut off on the distance *through the air*, with the drop from the
 * ceiling to the floor counted against the same reach — and since the reach is a
 * property of the grid and the drop a property of the room, the two had nothing
 * to do with each other. Every room whose ceiling stood higher than its lamps
 * reached wide lit nothing at all: the King's living quarters under seven metres
 * of ceiling on Tier 1's close 5,6 m grid, the banquet hall, the VIP casino, the
 * screening room, the police atrium — the six grandest rooms on the ship baked to
 * the bare fill and came out the darkest places on board, while a first-class
 * lavatory with a 3 m ceiling took the brightest floor of all 314. The class
 * ladder read upside down, and it read that way *because* Tier 1 hangs its lamps
 * closest: a fine grid is a short reach, and a short reach was what a tall room
 * was punished by.
 *
 * So the pool is a disc of radius `reach` on the floor, at any ceiling height,
 * and the falloff runs along the slant — the same fraction of the way out, down
 * a longer line. A high room is still a dimmer room, which is true of a lamp and
 * true of this ship; it is no longer an unlit one.
 *
 * That the cut-off is horizontal also settles what `RoomLight.pool`'s window of
 * cells could only claim before: a lamp out of range is out of range on the plan,
 * which is the plane the cells are laid on, at every height in the room.
 */
export function lampFalloff(plan: number, drop: number, reach: number): number {
  if (!(plan < reach)) return 0
  const fall = 1 - Math.hypot(plan, drop) / Math.hypot(reach, drop)
  return fall * fall
}

/**
 * A hash of a point on the plan, in 0…1.
 *
 * A hash and not a random number: the deck is baked afresh on every load, and a
 * lamp that was out last time has to be out this time — otherwise the hold
 * flickers at the rate the visitor changes decks, which is the one thing a dead
 * lamp must not do.
 */
function scatter(x: number, z: number): number {
  const value = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453
  return value - Math.floor(value)
}

/**
 * Where a room hangs its lamps: its grid, less the ones that are out.
 *
 * Never empty. A room whose every lamp the hash happened to kill would be a room
 * with no light at all, and the hold is meant to be badly lit, not sealed.
 */
export function lampsOf(footprint: Polygon, light: Lamplight): Vec2[] {
  const all = ceilingLamps(footprint, light.spacing)
  if (light.dead <= 0) return all
  const lit = all.filter(([x, z]) => scatter(x, z) >= light.dead)
  return lit.length ? lit : [all[0]]
}
