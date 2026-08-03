import { hatsuAudioGraph, midiToHz } from '../ambient'

import { rush, startsAt, swept } from './synth'

// ── On the rooms ─────────────────────────────────────────────────────────

/**
 * Secret Window's owl, attached or called back.
 *
 * Two notes, the second lower and shorter, each sagging about a tone across the
 * call — which is what a tawny owl does and what makes the sound read as a bird
 * rather than as a flute. The breath under it is a short band of noise: a hoot
 * is mostly air.
 */
export function hootAnOwl() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  for (const [offset, from, length, peak] of [
    [0, 384, 0.34, 0.11],
    [0.44, 352, 0.46, 0.09],
  ]) {
    swept(g, at + offset, {
      duration: length,
      type: 'sine',
      from,
      to: from * 0.9,
      peak,
      attack: 0.05,
      release: 0.22,
      send: 0.55,
    })
    // The octave above is what stops the sine sounding like a test tone.
    swept(g, at + offset, {
      duration: length * 0.7,
      type: 'triangle',
      from: from * 2,
      to: from * 1.8,
      peak: peak * 0.22,
      attack: 0.06,
      release: 0.2,
    })
    rush(g, at + offset, {
      duration: length * 0.5,
      peak: 0.02,
      cutoff: from * 2.2,
      q: 2.5,
      attack: 0.04,
      release: 0.15,
    })
  }
}

/**
 * Cross Game's card, laid on a room: blue, then yellow, then red.
 *
 * A card being drawn off the deck and set down — the slide is the noise, the set
 * is the click — and above it the two-tone blip of a selection being made. The
 * blip climbs with the stage, so the third card is heard to be the third one
 * without anyone having to look at its colour.
 */
export function selectACard(stage = 1) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const step = Math.min(2, Math.max(0, stage - 1))

  // The card leaving the deck.
  rush(g, at, {
    duration: 0.075,
    peak: 0.07,
    type: 'highpass',
    cutoff: 2600,
    sweepTo: 5200,
    release: 0.04,
  })
  // And landing on the room.
  rush(g, at + 0.085, {
    duration: 0.02,
    peak: 0.09,
    type: 'bandpass',
    cutoff: 2000,
    q: 0.8,
    release: 0.05,
  })

  const root = 74 + step * 3
  swept(g, at + 0.085, {
    duration: 0.05,
    type: 'square',
    from: midiToHz(root),
    peak: 0.05,
    release: 0.06,
  })
  swept(g, at + 0.145, {
    duration: 0.09,
    type: 'square',
    from: midiToHz(root + 7),
    peak: 0.045,
    release: 0.14,
    send: 0.4,
  })
}

/**
 * A mouth of Magical Worm, opening.
 *
 * The sound the films give a portal cut in the air: a low swallow of space, a
 * shower of sparks round the rim, and a ring once the hole is standing. The
 * sparks are scattered by hand rather than by an LFO — a rim of fire is
 * irregular, and a regular one reads as a machine.
 */
export function openAWormhole() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The air going through the hole, low and rising as it widens.
  rush(g, at, {
    duration: 0.55,
    peak: 0.1,
    type: 'lowpass',
    cutoff: 180,
    sweepTo: 1400,
    q: 0.7,
    attack: 0.12,
    release: 0.2,
    send: 0.5,
  })
  // The rim: twenty grains of fire, thrown across the opening.
  for (let i = 0; i < 20; i++) {
    const when = at + 0.05 + Math.random() * 0.5
    rush(g, when, {
      duration: 0.012 + Math.random() * 0.02,
      peak: 0.035 + Math.random() * 0.03,
      type: 'bandpass',
      cutoff: 2400 + Math.random() * 4200,
      q: 6,
      attack: 0.002,
      release: 0.06,
      send: 0.6,
    })
  }
  // And the ring, once it is a hole and not a wound: a fifth, held open.
  for (const [semitone, peak] of [
    [0, 0.055],
    [7, 0.04],
    [12, 0.03],
  ]) {
    swept(g, at + 0.3, {
      duration: 0.7,
      type: 'triangle',
      from: midiToHz(69 + semitone),
      peak,
      attack: 0.18,
      release: 0.8,
      send: 0.75,
    })
  }
}

