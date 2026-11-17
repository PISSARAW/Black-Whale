import { writable } from 'svelte/store'
import type { FightState } from '../types'
import { selectVictory, VICTORY_DURATION, type VictorySelection } from './catalogue'

export interface VictoryFrame extends VictorySelection {
  elapsed: number
  active: boolean
}
export function createVictoryPlayback() {
  const store = writable<VictoryFrame | null>(null)
  let frame: VictoryFrame | null = null,
    completed: string | null = null
  let ready = false,
    failed = false
  const publish = () => store.set(frame ? { ...frame } : null)
  const finish = () => {
    if (!frame) return
    completed = frame.token
    frame = { ...frame, elapsed: VICTORY_DURATION, active: false }
    publish()
  }
  return {
    subscribe: store.subscribe,
    observe(state: FightState, enabled = true) {
      const selection = enabled && !failed ? selectVictory(state) : null
      if (!selection) {
        frame = null
        completed = null
        publish()
        return
      }
      if (frame?.token === selection.token || completed === selection.token) return
      frame = { ...selection, elapsed: 0, active: true }
      publish()
    },
    advance(dt: number, paused = false) {
      if (!frame?.active || !ready || paused || !Number.isFinite(dt)) return
      frame.elapsed = Math.min(VICTORY_DURATION, frame.elapsed + Math.max(0, dt))
      if (frame.elapsed >= VICTORY_DURATION - 1e-8) finish()
      else publish()
    },
    sceneReady() {
      ready = true
    },
    sceneLoading() {
      ready = false
      failed = false
    },
    sceneFailed() {
      failed = true
      finish()
    },
    skip: finish,
  }
}
