import { aiJudgmentSpeechAllowed } from './judgmentCommunication'
import { habitAttackSlots } from './opponentHabits'
import { counterplayAttackSlots } from './styleCounterAttack'
import { arsenalAttackSlots } from './arsenalAi'
import { canUseMovesetMove, moveForSlot, movesetFor } from './movesets'
import type { FighterMove } from './movesetTypes'
import type { FightState } from './types'

/** Plans propose commands; the same admission rules as human input decide what can run. */
export function chooseMovesetAttack(
  state: FightState,
  roll: number,
  gap: number,
): FighterMove | null {
  const fighter = state.opponent
  if (!movesetFor(fighter.id) || !Number.isFinite(gap)) return null
  const slots = [
    ...(counterplayAttackSlots(state, gap) ?? habitAttackSlots(state) ?? []),
    ...arsenalAttackSlots({ state, roll, gap }),
  ]
  return (
    slots
      .map((slot) => moveForSlot(fighter.id, slot))
      .find(
        (move) => move && aiMoveInRange(move, gap) && aiJudgmentSpeechAllowed(state, 'opponent', move.id) && canUseMovesetMove(state, 'opponent', move),
      ) ?? null
  )
}

export function aiMoveInRange(move: FighterMove, gap: number): boolean {
  if (move.tuning.damage === 0 || move.tuning.reach === 0) return true
  // These attacks release travelling matter or aura, rather than a melee hitbox.
  if (move.kind === 'special' && /^(franklin|theta|kalluto|leorio):/.test(move.id)) return true
  return gap <= move.tuning.reach + Math.max(0, move.tuning.lunge) + 2
}
