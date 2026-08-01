import { writable } from 'svelte/store'

/**
 * The voyage theme is synthesised rather than streamed: a Hunter × Hunter (2011)
 * flavoured piece — a slow minor-key ocarina line over a string pad with sparse
 * celesta answers — written as a note schedule instead of an audio file. That
 * keeps the soundtrack original, adds no megabytes to the page, and gives the
 * Hatsu layer a real audio graph to reach into when a technique seals hearing.
 */

const ENABLED_KEY = 'black-whale:ambient'

export const ambientPlaying = writable(false)
export const ambientMuffled = writable(false)

/** Musical time. 62 BPM in 4/4 — one bar is a little under four seconds. */
const BEAT = 60 / 62
const BAR = BEAT * 4

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

export type Graph = {
  context: AudioContext
  master: GainNode
  muffle: BiquadFilterNode
  air: BiquadFilterNode
  reverbSend: GainNode
}

let graph: Graph | null = null
let scheduler: ReturnType<typeof setInterval> | null = null
let nextBar = 0
let barIndex = 0
let muffled = false

export const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

function buildGraph(): Graph {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const context = new Ctor()

  // Sealed hearing squeezes the whole mix through this filter, so every voice
  // is routed here rather than straight at the destination.
  const muffle = context.createBiquadFilter()
  muffle.type = 'lowpass'
  muffle.frequency.value = 18000
  muffle.Q.value = 0.4

  // A gentle high shelf keeps the muffled state from sounding merely quiet.
  const air = context.createBiquadFilter()
  air.type = 'highshelf'
  air.frequency.value = 2400
  air.gain.value = 0

  const master = context.createGain()
  master.gain.value = 0

  // A short feedback delay stands in for a hall without shipping an impulse.
  const delay = context.createDelay(1)
  delay.delayTime.value = BEAT * 0.75
  const feedback = context.createGain()
  feedback.gain.value = 0.32
  const damp = context.createBiquadFilter()
  damp.type = 'lowpass'
  damp.frequency.value = 2200
  const reverbSend = context.createGain()
  reverbSend.gain.value = 0.3

  reverbSend.connect(delay)
  delay.connect(damp)
  damp.connect(feedback)
  feedback.connect(delay)
  damp.connect(master)

  muffle.connect(air)
  air.connect(master)
  master.connect(context.destination)

  return { context, master, muffle, air, reverbSend }
}

/** One sung note: its pitch, how long it is held, and how it is coloured. */
export interface Note {
  /** The pitch, in hertz. */
  hz: number
  /** How long the note is held, before the release tail is added to it. */
  duration: number
  type: OscillatorType
  peak: number
  attack: number
  release: number
  detune?: number
  vibrato?: number
  send?: number
}

export function voice(g: Graph, at: number, options: Note) {
  const { hz, duration } = options
  const { context } = g
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(options.peak, at + options.attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration + options.release)

  const osc = context.createOscillator()
  osc.type = options.type
  osc.frequency.value = hz
  if (options.detune) osc.detune.value = options.detune

  if (options.vibrato) {
    const lfo = context.createOscillator()
    lfo.frequency.value = 5.2
    const depth = context.createGain()
    depth.gain.setValueAtTime(0, at)
    // The vibrato fades in so held notes breathe instead of wobbling at once.
    depth.gain.linearRampToValueAtTime(options.vibrato, at + duration * 0.6)
    lfo.connect(depth)
    depth.connect(osc.frequency)
    lfo.start(at)
    lfo.stop(at + duration + options.release)
  }

  osc.connect(gain)
  gain.connect(g.muffle)
  if (options.send) {
    const send = context.createGain()
    send.gain.value = options.send
    gain.connect(send)
    send.connect(g.reverbSend)
  }
  osc.start(at)
  osc.stop(at + duration + options.release + 0.05)
}

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

/**
 * Melody's flute, one degree per solfège syllable: A natural minor, so a score
 * played over the voyage theme stays in the same key as the pad underneath it.
 * DO is A4 and the seven entries line up with the DO…SI labels the Hatsu draws.
 */
const SOLFEGE = [0, 2, 3, 5, 7, 8, 10]

/** Kept only while the theme is off — otherwise notes go through its mixer. */
let fluteGraph: Graph | null = null

/**
 * The mixer anything the Hatsu layer plays should go through.
 *
 * The theme's own graph when the theme is on, and a stand-in built on first use
 * when it is off — either way it is behind `muffle`, which is what lets Three
 * Monkeys take the visitor's hearing without every caller knowing about it.
 * `$lib/audio/hatsuSounds` is the other user of this; it is exported rather
 * than duplicated so a technique never opens a second AudioContext.
 */
