import { canPracticeReplay } from './fightReplayPractice'
import { gyoSight } from './nenPerception'
import { seesCombatBody } from './fightCounterplay'
import { attackPhase, otherSide } from './frameData'
import { moveById } from './movesets'
import { trainingCanAct } from './trainingMeasurement'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function coachSupported(state: FightState): boolean {
  return !state.pvpSeat && !state.spectatorView && !state.teamMatch && !state.forecastSimulation
}
/** Never infer an unseen attack from an enemy book, buffer or private analysis. */
export function visibleRecovery(state: FightState, side: FightSide): boolean {
  if (!learningMoment(state)) return false
  const owner = state[side],
    enemy = state[otherSide(side)]
  if (!readyObserver(owner) || enemy.y > 0) return false
  if (enemy.attack?.concealed && !gyoSight(owner)) return false
  return ordinaryRecovery(enemy)
}
function readyObserver(owner: ArcadeFighter) {
  return seesCombatBody(owner) && trainingCanAct(owner) && owner.y === 0
}
function ordinaryRecovery(enemy: ArcadeFighter) {
  const move = moveById(enemy.attack?.moveId)
  if (!move || (move.category !== 'normal' && move.category !== 'command')) return false
  return attackPhase(enemy) === 'recovery'
}
function learningMoment(state: FightState) {
  return canPracticeReplay(state) && !state.parallelFuture && !state.catsName && !state.hitstop
}
export function coachTransitionSupported(before: FightState, after: FightState) {
  return (
    coachSupported(after) &&
    !before.parallelFuture &&
    !after.parallelFuture &&
    !before.catsName &&
    !after.catsName
  )
}
