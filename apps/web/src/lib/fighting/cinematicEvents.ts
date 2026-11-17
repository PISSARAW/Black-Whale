import { moveById } from './movesets'
import { ALL_CINEMATIC_RULES } from './cinematicCatalogue'
import { actorContext, point, rig, ruleChanged, ruleEvent } from './cinematicRules'
import { cameraSnapshot, type CameraSnapshot } from './cinematicSnapshot'
import { cinematicWorldEvents } from './cinematicWorldEvents'
import { castCameraDetail } from './cinematicMoveLenses'
import type { CameraDetail, CameraEvent } from './cinematicTypes'
import type { FightSide, FightState } from './types'
export { cameraSnapshot } from './cinematicSnapshot'
export type { CameraEvent } from './cinematicTypes'

function personalEvents(
  state: FightState,
  before: CameraSnapshot,
  after: CameraSnapshot,
): CameraEvent[] {
  return (['player', 'opponent'] as const).flatMap((side, index) => {
    const c = actorContext(state, side)
    return ALL_CINEMATIC_RULES.flatMap((rule, i) => {
      if (!ruleChanged(rule, before.actors[index].signals[i], after.actors[index].signals[i]))
        return []
      if (rule.guard && !rule.guard(c)) return []
      return [ruleEvent(rule, c)]
    })
  })
}
function castEvents(state: FightState, before: CameraSnapshot): CameraEvent[] {
  return (['player', 'opponent'] as const).flatMap((side, index) => {
    const a = state[side].attack
    const old = before.actors[index]
    if (!a || !['special', 'ranged'].includes(a.kind)) return []
    if (old.move === a.moveId && old.kind === a.kind && a.frame >= old.attackFrame) return []
    return [
      {
        cue: { frame: state.frame, side, strength: 1, hold: 22, release: 44 },
        detail: castCameraDetail(state, side),
        duration: 42,
        priority: 1,
      },
    ]
  })
}
function nenCues(state: FightState, before: CameraSnapshot): CameraEvent[] {
  return (['player', 'opponent'] as const).flatMap((side, index) => {
    const f = state[side]
    const old = before.actors[index]
    const changed =
      old.mode !== f.nen.mode ||
      old.ken !== f.nen.ken ||
      old.ko !== f.nen.ko ||
      old.ryu !== JSON.stringify(f.nen.ryu)
    return changed
      ? [{ cue: { frame: state.frame, side, strength: 0.55, hold: 12, release: 30 } }]
      : []
  })
}
function impactMove(state: FightState, before: CameraSnapshot) {
  const hit = state.impact!
  const moveId =
    state[hit.attacker].attack?.moveId ?? before.actors[hit.attacker === 'player' ? 0 : 1].move
  return hit.kind === 'special' ? moveById(moveId) : null
}
function impactDetail(state: FightState, before: CameraSnapshot): CameraDetail {
  const hit = state.impact!
  const side = hit.attacker === 'player' ? 'opponent' : 'player'
  const old = before.projectiles.find((p) => p.id === hit.projectileId)
  const move = impactMove(state, before)
  const label = hit.kind === 'ranged' ? 'Projectile' : 'Hatsu'
  return {
    kind: 'impact',
    side,
    labelFr: `${move?.nameFr ?? label} · Impact`,
    labelEn: `${move?.nameEn ?? label} · Impact`,
    offset: { x: hit.position.x - state[side].x, y: hit.position.y - state[side].y },
    eventId: `impact:${hit.sequence}`,
    source: old?.source,
    sourceSide: hit.attacker,
    aura: hit.concealed,
    anchors: impactAnchors(state, side),
  }
}
function impactAnchors(state: FightState, side: FightSide) {
  const body = state[side].hanzoProjection
  const hit = state.impact!
  return body
    ? [point(body.bodyX, hit.position.y, 1)]
    : [rig(side, hit.zone === 'torso' ? 'chest' : hit.zone)]
}
function isNewImpact(state: FightState, before: CameraSnapshot): boolean {
  const hit = state.impact
  return Boolean(hit && hit.sequence !== before.impact && !hit.avoided && !hit.invulnerable)
}
function impactEvents(state: FightState, before: CameraSnapshot): CameraEvent[] {
  if (!isNewImpact(state, before)) return []
  const hit = state.impact!
  if (hit.blocked) return blockEvent(state)
  const detailed = hit.kind === 'special' || hit.projectileId !== null
  if (!detailed && !hit.critical && hit.comboHits < 2) return []
  return [
    {
      cue: {
        frame: state.frame,
        side: hit.attacker,
        strength: hit.critical ? 1.1 : 1,
        hold: 10,
        release: 44,
      },
      ...(detailed ? { detail: impactDetail(state, before), duration: 42, priority: 2 } : {}),
    },
  ]
}
function blockEvent(state: FightState): CameraEvent[] {
  const hit = state.impact!
  if (hit.kind !== 'heavy' && !hit.parried) return []
  const side = hit.attacker === 'player' ? 'opponent' : 'player'
  return [{ cue: { frame: state.frame, side, strength: 0.5, hold: 12, release: 30 } }]
}
export function cinematicEvents(
  state: FightState,
  before: CameraSnapshot,
  after = cameraSnapshot(state),
): CameraEvent[] {
  const events = [
    ...castEvents(state, before),
    ...nenCues(state, before),
    ...personalEvents(state, before, after),
    ...cinematicWorldEvents(state, before),
    ...impactEvents(state, before),
  ]
  if (state.phase === 'finished' && before.phase === 'fighting')
    events.push({
      cue: {
        frame: state.frame,
        side: state.winner === 'opponent' ? 'opponent' : 'player',
        strength: 1.2,
        hold: 30,
        release: 44,
      },
    })
  return events
}
