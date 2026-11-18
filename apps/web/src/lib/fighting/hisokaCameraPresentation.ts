import { HISOKA_ACCENT_FRAMES } from './hisokaPresentation'
import { gyoSight } from './nenPerception'
import type { CameraDetail, CameraEvent } from './cinematicTypes'
import type { FightSide, FightState } from './types'

function elasticEvent(detail: CameraDetail, state: FightState) {
  if (detail.eventId?.startsWith('hisoka.')) return true
  if (detail.eventId?.startsWith('arena.tether:')) return detail.labelEn.startsWith('Bungee Gum')
  return elasticCast(detail, state) || elasticImpact(detail, state)
}
function elasticCast(detail: CameraDetail, state: FightState) {
  if (!detail.eventId?.startsWith('cast:')) return false
  const actor = state[detail.sourceSide ?? detail.side]
  return detail.source === 'hisoka' && actor.attack?.kind === 'special'
}
function elasticImpact(detail: CameraDetail, state: FightState) {
  if (detail.kind !== 'impact' || state.impact?.kind !== 'special') return false
  return state[state.impact.attacker].attack?.hatsuSource === 'hisoka'
}

export function hisokaCameraEvent(
  event: CameraEvent,
  c: { state: FightState; viewer: FightSide },
): CameraEvent {
  if (!event.detail || !elasticEvent(event.detail, c.state)) return event
  return {
    cue: { ...event.cue, strength: hiddenGum(c) ? 0 : 0.16, hold: 3, release: 15 },
    duration: HISOKA_ACCENT_FRAMES,
    priority: 1,
  }
}
function hiddenGum(c: { state: FightState; viewer: FightSide }) {
  const gum = c.state.bungeeGum
  return gum?.hidden && gum.owner !== c.viewer && !gyoSight(c.state[c.viewer])
}
