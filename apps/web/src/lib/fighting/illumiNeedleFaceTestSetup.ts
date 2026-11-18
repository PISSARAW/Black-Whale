import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

export function needleFaceSetup(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'illumi' : 'theta', side === 'opponent' ? 'illumi' : 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 49, aura: 100 },
  }
}
export function needleCommand(
  state: FightState,
  command: ArsenalCommand,
  side: FightSide = 'player',
) {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}
export function needleFrames(state: FightState, count = 45, guard = false): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: { ...EMPTY_INPUT, guard } })
  return state
}
export function beginNeedleFace(state: FightState, side: FightSide = 'player'): FightState {
  state = needleCommand(state, { action: 'illumi-needle-mode', target: 'face-warp' }, side)
  return needleCommand(state, { action: 'illumi-needle-apply' }, side)
}
