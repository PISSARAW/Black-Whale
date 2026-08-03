/**
 * The air of a great void, as something you can see hanging in it.
 *
 * A room of five and a half thousand square metres under twenty-two metres of
 * deckhead is the hardest thing in the reconstruction to feel, because there is
 * nothing in the middle of it. The walls are too far off to read, the fog says
 * *far* without saying *how far*, and a visitor standing in the suspension bay is
 * looking at the same nothing they would see in a corridor with the lights off.
 * Dust is what makes the volume visible: a few hundred motes drifting between the
 * floor and the deckhead, lit by nothing, and the space between them is the size
 * of the room.
 *
 * Nothing here is new data. Which rooms get it, how many motes, and where they may
 * hang are all read off the footprint and the ceiling the blueprint already gives.
 */
import { ceilingOf } from './blueprint'
import { distanceToBoundary, pointInPolygon, polygonArea } from './geometry'
import type { Space, Tier } from './types'

/**
 * The smallest void worth hanging dust in.
 *
 * Both conditions, not either. Volume alone lets in half of Tier 4 — eight
 * thousand cubic metres of general berthing under a four-and-a-half-metre ceiling
 * — and dust in a room you can touch the deckhead of is not air, it is dirt on the
 * lens. Height alone lets in a tall narrow shaft, where there is no distance for a
 * mote to describe. What earns it is a room with height *and* room: ten of them on
 * the ship — the banquet hall, the screening room, the observation deck, the two
 * courts, the cineplex, both recycling plants, the Cha-R warehouse and the
 * suspension bay — and they are the ten the walk is emptiest in.
 */
export const DUST_MIN_VOLUME = 8000
export const DUST_MIN_HEIGHT = 8

/** The most motes any one room gets, and the fewest a qualifying one does. */
export const DUST_MAX = 500
export const DUST_MIN = 120

/** Cubic metres a mote stands for, before the bounds above are applied. */
const VOLUME_PER_MOTE = 80

/** How far off the floor and the deckhead the dust keeps, in metres. */
const MARGIN = 0.5

/** Metres a second a mote rises. Slow enough to be movement and not weather. */
export const DUST_RISE = 0.06

/** How long a shove takes to fall to 1/e of itself, in seconds. */
export const PUSH_HALFLIFE = 0.9

/** The most a mote may be lifted or dropped by a shove, in metres. */
const PUSH_MAX_RISE = 0.6

/** How far a mote wanders sideways, and how fast it wanders, in metres. */
const SWAY = 0.35
const SWAY_RATE = 0.11

/**
 * How many motes a volume is worth, at a given share of the full cloud.
 *
 * The share is applied *after* the bounds, not before: `DUST_MIN` is the point
 * below which a cloud stops reading as air and starts reading as a handful of
 * specks, and a palier that thinned it past that would be paying for something
 * that no longer does its job. So a lighter palier is a thinner cloud down to
 * the floor the effect needs, and never a broken one.
 */
export function dustCount(volume: number, share = 1): number {
  const full = Math.min(DUST_MAX, Math.max(DUST_MIN, Math.round(volume / VOLUME_PER_MOTE)))
  return Math.max(DUST_MIN, Math.round(full * Math.min(1, Math.max(0, share))))
}

/** Whether a room is one of the voids the dust is for. */
export function holdsDust(space: Space, tier: Tier): boolean {
  return (
    ceilingOf(space, tier) >= DUST_MIN_HEIGHT &&
    polygonArea(space.footprint) * ceilingOf(space, tier) >= DUST_MIN_VOLUME
  )
}

/**
 * A deterministic noise source, seeded on the room.
 *
 * The same generator the impulse responses use, for the same reason: the burial
 * chamber has to answer with the burial chamber's noise, and the hold has to hold
 * the same dust on a second visit as on the first.
 */
