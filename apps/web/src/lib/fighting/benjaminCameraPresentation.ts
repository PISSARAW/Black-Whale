import { BENJAMIN_ACCENT_FRAMES } from './benjaminPresentation'
import type { CameraDetail, CameraEvent } from './cinematicTypes'
import type { FightState } from './types'

const MOVES = new Set(['benjamin:neutralSpecial', 'benjamin:downSpecial', 'benjamin:finisher'])
function cast(detail: CameraDetail, state: FightState) {
  if (!detail.eventId?.startsWith('cast:')) return false
  return MOVES.has(state[detail.sourceSide ?? detail.side].attack?.moveId ?? '')
}
function impact(detail: CameraDetail, state: FightState) {
  if (detail.kind !== 'impact' || !state.impact) return false
  return MOVES.has(state[state.impact.attacker].attack?.moveId ?? '')
}
export function benjaminCameraEvent(event: CameraEvent, state: FightState): CameraEvent {
  const detail = event.detail
  if (!detail) return event
  const result = detail.eventId === 'benjamin.capture' || detail.eventId === 'benjamin.release'
  if (!result && !cast(detail, state) && !impact(detail, state)) return event
  return {
    cue: { ...event.cue, strength: 0.16, hold: 3, release: 15 },
    duration: BENJAMIN_ACCENT_FRAMES,
    priority: 1,
  }
}
