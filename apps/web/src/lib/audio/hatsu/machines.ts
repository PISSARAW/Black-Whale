import { hatsuAudioGraph } from '../ambient'

import { rush, startsAt, swept } from './synth'

export function grindThroughSpace(on = true) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const CYCLES = 3
  const CYCLE = 0.62

  for (let i = 0; i < CYCLES; i++) {
    const when = at + i * CYCLE
    // Rising when the walls open, falling when they close again: the same
    // machine, run the other way round.
    const low = 88 - i * 6
    const high = 168 - i * 10
    const [from, to] = on ? [low, high] : [high, low]

    for (const detune of [-11, 9]) {
      swept(g, when, {
        duration: CYCLE * 0.55,
        type: 'sawtooth',
        from,
        to,
        peak: 0.075,
        attack: 0.1,
        release: 0.22,
        detune,
        send: 0.65,
      })
      swept(g, when + CYCLE * 0.5, {
        duration: CYCLE * 0.45,
        type: 'sawtooth',
        from: to,
        to: from,
        peak: 0.06,
        attack: 0.08,
        release: 0.2,
        detune,
        send: 0.65,
      })
    }
    // The friction: a band of noise dragged across each turn.
    rush(g, when, {
      duration: CYCLE * 0.9,
      peak: 0.045,
      type: 'bandpass',
      cutoff: on ? 420 : 1500,
      sweepTo: on ? 1500 : 420,
      q: 2.2,
      attack: 0.15,
      release: 0.2,
      send: 0.7,
    })
  }

  // The thump when it has finished arriving, or finished leaving.
  swept(g, at + CYCLES * CYCLE, {
    duration: 0.2,
    type: 'sine',
    from: 96,
    to: 46,
    peak: 0.12,
    attack: 0.006,
    release: 0.5,
    send: 0.4,
  })
}

/**
 * Biohazard, waking something up.
 *
 * Hinrigh's animal-machine is a machine first: a servo stepping through four
 * positions, a relay closing, and a low hydraulic settle underneath. The steps
 * are square and quantised on purpose — nothing about it should sound alive.
 */
export function wakeTheMachine() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The relay.
  rush(g, at, {
    duration: 0.02,
    peak: 0.1,
    type: 'highpass',
    cutoff: 3000,
    attack: 0.001,
    release: 0.04,
    send: 0.4,
  })

  // The servo, four positions, no glide between them.
  const steps = [196, 262, 233, 330]
  steps.forEach((hz, i) => {
    const when = at + 0.05 + i * 0.085
    swept(g, when, {
      duration: 0.06,
      type: 'square',
      from: hz,
      peak: 0.055,
      attack: 0.004,
      release: 0.03,
      send: 0.3,
    })
    // Gear noise on each move: brief, and the same every time, as a gear is.
    rush(g, when, {
      duration: 0.045,
      peak: 0.035,
      type: 'bandpass',
      cutoff: 1700,
      q: 3.5,
      attack: 0.004,
      release: 0.04,
    })
  })

  // The hydraulics taking the weight of whatever just stood up.
  swept(g, at + 0.4, {
    duration: 0.45,
    type: 'sawtooth',
    from: 58,
    to: 38,
    peak: 0.09,
    attack: 0.09,
    release: 0.4,
    send: 0.35,
  })
  rush(g, at + 0.4, {
    duration: 0.4,
    peak: 0.04,
    type: 'lowpass',
    cutoff: 700,
    sweepTo: 260,
    attack: 0.1,
    release: 0.3,
  })
}

/**
 * The Dowsing Chain's ball, brought down on a thing like a whip.
 *
 * A whip crack is three things in a fifth of a second and only three: the swish
 * of the chain coming round, which is a band of noise sweeping up as it gets
 * faster; the crack itself, which is a tip going supersonic and is therefore
 * broadband and almost instantaneous; and the ring of steel meeting whatever it
 * hit, which is the one part of this that is not air. Take away any of them and
 * it reads as a slap.
 */