export function hatsuAudioGraph(): Graph | null {
  if (graph) return graph
  if (typeof window === 'undefined') return null
  if (!fluteGraph) {
    // A click must never fail because the browser has no Web Audio; the score
    // still draws itself, it just stays silent.
    try {
      fluteGraph = buildGraph()
    } catch {
      return null
    }
    applyMuffle(fluteGraph, muffled, 0.05)
  }
  // A click is a gesture, so this resume always has permission to succeed.
  if (fluteGraph.context.state === 'suspended') void fluteGraph.context.resume()
  return fluteGraph
}

/**
 * Sound one note of Enchanting Music. `degree` counts syllables from DO and
 * wraps every seven, matching the label sequence, so a run of clicks is heard
 * as the scale it is written as.
 */
export function playHatsuNote(degree: number, options: { velocity?: number } = {}) {
  const g = hatsuAudioGraph()
  if (!g) return
  const step = ((Math.round(degree) % SOLFEGE.length) + SOLFEGE.length) % SOLFEGE.length
  // Every wrap climbs an octave, so a long score rises instead of circling.
  const octave = Math.floor(Math.round(degree) / SOLFEGE.length)
  const midi = 69 + SOLFEGE[step] + 12 * Math.min(octave, 2)
  const at = g.context.currentTime + 0.02
  const peak = 0.18 * (options.velocity ?? 1)

  voice(g, at, {
    hz: midiToHz(midi),
    duration: 0.45,
    type: 'triangle',
    peak,
    attack: 0.05,
    release: 0.6,
    vibrato: 3.5,
    send: 0.6,
  })
  // A quiet octave above gives the triangle the breathy edge of a flute.
  voice(g, at, {
    hz: midiToHz(midi + 12),
    duration: 0.3,
    type: 'sine',
    peak: peak * 0.35,
    attack: 0.02,
    release: 0.5,
    send: 0.8,
  })
}

/**
 * Bonolenov's battle music.
 *
 * All three of his techniques are the same instrument — air forced through the
 * holes in his body — and the dance is what carries them, so the overlay played
 * them in silence for no good reason. This is that dance: a 132 BPM loop of bone
 * flute over hand drums, four bars long, running for as long as the technique is
 * held. It shares the theme's mixer when the theme is on, so sealing hearing
 * muffles it too.
 */
const BATTLE_BEAT = 60 / 132
const BATTLE_BAR = BATTLE_BEAT * 4

/** [beat, semitones above A4, beats] — a pentatonic figure, played on bone. */
const battleFlute: Array<Array<[number, number, number]>> = [
  [
    [0, 0, 0.5],
    [0.75, 7, 0.5],
    [1.5, 5, 0.75],
    [2.5, 3, 0.5],
    [3, 7, 1],
  ],
  [
    [0, 12, 0.5],
    [1, 10, 0.5],
    [1.75, 7, 0.75],
    [3, 5, 1],
  ],
  [
    [0, 3, 0.5],
    [0.5, 5, 0.5],
    [1.5, 7, 1],
    [2.75, 10, 0.75],
  ],
  [
    [0, 12, 0.75],
    [1.25, 7, 0.5],
    [2, 5, 0.5],
    [2.5, 3, 1.5],
  ],
]

/** [beat, low or high] — the drum under it, four to the bar with answers. */
const battleDrums: Array<Array<[number, 'low' | 'high']>> = [
  [
    [0, 'low'],
    [1, 'high'],
    [2, 'low'],
    [2.5, 'low'],
    [3, 'high'],
  ],
  [
    [0, 'low'],
    [1, 'high'],
    [1.75, 'high'],
    [2, 'low'],
    [3, 'high'],
  ],
  [
    [0, 'low'],
    [0.75, 'low'],
    [1, 'high'],
    [2, 'low'],
    [3, 'high'],
    [3.5, 'high'],
  ],
  [
    [0, 'low'],
    [1, 'high'],
    [2, 'low'],
    [2.75, 'low'],
    [3, 'high'],
    [3.5, 'high'],
  ],
]

let battleScheduler: ReturnType<typeof setInterval> | null = null
let battleNextBar = 0
let battleBarIndex = 0

