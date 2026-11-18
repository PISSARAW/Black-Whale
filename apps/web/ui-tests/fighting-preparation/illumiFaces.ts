import { beginFight, createFight } from '../../src/lib/fighting/engine'
import type { FightSide, FightState } from '../../src/lib/fighting/types'

export function illumiFaceScenario(side: FightSide, pinned: boolean, close = false): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'illumi' : 'theta', side === 'opponent' ? 'illumi' : 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { needleStock: { player: pinned, opponent: pinned } },
    }),
  )
  const ready = { ...state, [side]: { ...state[side], aura: 100 } }
  return close
    ? { ...ready, player: { ...ready.player, x: 44 }, opponent: { ...ready.opponent, x: 49 } }
    : ready
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
    disguisePins: actor.illumiDisguisePins,
    mode: actor.illumiNeedleMode,
    needleFace: actor.needleFace,
    puppet: actor.needlePuppet,
    piles: state.battlefield?.entities.filter(
      (entry) => entry.detachedFaceNeedles || entry.disguisePinBundle,
    ),
  }
}

export function illumiBookFaceScenario(side: FightSide): FightState {
  const base = illumiFaceScenario(side, true)
  return {
    ...base,
    [side]: {
      ...base[side],
      id: 'chrollo',
      chrolloBook: { pages: ['illumi:backSpecial'], page: 0, open: true, bookmark: null },
    },
  }
}
