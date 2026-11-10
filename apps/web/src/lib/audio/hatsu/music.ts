import { hatsuAudioGraph, midiToHz, type Graph } from '../ambient'

import { rush, startsAt, swept } from './synth'

const DIRGE_BEAT = 60 / 40
const DIRGE_BAR = DIRGE_BEAT * 4

/** [beat, semitones above D3, beats] — a descending lament, twice through. */
const dirge: Array<Array<[number, number, number]>> = [
  [
    [0, 0, 2],
    [2, -2, 2],
  ],
  [
    [0, -3, 2],
    [2, -5, 2],
  ],
  [
    [0, -4, 2],
    [2, -5, 1],
    [3, -7, 1],
  ],
  [[0, -12, 4]],
]

/** D3, which the whole thing hangs off. */
const DIRGE_ROOT = 50

let dirgeScheduler: ReturnType<typeof setInterval> | null = null
let dirgeNextBar = 0
let dirgeBar = 0

function scheduleDirgeBar(g: Graph, bar: number, at: number) {
  // The bell, once a bar. Four inharmonic partials, struck and left to ring.
  for (const [ratio, peak] of [
    [1, 0.09],
    [2.71, 0.035],
    [5.15, 0.018],
    [8.4, 0.01],
  ]) {
    swept(g, at, {
      duration: 0.1,
      type: 'sine',
      from: midiToHz(DIRGE_ROOT - 12) * ratio,
      peak,
      attack: 0.006,
      release: DIRGE_BAR * 0.9,
      send: 0.8,
    })
  }

  for (const [offset, semitone, beats] of dirge[bar % dirge.length]) {
    const hz = midiToHz(DIRGE_ROOT + semitone)
    // Two detuned saws and a sine under them: a choir, not a synth pad.
    swept(g, at + offset * DIRGE_BEAT, {
      duration: beats * DIRGE_BEAT * 0.85,
      type: 'sawtooth',
      from: hz,
      peak: 0.045,
      attack: 0.45,
      release: 0.9,
      detune: -7,
      send: 0.7,
    })
    swept(g, at + offset * DIRGE_BEAT, {
      duration: beats * DIRGE_BEAT * 0.85,
      type: 'sawtooth',
      from: hz,
      peak: 0.04,
      attack: 0.55,
      release: 0.9,
      detune: 8,
      send: 0.7,
    })
    swept(g, at + offset * DIRGE_BEAT, {
      duration: beats * DIRGE_BEAT * 0.9,
      type: 'sine',
      from: hz / 2,
      peak: 0.07,
      attack: 0.3,
      release: 0.7,
    })
  }
}

function dirgeTick() {
  const g = hatsuAudioGraph()
  if (!g) return
  while (dirgeNextBar < g.context.currentTime + DIRGE_BAR * 1.5) {
    scheduleDirgeBar(g, dirgeBar, Math.max(dirgeNextBar, g.context.currentTime + 0.05))
    dirgeBar += 1
    dirgeNextBar += DIRGE_BAR
  }
}

/** Start the mass. Calling it while it is already saying changes nothing. */
export function startRequiem() {
  if (dirgeScheduler) return
  const g = hatsuAudioGraph()
  if (!g) return
  dirgeBar = 0
  dirgeNextBar = g.context.currentTime + 0.1
  dirgeTick()
  dirgeScheduler = setInterval(dirgeTick, 250)
}

/** Stop it. What is already scheduled is allowed to finish, as a bell must. */
export function stopRequiem() {
  if (!dirgeScheduler) return
  clearInterval(dirgeScheduler)
  dirgeScheduler = null
}

/**
 * Kalluto's paper dolls, stuck to a room.
 *
 * Sheets rather than a sheet: five rustles staggered over a third of a second,
 * each a short band of high noise, because a fold of paper is a broadband
 * transient and a flock of them is five of those arriving nearly together.
 */

const FLUTE_ROOT = 74

/**
 * Each air as `[semitones above the root, when it lands in beats, how many
 * beats it holds]`, with the beat it is counted in.
 */
const AIRS: Record<
  'bloom' | 'scatter' | 'dance',
  { beat: number; peak: number; notes: [number, number, number][] }
> = {
  // Rising, unhurried, and ending on the note it started from an octave up:
  // nothing here resolves downward, because the room is opening.
  bloom: {
    beat: 0.42,
    peak: 0.075,
    notes: [
      [0, 0, 2],
      [2, 2, 1],
      [4, 3, 1],
      [7, 4, 2],
      [9, 6, 1],
      [7, 7, 1],
      [12, 8, 3],
    ],
  },
  // A crotchet, two quavers, four semiquavers, and the same again a step down:
  // the piece is the note values, and the notes scatter as they shorten.
  scatter: {
    beat: 0.34,
    peak: 0.07,
    notes: [
      [12, 0, 1],
      [10, 1, 0.5],
      [7, 1.5, 0.5],
      [5, 2, 0.25],
      [7, 2.25, 0.25],
      [3, 2.5, 0.25],
      [5, 2.75, 0.25],
      [10, 3, 1],
      [8, 4, 0.5],
      [5, 4.5, 0.5],
      [3, 5, 0.25],
      [5, 5.25, 0.25],
      [1, 5.5, 0.25],
      [0, 5.75, 0.25],
    ],
  },
  // Six-eight, and the long-short of it is the whole reason anything moves.
  dance: {
    beat: 0.19,
    peak: 0.08,
    notes: [
      [0, 0, 1],
      [4, 1, 0.5],
      [7, 1.5, 0.5],
      [9, 2, 1],
      [7, 3, 0.5],
      [4, 3.5, 0.5],
      [5, 4, 1],
      [9, 5, 0.5],
      [12, 5.5, 0.5],
      [11, 6, 1],
      [9, 7, 0.5],
      [7, 7.5, 0.5],
      [4, 8, 1],
      [7, 9, 1],
      [0, 10, 2],
    ],
  },
}

/** One air, played once. Which one is the visitor's decision, and their key. */
export function playATune(tune: 'bloom' | 'scatter' | 'dance') {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const air = AIRS[tune]

  for (const [step, when, held] of air.notes) {
    const hz = midiToHz(FLUTE_ROOT + step)
    const starts = at + when * air.beat
    const length = held * air.beat
    swept(g, starts, {
      duration: length,
      type: 'sine',
      from: hz,
      peak: air.peak,
      // A player's tongue, near enough: the shorter the note the harder it is
      // started, which is what makes a run of semiquavers sound played.
      attack: Math.min(0.06, 0.012 + length * 0.08),
      release: Math.min(0.35, 0.06 + length * 0.35),
      // The waver a held note gets and a short one has no time for.
      wobble: held >= 1 ? 3.5 : 0,
      wobbleHz: 5,
      send: 0.6,
    })
    // The breath across the lip plate, which is where the instrument is.
    rush(g, starts, {
      duration: Math.min(length, 0.09),
      peak: 0.014,
      type: 'bandpass',
      cutoff: hz * 2,
      q: 1.6,
      attack: 0.006,
      release: 0.06,
      send: 0.35,
    })
  }
}
