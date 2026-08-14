import { writable } from 'svelte/store'

import { resumeSharedContext, sharedAudioContext } from '../context'
import { type Bus, outputBus } from '../output'

/**
 * The mixer: the filter that seals a visitor's hearing, and the two graphs
 * behind it.
 *
 * The theme, Melody's flute, Bonolenov's dance and every Hatsu voice end up
 * behind a `muffle` node, which is what lets Three Monkeys take the hearing of
 * all four without any of them knowing about it.
 *
 * The theme and the techniques have a graph each now, and no longer a context
 * each: they share the ship's one context (`../context`) and part company only
 * at the fader they end on, so the visitor can hold the soundtrack down without
 * quietening a cast. The Hatsu graph used to be a stand-in built while the
 * theme was off and thrown away when it started — a technique's voice changed
 * mixer, and therefore changed level, depending on whether music happened to be
 * playing. It is now its own graph and stays put.
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

/** The techniques' own graph, built on first use and kept for the session. */
let effectsGraph: Graph | null = null

/** The theme's own graph, when the theme is playing. */
export const themeGraph = () => graph

/** The theme takes the graph over on start and gives it up on stop. */
export function setThemeGraph(next: Graph | null) {
  graph = next
}

/** Whether hearing is currently sealed, which a new graph has to be told. */
export const isMuffled = () => muffled

export const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

export function buildGraph(bus: Bus = 'ambient'): Graph {
  const context = sharedAudioContext()
  if (!context) throw new Error('no Web Audio')

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
  // The fader for this bus, and behind it the limiter every sound aboard ends
  // on. `destination` only when there is no output stage at all, which is a
  // browser that has a context and refuses to build a gain — it cannot happen,
  // and the sound still comes out if it does.
  master.connect(outputBus(bus) ?? context.destination)

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
 * Its own graph, on its own fader, built on first use and kept: a technique
 * sounds the same whether or not the theme happens to be playing, which was not
 * true while this borrowed the theme's mixer. It is behind a `muffle` of its
 * own, which is what lets Three Monkeys take the visitor's hearing without
 * every caller knowing about it. `$lib/audio/hatsuSounds` is the other user of
 * this; it is exported rather than duplicated so a technique never opens a
 * second graph.
 */
export function hatsuAudioGraph(): Graph | null {
  if (typeof window === 'undefined') return null
  if (!effectsGraph) {
    // A click must never fail because the browser has no Web Audio; the score
    // still draws itself, it just stays silent.
    try {
      effectsGraph = buildGraph('effects')
    } catch {
      return null
    }
    applyMuffle(effectsGraph, muffled, 0.05)
  }
  // A click is a gesture, so this resume always has permission to succeed.
  resumeSharedContext()
  return effectsGraph
}

/** Three Monkeys' second strike seals hearing: the theme drops underwater. */
export function setAmbientMuffled(on: boolean) {
  muffled = on
  ambientMuffled.set(on)
  if (graph) applyMuffle(graph, on, 0.9)
  // And the techniques with it. They were sealed for free while they borrowed
  // the theme's mixer; on their own graph they have to be told.
  if (effectsGraph) applyMuffle(effectsGraph, on, 0.9)
}
