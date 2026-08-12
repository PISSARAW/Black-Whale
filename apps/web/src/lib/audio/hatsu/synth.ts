import { type Graph } from '../ambient'
import { emissionColour, emissionDetune, emissionLevel, emissionTarget } from '../space'

/** A sound that runs until something stops it: a motor, a swarm, a dirge. */
export interface Held {
  stop: () => void
}

/** A hair of lead time: scheduling in the past is what makes a click. */
export const LEAD = 0.02

export const startsAt = (g: Graph) => g.context.currentTime + LEAD

// ── The bench ────────────────────────────────────────────────────────────
//
// Two helpers cover everything below. `swept` is a single oscillator that may
// bend — a hoot sags, a punch drops, a boing wobbles — which the theme's own
// `voice` cannot do because nothing in a written melody bends. `rush` is a loop
// of white noise through one filter, which is what air, paper, sparks and
// gunfire all are once you stop naming them.
//
// Both end on `emissionTarget` rather than on the mixer's own filter. That is
// where a cast is placed in the room it happened in, put through the wall
// between it and the ear, and fed into the reverberation of the space the
// visitor is standing in — none of which any voice below has to know about.
// The three `emission*` readings are the variation the same call brings: a
// technique cast twice is not the same recording twice. Outside a cast they
// return neutral, so the theme and the held loops are untouched.

/** Two seconds of white noise, built once per context and looped by everything. */
const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>()

export function noiseBuffer(context: AudioContext): AudioBuffer {
  const held = noiseBuffers.get(context)
  if (held) return held
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 2), context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  noiseBuffers.set(context, buffer)
  return buffer
}

export interface Swept {
  type: OscillatorType
  /** Where the pitch starts, in hertz. */
  from: number
  /** Where it ends, if it moves at all. */
  to?: number
  peak: number
  /** How long the note is held, before the release tail is added to it. */
  duration: number
  attack?: number
  release?: number
  detune?: number
  /** Depth of a pitch wobble, in hertz, and how fast it wobbles. */
  wobble?: number
  wobbleHz?: number
  send?: number
}

/** One oscillator, optionally bending and optionally wobbling as it goes. */
export function swept(g: Graph, at: number, o: Swept) {
  const { context } = g
  const { duration } = o
  const attack = o.attack ?? 0.005
  const release = o.release ?? 0.08
  const ends = at + duration + release

  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.peak * emissionLevel()), at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, ends)

  const osc = context.createOscillator()
  osc.type = o.type
  osc.frequency.setValueAtTime(o.from, at)
  if (o.to !== undefined && o.to !== o.from) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), at + duration)
  }
  // Cents rather than hertz, and the same cents for every voice of the cast:
  // the bend and the wobble keep their shape, the whole thing simply sits a
  // hair off where it sat last time.
  osc.detune.value = (o.detune ?? 0) + emissionDetune()

  if (o.wobble) {
    const lfo = context.createOscillator()
    lfo.frequency.value = o.wobbleHz ?? 7
    const depth = context.createGain()
    depth.gain.value = o.wobble
    lfo.connect(depth)
    depth.connect(osc.frequency)
    lfo.start(at)
    lfo.stop(ends)
  }

  osc.connect(gain)
  gain.connect(emissionTarget(g))
  if (o.send) {
    const send = context.createGain()
    send.gain.value = o.send
    gain.connect(send)
    send.connect(g.reverbSend)
  }
  osc.start(at)
  osc.stop(ends + 0.05)
}

export interface Rush {
  peak: number
  /** How long the gust lasts, before the release tail is added to it. */
  duration: number
  attack?: number
  release?: number
  type?: BiquadFilterType
  /** Where the filter starts, and where it has got to by the end. */
  cutoff?: number
  sweepTo?: number
  q?: number
  send?: number
}

/** A gust of noise through one filter: air, paper, sparks, a shot, a motor. */
export function rush(g: Graph, at: number, o: Rush) {
  const { context } = g
  const { duration } = o
  const attack = o.attack ?? 0.01
  const release = o.release ?? 0.05
  const ends = at + duration + release

  const source = context.createBufferSource()
  source.buffer = noiseBuffer(context)
  source.loop = true

  // Noise has no pitch to detune, so its variation is the filter: the same gust
  // is a few per cent brighter or duller each time it is thrown.
  const colour = emissionColour()
  const filter = context.createBiquadFilter()
  filter.type = o.type ?? 'bandpass'
  filter.frequency.setValueAtTime((o.cutoff ?? 1200) * colour, at)
  if (o.sweepTo !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, o.sweepTo * colour), at + duration)
  }
  filter.Q.value = o.q ?? 1

  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.peak * emissionLevel()), at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, ends)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(emissionTarget(g))
  if (o.send) {
    const send = context.createGain()
    send.gain.value = o.send
    gain.connect(send)
    send.connect(g.reverbSend)
  }
  // From a different point in the two seconds every time. Without this a gust
  // is not merely the same sound twice, it is the same *sample* twice, which is
  // the one thing the ear catches immediately.
  source.start(at, Math.random() * 1.5)
  source.stop(ends + 0.05)
}
