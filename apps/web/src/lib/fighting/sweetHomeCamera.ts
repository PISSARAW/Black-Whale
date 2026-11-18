import { gyoSight } from './nenPerception'
import type { CameraDetail, CameraEvent } from './cinematicTypes'
import type { FightSide, FightState } from './types'

function sweetHomeEvent(detail: CameraDetail, state: FightState) {
  if (detail.eventId?.startsWith('terebellum.')) return true
  if (detail.eventId?.startsWith('cast:')) return detail.source === 'terebellum'
  return detail.kind === 'impact' && Boolean(state.impact?.transfer || state.impact?.objectTransfer)
}
/** Existing private/In filters run first. A wound route never opens a secondary view. */
export function sweetHomeCameraEvent(
  event: CameraEvent,
  c: { state: FightState; viewer: FightSide },
): CameraEvent {
  if (!event.detail || !sweetHomeEvent(event.detail, c.state)) return event
  const owner = transferOwner(c.state, event.detail)
  const visible = owner === c.viewer || !c.state[owner].nen.in || gyoSight(c.state[c.viewer])
  return {
    cue: { ...event.cue, strength: visible ? 0.12 : 0, hold: 3, release: 15 },
    duration: 18,
    priority: 1,
  }
}

function transferOwner(state: FightState, detail: CameraDetail) {
  if (detail.kind !== 'impact') return detail.sourceSide ?? detail.side
  return state.impact?.transfer?.owner ?? state.impact?.objectTransfer?.owner ?? detail.side
}
