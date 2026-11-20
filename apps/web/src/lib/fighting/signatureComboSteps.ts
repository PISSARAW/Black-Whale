import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

/**
 * Steps of a signature combo that are not the player's own strikes (signatureCombos.ts):
 * the Parallel Future commands and the riposte the opponent lands on purpose. Each returns
 * the new world and whether the step is complete; an unfinished step is retried next frame.
 */
export interface StepResult {
  state: FightState
  done: boolean
}

/** Close the eyes (L), wait for the vision, then open them (H) to diverge. */
export function futureStep(state: FightState, phase: 'close' | 'vision' | 'open'): StepResult {
  const future = state.parallelFuture
  if (phase === 'vision') return { state, done: future?.phase === 'vision' }
  if (phase === 'close') {
    const after = performTrainingAction({ state, side: 'player', action: 'special' })
    return { state: after, done: after.parallelFuture?.owner === 'player' }
  }
  const after = performTrainingAction({ state, side: 'player', action: 'finisher' })
  return { state: after, done: after.parallelFuture?.phase === 'diverging' }
}

/**
 * The opponent strikes with `slot` whenever it can; the player neither guards nor moves.
 * `health` is the player's health when the step began: the step ends on a real injury.
 */
export function riposteStep(state: FightState, slot: MoveSlot, health: number): StepResult {
  if (state.player.health < health) return { state, done: true }
  if (state.opponent.attack) return { state, done: false }
  const after = performTrainingAction({
    state,
    side: 'opponent',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, state.opponent.facing),
  })
  return { state: after, done: false }
}

/** The dummy guards once struck, except while it is the one striking back. */
export function dummyInput(guard: boolean) {
  return { ...EMPTY_INPUT, guard }
}
