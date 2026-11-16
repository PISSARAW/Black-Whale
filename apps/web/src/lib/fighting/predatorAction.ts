import { canStartFighterAttack } from './fighterAttacks'
import {
  isPredatorMove,
  beginPredatorAnalysis,
  choosePredatorPrey,
  launchPredator,
  predatorReady,
  predatorNenAvailable,
} from './predator'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

/** Cognitive commands and a conjured hunter have no damaging melee carrier. */
export function performPredatorAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (kind !== 'special' || !isPredatorMove(fighter, moveId)) return null
  if (!predatorCanAct(options)) return state
  if (moveId === 'rihan:forwardSpecial') return choosePredatorPrey(state, side, 1)
  if (moveId === 'rihan:backSpecial') return choosePredatorPrey(state, side, -1)
  if (moveId === 'rihan:downSpecial') return abandonAnalysis(state, side)
  if (isRelease(moveId) || predatorReady(state, side)) return launchPredator(state, side)
  return beginPredatorAnalysis(state, side)
}

function abandonAnalysis(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (!fighter.predator || fighter.predator.hunt) return state
  return {
    ...state,
    [side]: { ...fighter, predator: { ...fighter.predator, watching: false, analysis: null } },
  }
}

function isRelease(moveId?: string): boolean {
  return moveId === 'rihan:finisher' || moveId === 'chrollo:finisher'
}

function predatorCanAct({ state, side, kind, moveId }: AuraAttackOptions): boolean {
  const fighter = state[side]
  return (
    predatorNenAvailable(fighter) && !fighter.attack && canStartFighterAttack(fighter, kind, moveId)
  )
}
