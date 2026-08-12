import { writable } from 'svelte/store'

import {
  applyMuffle,
  BAR,
  BEAT,
  buildGraph,
  type Graph,
  isMuffled,
  midiToHz,
  setThemeGraph,
  themeGraph,
  voice,
} from './mixer'

/**
 * The voyage theme is synthesised rather than streamed: a Hunter × Hunter (2011)
 * flavoured piece — a slow minor-key ocarina line over a string pad with sparse
 * celesta answers — written as a note schedule instead of an audio file. That
 * keeps the soundtrack original, adds no megabytes to the page, and gives the
 * Hatsu layer a real audio graph to reach into when a technique seals hearing.
 */

const ENABLED_KEY = 'black-whale:ambient'

let scheduler: ReturnType<typeof setInterval> | null = null
let nextBar = 0
let barIndex = 0

export const ambientPlaying = writable(false)

/** A minor, natural: the mode most of Hirano's quieter cues sit in. */
const A3 = 57
const progression = [
  // [root midi, chord tones relative to the pad's low register]
  { root: A3, tones: [0, 7, 12, 15] }, // Am
  { root: A3 - 4, tones: [0, 7, 12, 16] }, // F
  { root: A3 + 3, tones: [0, 7, 12, 16] }, // C
  { root: A3 - 2, tones: [0, 7, 12, 16] }, // G
]

/**
 * The melody, one entry per bar, as [beat offset, semitones above A4, beats].
 * Phrases are deliberately short and separated by rests — the theme should sit
 * behind the archive, never in front of it.
 */
const melody: Array<Array<[number, number, number]>> = [
  [
    [0, 12, 1.5],
    [1.5, 15, 0.5],
    [2, 14, 2],
  ],
  [
    [0.5, 12, 1],
    [1.5, 10, 0.5],
    [2, 9, 2],
  ],
  [
    [0, 7, 1.5],
    [1.5, 9, 0.5],
    [2, 12, 1.5],
  ],
  [
    [1, 10, 1],
    [2, 9, 2],
  ],
  [
    [0, 16, 1.5],
    [1.5, 15, 0.5],
    [2, 12, 2],
  ],
  [
    [0.5, 14, 1],
    [1.5, 12, 0.5],
    [2, 10, 2],
  ],
  [
    [0, 9, 1],
    [1, 12, 1],
    [2, 14, 2],
  ],
  [[1, 12, 3]],
]

/** Celesta answers, sparse and high, on the bars the melody leaves open. */
const sparkles: Array<Array<[number, number]>> = [
  [],
  [[3, 24]],
  [],
  [
    [3, 21],
    [3.5, 24],
  ],
  [],
  [[3.5, 26]],
  [],
  [
    [3, 24],
    [3.5, 19],
  ],
]

const LOOP_BARS = melody.length

function scheduleBar(g: Graph, index: number, at: number) {
  const chord = progression[index % progression.length]
  const bar = index % LOOP_BARS

  // Pad: two slightly detuned voices per chord tone, overlapping the next bar.
  for (const tone of chord.tones) {
    const hz = midiToHz(chord.root + tone)
    voice(g, at, {
      hz,
      duration: BAR * 0.9,
      type: 'sawtooth',
      peak: 0.035,
      attack: BEAT * 1.2,
      release: BEAT * 1.4,
      detune: -6,
      send: 0.25,
    })
    voice(g, at, {
      hz,
      duration: BAR * 0.9,
      type: 'sawtooth',
      peak: 0.03,
      attack: BEAT * 1.4,
      release: BEAT * 1.4,
      detune: 7,
    })
  }

  // Bass, one long note per bar, an octave below the chord root.
  voice(g, at, {
    hz: midiToHz(chord.root - 12),
    duration: BAR * 0.8,
    type: 'sine',
    peak: 0.12,
    attack: 0.4,
    release: 0.8,
  })

  for (const [offset, semitone, beats] of melody[bar]) {
    voice(g, at + offset * BEAT, {
      hz: midiToHz(69 + semitone),
      duration: beats * BEAT,
      type: 'triangle',
      peak: 0.1,
      attack: 0.12,
      release: 0.5,
      vibrato: 4,
      send: 0.5,
    })
  }

  for (const [offset, semitone] of sparkles[bar]) {
    voice(g, at + offset * BEAT, {
      hz: midiToHz(69 + semitone),
      duration: 0.12,
      type: 'sine',
      peak: 0.06,
      attack: 0.01,
      release: 1.4,
      send: 0.8,
    })
  }
}

function tick() {
  const graph = themeGraph()
  if (!graph) return
  const { context } = graph
  // Schedule a bar ahead of playback so timer jitter never lands mid-phrase.
  while (nextBar < context.currentTime + BAR * 1.5) {
    scheduleBar(graph, barIndex, Math.max(nextBar, context.currentTime + 0.05))
    barIndex += 1
    nextBar += BAR
  }
}

export async function startAmbient() {
  if (typeof window === 'undefined') return
  // The toggle exists in both the header and the drawer; only one may start it.
  if (scheduler) return
  let graph: Graph
  // The ship may have no Web Audio at all, in which case there is no theme and
  // the page is otherwise untouched.
  try {
    graph = themeGraph() ?? buildGraph()
  } catch {
    return
  }
  setThemeGraph(graph)
  // Browsers hand back a suspended context until a gesture resumes it.
  if (graph.context.state === 'suspended') await graph.context.resume()

  nextBar = graph.context.currentTime + 0.1
  barIndex = 0
  applyMuffle(graph, isMuffled(), 1.2)
  tick()
  if (!scheduler) scheduler = setInterval(tick, 250)

  ambientPlaying.set(true)
  if (typeof localStorage !== 'undefined') localStorage.setItem(ENABLED_KEY, 'on')
}

export function stopAmbient() {
  if (scheduler) {
    clearInterval(scheduler)
    scheduler = null
  }
  const graph = themeGraph()
  if (graph) {
    const now = graph.context.currentTime
    graph.master.gain.cancelScheduledValues(now)
    graph.master.gain.setTargetAtTime(0.0001, now, 0.4)
    // The context is not closed. It is the ship's, shared with the walk and
    // with every technique, and closing it because the soundtrack was switched
    // off would take the footsteps and the casts with it. What is dropped is
    // this graph: once its master is off the bus nothing pulls on it, and the
    // feedback delay that stands in for the hall stops being computed. Let the
    // tail ring out first, or the silence starts with a click.
    const { master } = graph
    setTimeout(() => {
      if (!scheduler) master.disconnect()
    }, 2500)
    setThemeGraph(null)
  }
  ambientPlaying.set(false)
  if (typeof localStorage !== 'undefined') localStorage.setItem(ENABLED_KEY, 'off')
}

export function toggleAmbient() {
  if (themeGraph()) stopAmbient()
  else void startAmbient()
}

export function ambientWasEnabled() {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(ENABLED_KEY) === 'on'
}
