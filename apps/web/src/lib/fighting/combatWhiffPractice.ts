import { combatRouteInput } from './combatRouteFight'
import { attackData, attackPhase } from './frameData'
import { EMPTY_INPUT, type FighterId, type FightInput, type FightState } from './types'

export interface CombatWhiffPractice {
  opponent: FighterId
  gap: number
  retreatFrames?: number
  advanceFrames?: number
}

export const WHIFF_PUNISH_START = 30

export function whiffPunishReady(state: FightState, practice: CombatWhiffPractice): boolean {
  if (attackPhase(state.opponent) !== 'recovery') return false
  const attack = state.opponent.attack!
  const { startup, active } = attackData(attack.kind, state.opponent)
  return attack.frame >= startup + active + (practice.advanceFrames ?? 0)
}

export function whiffDemonstrationInput(
  state: FightState,
  practice: CombatWhiffPractice,
  delay: { at: number; step: number },
): FightInput {
  if (delay.step > 0 || state.frame < delay.at || state.player.attack) return EMPTY_INPUT
  if (attackPhase(state.opponent) === 'recovery')
    return whiffPunishReady(state, practice)
      ? EMPTY_INPUT
      : combatRouteInput('forwardLight', state.player.facing)
  if (practice.retreatFrames && (state.opponent.attack?.frame ?? 0) >= practice.retreatFrames)
    return EMPTY_INPUT
  return combatRouteInput('backHeavy', state.player.facing)
}
