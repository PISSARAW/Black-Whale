import { HULL_FUNDAMENTAL, hullNoise, hullRumble } from '$lib/tour/atmosphere'
import { seaOffset, seaOutside } from '$lib/tour/sea'

import { earLocal, type Facing, type Offset, onSphere } from '../ears'

/**
 * The two noises the ship makes that are not made in a room: the machinery
 * under the floor, and the water outside the hull.
 *
 * The machinery was already here, in `./graph`, mono and in the middle of the
 * visitor's head. It has moved out whole — same fundamental, same pink bed, same
 * lowpass keyed to the deck — and gained two things: a panner, and a companion.
 * The companion is the point. A ship is a machine *floating*, and the walk had
 * only ever built the machine; the sea is the other half of the sentence, and it
 * is the half that tells a visitor which way is up.
 *
 * Neither is fed into the room. The reverberation is what a room does to a sound
 * made in it, and neither of these is made in the room the visitor is standing
 * in — they arrive through its walls. Both go through the walk's `muffle`, so a
 * technique that seals hearing seals the ship and the sea with it, and both end
 * on the `walk` bus rather than the `ambient` one: this is the vessel, not the
 * soundtrack over it. See the note at the head of `../steps`, which argues the
 * same point for the hull and now covers both.
 */

/**
 * What the loudest deck of the ship mixes the hull at.
 *
 * Under the footsteps by design: at Tier 5 the rumble is the floor of the mix and
 * a boot on the plate still lands on top of it. `hullRumble` gives the fraction of
 * this each elevation gets, from 1 in the hold to 0,12 in the King's rooms.
 */
export const HULL_GAIN = 0.16

/**
 * And what the waterline mixes the sea at, which is well under the hull.
 *
 * `$lib/tour/atmosphere` is right that the ship stands in for the weather: the
 * engines are the voice of the Black Whale and the water is the room it is in.
 * Half of `HULL_GAIN` keeps the sea a fact the visitor can check rather than a
 * thing they have to listen past.
 */
export const SEA_GAIN = 0.08

/**
 * Seconds of pink noise in each loop.
 *
 * Long enough that the ear cannot find the period — under two seconds a noise
 * loop is heard as a texture repeating — and short enough that the buffer is a few
 * hundred kilobytes rather than a few megabytes. `hullNoise` folds its ends
 * together, so the length is a question of period and not of the seam. The sea
 * reads a second, longer buffer rather than the hull's, or the two would be
 * correlated and the ear would hear one source with a filter on it.
 */
export const HULL_LOOP = 4
export const SEA_LOOP = 7

/** The deck the damping starts at, before the walk says where the visitor is. */
export const HULL_DECK_DEFAULT = hullRumble(0)

/** How long the environment takes to change when the visitor changes deck. */
export const HULL_SETTLE = 2.5

/**
 * How far the engines are aft of wherever the visitor is standing, in metres.
 *
 * The canon puts Tier 5 at the very bottom of the hull, beside the propeller,
 * and the propeller is at the stern. A fixed bias rather than the real position
 * of an engine room, because the rumble does not arrive from a point — it
 * arrives through two hundred metres of structure, and a point source would
 * swing wildly as the visitor walked past where it was pinned. What this buys is
 * the one thing a purely vertical placement cannot: turning on the spot moves
 * the ship's own note across the head, so the visitor can tell which way they
 * are facing with their eyes shut.
 */
const ENGINE_AFT = 60

/** And how far below the lowest deck they sit, so Tier 5 still stands over them. */
const KEEL = 6

/**
 * The radius both sources are placed at. Direction only — see `onSphere`.
 *
 * Comfortably outside the head and well inside the room, so the HRTF is read at
 * an angle the database actually has rather than at the extremes it interpolates.
 */
const RADIUS = 8

/** How long a panner takes to reach a new position, in seconds. */
const SWING = 0.06

