import { hatsuAudioGraph, midiToHz } from '../ambient'

import { rush, startsAt, swept } from './synth'

// ── The things that happen ───────────────────────────────────────────────

/**
 * Air Blow, crossing the ship.
 *
 * One long band of air sweeping downward — a gust is bright at the front and
 * dark by the time it has gone past — timed to the 1,1 s the scene gives the
 * motes, so the sound and the picture end together.
 */
export function blowAGust() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  rush(g, at, {
    duration: 1,
    peak: 0.13,
    type: 'bandpass',
    cutoff: 1100,
    sweepTo: 220,
    q: 0.55,
    attack: 0.16,
    release: 0.25,
    send: 0.4,
  })
  // A second, thinner band a beat behind: the tail of the same gust.
  rush(g, at + 0.12, {
    duration: 0.85,
    peak: 0.05,
    type: 'highpass',
    cutoff: 2400,
    sweepTo: 700,
    attack: 0.2,
    release: 0.3,
    send: 0.6,
  })
}

/**
 * Remote Punch, arriving.
 *
 * A fist is a very short broadband crack over a sine that falls two octaves in
 * under a fifth of a second. Nothing rings: the aura came up out of the deck,
 * hit something, and stopped.
 */
export function landAPunch() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  swept(g, at, {
    duration: 0.16,
    type: 'sine',
    from: 168,
    to: 42,
    peak: 0.26,
    attack: 0.004,
    release: 0.18,
    send: 0.25,
  })
  rush(g, at, {
    duration: 0.05,
    peak: 0.12,
    type: 'lowpass',
    cutoff: 1800,
    sweepTo: 400,
    attack: 0.002,
    release: 0.1,
  })
  // The deck it came up through, answering.
  swept(g, at + 0.02, {
    duration: 0.3,
    type: 'triangle',
    from: 74,
    to: 52,
    peak: 0.07,
    release: 0.35,
  })
}

/**
 * Rising Sun, at the radius the wrapping had taken.
 *
 * Not an explosion — Feitan does not throw it, he becomes it — so it blooms:
 * a low roar underneath, a shimmer climbing over the top, and both of them
 * scaled by how far the heat reached. The 2,4 s matches the scene's exposure.
 */
export function raiseTheSun(metres = 12) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const reach = Math.min(2, Math.max(0.5, metres / 14))

  // The roar.
  rush(g, at, {
    duration: 1.9,
    peak: 0.13 * reach,
    type: 'lowpass',
    cutoff: 90,
    sweepTo: 900,
    q: 0.6,
    attack: 0.7,
    release: 0.7,
    send: 0.5,
  })
  // The shimmer: two saws a fifth apart, climbing as the sphere opens.
  for (const [semitone, peak, detune] of [
    [0, 0.045, -9],
    [7, 0.035, 6],
    [12, 0.025, 0],
  ]) {
    swept(g, at + 0.25, {
      duration: 1.7,
      type: 'sawtooth',
      from: midiToHz(50 + semitone),
      to: midiToHz(50 + semitone) * 2.4,
      peak: peak * reach,
      attack: 0.8,
      release: 0.6,
      detune,
      send: 0.7,
    })
  }
  // And the top of the bloom, where it stops climbing.
  rush(g, at + 1.4, {
    duration: 0.5,
    peak: 0.05 * reach,
    type: 'highpass',
    cutoff: 3400,
    sweepTo: 7000,
    attack: 0.3,
    release: 0.6,
    send: 0.8,
  })
}

/**
 * Grimmel's arrow, already gone past by the time it is heard.
 *
 * Three events in under half a second: the string, the shaft going by, and the
 * arrival. That order is the point — the walk is standing in the far room, so
 * what it hears is the sound catching up with the exchange.
 */
