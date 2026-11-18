import { secretWindowUtility } from './secretWindow'
import { comboMasterMonitoring, comboMasterUtilityMove } from './comboMasterAvailability'
import type { CameraDetail, CameraEvent } from './cinematicTypes'
import type { FightSide, FightState } from './types'

function privateCast(detail: CameraDetail, state: FightState) {
  if (!detail.eventId?.startsWith('cast:')) return false
  const actor = state[detail.sourceSide ?? detail.side]
  return secretWindowUtility(actor) || comboMasterUtilityMove(actor)
}
export function perceptionCameraAllowed(
  event: CameraEvent,
  c: { state: FightState; viewer: FightSide },
) {
  const detail = event.detail
  return !detail || !privateCast(detail, c.state) || (detail.sourceSide ?? detail.side) === c.viewer
}
function repliedImpact(detail: CameraDetail, state: FightState) {
  const hit = state.impact
  if (detail.kind !== 'impact' || !hit) return false
  const reply = state[hit.attacker].bodyAndSoulReplies?.at(-1)
  return Boolean(reply && reply.questioner === hit.attacker && state.frame - reply.frame <= 1)
}
function perceptionEvent(detail: CameraDetail, state: FightState) {
  if (detail.eventId === 'nen.gyo' && comboMasterMonitoring(state[detail.side])) return true
  return (
    ['musse.', 'sayird.', 'furykov.', 'lynch.'].some((prefix) =>
      detail.eventId?.startsWith(prefix),
    ) ||
    privateCast(detail, state) ||
    repliedImpact(detail, state)
  )
}
/** Private detail filtering happens first. These events never request a secondary view. */
export function perceptionCameraEvent(event: CameraEvent, state: FightState): CameraEvent {
  if (!event.detail || !perceptionEvent(event.detail, state)) return event
  return { cue: { ...event.cue, strength: 0.12, hold: 3, release: 15 }, duration: 18, priority: 1 }
}
