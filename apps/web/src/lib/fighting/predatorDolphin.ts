import { launchPredator, predatorReady } from './predator'
import type { FightSide, FightState } from './types'

/** One borrowed Predator use includes its study; it can be abandoned before release. */
export function finishBorrowedPredator(state: FightState, side: FightSide): FightState | null {
  const fighter = state[side]
  if (fighter.kurapika?.held?.source !== 'rihan' || !fighter.predator) return null
  if (fighter.predator.hunt) return state
  if (predatorReady(state, side)) return launchPredator(state, side)
  return { ...state, [side]: { ...fighter, predator: { ...fighter.predator, watching: false } } }
}
