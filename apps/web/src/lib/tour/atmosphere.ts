/**
 * What the room does to the light and the sound crossing it.
 *
 * The reconstruction knows the size of every space it draws — that is most of
 * what it knows — and until now it told the visitor none of it. One fog setting
 * stood for volumes from a twelve-square-metre cabin to a five-and-a-half
 * thousand square metre hold, and the walk was silent, so a corridor and a hall
 * differed only in how long the walls took to arrive.
 *
 * Both are read from the same measurement: the longest chord of the footprint
 * and the ceiling over it. No new data, no new geometry — the blueprint already
 * says all of this, and everything here is arithmetic on it.
 */
import { longestChord, perimeter, polygonArea } from './geometry'
import { ceilingOf } from './blueprint'
import type { Space, Tier } from './types'

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

// ── Air ────────────────────────────────────────────

/**
 * How much of the sight line the haze is allowed to swallow.
 *
 * `FogExp2` leaves a fraction `exp(-(d·density)²)` of a surface at `d` metres
 * showing, so at `d = 1/density` a little over a third of it is left: far enough
 * to be read as depth, close enough that the end of the room is plainly hazed.
 * The density that does that for a given room is therefore `REACH / chord`.
 */
const REACH = 1.4

/**
 * The thickest and thinnest air the ship holds.
 *
 * The floor keeps a hundred-and-sixty-metre hall from being drawn in vacuum —
 * the far end must not be as crisp as the near end, or the length is a fact
 * about the minimap and not about the room. The ceiling keeps a cabin from
 * fogging up at arm's length: at 0,09 a wall four metres off still shows
 * seven-eighths of itself.
 */
export const MIN_DENSITY = 0.006
export const MAX_DENSITY = 0.09

/**
 * How far the fog closes to when sight is sealed.
 *
 * The monkeys take seeing, not the ship: the air goes solid at arm's length and
 * the hull is still there behind it. Its own constant rather than a room read
 * through `fogDensityFor`, because it has nothing to do with the size of the
 * room — that is the point of it.
 */
export const SEALED_REACH = 1.6
export const SEALED_DENSITY = REACH / SEALED_REACH

/** The air of a room, from the longest sight line it can offer. */
export function fogDensityFor(chord: number): number {
  if (!(chord > 0)) return MAX_DENSITY
  return clamp(REACH / chord, MIN_DENSITY, MAX_DENSITY)
}

/** The same, for a space of the ship. */
export function fogDensityOf(space: Space): number {
  return fogDensityFor(longestChord(space.footprint))
}

/**
 * How long the air takes to change when the visitor crosses a threshold.
 *
 * Snapping the density at the doorway would be a cut, and a cut reads as a bug
 * in the renderer rather than as a change in the ship. Over a little under half
 * a second the change is unmistakably felt and never seen to happen: you walk
 * out of the corridor and the air opens.
 */
export const SETTLE = 0.45

/**
 * The density this frame, easing towards the room the visitor is now in.
 *
 * Exponential rather than linear so it is frame-rate independent — the same walk
 * through the same door settles the same way at 30 Hz and at 144 Hz — and so the
 * approach has no corner at the end of it. `SETTLE` is the time to close about
 * 95% of the gap, which is three time constants.
 */
export function settleDensity(current: number, target: number, delta: number): number {
  if (!(delta > 0)) return current
  return current + (target - current) * (1 - Math.exp((-delta * 3) / SETTLE))
}

// ── Sound ──────────────────────────────────────────

/** Metres a second, at the temperature a heated ship holds. */
export const SPEED_OF_SOUND = 343

/**
 * The Sabine absorption coefficient of the ship's surfaces.
 *
 * A single figure for painted steel, riveted plate and the bare deck between
 * them: hard, reflective, but not a laboratory chamber — there are people,
 * bedding and upholstery in most of these rooms. Frequency-dependent
 * coefficients would be more honest still, and would need a table of materials
 * per surface that the blueprint does not have and the manga cannot support.
 * One coefficient is the claim the sources can carry.
 */
export const ABSORPTION = 0.16

/** The air a room holds, in cubic metres. */
export function roomVolume(space: Space, tier: Tier): number {
  return polygonArea(space.footprint) * ceilingOf(space, tier)
}

/** Every surface the sound can strike: floor, ceiling and the walls round it. */
export function roomSurface(space: Space, tier: Tier): number {
  return polygonArea(space.footprint) * 2 + perimeter(space.footprint) * ceilingOf(space, tier)
}

/**
 * The shortest and longest reverberation the walk will play.
 *
 * The floor is there because a cupboard with no reverberation at all sounds like
 * a dead studio rather than like a small steel room. The ceiling is there
 * because Sabine's equation is a diffuse-field approximation: past about four
 * seconds it is describing a cathedral, and the hold — however large — is full
 * of springs, crates and stanchions that break the field up long before that.
 */
