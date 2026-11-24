import { writable } from 'svelte/store'
import type { CareerAppearance } from '../career/types'
import type { FightSide, FightState } from '../types'
import { INTRO_SHOT_MIN_SECONDS, introDialogue } from './introDialogue'

const DEFAULT_SHOTS = [INTRO_SHOT_MIN_SECONDS, INTRO_SHOT_MIN_SECONDS] as const

export interface IntroFrame {
  elapsed: number
  duration: number
  mode: CareerAppearance['intro']
  waiting: boolean
  run?: number
  firstSide?: FightSide
  shotSeconds?: readonly [number, number]
}

export function introShot(frame: IntroFrame): { side: FightSide | null; progress: number } {
  if (frame.mode !== 'full') return { side: null, progress: frame.elapsed / frame.duration }
  const [first, second] = frame.shotSeconds ?? DEFAULT_SHOTS
  const opening = frame.firstSide ?? 'player'
  if (frame.elapsed < first) return { side: opening, progress: frame.elapsed / first }
  if (frame.elapsed < first + second)
    return {
      side: opening === 'player' ? 'opponent' : 'player',
      progress: (frame.elapsed - first) / second,
    }
  return { side: null, progress: (frame.elapsed - first - second) / 1.6 }
}

function makeIntroFrame(
  state: FightState,
  options: Pick<IntroFrame, 'mode' | 'run' | 'waiting'>,
): IntroFrame {
  const dialogue = options.mode === 'full' ? introDialogue(state) : undefined
  const shots = dialogue?.shotSeconds ?? DEFAULT_SHOTS
  return {
    ...options,
    elapsed: 0,
    duration: options.mode === 'full' ? shots[0] + shots[1] + 1.6 : 1.6,
    firstSide: dialogue?.firstSide,
    shotSeconds: dialogue?.shotSeconds,
  }
}

/** The simulation stays ready until both entrances and the opening signal finish. */
export function createIntroPlayback(complete: () => void, paused: () => boolean = () => false) {
  const store = writable<IntroFrame | null>(null)
  let source: FightState | null = null
  let frame: IntroFrame | null = null
  let ready = false
  let failed = false
  let skipped = false
  let run = 0
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
        if (frame) {
          frame = null
          publish()
        }
        return
      }
      if (source === state) return
      source = state
      skipped = false
      frame = makeIntroFrame(state, {
        mode: options.mode,
        waiting: !ready,
        run: ++run,
      })
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
