import { chrolloPageForMove, CHROLLO_USE, CHROLLO_SECONDARY } from './chrolloBook'
import { canAskLynchQuestion } from './lynchRules'
import { LYNCH_MOVE, LYNCH_QUESTIONS, type LynchQuestionId } from './lynchTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

/** The special command speaks a question; the player must subsequently land a real fist strike. */
export function performLynchAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (kind !== 'special') return null
  if (fighter.id !== 'lynch' && chrolloPageForMove(fighter, moveId) !== 'lynch') return null
  if (fighter.id === 'lynch' && moveId && moveId !== LYNCH_MOVE) return state
  return startQuestion(options)
}

function startQuestion(options: AuraAttackOptions): FightState {
  const { state, side, moveId, lynchQuestion = 'identity' } = options
  const fighter = state[side]
  if (!Object.hasOwn(LYNCH_QUESTIONS, lynchQuestion) || !canAskLynchQuestion(state, side, moveId))
    return state
  return {
    ...state,
    [side]: {
      ...fighter,
      bufferedAttack: null,
      lynchQuestion: {
        id: lynchQuestion,
        target: side === 'player' ? 'opponent' : 'player',
        askedFrame: state.frame,
        sourceMoveId: moveId ?? LYNCH_MOVE,
      },
    },
  }
}

export function askLynchQuestion(
  options: { state: FightState; side: FightSide; question: LynchQuestionId },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, question } = options
  const fighter = state[side]
  const moveId =
    fighter.id === 'chrollo'
      ? chrolloPageForMove(fighter) === 'lynch'
        ? CHROLLO_USE
        : CHROLLO_SECONDARY
      : fighter.id === 'kurapika'
        ? 'kurapika:backSpecial'
        : LYNCH_MOVE
  return perform({
    state,
    side,
    kind: 'special',
    moveId,
    auraCharged: false,
    lynchQuestion: question,
  })
}
