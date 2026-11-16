import type { FightFinishReason, FightSide, FightState } from './types'

export function finishFight(
  state: FightState,
  winner: FightSide,
  finishReason: Exclude<FightFinishReason, null> = 'knockout',
): FightState {
  const loser = winner === 'player' ? 'opponent' : 'player'
  const roundsWon = { ...state.roundsWon, [winner]: state.roundsWon[winner] + 1 }
  const matchWinner = roundsWon[winner] >= 2 ? winner : null
  return {
    ...state,
    phase: 'finished',
    winner,
    matchWinner,
    roundsWon,
    finishReason,
    lsdf: finishReason === 'expulsion' ? state.lsdf : undefined,
    [loser]: {
      ...state[loser],
      pose: finishReason === 'expulsion' ? 'idle' : 'ko',
      blocking: false,
      attack: null,
      bufferedAttack: null,
    },
  }
}