/**
 * The swell, as two slow oscillators that never line up.
 *
 * A big hull meets ocean swell every six to ten seconds, and one LFO at that
 * rate is a machine rather than a sea — the ear finds the period inside three
 * passes. Two incommensurate rates sum to a rise and fall that does not repeat
 * for something over an hour, which is longer than anybody stays aboard.
 */
const SWELL = [
  { hz: 0.11, depth: 0.22 },
  { hz: 0.071, depth: 0.13 },
]

export interface Environment {
  /** How loud the machinery is where the visitor is standing. */
  hull: GainNode
  /** How much of it the decks between here and the engines let through. */
  hullDamp: BiquadFilterNode
  /** How loud the water is, and how much of it survives the hull. */
  sea: GainNode
  seaDamp: BiquadFilterNode
  /** One panner each: this is the whole of the third dimension. */
  panners: { hull: PannerNode; sea: PannerNode }
  /** Where each source is in ship axes, relative to the visitor. */
  at: { hull: Offset; sea: Offset }
  /** The last facing reported, so a change of deck re-places without waiting. */
  facing: Facing
}

function pannerInto(context: AudioContext, into: AudioNode): PannerNode {
  const panner = context.createPanner()
  panner.panningModel = 'HRTF'
  // The distance is not the panner's business — `$lib/tour/sea` and
  // `$lib/tour/atmosphere` have already decided how loud each source is at this
  // elevation, and a rolloff here would apply that decision a second time.
  panner.distanceModel = 'inverse'
  panner.refDistance = RADIUS
  panner.rolloffFactor = 0
  panner.connect(into)
  return panner
}

/** A seamless loop of pink noise, started immediately and never stopped. */
function bed(context: AudioContext, into: AudioNode, spec: { seconds: number; level: number }) {
  const { seconds, level } = spec
  const source = context.createBufferSource()
  const rate = context.sampleRate
  const buffer = context.createBuffer(1, Math.floor(seconds * rate), rate)
  buffer.copyToChannel(hullNoise(seconds, rate), 0)
  source.buffer = buffer
  source.loop = true
  const gain = context.createGain()
  gain.gain.value = level
  source.connect(gain)
  gain.connect(into)
  source.start()
}

/**
 * The machinery: a single very low note and the structure it is transmitted
 * through, shaped by one lowpass, because what changes with elevation is not the
 * engine but how much of it survives the steel.
 */
function buildHull(context: AudioContext, into: AudioNode): Pick<Environment, 'hull' | 'hullDamp'> {
  const hullDamp = context.createBiquadFilter()
  hullDamp.type = 'lowpass'
  hullDamp.frequency.value = HULL_DECK_DEFAULT.cutoff
  hullDamp.Q.value = 0.7

  const hull = context.createGain()
  hull.gain.value = 0
  hullDamp.connect(hull)
  hull.connect(into)

  bed(context, hullDamp, { seconds: HULL_LOOP, level: 0.6 })

  const engine = context.createOscillator()
  engine.type = 'sine'
  engine.frequency.value = HULL_FUNDAMENTAL
  const engineLevel = context.createGain()
  engineLevel.gain.value = 0.5
  engine.connect(engineLevel)
  engineLevel.connect(hullDamp)
  engine.start()

  return { hull, hullDamp }
}

/**
 * The water: the same pink bed, cleared of the bottom octave so it does not
 * fight the engine for the one part of the spectrum the engine owns, opened by
 * a lowpass keyed to the elevation, and breathed on by the swell.
 */
