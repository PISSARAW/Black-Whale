import { hatsuAudioGraph } from '../ambient'

import { rush, startsAt, swept } from './synth'

/**
 * A refusal: the gesture happened, but the ship would not take it.
 *
 * Short inharmonic cluster, low and dry, so it reads as a door closing rather
 * than an error. Used for every refusal that already has a physical gesture
 * (a hand went up, a cast was made) and for the limits the technique states.
 */
export function decline() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // Two saw waves a semitone apart, dying quickly: the smallest possible "no".
  for (const detune of [-5, 7]) {
    swept(g, at, {
      duration: 0.05,
      type: 'sawtooth',
      from: 180,
      to: 90,
      peak: 0.05,
      attack: 0.002,
      release: 0.12,
      detune,
      send: 0.3,
    })
  }
  // And the air leaving the gesture.
  rush(g, at, {
    duration: 0.08,
    peak: 0.04,
    type: 'bandpass',
    cutoff: 600,
    sweepTo: 200,
    q: 1.5,
    attack: 0.005,
    release: 0.1,
    send: 0.25,
  })
}
