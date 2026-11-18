import { implantedJudgmentLabel } from './judgmentPresentation'
import type { CameraDetail, CameraEvent } from './cinematicTypes'
import type { FightSide, FightState } from './types'
import { KURAPIKA_MAJOR_FRAMES } from './kurapikaPresentation'
import { gyoSight } from './nenPerception'

const MAJOR = new Set([
  'kurapika.emperor',
  'kurapika.jail',
  'kurapika.steal-attach',
  'kurapika.steal-complete',
  'kurapika.judgment',
])
const ACCENTS = new Set([
  'kurapika.heal',
  'kurapika.jail-release',
  'kurapika.steal-break',
  'kurapika.emperor-end',
])
export const kurapikaMajorCamera = (id?: string) => MAJOR.has(id ?? '')

/** Applied after privacy filtering: an ordinary cast gets an accent, a confirmed result a shot. */
export function kurapikaCameraEvent(
  event: CameraEvent,
  context?: { state: FightState; viewer: FightSide },
): CameraEvent {
  const detail = event.detail
  if (!detail) return event
  const cast =
    detail.source === 'kurapika' &&
    (detail.eventId?.startsWith('cast:') || detail.kind === 'impact')
  if (!cast && !ACCENTS.has(detail.eventId ?? '') && !visibleJailZetsu(detail, context))
    return event
  return {
    cue: { ...event.cue, strength: 0.2, hold: 3, release: 15 },
    duration: 18,
    priority: 1,
  }
}

function visibleJailZetsu(
  detail: CameraDetail,
  context?: { state: FightState; viewer: FightSide },
) {
  if (detail.eventId !== 'nen.forced-zetsu' || !context) return false
  const jail = context.state[detail.side].chainJail
  if (!jail) return false
  return (
    jail.owner === context.viewer ||
    !context.state[jail.owner].nen.in ||
    gyoSight(context.state[context.viewer])
  )
}

export function kurapikaCinematicDetail(
  detail: CameraDetail | null,
  context: { state: FightState; age: number },
): CameraDetail | null {
  if (!detail || detail.followThrough) return detail
  const target = detail.side === 'player' ? 'opponent' : 'player'
  if (detail.eventId === 'kurapika.jail' && context.age >= 30)
    return {
      ...detail,
      kind: 'focus',
      isolate: false,
      anchors: [{ type: 'rig', side: target, part: 'chest' }],
    }
  if (detail.eventId === 'kurapika.steal-complete')
    return {
      ...detail,
      kind: 'focus',
      anchors: [{ type: 'rig', side: detail.side, part: 'right-hand' }],
    }
  if (detail.eventId === 'kurapika.judgment')
    return {
      ...detail,
      labelFr: `Judgment Chain · ${implantedJudgmentLabel(context.state[target], 'fr')}`,
      labelEn: `Judgment Chain · ${implantedJudgmentLabel(context.state[target], 'en')}`,
    }
  return detail
}

export function kurapikaCameraDuration(detail: CameraDetail): number | null {
  return kurapikaMajorCamera(detail.eventId) ? KURAPIKA_MAJOR_FRAMES : null
}
