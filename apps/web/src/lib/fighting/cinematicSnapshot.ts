import { ALL_CINEMATIC_RULES } from './cinematicCatalogue'
import { actorContext, ruleValue } from './cinematicRules'
import type { FightState } from './types'

/** Only immutable scalar observations are retained: callers may reuse or mutate a preview state. */
export function cameraSnapshot(state: FightState) {
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}`,
    frame: state.frame,
    phase: state.phase,
    impact: state.impact?.sequence,
    actors: (['player', 'opponent'] as const).map((side) => {
      const f = state[side]
      const c = actorContext(state, side)
      return {
        id: f.id,
        x: f.x,
        y: f.y,
        health: f.health,
        move: f.attack?.moveId,
        attackFrame: f.attack?.frame ?? -1,
        kind: f.attack?.kind,
        source: f.attack?.hatsuSource,
        mode: f.nen.mode,
        ken: f.nen.ken,
        ko: f.nen.ko,
        ryu: JSON.stringify(f.nen.ryu),
        projection: Boolean(f.hanzoProjection),
        signals: ALL_CINEMATIC_RULES.map((rule) => ruleValue(rule, c)),
      }
    }),
    entities: (state.battlefield?.entities ?? []).map((e) => ({
      id: e.id,
      x: e.x,
      y: e.y,
      health: e.health,
      present: e.present,
      sun: e.arena?.sun,
      moon: e.arena?.moon,
      burning: Boolean(e.arena?.burning),
      growth: e.growth,
      delivered: e.delivered,
      sleeping: Boolean(e.sleepingFrames),
      controller: e.controller?.side,
    })),
    projectiles: state.projectiles.map((p) => ({
      id: p.id,
      owner: p.owner,
      source: p.fighterId,
      age: p.age,
      shape: p.shape,
      concealed: p.concealed,
      x: p.x,
      y: p.y,
    })),
    tether: (['player', 'opponent'] as const).map((side) => {
      const t = state.arena?.tether[side]
      return { object: t?.objectId, kind: t?.kind, pulling: Boolean(t?.pulling) }
    }),
  }
}
export type CameraSnapshot = ReturnType<typeof cameraSnapshot>
