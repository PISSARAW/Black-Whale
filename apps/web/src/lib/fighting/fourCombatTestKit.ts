import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { attackData } from './frameData'
import {
  EMPTY_INPUT,
  type FightState,
  type FighterId,
  type FightSide,
  type FightInput,
} from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

export function multiDuel(player: FighterId, opponent: FighterId = 'theta'): FightState {
  const s = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...s,
    player: { ...s.player, x: 30, aura: 100 },
    opponent: { ...s.opponent, x: 46, aura: 100 },
  }
}
export function multiCommand(
  state: FightState,
  command: ArsenalCommand,
  side: FightSide = 'player',
) {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}
export function multiFrames(
  state: FightState,
  count: number,
  input: Partial<FightInput> = {},
): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(
      state,
      { ...EMPTY_INPUT, ...input },
      { dt: 1 / 60, opponentInput: EMPTY_INPUT },
    )
  return state
}
export function multiActive(state: FightState, side: FightSide = 'player'): FightState {
  const actor = state[side]
  if (!actor.attack) throw new Error('Expected a real cast')
  return {
    ...state,
    [side]: {
      ...actor,
      attack: { ...actor.attack, frame: attackData(actor.attack.kind, actor).startup },
    },
  }
}
