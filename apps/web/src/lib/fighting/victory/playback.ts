import { writable } from 'svelte/store'
import type { FightState } from '../types'
import { selectVictory, VICTORY_DURATION, type VictorySelection } from './catalogue'
import { createSunMoonVictoryWitness } from '../chrolloDetonation'
import { throwVictoryDelay } from '../throwCinematic'

export interface VictoryFrame extends VictorySelection {
  elapsed: number
  active: boolean
  pendingThrow?: number
}
export function createVictoryPlayback() {
  const store = writable<VictoryFrame | null>(null)
  const sunMoon = createSunMoonVictoryWitness()
  let frame: VictoryFrame | null = null,
    completed: string | null = null
  let ready = false,
    failed = false
  const publish = () => store.set(frame ? { ...frame } : null)
  const finish = () => {
    if (!frame) return
    completed = frame.token
    frame = {
      ...frame,
      elapsed: frame.duration ?? VICTORY_DURATION,
      pendingThrow: 0,
      active: false,
    }
    publish()
  }
  return {
    subscribe: store.subscribe,
    observe(state: FightState, enabled = true) {
      const decisive = sunMoon(state)
      const selection = enabled && !failed ? selectVictory(state) : null
      if (!selection) {
        frame = null
        completed = null
        publish()
        return
      }
      if (frame?.token === selection.token || completed === selection.token) return
      frame = {
        ...selection,
        ...(decisive && selection.fighter === 'chrollo'
          ? { variant: 'chrollo-sun-moon' as const, duration: 3 }
          : {}),
        elapsed: 0,
        pendingThrow: throwVictoryDelay(state),
        active: throwVictoryDelay(state) === 0,
      }
      publish()
    },
    advance(dt: number, paused = false) {
      if (!frame || !ready || paused || !Number.isFinite(dt)) return
      if (frame.pendingThrow) {
        const used = Math.min(frame.pendingThrow, Math.max(0, dt))
        frame.pendingThrow -= used
        dt -= used
        frame.active = frame.pendingThrow === 0
        publish()
      }
      if (!frame.active) return
      const duration = frame.duration ?? VICTORY_DURATION
      frame.elapsed = Math.min(duration, frame.elapsed + Math.max(0, dt))
      if (frame.elapsed >= duration - 1e-8) finish()
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
