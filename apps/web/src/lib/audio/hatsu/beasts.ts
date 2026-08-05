import { hatsuAudioGraph } from '../ambient'

import { rush, startsAt, swept } from './synth'

// ── The beasts ────────────────────────────────────────────────────────────
//
// Guardian Spirit Beasts and the other summoned things the walk draws. They
// are not animals — they are aura given hunger — so none of them sounds like
// a real creature. Each voice is a family: the big ones gnaw, the long ones
// coil, the curses mark, and the swarms buzz.

/**
 * A big Guardian Spirit Beast arriving or leaving.
 *
 * Low irregular crunch, like a mouth closing on metal. The attack is soft
 * because the beast does not leap; it arrives, and the whole room feels it.
 */
export function gnash() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The body of the sound: noise dragged down through a closing lowpass.
  rush(g, at, {
    duration: 0.65,
    peak: 0.11,
    type: 'lowpass',
    cutoff: 700,
    sweepTo: 180,
    q: 0.8,
    attack: 0.12,
    release: 0.35,
    send: 0.55,
  })

  // Two low detuned saws give it a jaw rather than a wind.
  for (const [offset, from, peak] of [
    [0, 92, 0.07],
    [0.08, 86, 0.05],
  ]) {
    swept(g, at + offset, {
      duration: 0.55,
      type: 'sawtooth',
      from,
      to: from * 0.7,
      peak,
      attack: 0.1,
      release: 0.3,
      wobble: 9,
      wobbleHz: 11,
      send: 0.45,
    })
  }
}

/**
 * A snake, a centipede, or any long thing coiling around a room.
 *
 * Quick sine ripples that speed up, like scales sliding over one another, with
 * a dry rattle at the end.
 */
export function coil() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  const SCALES = 8
  for (let i = 0; i < SCALES; i++) {
    const when = at + i * 0.038
    swept(g, when, {
      duration: 0.03,
      type: 'sine',
      from: 280 + i * 45,
      to: 180 + i * 25,
      peak: 0.035,
      attack: 0.002,
      release: 0.06,
      send: 0.3,
    })
  }

  // The rattle.
  for (let i = 0; i < 6; i++) {
    const when = at + SCALES * 0.038 + i * 0.02
    swept(g, when, {
      duration: 0.01,
      type: 'triangle',
      from: 1200,
      to: 900,
      peak: 0.03,
      attack: 0.001,
      release: 0.03,
      send: 0.25,
    })
  }
}

/**
 * A curse being laid on a room.
 *
 * The walk does not say what the curse does; it only says that something was
 * marked. The sound is a low pulse, like a seal pressed into wax, followed by
 * a long decay.
 */
export function curseSet() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The seal.
  swept(g, at, {
    duration: 0.08,
    type: 'sine',
    from: 220,
    to: 55,
    peak: 0.1,
    attack: 0.004,
    release: 0.45,
    send: 0.5,
  })
  rush(g, at, {
    duration: 0.12,
    peak: 0.06,
    type: 'bandpass',
    cutoff: 400,
    sweepTo: 120,
    q: 1.4,
    attack: 0.01,
    release: 0.35,
    send: 0.45,
  })
}

/**
 * A swarm or flock moving as one.
 *
 * Tyson's eye-wogs, Momoze's flock, or any mass of small aura-things. It is
 * higher and more irregular than a single beast, and it stays in motion.
 */
export function swarm() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  rush(g, at, {
    duration: 0.55,
    peak: 0.07,
    type: 'bandpass',
    cutoff: 2200,
    sweepTo: 1200,
    q: 1.6,
    attack: 0.08,
    release: 0.25,
    send: 0.4,
  })

  for (let i = 0; i < 12; i++) {
    const when = at + i * 0.04 + Math.random() * 0.02
    swept(g, when, {
      duration: 0.025,
      type: 'sine',
      from: 1800 + Math.random() * 600,
      to: 1400 + Math.random() * 400,
      peak: 0.02,
      attack: 0.001,
      release: 0.04,
      send: 0.3,
    })
  }
}
