import type { CameraDetail, CameraEvent } from './cinematicTypes'
import type { FightState } from './types'
import { blinkyCommand } from './blinky'

const SOURCES = new Set([
  'machi',
  'kalluto',
  'zakuro',
  'gel',
  'padaille',
  'leorio',
  'luini',
  'voconte',
  'bill',
  'cluck',
])
function personal(detail: CameraDetail) {
  return [...SOURCES].some((source) => detail.eventId?.startsWith(`${source}.`))
}
function materialImpact(detail: CameraDetail, state: FightState) {
  const hit = state.impact
  if (detail.kind !== 'impact' || !hit) return false
  if (SOURCES.has(detail.source ?? '')) return true
  const actor = state[hit.attacker]
  if (hit.kind === 'special') return SOURCES.has(actor.attack?.hatsuSource ?? actor.id)
  return actor.attack?.hatsuSource === 'kalluto'
}
function blinkyEvent(detail: CameraDetail, state: FightState) {
  if (detail.eventId?.startsWith('shizuku.')) return true
  if (detail.eventId?.startsWith('cast:') && detail.source === 'shizuku')
    return blinkyCommand(state[detail.sourceSide ?? detail.side]) !== null
  return false
}
function materialEvent(detail: CameraDetail, state: FightState) {
  if (blinkyEvent(detail, state)) return true
  if (personal(detail)) return true
  if (detail.eventId?.startsWith('cast:')) return SOURCES.has(detail.source ?? '')
  if (detail.eventId?.startsWith('arena.tether:')) return state[detail.side].id === 'machi'
  return materialImpact(detail, state)
}
/** Private observations have already been filtered; no labels or hearing information are copied. */
export function fineControlCameraEvent(event: CameraEvent, state: FightState): CameraEvent {
  if (!event.detail || !materialEvent(event.detail, state)) return event
  return { cue: { ...event.cue, strength: 0.14, hold: 3, release: 15 }, duration: 18, priority: 1 }
}