export function loostAnArrow() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The string.
  swept(g, at, {
    duration: 0.09,
    type: 'triangle',
    from: 240,
    to: 132,
    peak: 0.12,
    attack: 0.002,
    release: 0.12,
    send: 0.4,
  })
  rush(g, at, { duration: 0.04, peak: 0.07, type: 'highpass', cutoff: 2200, release: 0.06 })

  // The shaft, passing.
  rush(g, at + 0.06, {
    duration: 0.3,
    peak: 0.09,
    type: 'bandpass',
    cutoff: 3200,
    sweepTo: 600,
    q: 1.4,
    attack: 0.05,
    release: 0.12,
    send: 0.5,
  })

  // The arrival: a soul is not a target, so it lands soft and rings a little.
  swept(g, at + 0.36, {
    duration: 0.12,
    type: 'sine',
    from: 320,
    to: 110,
    peak: 0.11,
    attack: 0.003,
    release: 0.5,
    send: 0.75,
  })
}

/**
 * Nen Stitches, thrown down the reticle.
 *
 * Wire coming off a drum: fourteen metallic ticks that speed up as the thread
 * runs out, over a thin band of noise sliding away from the hand. The last tick
 * is the bite — it is what says the thread took hold rather than fell short.
 */
export function unspoolWire() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  rush(g, at, {
    duration: 0.6,
    peak: 0.05,
    type: 'highpass',
    cutoff: 1800,
    sweepTo: 5200,
    attack: 0.04,
    release: 0.15,
    send: 0.45,
  })

  const TICKS = 14
  for (let i = 0; i < TICKS; i++) {
    // Quadratic spacing: the drum accelerates as the coil gets lighter.
    const when = at + 0.62 * (1 - (1 - i / TICKS) ** 2)
    swept(g, when, {
      duration: 0.01,
      type: 'square',
      from: 2600 + i * 130,
      peak: 0.035,
      attack: 0.001,
      release: 0.03,
      send: 0.35,
    })
  }

  // The bite.
  swept(g, at + 0.64, {
    duration: 0.05,
    type: 'triangle',
    from: 1400,
    to: 520,
    peak: 0.09,
    attack: 0.002,
    release: 0.4,
    send: 0.7,
  })
}

/**
 * Double Machine Gun: eight rounds, two barrels, sixty milliseconds apart.
 *
 * The barrels are a filter apart rather than a pitch apart, because two guns
 * firing the same round differ in what the body of the weapon does to it. The
 * fall of brass at the end is what makes it a burst and not a drum fill.
 */
export function fireABurst(rounds = 8) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const shots = Math.min(14, Math.max(2, rounds))

  for (let i = 0; i < shots; i++) {
    const when = at + i * 0.062
    const left = i % 2 === 0
    // The crack.
    rush(g, when, {
      duration: 0.035,
      peak: 0.11,
      type: 'highpass',
      cutoff: left ? 2400 : 3100,
      sweepTo: left ? 900 : 1200,
      attack: 0.001,
      release: 0.07,
      send: 0.55,
    })
    // The charge behind it.
    swept(g, when, {
      duration: 0.05,
      type: 'sine',
      from: left ? 150 : 168,
      to: 48,
      peak: 0.15,
      attack: 0.002,
      release: 0.09,
    })
  }

  // Brass on the deck, after the last round.
  for (let i = 0; i < 4; i++) {
    rush(g, at + shots * 0.062 + 0.1 + i * 0.09 + Math.random() * 0.05, {
      duration: 0.02,
      peak: 0.03,
      type: 'bandpass',
      cutoff: 4200 + Math.random() * 2000,
      q: 7,
      attack: 0.001,
      release: 0.12,
      send: 0.6,
    })
  }
}

/**
 * Three Monkeys, one strike at a time.
 *
 * A temple gong, struck once per seal — sight, then hearing, then speech — and
 * pitched a tone lower each time, so the third strike is heard to be worse than
 * the first. Four inharmonic partials over a strike transient: a gong is metal
 * that does not agree with itself, which is exactly why a sine will not do.
 *
 * The second strike takes hearing, so it is the last thing heard clearly; the
 * `muffle` node every voice here goes through does the rest without being asked.
 */