function buildSea(context: AudioContext, into: AudioNode): Pick<Environment, 'sea' | 'seaDamp'> {
  const sea = context.createGain()
  sea.gain.value = 0
  sea.connect(into)

  // Intrinsically one, with the two swell oscillators summed into it: the depth
  // of the breathing is then a property of the sea and not of the deck, and
  // `settleEnvironment` can ramp the level underneath without touching it.
  const swell = context.createGain()
  swell.gain.value = 1
  swell.connect(sea)
  for (const { hz, depth } of SWELL) {
    const lfo = context.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = hz
    const amount = context.createGain()
    amount.gain.value = depth
    lfo.connect(amount)
    amount.connect(swell.gain)
    lfo.start()
  }

  const seaDamp = context.createBiquadFilter()
  seaDamp.type = 'lowpass'
  seaDamp.frequency.value = seaOutside(0).cutoff
  seaDamp.Q.value = 0.5
  seaDamp.connect(swell)

  const clear = context.createBiquadFilter()
  clear.type = 'highpass'
  clear.frequency.value = 60
  clear.Q.value = 0.4
  clear.connect(seaDamp)

  bed(context, clear, { seconds: SEA_LOOP, level: 1 })

  return { sea, seaDamp }
}

/**
 * Builds both, silent, into the node the walk squeezes through when hearing is
 * sealed. The levels arrive the moment the walk says which deck this is.
 */
export function buildEnvironment(context: AudioContext, into: AudioNode): Environment {
  const panners = { hull: pannerInto(context, into), sea: pannerInto(context, into) }
  return {
    ...buildHull(context, panners.hull),
    ...buildSea(context, panners.sea),
    panners,
    at: { hull: { x: 0, y: -KEEL, z: 0 }, sea: { x: 0, y: seaOffset(0), z: 0 } },
    facing: { heading: 0, pitch: 0 },
  }
}

/** Points both panners where `at` and `facing` currently say they are. */
function place(env: Environment) {
  const now = env.panners.hull.context.currentTime
  for (const which of ['hull', 'sea'] as const) {
    const local = onSphere(earLocal(env.at[which], env.facing), RADIUS)
    // Null only when the visitor stands exactly on the source — the waterline
    // itself, which Tier 4's deck is. Leaving the panner where it was is the
    // right answer: the water is all around them and has no direction.
    if (!local) continue
    const panner = env.panners[which]
    panner.positionX.setTargetAtTime(local.x, now, SWING)
    panner.positionY.setTargetAtTime(local.y, now, SWING)
    panner.positionZ.setTargetAtTime(local.z, now, SWING)
  }
}

/**
 * Puts the visitor on a deck: how much of each reaches this elevation, and where
 * each of them is from here.
 *
 * Eased over `HULL_SETTLE`, which is slow on purpose. A lift or a stairwell is
 * the one place on the ship where a visitor changes deck, and this is the whole
 * cue: the rumble comes up to meet them over a couple of seconds, and the water
 * — this is the new half — crosses them. Above Tier 5 it is under the floor;
 * inside Tier 5 it closes over the head. Cut instantly, both would read as a bug
 * in the audio, which is what every abrupt gain change reads as.
 */
export function settleEnvironment(env: Environment, elevation: number) {
  const now = env.hull.context.currentTime
  const ease = HULL_SETTLE / 3
  const rumble = hullRumble(elevation)
  const water = seaOutside(elevation)

  for (const [param, target] of [
    [env.hull.gain, rumble.level * HULL_GAIN],
    [env.hullDamp.frequency, rumble.cutoff],
    [env.sea.gain, water.level * SEA_GAIN],
    [env.seaDamp.frequency, water.cutoff],
  ] as const) {
    param.cancelScheduledValues(now)
    param.setTargetAtTime(target, now, ease)
  }

  env.at.hull = { x: ENGINE_AFT, y: -(elevation + KEEL), z: 0 }
  env.at.sea = { x: 0, y: seaOffset(elevation), z: 0 }
  place(env)
}

/**
 * Turns the visitor's head.
 *
 * Called on every meaningful change of heading or pitch, which is a good deal
 * more often than the deck changes and a good deal less often than a frame: six
 * audio parameters ramped over `SWING` cost nothing measurable, and the geometry
 * the walk does for the room is deliberately not repeated here.
 */
export function orientEnvironment(env: Environment, facing: Facing) {
  env.facing = facing
  place(env)
}
