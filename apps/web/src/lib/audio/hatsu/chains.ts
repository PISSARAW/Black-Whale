import { hatsuAudioGraph } from '../ambient'

import { rush, startsAt, swept } from './synth'

// ── The chain ─────────────────────────────────────────────────────────────
//
// Kurapika's five fingers, and the sounds the walk had not yet given them.
// Every one of these is metal under tension: a chain pulled from the hand,
// a ring that closes, a blade that drives in. They share the same material
// because the manga does — the chain is one aura in five shapes.

/**
 * Chain Jail closing around a room.
 *
 * Five rings of metal snapping shut, each a little faster than the one before,
 * because a chain that has found its length stops slack. The rings are short
 * inharmonic pings rather than notes — a chain is not a bell — and the whole
 * thing is sent hard to the reverb so it sounds as though it filled the frame.
 */
export function chainRings() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const RINGS = 5

  for (let i = 0; i < RINGS; i++) {
    const when = at + i * 0.045
    // The ring itself: a cluster of partials, none of them quite in tune.
    for (const partial of [2100, 2680, 3320, 4100]) {
      swept(g, when, {
        duration: 0.015,
        type: 'sine',
        from: partial + i * 80,
        to: partial * 0.96,
        peak: 0.025,
        attack: 0.001,
        release: 0.08 - i * 0.01,
        send: 0.5,
      })
    }
    // The slide of one link through the next.
    rush(g, when, {
      duration: 0.04,
      peak: 0.035,
      type: 'bandpass',
      cutoff: 1800,
      sweepTo: 5200,
      q: 1.8,
      attack: 0.002,
      release: 0.05,
      send: 0.4,
    })
  }

  // The final catch: the lock turning.
  swept(g, at + RINGS * 0.045, {
    duration: 0.04,
    type: 'triangle',
    from: 880,
    to: 220,
    peak: 0.08,
    attack: 0.002,
    release: 0.25,
    send: 0.6,
  })
}

/**
 * Judgment Chain driving a blade into the heart.
 *
 * The manga draws it as a single sudden strike: the chain goes in, the rule
 * is spoken, and the heart is bound. The sound is the point of the blade
 * arriving — a short metallic crack — followed by the same rings tightening
 * one beat later, because the chain does not stop once it has made its point.
 */
export function judgeByHeart() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The blade.
  rush(g, at, {
    duration: 0.04,
    peak: 0.11,
    type: 'highpass',
    cutoff: 3400,
    sweepTo: 1200,
    q: 1.4,
    attack: 0.001,
    release: 0.12,
    send: 0.55,
  })
  swept(g, at, {
    duration: 0.03,
    type: 'square',
    from: 1600,
    to: 400,
    peak: 0.08,
    attack: 0.001,
    release: 0.15,
    send: 0.5,
  })

  // The rings that follow, three of them, tighter than Chain Jail's.
  for (let i = 0; i < 3; i++) {
    const when = at + 0.12 + i * 0.035
    for (const partial of [2400, 3000, 3800]) {
      swept(g, when, {
        duration: 0.012,
        type: 'sine',
        from: partial,
        to: partial * 0.95,
        peak: 0.022,
        attack: 0.001,
        release: 0.06,
        send: 0.55,
      })
    }
  }
}

/**
 * Skill Hunter turning a page, or Steal Chain tearing one away.
 *
 * Chrollo's book and Kurapika's dolphin both trade in pages. The sound is the
 * page being pulled from the spine — a short rough tear of paper and the click
 * of whatever held it. Gallery Fake uses the same gesture, and the walk already
 * gives that a fold of paper; this is the same family, louder and more abrupt.
 */
export function tearAPage() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The tear.
  rush(g, at, {
    duration: 0.18,
    peak: 0.07,
    type: 'highpass',
    cutoff: 4200,
    sweepTo: 2600,
    q: 1.2,
    attack: 0.02,
    release: 0.1,
    send: 0.35,
  })
  // The spine click that says it came free.
  swept(g, at + 0.14, {
    duration: 0.02,
    type: 'triangle',
    from: 560,
    to: 180,
    peak: 0.07,
    attack: 0.001,
    release: 0.08,
    send: 0.4,
  })
}