export const MIN_REVERB = 0.25
export const MAX_REVERB = 4

/**
 * How long the room rings, in seconds, by Sabine's equation.
 *
 * `RT60 = 0,161 · V / (S · α)` — the time for a sound to fall 60 dB. It is the
 * oldest result in architectural acoustics and it needs exactly what the
 * blueprint already has: a volume and a surface area.
 */
export function reverbTime(space: Space, tier: Tier): number {
  const absorption = roomSurface(space, tier) * ABSORPTION
  if (absorption <= 0) return MIN_REVERB
  return clamp((0.161 * roomVolume(space, tier)) / absorption, MIN_REVERB, MAX_REVERB)
}

/**
 * When the first reflection comes back off a wall that far away, in seconds.
 *
 * The round trip, not the one-way distance: a footstep leaves the visitor's
 * feet, crosses to the wall and crosses back to their ears. This is the cue the
 * ear actually uses to size a room — it is what makes a corridor sound like a
 * corridor before the tail of the reverberation has said anything — and it is
 * the one part of the acoustics that has to follow the visitor around the room
 * rather than being a property of the room.
 */
export function slapDelay(wallDistance: number): number {
  return clamp((2 * Math.max(0, wallDistance)) / SPEED_OF_SOUND, 0.004, 0.5)
}

/**
 * A deterministic noise source.
 *
 * `Math.random` would give a different room to every visitor and a different one
 * to the same visitor twice, which for a reconstruction that publishes its
 * sources is the wrong kind of variation: the hold should sound like the hold.
 * Seeded on the room instead, so the same space always answers the same way.
 */
function noise(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1
  }
}

/**
 * How much of the tail is worth convolving, in seconds.
 *
 * A four-second impulse response is four seconds of multiply-adds on the audio
 * thread for a tail whose last stretch is 40 dB down and inaudible under a
 * footstep. Cut here, with the decay curve taken to its own end rather than to
 * the cut, so shortening the buffer does not brighten the room.
 */
export const MAX_TAIL = 2.5

/**
 * A room's impulse response, synthesised.
 *
 * Not a recording: an exponential decay over seeded noise, with the early
 * reflections put in by hand where the geometry says they land. That is the same
 * bargain the rest of the tour makes — the springs are drawn from the panel that
 * shows them and the corridor between them is marked as invented — and it costs
 * no download, which a real impulse response of a fictional ship could not
 * honestly be anyway.
 *
 * The noise is smoothed by a one-pole filter whose coefficient rises with the
 * reverberation time, because a large room absorbs its highs on every one of the
 * many more bounces the sound makes before it dies: a hold rumbles where a cabin
 * rings. Written mono; the graph reads the same buffer into both ears, so a
 * moving visitor is placed by the slap and by the level, not by the tail.
 */
export function impulseResponse(
  rt60: number,
  sampleRate: number,
  options: { reflections?: number[]; seed?: number } = {},
  // The buffer it writes is handed straight to `AudioBuffer.copyToChannel`,
  // which takes an array over a plain `ArrayBuffer` and not over a shared one.
): Float32Array<ArrayBuffer> {
  const decay = clamp(rt60, MIN_REVERB, MAX_REVERB)
  const length = Math.max(1, Math.floor(Math.min(decay, MAX_TAIL) * sampleRate))
  const buffer = new Float32Array(length)
  const random = noise(options.seed ?? 1)

  // −60 dB at `decay` seconds is the definition of the reverberation time.
  const fade = Math.log(1000) / decay
  // Duller as the room grows: 0,2 in a cabin, past 0,6 in the hold.
  const dullness = clamp(0.18 + decay * 0.16, 0.18, 0.7)
  let previous = 0

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate
    previous += (random() - previous) * (1 - dullness)
    buffer[i] = previous * Math.exp(-fade * t)
  }

  // The discrete reflections sit on top of the diffuse tail: a wall close enough
  // to hear is a single slap, not a thickening of the noise.
  for (const at of options.reflections ?? []) {
    const index = Math.floor(at * sampleRate)
    if (index < 0 || index >= length) continue
    buffer[index] += 0.6 * Math.exp(-fade * at)
  }

  return buffer
}

// ── The hull ───────────────────────────────────────

