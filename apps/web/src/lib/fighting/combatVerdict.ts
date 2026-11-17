import { settleTeamBodyOutcome } from './teamOutcome'
import { wakeHanzoBody } from './hanzoProjection'
import type { FightFinishReason, FightSide, FightState } from './types'

export function finishFight(
  state: FightState,
  winner: FightSide,
  finishReason: Exclude<FightFinishReason, null> = 'knockout',
): FightState {
  const loser = winner === 'player' ? 'opponent' : 'player'
  const roundsWon = { ...state.roundsWon, [winner]: state.roundsWon[winner] + 1 }
  const matchWinner = roundsWon[winner] >= 2 ? winner : null
  return settleTeamBodyOutcome({
    ...state,
    player: wakeHanzoBody(state.player),
    opponent: wakeHanzoBody(state.opponent),
    phase: 'finished',
    winner,
    matchWinner,
    roundsWon,
    finishReason,
    lsdf: finishReason === 'expulsion' ? state.lsdf : undefined,
    [loser]: {
      ...wakeHanzoBody(state[loser]),
      pose: finishReason === 'expulsion' ? 'idle' : 'ko',
      blocking: false,
      attack: null,
      bufferedAttack: null,
    },
  })
}