function scheduleBattleBar(g: Graph, bar: number, at: number) {
  for (const [offset, semitone, beats] of battleFlute[bar % battleFlute.length]) {
    voice(g, at + offset * BATTLE_BEAT, {
      hz: midiToHz(69 + semitone),
      duration: beats * BATTLE_BEAT * 0.9,
      type: 'square',
      peak: 0.05,
      attack: 0.02,
      release: 0.18,
      vibrato: 2.5,
      send: 0.35,
    })
    // The breath in the holes: a quiet fifth above, half the length.
    voice(g, at + offset * BATTLE_BEAT, {
      hz: midiToHz(76 + semitone),
      duration: beats * BATTLE_BEAT * 0.4,
      type: 'triangle',
      peak: 0.02,
      attack: 0.01,
      release: 0.12,
      send: 0.6,
    })
  }
  for (const [offset, weight] of battleDrums[bar % battleDrums.length]) {
    voice(g, at + offset * BATTLE_BEAT, {
      hz: weight === 'low' ? 62 : 128,
      duration: 0.12,
      type: 'sine',
      peak: weight === 'low' ? 0.22 : 0.11,
      attack: 0.005,
      release: 0.16,
      send: 0.15,
    })
  }
}

function battleTick() {
  const g = hatsuAudioGraph()
  if (!g) return
  while (battleNextBar < g.context.currentTime + BATTLE_BAR * 1.5) {
    scheduleBattleBar(g, battleBarIndex, Math.max(battleNextBar, g.context.currentTime + 0.05))
    battleBarIndex += 1
    battleNextBar += BATTLE_BAR
  }
}

/** Start the dance. Calling it while it is already playing changes nothing. */
export function startBattleMusic() {
  if (battleScheduler) return
  const g = hatsuAudioGraph()
  if (!g) return
  battleBarIndex = 0
  battleNextBar = g.context.currentTime + 0.08
  battleTick()
  battleScheduler = setInterval(battleTick, 200)
}

/** Stop it. Notes already scheduled ring out on their own. */
export function stopBattleMusic() {
  if (!battleScheduler) return
  clearInterval(battleScheduler)
  battleScheduler = null
}

function tick() {
  if (!graph) return
  const { context } = graph
  // Schedule a bar ahead of playback so timer jitter never lands mid-phrase.
  while (nextBar < context.currentTime + BAR * 1.5) {
    scheduleBar(graph, barIndex, Math.max(nextBar, context.currentTime + 0.05))
    barIndex += 1
    nextBar += BAR
  }
}

function applyMuffle(g: Graph, on: boolean, seconds: number) {
  const now = g.context.currentTime
  const target = { cutoff: on ? 210 : 18000, air: on ? -22 : 0, level: on ? 0.09 : 1 }
  g.muffle.frequency.cancelScheduledValues(now)
  g.muffle.frequency.setTargetAtTime(target.cutoff, now, seconds / 3)
  g.air.gain.cancelScheduledValues(now)
  g.air.gain.setTargetAtTime(target.air, now, seconds / 3)
  g.master.gain.cancelScheduledValues(now)
  g.master.gain.setTargetAtTime(target.level * 0.85, now, seconds / 3)
}

export async function startAmbient() {
  if (typeof window === 'undefined') return
  // The toggle exists in both the header and the drawer; only one may start it.
  if (scheduler) return
  if (!graph) graph = buildGraph()
  // The theme's own mixer takes over the flute; drop the stand-in context so a
  // session of toggling never stacks up idle AudioContexts.
  if (fluteGraph) {
    void fluteGraph.context.close()
    fluteGraph = null
  }
  // Browsers hand back a suspended context until a gesture resumes it.
  if (graph.context.state === 'suspended') await graph.context.resume()

  nextBar = graph.context.currentTime + 0.1
  barIndex = 0
  applyMuffle(graph, muffled, 1.2)
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
  if (graph) {
    const now = graph.context.currentTime
    graph.master.gain.cancelScheduledValues(now)
    graph.master.gain.setTargetAtTime(0.0001, now, 0.4)
    const context = graph.context
    // Let the tail ring out before the context goes away.
    setTimeout(() => {
      if (!scheduler) void context.close()
    }, 2500)
    graph = null
  }
  ambientPlaying.set(false)
  if (typeof localStorage !== 'undefined') localStorage.setItem(ENABLED_KEY, 'off')
}

export function toggleAmbient() {
  if (graph) stopAmbient()
  else void startAmbient()
}

/** Three Monkeys' second strike seals hearing: the theme drops underwater. */
export function setAmbientMuffled(on: boolean) {
  muffled = on
  ambientMuffled.set(on)
  if (graph) applyMuffle(graph, on, 0.9)
  if (fluteGraph) applyMuffle(fluteGraph, on, 0.9)
}

export function ambientWasEnabled() {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(ENABLED_KEY) === 'on'
}