/**
 * How loud the machinery is, and how much of it gets through, deck by deck.
 *
 * There is no sky on the Black Whale — two windows out of 314 spaces, and the
 * rest of the voyage happens inside a hull. What stands in for the weather is the
 * ship itself: the engines are in the bottom of it, and everything above them
 * hears a filtered version of the same noise. Stand on Tier 5 and it is a
 * presence; stand in the King's living room seventy-two metres up and it is a
 * suggestion you notice when it changes.
 *
 * These five pairs are a mix decision and not a derivation, which is why they are
 * written out rather than computed: nothing in `blueprint.json` measures a decibel
 * or a corner frequency, and a formula here would dress a choice up as a
 * measurement. What they *do* follow is the one figure the blueprint gives — the
 * elevation of the deck — so a level between two decks is interpolated rather than
 * guessed, and an interior carries the elevation of the deck it is inside.
 *
 * Level is a fraction of `HULL_GAIN` in `$lib/audio/steps`, where it is mixed
 * against the footsteps; the cutoff is in hertz, and the fall from 260 to 70 is
 * the mass of four decks of steel between the visitor and the engine room.
 */
export const HULL_DECKS: readonly { elevation: number; level: number; cutoff: number }[] = [
  { elevation: 0, level: 1, cutoff: 260 },
  { elevation: 18, level: 0.7, cutoff: 190 },
  { elevation: 36, level: 0.45, cutoff: 140 },
  { elevation: 54, level: 0.25, cutoff: 100 },
  { elevation: 72, level: 0.12, cutoff: 70 },
]

/**
 * The rumble at an elevation, interpolated between the decks around it.
 *
 * Linear in elevation, and flat outside the range: the hold is the loudest place
 * on the ship because it is the closest to the machinery, and nothing above Tier 1
 * is quieter than Tier 1 because there is nothing above Tier 1.
 */
export function hullRumble(elevation: number): { level: number; cutoff: number } {
  const first = HULL_DECKS[0]
  const last = HULL_DECKS[HULL_DECKS.length - 1]
  if (!(elevation > first.elevation)) return { level: first.level, cutoff: first.cutoff }
  if (elevation >= last.elevation) return { level: last.level, cutoff: last.cutoff }

  for (let i = 1; i < HULL_DECKS.length; i++) {
    const above = HULL_DECKS[i]
    if (elevation > above.elevation) continue
    const below = HULL_DECKS[i - 1]
    const t = (elevation - below.elevation) / (above.elevation - below.elevation)
    return {
      level: below.level + (above.level - below.level) * t,
      cutoff: below.cutoff + (above.cutoff - below.cutoff) * t,
    }
  }
  return { level: last.level, cutoff: last.cutoff }
}

/** The lowest note of the hull, in hertz: the engine, not the room it is heard in. */
export const HULL_FUNDAMENTAL = 38

/**
 * The bed of noise under the rumble, as a buffer meant to be looped.
 *
 * Pink rather than white — Kellet's three-pole approximation, which is within a
 * fraction of a decibel of −3 dB an octave across the band that survives the
 * lowpass this is played through. White noise here would be a hiss with the top
 * taken off it; pink noise is what a large machine heard through a structure
 * actually sounds like, because every doubling of frequency carries the same
 * energy in the source and the hull takes the top off both.
 *
 * The last `FOLD` seconds are crossfaded into the first, so the loop point is
 * continuous in value and in slope. A discontinuity there would be a click once
 * per pass — the one artefact a listener localises immediately, and the reason a
 * generated loop is usually longer than it needs to be.
 *
 * Seeded, like every other noise in the walk: the ship is a reconstruction and
 * has to sound the same to two visitors.
 */
export function hullNoise(
  seconds: number,
  sampleRate: number,
  seed = 5,
  // Handed straight to `AudioBuffer.copyToChannel`, which wants a plain buffer.
): Float32Array<ArrayBuffer> {
  const FOLD = 0.25
  const length = Math.max(2, Math.floor(seconds * sampleRate))
  const fold = Math.min(Math.floor(FOLD * sampleRate), Math.floor(length / 2) - 1)
  const random = noise(seed)

  const raw = new Float32Array(length + fold)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  let peak = 0
  for (let i = 0; i < raw.length; i++) {
    const white = random()
    b0 = 0.99765 * b0 + white * 0.099046
    b1 = 0.963 * b1 + white * 0.2965164
    b2 = 0.57 * b2 + white * 1.0526913
    const pink = b0 + b1 + b2 + white * 0.1848
    raw[i] = pink
    if (Math.abs(pink) > peak) peak = Math.abs(pink)
  }

  const buffer = new Float32Array(length)
  // Normalised so the gain in the graph is the only thing that sets the level.
  const scale = peak > 0 ? 1 / peak : 1
  for (let i = 0; i < length; i++) buffer[i] = raw[i] * scale

  // The fold: the tail written past the end of the loop is mixed back over its
  // head, each fading as the other rises, so playing the buffer end to end has
  // no seam in it at all.
  for (let i = 0; i < fold; i++) {
    const t = i / fold
    buffer[i] = buffer[i] * t + raw[length + i] * scale * (1 - t)
  }

  return buffer
}
