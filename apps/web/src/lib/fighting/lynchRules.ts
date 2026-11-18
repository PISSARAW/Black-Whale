import { voluntaryNenAvailable } from './nenAccess'
import { chrolloPageForMove, chrolloHasActivePage } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { canHear, soundDistance, musicPacifies } from './melodyRules'
import { canSpeak } from './saiyuSenses'
import { LYNCH_ANSWER_COST, LYNCH_MOVE, LYNCH_QUESTION_RANGE } from './lynchTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function lynchNenAvailable(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter)
}

export function hasBodyAndSoul(fighter: ArcadeFighter, moveId?: string): boolean {
  if (!lynchNenAvailable(fighter) || fighter.hatsuEffects.hatsuStolen > 0) return false
  if (chainAbilitySealed(fighter, moveId ?? LYNCH_MOVE)) return false
  if (fighter.id === 'lynch') return true
  if (borrowsBodyAndSoul(fighter)) return true
  return moveId
    ? chrolloPageForMove(fighter, moveId) === 'lynch'
    : chrolloHasActivePage(fighter, 'lynch')
}

/** This duel treats a knockdown as incapacity; ordinary hitstun does not erase consciousness. */
export function lynchTargetConscious(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    fighter.knockdownFrames === 0 &&
    !fighter.hanzoProjection &&
    !fighter.halkSoulSleep &&
    (fighter.kurapika?.blackoutFrames ?? 0) === 0
  )
}

export function canAskLynchQuestion(state: FightState, side: FightSide, moveId?: string): boolean {
  const fighter = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    questioningBodyFree(fighter) &&
    hasBodyAndSoul(fighter, moveId) &&
    fighter.aura >= LYNCH_ANSWER_COST &&
    audibleQuestion(fighter, target)
  )
}

function questioningBodyFree(fighter: ArcadeFighter): boolean {
  return (
    lynchTargetConscious(fighter) &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    !musicPacifies(fighter) &&
    canSpeak(fighter) &&
    !fighter.attack &&
    !fighter.hanzoProjection &&
    !fighter.halkSoulSleep &&
    !fighter.parallelEyesClosed &&
    !fighter.melodyPerformance
  )
}

function audibleQuestion(fighter: ArcadeFighter, target: ArcadeFighter): boolean {
  return (
    lynchTargetConscious(target) &&
    canHear(target) &&
    soundDistance(fighter, target) <= LYNCH_QUESTION_RANGE
  )
}

function borrowsBodyAndSoul(fighter: ArcadeFighter): boolean {
  const held = fighter.kurapika?.held
  return Boolean(held?.used && held.source === 'lynch')
}
