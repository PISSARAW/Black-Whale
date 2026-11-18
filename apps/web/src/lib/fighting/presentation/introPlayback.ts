import { writable } from 'svelte/store'
import type { CareerAppearance } from '../career/types'
import type { FightSide, FightState } from '../types'

export interface IntroFrame {
  elapsed: number
  duration: number
  mode: CareerAppearance['intro']
  waiting: boolean
}

export function introShot(frame: IntroFrame): { side: FightSide | null; progress: number } {
  if (frame.mode !== 'full') return { side: null, progress: frame.elapsed / frame.duration }
  if (frame.elapsed < 2.4) return { side: 'player', progress: frame.elapsed / 2.4 }
  if (frame.elapsed < 4.8) return { side: 'opponent', progress: (frame.elapsed - 2.4) / 2.4 }
  return { side: null, progress: (frame.elapsed - 4.8) / 1.6 }
}

/** The simulation stays ready until both entrances and the opening signal finish. */
export function createIntroPlayback(complete: () => void, paused: () => boolean = () => false) {
  const store = writable<IntroFrame | null>(null)
  let source: FightState | null = null
  let frame: IntroFrame | null = null
  let ready = false
  let failed = false
  let skipped = false
  const publish = () => store.set(frame ? { ...frame } : null)
  function finish() {
    if (!frame) return
    frame = null
    publish()
    complete()
  }
  function release() {
    if (paused()) return
    if (ready && (skipped || failed || frame?.mode === 'off')) finish()
  }
  return {
    subscribe: store.subscribe,
    observe(state: FightState, options: { enabled: boolean; mode: CareerAppearance['intro'] }) {
      if (!options.enabled || state.phase !== 'ready') {
        source = null
        frame = null
        publish()
        return
      }
      if (source === state) return
      source = state
      skipped = false
      frame = {
        elapsed: 0,
        duration: options.mode === 'full' ? 6.4 : 1.6,
        mode: options.mode,
        waiting: !ready,
      }
      publish()
      release()
    },
    advance(dt: number, paused = false) {
      if (!frame || !ready || paused || !Number.isFinite(dt)) return
      release()
      if (!frame) return
      frame.elapsed = Math.min(frame.duration, frame.elapsed + Math.max(0, dt))
      if (frame.elapsed >= frame.duration) finish()
      else publish()
    },
    sceneLoading() {
      ready = false
      failed = false
      if (frame) frame.waiting = true
      publish()
    },
    sceneReady() {
      ready = true
      if (frame) frame.waiting = false
      publish()
      release()
    },
    sceneFailed() {
      ready = true
      failed = true
      release()
    },
    skip() {
      skipped = true
      release()
    },
  }
}
export type IntroPlayback = ReturnType<typeof createIntroPlayback>
