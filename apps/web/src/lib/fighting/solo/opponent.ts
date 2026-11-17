import { performTrainingAction } from '../trainingAction'
import type { FightState } from '../types'
import type { SoloRun } from './types'
import { soloEncounter } from './catalogue'
export function driveSoloOpponent(state: FightState, run: SoloRun): FightState {
  if (soloEncounter(run).script !== 'fire' || state.parallelFuture || state.catsName) return state
  const age = state.frame - run.objective.start
  if (age % 150 !== 0) return state
  return performTrainingAction({ state, side: 'opponent', action: 'ranged' })
}
