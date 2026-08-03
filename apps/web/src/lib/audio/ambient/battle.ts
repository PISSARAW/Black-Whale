import { type Graph, hatsuAudioGraph, midiToHz, voice } from './mixer'

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
