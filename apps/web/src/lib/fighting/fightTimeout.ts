import { fightFormat } from './formats'
import { finishFight } from './combatVerdict'
import type { FightState } from './types'

export function finishExpiredFight(state: FightState): FightState {
  if (fightFormat(state.formatId).timeLimit === false) return state
  return state.remainingFrames === 0 && state.mode !== 'training' ? finishByTime(state) : state
}

export function finishByTime(state: FightState): FightState {
  const format = fightFormat(state.formatId)
  if (format.victory !== 'health' && state.score.player !== state.score.opponent) {
    return finishFight(
      state,
      state.score.player > state.score.opponent ? 'player' : 'opponent',
      'time',
    )
  }
  if (state.player.health === state.opponent.health) {
    return {
      ...state,
      phase: 'finished',
      winner: 'draw',
      finishReason: 'time',
    }
  }
  return finishFight(
    state,
    state.player.health > state.opponent.health ? 'player' : 'opponent',
    'time',
  )
}
