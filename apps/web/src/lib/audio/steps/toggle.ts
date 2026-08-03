import { writable } from 'svelte/store'

import {
  applyMuffle,
  buildGraph,
  currentDeckElevation,
  currentGraph,
  isMuffled,
  setCurrentGraph,
  setCurrentRoomKey,
} from './graph'
import { enterDeck } from './rooms'

const ENABLED_KEY = 'black-whale:tour-sound'

/** Whether the walk is currently audible, for the button that says so. */
export const stepsPlaying = writable(false)

/**
 * Starts the walk's sound. Called from the gesture that engages the walk, so the
 * browser has already given us permission to make a noise.
 */
export function startSteps() {
  if (typeof window === 'undefined') return
  let graph = currentGraph()
  if (!graph) {
    // A walk must never fail because the browser has no Web Audio: the ship is
    // still there, it is just silent.
    try {
      graph = buildGraph()
    } catch {
      return
    }
    setCurrentGraph(graph)
    applyMuffle(graph, isMuffled(), 0.05)
  }
  if (graph.context.state === 'suspended') void graph.context.resume()
  // The hull swells in from silence over `HULL_SETTLE` on the deck the visitor is
  // actually standing on, which nothing but this module remembers.
  enterDeck(currentDeckElevation())
  stepsPlaying.set(true)
  if (typeof localStorage !== 'undefined') localStorage.setItem(ENABLED_KEY, 'on')
}

/** Silences the walk, and forgets which room it was in so returning rebuilds it. */
export function stopSteps() {
  const held = currentGraph()
  if (held) {
    const context = held.context
    setCurrentGraph(null)
    setCurrentRoomKey('')
    const now = context.currentTime
    held.master.gain.cancelScheduledValues(now)
    held.master.gain.setTargetAtTime(0.0001, now, 0.15)
    // Let whatever is ringing ring out before the context goes away, or the
    // silence starts with a click.
    setTimeout(() => {
      if (!currentGraph()) void context.close()
    }, 1200)
  }
  stepsPlaying.set(false)
  if (typeof localStorage !== 'undefined') localStorage.setItem(ENABLED_KEY, 'off')
}

export function toggleSteps() {
  if (currentGraph()) stopSteps()
  else startSteps()
}

/**
 * Whether the visitor has silenced the walk before.
 *
 * Unlike the voyage theme, this is on unless it was turned off: footsteps and the
 * room answering them are part of the walk rather than a soundtrack over it, and
 * a visitor who has never touched the button should hear the ship. Nothing sounds
 * until they engage the walk, which is a gesture and their own doing.
 */
export function stepsWereSilenced(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(ENABLED_KEY) === 'off'
}
