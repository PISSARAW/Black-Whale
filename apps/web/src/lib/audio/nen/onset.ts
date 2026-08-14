import type { Graph } from '../ambient'
import { noiseBuffer } from '../hatsu/synth'

/**
 * The two edges of the veil: the world closing, and the world coming back.
 *
 * A fader alone is not an event. The anime never fades into Gyo — it cuts, on
 * a high metallic ring that arrives with the eyes and then hangs in the room
 * while everything else is already gone. Without that strike the veil is heard
 * as the volume slipping; with it, it is heard as the visitor doing something.
 *
 * Both are written straight onto `g.muffle` and not onto the placed emission
 * the techniques use. A cast happens somewhere in the ship and is put through
 * the wall between there and the ear; this happens behind the ear, and putting
 * it in the room would be saying the ship had made the sound. It had not.
 */

const LEAD = 0.015

interface Ping {
  hz: number
  to?: number
  peak: number
  duration: number
  attack?: number
  type?: OscillatorType
}

function ping(g: Graph, at: number, o: Ping) {
  const osc = g.context.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.hz, at)
  if (o.to !== undefined)
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), at + o.duration)
  const gain = g.context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(o.peak, at + (o.attack ?? 0.004))
  gain.gain.exponentialRampToValueAtTime(0.0001, at + o.duration)
  osc.connect(gain)
  gain.connect(g.muffle)
  osc.start(at)
  osc.stop(at + o.duration + 0.04)
}

interface Hiss {
  cutoff: number
  sweepTo?: number
  q?: number
  peak: number
  duration: number
  type?: BiquadFilterType
}

function hiss(g: Graph, at: number, o: Hiss) {
  const source = g.context.createBufferSource()
  source.buffer = noiseBuffer(g.context)
  source.loop = true
  const filter = g.context.createBiquadFilter()
  filter.type = o.type ?? 'bandpass'
  filter.frequency.setValueAtTime(o.cutoff, at)
  if (o.sweepTo !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, o.sweepTo), at + o.duration)
  }
  filter.Q.value = o.q ?? 1
  const gain = g.context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(o.peak, at + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + o.duration)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(g.muffle)
  source.start(at, Math.random() * 1.5)
  source.stop(at + o.duration + 0.05)
}

/**
 * Aura into the eyes: the strike that closes the world.
 *
 * Three things inside a tenth of a second and one that outlives them. The hiss
 * is the intake — bright, short, gone before it is identified. The falling
 * sine under it is the focus itself, five kilohertz down to two, which is the
 * shape the anime draws as lines converging on a pupil. And then the ring: two
 * sines a beat apart, held for the better part of a second at a level that is
 * barely there, so that when the room has finished leaving there is still
 * something in the ear. That last one is the whole cue. Cut it and the veil is
 * a mute button.
 */
export function snapIntoGyo(g: Graph): void {
  const at = g.context.currentTime + LEAD
  hiss(g, at, { cutoff: 2400, sweepTo: 5200, q: 9, peak: 0.03, duration: 0.07 })
  ping(g, at, { hz: 5400, to: 2300, peak: 0.02, duration: 0.14 })
  ping(g, at + 0.03, { hz: 3120, peak: 0.026, duration: 0.72, attack: 0.006 })
  ping(g, at + 0.03, { hz: 3129, peak: 0.026, duration: 0.78, attack: 0.006 })
}

/**
 * Letting it go: the room arriving back before the fader has finished opening.
 *
 * Deliberately the plainer of the two. Coming out of Gyo is a relief and not an
 * event — a low fall and a breath of air, and the ship does the rest by simply
 * being audible again.
 */
export function letGoOfGyo(g: Graph): void {
  const at = g.context.currentTime + LEAD
  ping(g, at, { hz: 150, to: 62, peak: 0.05, duration: 0.3, type: 'triangle' })
  hiss(g, at, { cutoff: 300, sweepTo: 1400, q: 0.7, peak: 0.014, duration: 0.26, type: 'lowpass' })
}