export function strikeAGong(stage = 1) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  // Stage 0 is the fourth strike, which lifts all three seals and rings open.
  const step = Math.max(0, stage - 1)
  const root = midiToHz(45 - step * 2) * (stage === 0 ? 2 : 1)

  // The mallet.
  rush(g, at, {
    duration: 0.03,
    peak: 0.09,
    type: 'bandpass',
    cutoff: 1800,
    q: 1.2,
    attack: 0.002,
    release: 0.08,
  })

  for (const [ratio, peak, ring] of [
    [1, 0.13, 3.4],
    [2.34, 0.07, 2.8],
    [3.71, 0.045, 2.2],
    [5.9, 0.028, 1.6],
    [8.63, 0.016, 1.1],
  ]) {
    swept(g, at, {
      duration: 0.12,
      type: 'sine',
      from: root * ratio,
      // Metal detunes downward as the strike energy leaves it.
      to: root * ratio * 0.994,
      peak,
      attack: 0.008,
      release: ring,
      send: 0.85,
    })
  }
}

/**
 * Bungee Gum, set on something.
 *
 * It has the properties of both rubber and gum, so it is heard as both: a
 * stretch that climbs, and a snap back that falls past where it started before
 * settling. The wobble on the way down is the rubber, and it is the whole joke.
 */
export function stretchTheGum() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The stretch.
  swept(g, at, {
    duration: 0.18,
    type: 'triangle',
    from: 190,
    to: 560,
    peak: 0.1,
    attack: 0.02,
    release: 0.04,
    send: 0.3,
  })
  // And the return, overshooting and wobbling as it goes.
  swept(g, at + 0.19, {
    duration: 0.34,
    type: 'triangle',
    from: 560,
    to: 148,
    peak: 0.12,
    attack: 0.008,
    release: 0.22,
    wobble: 34,
    wobbleHz: 13,
    send: 0.5,
  })
  swept(g, at + 0.19, {
    duration: 0.3,
    type: 'sine',
    from: 280,
    to: 74,
    peak: 0.05,
    attack: 0.01,
    release: 0.2,
  })
}

/**
 * Spatial Teleportation: the steel stops being a boundary.
 *
 * Luini's is the one technique in the walk that is a state rather than a moment
 * — the hull goes half transparent and stays there — so what marks it is the
 * grinding cycle of a machine dematerialising rather than a single hit. Three
 * turns of it, each a pair of detuned saws sweeping up and back through a
 * closing filter, with the brakes left on.
 */

export function crackAWhip() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The chain coming round: air, rising as the weight accelerates.
  rush(g, at, {
    duration: 0.11,
    peak: 0.06,
    type: 'bandpass',
    cutoff: 700,
    sweepTo: 3200,
    q: 0.9,
    attack: 0.05,
    release: 0.03,
  })

  // The crack: everything at once, and gone.
  rush(g, at + 0.11, {
    duration: 0.02,
    peak: 0.3,
    type: 'highpass',
    cutoff: 1800,
    sweepTo: 6000,
    attack: 0.001,
    release: 0.09,
    send: 0.55,
  })

  // And the steel that made it, which is what says this was a chain rather
  // than a length of leather: a short, hard ring on the ball itself.
  swept(g, at + 0.115, {
    duration: 0.06,
    type: 'triangle',
    from: 2100,
    to: 1500,
    peak: 0.07,
    attack: 0.002,
    release: 0.16,
    send: 0.4,
  })
  swept(g, at + 0.115, {
    duration: 0.05,
    type: 'sine',
    from: 3160,
    to: 2400,
    peak: 0.035,
    attack: 0.002,
    release: 0.12,
    send: 0.4,
  })
}

/**
 * Snake Arm biting a solid.
 *
 * A snake's hiss: a sudden, sharp band of high-frequency noise that decays quickly.
 */