/**
 * Chrollo's teleport: the moment the walk is somewhere else.
 *
 * Time being taken out rather than crossed — the swell rises, is cut off
 * mid-breath rather than resolved, and what lands on the far side is a single
 * hollow thud with a shard of metal on top of it. The cut is the whole sound:
 * a swell that faded would be travel, and this is not travel.
 */
export function skipThroughTime() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The swell, climbing to nothing.
  rush(g, at, {
    duration: 0.34,
    peak: 0.11,
    type: 'bandpass',
    cutoff: 220,
    sweepTo: 3200,
    q: 1.6,
    attack: 0.22,
    release: 0.005,
  })
  swept(g, at, {
    duration: 0.34,
    type: 'sawtooth',
    from: 62,
    to: 210,
    peak: 0.07,
    attack: 0.2,
    release: 0.005,
  })

  // The cut, and the far side of it.
  const landed = at + 0.36
  swept(g, landed, {
    duration: 0.24,
    type: 'sine',
    from: 140,
    to: 38,
    peak: 0.22,
    attack: 0.004,
    release: 0.3,
    send: 0.3,
  })
  swept(g, landed, {
    duration: 0.1,
    type: 'square',
    from: 1860,
    to: 620,
    peak: 0.05,
    attack: 0.002,
    release: 0.35,
    send: 0.7,
  })
  rush(g, landed, {
    duration: 0.06,
    peak: 0.06,
    type: 'highpass',
    cutoff: 3600,
    release: 0.25,
    send: 0.6,
  })
}

/**
 * Indoor Fish: the requiem, for as long as there is a shoal in the ship.
 *
 * The victims feel nothing and stay alive until the ability ends, which is the
 * cruellest line in the technique — so what plays is not a bite but a mass for
 * the dead: a four-bar dirge in D minor, low choir over a tolling bell, at forty
 * to the minute. It is music rather than a sound effect because the fish are a
 * state and not an event, and it stops when the last room is let go.
 */

export function foldPaper() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  for (let i = 0; i < 5; i++) {
    const when = at + i * 0.055 + Math.random() * 0.03
    rush(g, when, {
      duration: 0.05 + Math.random() * 0.05,
      peak: 0.05 + Math.random() * 0.025,
      type: 'highpass',
      cutoff: 2600 + Math.random() * 2400,
      sweepTo: 5600,
      q: 0.8,
      attack: 0.008,
      release: 0.07,
      send: 0.3,
    })
  }
  // The last sheet settling: one flick, lower and slower than the rest.
  rush(g, at + 0.3, {
    duration: 0.12,
    peak: 0.04,
    type: 'bandpass',
    cutoff: 1500,
    sweepTo: 900,
    q: 1.2,
    release: 0.12,
    send: 0.45,
  })
}

/**
 * Enchanting Music, on the flute the walk puts in the visitor's hands.
 *
 * A flute is a sine with air in it: the tone is nearly pure — which is why
 * every other voice in this file needs a second oscillator to stop sounding
 * like a test tone and this one does not — and what makes it an instrument
 * rather than a signal is the breath across the lip plate and the slow waver a
 * player cannot help putting on a held note.
 *
 * Three airs, and they are written out rather than generated, because what
 * tells them apart is the writing: the soft one is long notes rising through a
 * pentatonic, which has no interval in it that can sound wrong; the sharp one
 * is the same instrument played in note values that keep halving — crotchet,
 * quaver, semiquaver, which is exactly what the room fills up with; and the
 * lively one is a jig, in the compound time that has made people dance for four
 * hundred years.
 */
