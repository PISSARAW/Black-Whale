import { PHINKS_IMPACT_EVENT, PHINKS_IMPACT_FRAMES } from './phinksAnimation'
import { ALL_CINEMATIC_RULES } from './cinematicCatalogue'
import { actorContext, ruleValue, rig } from './cinematicRules'
import type { CameraAnchor, CameraDetail, CameraPacing } from './cinematicTypes'
import type { FightState } from './types'
import { kurapikaCameraDuration } from './kurapikaCameraPresentation'
import { chrolloCameraDuration } from './chrolloCameraPresentation'

const OBSERVATIONS = new Map(ALL_CINEMATIC_RULES.map((rule) => [rule.id, rule]))
const AWAKENINGS = new Set(['eyes', 'body', 'armour', 'sun'])
export function cameraDuration(
  detail: CameraDetail,
  duration: number | undefined,
  pacing: CameraPacing,
) {
  if (detail.eventId === PHINKS_IMPACT_EVENT) return PHINKS_IMPACT_FRAMES
  const kurapika = kurapikaCameraDuration(detail)
  if (kurapika !== null) return kurapika
  const chrollo = chrolloCameraDuration(detail)
  if (chrollo !== null) return chrollo
  if (detail.eventId === 'nen.on') return duration ?? 108
  if (pacing === 'compact') return duration ?? 42
  return Math.max(duration ?? 0, AWAKENINGS.has(detail.kind) ? 228 : 180)
}
function castLive(detail: CameraDetail, state: FightState) {
  if (!detail.eventId?.startsWith('cast:')) return true
  const attack = state[detail.sourceSide ?? detail.side].attack
  const id = detail.eventId.split(':').slice(2, -1).join(':')
  return Boolean(attack && (attack.moveId ?? attack.kind) === id)
}
function observedLive(detail: CameraDetail, state: FightState) {
  if (!detail.observation) return true
  const rule = OBSERVATIONS.get(detail.observation.rule)
  return Boolean(
    rule && ruleValue(rule, actorContext(state, detail.side)) === detail.observation.value,
  )
}
function manifestationLive(detail: CameraDetail, state: FightState) {
  const actor = state[detail.side]
  if (detail.kind === 'eyes') return Boolean(actor.kurapika?.emperorTime)
  if (detail.kind === 'armour') return Boolean(actor.hatsuEffects.painPacker?.armour)
  if (detail.kind === 'sun') return Boolean(actor.hatsuEffects.painPacker?.sun)
  return true
}
export function cameraObservationLive(
  detail: CameraDetail,
  state: FightState,
  pacing: CameraPacing = 'extended',
): boolean {
  if (detail.followThrough) return true
  return (
    (pacing === 'compact' || castLive(detail, state)) &&
    observedLive(detail, state) &&
    manifestationLive(detail, state)
  )
}
function physicalAnchor(anchor: CameraAnchor): CameraAnchor | null {
  if (anchor.type === 'rig') return anchor
  return anchor.type === 'node' && anchor.fallback ? physicalAnchor(anchor.fallback) : null
}
/** Do not keep an extinct sun, departed projectile or obsolete phase on screen. */
export function cameraContinuation(detail: CameraDetail): CameraDetail {
  const anchors =
    detail.kind === 'eyes'
      ? [rig(detail.side, 'head')]
      : (detail.anchors?.map(physicalAnchor).filter((a): a is CameraAnchor => Boolean(a)) ?? [])
  const head = detail.kind === 'eyes'
  return {
    ...detail,
    kind: 'focus',
    observation: undefined,
    tip: undefined,
    offset: undefined,
    anchors: anchors.length ? anchors : [rig(detail.side, head ? 'head' : 'body')],
    frontal: head || detail.frontal,
    followThrough: true,
  }
}
export function cameraDwell(detail: CameraDetail) {
  if (detail.eventId === PHINKS_IMPACT_EVENT) return 24
  if (kurapikaCameraDuration(detail) !== null) return 24
  if (chrolloCameraDuration(detail) !== null) return 24
  if (AWAKENINGS.has(detail.kind)) return 90
  return detail.eventId?.startsWith('cast:') ? 18 : 54
}
