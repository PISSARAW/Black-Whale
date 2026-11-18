import { usesFranklinBarrage } from './franklinAttack'
import { gyoSight } from './nenPerception'
import type { CameraDetail, CameraEvent } from './cinematicTypes'
import type { FightSide, FightState } from './types'

function volleyEvent(detail: CameraDetail, state: FightState) {
  if (detail.eventId === 'franklin.fire') return true
  if (detail.eventId?.startsWith('cast:')) return detail.source === 'franklin'
  if (detail.kind !== 'impact') return false
  if (detail.source === 'franklin') return true
  return Boolean(state.impact && usesFranklinBarrage(state[state.impact.attacker]))
}
function hiddenImpact(detail: CameraDetail, c: { state: FightState; viewer: FightSide }) {
  const hit = c.state.impact
  if (detail.kind !== 'impact' || !hit?.concealed || hit.attacker === c.viewer) return false
  return !gyoSight(c.state[c.viewer])
}
export function franklinCameraEvent(
  event: CameraEvent,
  c: { state: FightState; viewer: FightSide },
): CameraEvent {
  const detail = event.detail
  if (!detail || !volleyEvent(detail, c.state)) return event
  return {
    cue: { ...event.cue, strength: hiddenImpact(detail, c) ? 0 : 0.12, hold: 2, release: 10 },
    duration: 18,
    priority: 1,
  }
}
