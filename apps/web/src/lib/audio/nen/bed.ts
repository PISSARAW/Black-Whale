import type { Graph } from '../ambient'
import { noiseBuffer } from '../hatsu/synth'

/**
 * The sound the Nen itself makes: one bed, started once, never rebuilt.
 *
 * The manga writes it rather than draws it — ゴゴゴゴ under a panel where
 * nothing is moving, which is the reader being told that the air in that room
 * is under pressure. The anime gives the same panel a low roll with a beat in
 * it, somewhere between a gas burner and a held cello, and it is the one sound
 * that never has a source you could point at. That is the thing being built
 * here: not an effect that fires, a floor that is either there or not.
 *
 * Four layers, because one oscillator at 38 Hz is a hum and not a threat:
 *
 *   - a sub and its fifth, felt more than heard, which is the pressure;
 *   - an octave above them, which is what a laptop speaker can actually make;
 *   - noise through a resonant low-pass, beaten at 4.6 Hz — the ゴゴゴ, the
 *     part that is granular instead of pure, and the part that makes it read as
 *     something churning rather than as a test tone;
 *   - a pair of near-identical sines up at 4.2 kHz beating seven times a
 *     second: the ringing the anime puts under a moment of dread. It is on its
 *     own fader because it belongs to *seeing* something, not to holding aura,
 *     and Ren without Gyo must not have it.
 *
 * The whole thing runs from the first Nen the visitor raises to the end of the
 * session, silent at the bottom of its fader in between. Oscillators are cheap
 * and starting one is not: a bed rebuilt on every state change clicks on every
 * state change, and there are a dozen of those in ten seconds of play.
 *
 * It ends on `g.muffle`, so Three Monkeys takes the aura's own voice with
 * everything else — sealed hearing is sealed hearing — and it is on the
 * techniques' bus, which `veil.ts` never touches. Gyo closing the world does
 * not close this.
 */

/** Where the pressure sits. The fifth is a touch flat, so the two beat slowly. */
const SUB = 38
const FIFTH = SUB * 1.5
const OCTAVE = SUB * 2

/** The churn: noise through this, resonant enough to have a pitch of its own. */
const RUMBLE = { cutoff: 124, q: 4.2 }

/** How fast the churn beats, and how deep. */
const TREMOLO = { hz: 4.6, depth: 0.46 }

/** The slow swell over the top of it, so a held aura never sits still. */
const BREATH = { hz: 0.11, depth: 0.17 }

/** The dread. Two sines this far apart beat at their difference. */
const RING = { hz: 4180, beat: 7 }

/**
 * What full pressure and full ring are worth at the fader.
 *
 * Low for what it sounds like, because unlike every other voice aboard this one
 * is *constant*: a bed that sits where a cast sits eats the headroom the cast
 * needs, and the limiter in `output.ts` would spend the whole visit leaning on
 * a hum. Four layers summing in and out of phase get most of it back.
 */
const PRESSURE_PEAK = 0.1
const RING_PEAK = 0.0055

export interface NenBed {
  /** How much aura is in the air, from 0 to 1. */
  pressure(level: number, seconds: number): void
  /** How much is being looked at, from 0 to 1. */
  ring(level: number, seconds: number): void
}

const beds = new WeakMap<AudioContext, NenBed>()

function gainOf(g: Graph, value: number): GainNode {
  const gain = g.context.createGain()
  gain.gain.value = value
  return gain
}

function running(g: Graph, options: { hz: number; type: OscillatorType; detune?: number }) {
  const osc = g.context.createOscillator()
  osc.type = options.type
  osc.frequency.value = options.hz
  osc.detune.value = options.detune ?? 0
  osc.start()
  return osc
}

/**
 * A slow oscillation written onto a gain that already sits at one.
 *
 * In series rather than on the output fader: an LFO connected to an AudioParam
 * adds to it, so modulating the fader itself would make the bed breathe at the
 * same depth when it is silent as when it is full — and a gain driven below
 * zero inverts rather than stopping.
 */
function breathing(g: Graph, options: { hz: number; depth: number }): GainNode {
  const stage = gainOf(g, 1)
  const lfo = running(g, { hz: options.hz, type: 'sine' })
  const depth = gainOf(g, options.depth)
  lfo.connect(depth)
  depth.connect(stage.gain)
  return stage
}

function buildPressure(g: Graph): GainNode {
  const out = gainOf(g, 0.0001)
  const swell = breathing(g, BREATH)
  swell.connect(out)

  const sub = gainOf(g, 1)
  running(g, { hz: SUB, type: 'sine' }).connect(sub)
  const fifth = gainOf(g, 0.34)
  running(g, { hz: FIFTH, type: 'sine', detune: -9 }).connect(fifth)
  const octave = gainOf(g, 0.22)
  running(g, { hz: OCTAVE, type: 'triangle', detune: 5 }).connect(octave)
  sub.connect(swell)
  fifth.connect(swell)
  octave.connect(swell)

  const source = g.context.createBufferSource()
  source.buffer = noiseBuffer(g.context)
  source.loop = true
  const low = g.context.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.value = RUMBLE.cutoff
  low.Q.value = RUMBLE.q
  const churn = breathing(g, TREMOLO)
  const rumble = gainOf(g, 0.7)
  source.connect(low)
  low.connect(churn)
  churn.connect(rumble)
  rumble.connect(swell)
  source.start()

  out.connect(g.muffle)
  return out
}

function buildRing(g: Graph): GainNode {
  const out = gainOf(g, 0.0001)
  running(g, { hz: RING.hz, type: 'sine' }).connect(out)
  running(g, { hz: RING.hz + RING.beat, type: 'sine' }).connect(out)
  out.connect(g.muffle)
  return out
}

function ramp(g: Graph, node: GainNode, to: { level: number; peak: number; seconds: number }) {
  const now = g.context.currentTime
  node.gain.cancelScheduledValues(now)
  node.gain.setTargetAtTime(
    Math.max(0.0001, Math.min(1, Math.max(0, to.level)) * to.peak),
    now,
    Math.max(0.001, to.seconds / 3),
  )
}

/** The bed for this context, built on the first aura the visitor raises. */
export function nenBed(g: Graph): NenBed {
  const held = beds.get(g.context)
  if (held) return held
  const pressure = buildPressure(g)
  const ring = buildRing(g)
  const bed: NenBed = {
    pressure: (level, seconds) => ramp(g, pressure, { level, peak: PRESSURE_PEAK, seconds }),
    ring: (level, seconds) => ramp(g, ring, { level, peak: RING_PEAK, seconds }),
  }
  beds.set(g.context, bed)
  return bed
}