function noise(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A hash of the room's name, so its dust hangs where it hung last time. */
function seedOf(id: string): number {
  let hash = 2166136261
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export interface Dust {
  /** Where each mote is, as `[x, y, z]` triples in ship metres. */
  positions: Float32Array
  /**
   * Where each mote was sampled, as `[x, z]` pairs.
   *
   * The sway is a displacement from here rather than a step added to wherever the
   * mote drifted to last frame. Integrating a sway would let rounding walk a mote
   * out through a wall over a long enough visit, and a visitor can stand in the
   * banquet hall for as long as they like.
   */
  origins: Float32Array
  /**
   * What each mote does with time: `[phase, rate, radius]`.
   *
   * A rigid cloud drifting as one object is cheaper and reads as a camera fault —
   * dust does not move in formation. A phase and a rate per mote is three floats
   * and gives every one of them its own slow circle, which is what a room full of
   * still air actually looks like.
   */
  drift: Float32Array
  /**
   * How far each mote may be moved off its circle before it is in a wall, in
   * metres: the distance from where it was sampled to the nearest boundary,
   * less what its own sway already spends.
   *
   * The sway alone could be bounded when the mote was sampled and then
   * forgotten. A push cannot: it arrives later, from a direction nothing knew
   * in advance, and the one thing this cloud must never do is hang outside the
   * room it is the air of. So the allowance is kept.
   */
  room: Float32Array
  /**
   * Where something has shoved each mote, as `[x, y, z]`, decaying to nothing.
   *
   * Added to the drift rather than integrated into the origin, for the reason
   * `origins` exists at all: a displacement that accumulated would walk a mote
   * out of the room over a long enough visit, and a visitor can stand in the
   * banquet hall for as long as they like.
   */
  push: Float32Array
  /** Where the motes are penned: the floor and the deckhead of the room. */
  floorY: number
  ceilingY: number
  /** The point they are all within, and how far, so the cloud can be culled. */
  centre: readonly [number, number, number]
  radius: number
}

/**
 * The dust of one room, or `null` for the 304 rooms that do not hold any.
 *
 * The motes are rejection-sampled against the footprint rather than scattered over
 * its bounding box: the screening room is an L and the observation deck is a
 * slanted band, and dust outside the walls of either would be dust hanging in the
 * hull. Seeded on the room's id, so it is the same cloud every visit.
 */
export function dustOf(space: Space, tier: Tier, share = 1): Dust | null {
  if (!holdsDust(space, tier)) return null

  const ceiling = ceilingOf(space, tier)
  const floorY = tier.elevation + MARGIN
  const ceilingY = tier.elevation + ceiling - MARGIN
  const count = dustCount(polygonArea(space.footprint) * ceiling, share)
  const random = noise(seedOf(space.id))

  const xs = space.footprint.map((point) => point[0])
  const zs = space.footprint.map((point) => point[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)

  const positions = new Float32Array(count * 3)
  const origins = new Float32Array(count * 2)
  const drift = new Float32Array(count * 3)
  const room = new Float32Array(count)
  const push = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    let x = 0
    let z = 0
    // The footprints of these ten rooms fill most of their bounding boxes, so
    // this lands on the first or second try; the cap is a guard and not a budget.
    for (let attempt = 0; attempt < 24; attempt++) {
      x = minX + random() * (maxX - minX)
      z = minZ + random() * (maxZ - minZ)
      if (pointInPolygon([x, z], space.footprint)) break
    }
    positions[i * 3] = x
    positions[i * 3 + 1] = floorY + random() * (ceilingY - floorY)
    positions[i * 3 + 2] = z
    origins[i * 2] = x
    origins[i * 2 + 1] = z

    drift[i * 3] = random() * Math.PI * 2
    // A spread of rates, so the cloud never comes back into phase with itself.
    drift[i * 3 + 1] = SWAY_RATE * (0.6 + random() * 0.8)
    // Its circle, cut down to what the nearest wall allows: a mote sampled half a
    // metre off a bulkhead would otherwise swing through it, and the one thing this
    // cloud must never do is hang outside the room it is the air of.
    const clearance = Math.max(0, distanceToBoundary([x, z], space.footprint) - 0.05)
    drift[i * 3 + 2] = Math.min(SWAY * (0.4 + random() * 0.6), clearance)
    room[i] = Math.max(0, clearance - drift[i * 3 + 2])
  }

  return {
    positions,
    origins,
    drift,
    room,
    push,
    floorY,
    ceilingY,
    centre: [(minX + maxX) / 2, (floorY + ceilingY) / 2, (minZ + maxZ) / 2],
    // The half-diagonal of the box the motes are sampled in, which contains them.
    radius: Math.hypot(maxX - minX, ceilingY - floorY, maxZ - minZ) / 2,
  }
}

/**
 * Moves the dust on by `delta` seconds, in place.
 *
 * Rise plus a slow circle about where the mote was sampled: the vertical is what
 * makes a column of light read as light rather than as a cone of paint, and the
 * circle is what keeps five hundred motes from looking like one object. A mote that
 * reaches the deckhead is returned to the floor and keeps its circle, so the cloud
 * neither thins out nor migrates while the visitor crosses the room.
 *
 * `elapsed` is the walk's own clock, and the horizontal is a function of it rather
 * than of the last frame — so a mote's sway is bounded by its radius exactly, at
 * any frame rate, for as long as anyone cares to stand there.
 *
 * Once per frame per visible cloud: a sine, a cosine and a handful of multiplies
 * per mote, which for the Cha-R warehouse is five hundred of each.
 */
export function driftDust(dust: Dust, delta: number, elapsed: number): void {
  if (!(delta > 0)) return
  const span = dust.ceilingY - dust.floorY
  if (!(span > 0)) return

  // What is left of the last shove, this frame. Exponential rather than linear:
  // still air gives back what was pushed through it fastest at the start, and a
  // linear decay ends with every mote arriving home at the same instant, which
  // reads as the whole cloud snapping.
  const remaining = Math.exp(-delta / PUSH_HALFLIFE)

  for (let i = 0, mote = 0; i < dust.positions.length; i += 3, mote += 2) {
    // The rise is integrated, so the shove has to come *off* the height before
    // the step and go back on after it. Add it to the position and leave it
    // there and the mote climbs by the whole of every shove it has ever taken,
    // for as long as the visitor stays in the room.
    let height = dust.positions[i + 1] - dust.push[i + 1] + DUST_RISE * delta
    // Wrapped rather than reflected: dust that settled and rose again would be a
    // convection current, which is a claim about the ship's air handling.
    while (height > dust.ceilingY) height -= span

    dust.push[i] *= remaining
    dust.push[i + 1] *= remaining
    dust.push[i + 2] *= remaining
    // Clamped into the room's own height, and the clamp is kept: a mote driven
    // at the deckhead has had that much of its shove taken by the deckhead, and
    // giving it back on the way down would be a bounce.
    dust.push[i + 1] = Math.min(
      dust.ceilingY - height,
      Math.max(dust.floorY - height, dust.push[i + 1]),
    )

    const phase = dust.drift[i] + elapsed * dust.drift[i + 1]
    const radius = dust.drift[i + 2]
    dust.positions[i] = dust.origins[mote] + Math.cos(phase) * radius + dust.push[i]
    dust.positions[i + 1] = height + dust.push[i + 1]
    dust.positions[i + 2] = dust.origins[mote + 1] + Math.sin(phase) * radius + dust.push[i + 2]
  }
}

/**
 * Something moving through the air, and how hard.
 *
 * `at` is in ship metres, the same frame the motes are in. `strength` is the
 * displacement at the very centre of it, before the falloff — so it is read in
 * metres too, and a caller can say what it means rather than tuning a number.
 */
export interface DustImpulse {
  at: readonly [number, number, number]
  radius: number
  strength: number
}

/**
 * Shoves the motes out of the way of something passing through them.
 *
 * This is the point at which the dust stops being weather and becomes evidence.
 * The ten rooms that hold it are the ten the reconstruction can say the least
 * about — a five-and-a-half-thousand-square-metre bay with nothing in the middle
 * of it — and until now the visitor could walk the whole length of one without
 * the room registering that anyone had. An aura that displaces the air is the
 * aura *made visible in the air*, which is the only kind of proof a volume can
 * offer; a body that displaces it is the same argument about the body.
 *
 * Displacement is always outward from the source and always bounded by the
 * clearance the mote was sampled with, so no shove — of any strength, from any
 * direction, however many arrive at once — can put a mote through a bulkhead.
 * That bound is the whole reason `room` is carried on the cloud.
 */
export function disturbDust(dust: Dust, impulse: DustImpulse): void {
  if (!(impulse.radius > 0) || !(impulse.strength > 0)) return
  const [sx, sy, sz] = impulse.at

  for (let i = 0; i < dust.positions.length; i += 3) {
    const dx = dust.positions[i] - sx
    const dy = dust.positions[i + 1] - sy
    const dz = dust.positions[i + 2] - sz
    const distance = Math.hypot(dx, dy, dz)
    if (distance > impulse.radius) continue

    // Squared falloff, and a mote sitting exactly on the source is pushed
    // straight up rather than in a direction chosen by a division by zero.
    const near = 1 - distance / impulse.radius
    const force = impulse.strength * near * near
    const unit = distance > 1e-4 ? 1 / distance : 0
    const ux = distance > 1e-4 ? dx * unit : 0
    const uy = distance > 1e-4 ? dy * unit : 1
    const uz = distance > 1e-4 ? dz * unit : 0

    const mote = i / 3
    const allowance = dust.room[mote]
    const nextX = dust.push[i] + ux * force
    const nextZ = dust.push[i + 2] + uz * force
    const reach = Math.hypot(nextX, nextZ)
    const scale = reach > allowance && reach > 0 ? allowance / reach : 1
    dust.push[i] = nextX * scale
    dust.push[i + 2] = nextZ * scale
    dust.push[i + 1] = Math.min(
      PUSH_MAX_RISE,
      Math.max(-PUSH_MAX_RISE, dust.push[i + 1] + uy * force),
    )
  }
}
