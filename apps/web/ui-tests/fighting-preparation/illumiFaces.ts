import { beginFight, createFight } from '../../src/lib/fighting/engine'
import type { FightSide, FightState } from '../../src/lib/fighting/types'

export function illumiFaceScenario(side: FightSide, pinned: boolean): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'illumi' : 'theta', side === 'opponent' ? 'illumi' : 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { needleStock: { player: pinned, opponent: pinned } },
    }),
  )
  return { ...state, [side]: { ...state[side], aura: 100 } }
}
export function illumiFaceSnapshot(state: FightState, side: FightSide) {
  const actor = state[side]
  return {
    id: actor.id,
    face: actor.illumi,
    equipment: actor.equipment,
    health: actor.health,
    aura: actor.aura,
    plan: actor.illumiDisguisePlan,
  }
}
