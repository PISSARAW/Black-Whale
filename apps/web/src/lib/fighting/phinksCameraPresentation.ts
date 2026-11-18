import {
  PHINKS_IMPACT_EVENT,
  PHINKS_IMPACT_FRAMES,
  committedPhinksTurns,
  phinksChargedHits,
} from './phinksAnimation'
import { gyoSight } from './nenPerception'
import type { PhinksImpactSnapshot } from './phinksAnimation'
import type { CameraDetail, CameraEvent } from './cinematicTypes'
import type { FightSide, FightState } from './types'

export function phinksImpactEvents(
  state: FightState,
  before: PhinksImpactSnapshot,
  fallback: CameraEvent[],
): CameraEvent[] {
  const hits = phinksChargedHits(state, before)
  if (!hits.length) return committedPhinksTurns(state, before) > 0 ? fallback.map(accent) : fallback
  return hits.map((hit) => ({
    cue: { frame: state.frame, side: hit.owner, strength: 0.85, hold: 10, release: 28 },
    detail: {
      kind: 'impact',
      side: hit.owner,
      sourceSide: hit.owner,
      source: 'phinks',
      eventId: PHINKS_IMPACT_EVENT,
      labelFr: 'Ripper Cyclotron · Impact confirmé',
      labelEn: 'Ripper Cyclotron · Confirmed impact',
      anchors: [
        { type: 'rig', side: hit.owner, part: 'right-hand' },
        { type: 'rig', side: hit.target, part: 'chest' },
      ],
      aura: state.cyclotronContacts?.[hit.owner]?.concealed ?? state.impact?.concealed,
    },
    duration: PHINKS_IMPACT_FRAMES,
    priority: 3,
  }))
}

function accent(event: CameraEvent): CameraEvent {
  return { cue: { ...event.cue, strength: 0.14, hold: 3, release: 15 }, duration: 18, priority: 1 }
}
function phinksPhase(detail: CameraDetail) {
  return (
    detail.eventId?.startsWith('phinks.') ||
    (detail.eventId?.startsWith('cast:') && detail.source === 'phinks')
  )
}
function hiddenHit(detail: CameraDetail, c: { state: FightState; viewer: FightSide }) {
  const owner = detail.sourceSide ?? detail.side
  const concealed = c.state.cyclotronContacts?.[owner]?.concealed ?? c.state.impact?.concealed
  return concealed && owner !== c.viewer && !gyoSight(c.state[c.viewer])
}
/** Rotations and commitment stay in type 1; only the already confirmed contact keeps type 2. */
export function phinksCameraEvent(
  event: CameraEvent,
  c: { state: FightState; viewer: FightSide },
): CameraEvent {
  const detail = event.detail
  if (!detail) return event
  if (detail.eventId === PHINKS_IMPACT_EVENT)
    return hiddenHit(detail, c)
      ? { ...accent(event), cue: { ...accent(event).cue, strength: 0 } }
      : event
  return phinksPhase(detail) ? accent(event) : event
}
