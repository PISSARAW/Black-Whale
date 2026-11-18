import { createFightState, nextFightRound } from './fightState'
import { futurePerceptionView } from './futurePerception'
import type { FightState } from './types'

export type PerceivedResultAction = 'continue' | 'rematch'

/** Result buttons belong to the perceived world until Laplace releases its observer. */
export function performPerceivedResult(
  state: FightState,
  action: PerceivedResultAction,
): FightState {
  const perceived = futurePerceptionView(state)
  if (perceived?.phase !== 'finished') return state
  const next =
    action === 'continue'
      ? nextFightRound(perceived)
      : createFightState(perceived.player.id, perceived.opponent.id, {
          mode: perceived.mode,
          formatId: perceived.formatId,
          environment: perceived.environment,
        })
  if (next === perceived) return state
  return { ...state, futurePerception: { ...next, phase: 'fighting', forecastSimulation: true } }
}
