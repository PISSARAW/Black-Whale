import { writable } from 'svelte/store'

/**
 * The mixer: one AudioContext, and the filter that seals a visitor's hearing.
 *
 * The theme, Melody's flute, Bonolenov's dance and every Hatsu voice end up
 * behind the same `muffle` node, which is what lets Three Monkeys take the
 * hearing of all four without any of them knowing about it. The graph is held
 * here rather than in the theme because a technique may sound while the theme
 * is off, and a second AudioContext is a second ship.
 */

export const ambientMuffled = writable(false)

/** Musical time. 62 BPM in 4/4 — one bar is a little under four seconds. */
export const BEAT = 60 / 62
export const BAR = BEAT * 4

export type Graph = {
  context: AudioContext
  master: GainNode
  muffle: BiquadFilterNode
  air: BiquadFilterNode
  reverbSend: GainNode
}

let graph: Graph | null = null
let muffled = false

/** Kept only while the theme is off — otherwise notes go through its mixer. */
let fluteGraph: Graph | null = null

/** The theme's own graph, when the theme is playing. */
export const themeGraph = () => graph

/** The theme takes the graph over on start and gives it up on stop. */
export function setThemeGraph(next: Graph | null) {
  graph = next
}

/**
 * Drop the stand-in the flute built while the theme was off: the theme's own
 * mixer takes over, and a session of toggling never stacks up idle contexts.
 */
export function dropStandInGraph() {
  if (!fluteGraph) return
  void fluteGraph.context.close()
  fluteGraph = null
}

/** Whether hearing is currently sealed, which a new graph has to be told. */
export const isMuffled = () => muffled

export const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

export function buildGraph(): Graph {
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

export function applyMuffle(g: Graph, on: boolean, seconds: number) {
  const now = g.context.currentTime
  const target = { cutoff: on ? 210 : 18000, air: on ? -22 : 0, level: on ? 0.09 : 1 }
  g.muffle.frequency.cancelScheduledValues(now)
  g.muffle.frequency.setTargetAtTime(target.cutoff, now, seconds / 3)
  g.air.gain.cancelScheduledValues(now)
  g.air.gain.setTargetAtTime(target.air, now, seconds / 3)
  g.master.gain.cancelScheduledValues(now)
  g.master.gain.setTargetAtTime(target.level * 0.85, now, seconds / 3)
}

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

/** Three Monkeys' second strike seals hearing: the theme drops underwater. */
export function setAmbientMuffled(on: boolean) {
  muffled = on
  ambientMuffled.set(on)
  if (graph) applyMuffle(graph, on, 0.9)
}

/** 
 * Triggers a low-frequency pulse to simulate the pressure of an Aura (Ren).
 * Creates a 30Hz oscillator with a slow vibrato/tremolo effect.
 */
export function triggerAuraPulse(g: Graph, { at, duration, intensity = 0.5 }: { at: number; duration: number; intensity?: number }) {
  const { context } = g
  const gain = context.createGain()
  
  // Pulse fade in/out
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(intensity, at + duration * 0.2)
  gain.gain.linearRampToValueAtTime(0, at + duration)
  
  // 30Hz sub-bass
  const osc = context.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 30
  
  // Add a tremolo (LFO on gain) to make it "beat" or "breathe"
  const tremolo = context.createGain()
  tremolo.gain.value = 0.5
  
  const lfo = context.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 4 // 4 beats per second
  lfo.connect(tremolo.gain)
  lfo.start(at)
  lfo.stop(at + duration)
  
  osc.connect(tremolo)
  tremolo.connect(gain)
  gain.connect(g.master) // Route directly to master
  
  osc.start(at)
  osc.stop(at + duration)
}

/**
 * Triggers a sudden, eerie drop in ambient volume to simulate an assassin in Zetsu.
 */
export function triggerZetsuSilence(g: Graph, at: number, duration: number) {
  
  // We temporarily duck the master gain.
  // Note: this assumes the ambient theme doesn't constantly reset master.gain.
  // We use current time to get the current value, but since it's an AudioParam we just scale it.
  
  g.master.gain.cancelScheduledValues(at)
  // Drop volume quickly to 10%
  g.master.gain.setTargetAtTime(0.1, at, 0.5)
  // Bring it back slowly after duration
  g.master.gain.setTargetAtTime(1.0, at + duration, 2)
}
