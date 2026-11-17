import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import { seesCombatBody } from './fightCounterplay'
import { recipientHears } from './fightSpeechRecipient'
import { voiceAvailable } from './kallutoListening'
import { DOWSING_MOVE, DOWSING_COST } from './dowsingTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function ownsDowsing(fighter: ArcadeFighter): boolean {
  if (chainAbilitySealed(fighter, DOWSING_MOVE)) return false
  if (fighter.id === 'kurapika') return true
  return (
    fighter.id === 'chrollo' &&
    chrolloHasActivePage(fighter, DOWSING_MOVE) &&
    fighter.chrolloBook?.open === false
  )
}
/** Ordinary screening observes a present subject face to face. It cannot inspect a replay. */
export function dowsingFaceToFace(state: FightState, side: FightSide): boolean {
  const target = side === 'player' ? 'opponent' : 'player'
  const actor = state[side],
    subject = state[target]
  return (
    seesCombatBody(actor) &&
    voiceAvailable(state, target) &&
    recipientHears(state, side, { seat: target }) &&
    recipientHears(state, target, { seat: side }) &&
    facingSubject(actor, subject) &&
    facingSubject(subject, actor)
  )
}
function facingSubject(actor: ArcadeFighter, subject: ArcadeFighter): boolean {
  return (subject.x - actor.x) * actor.facing >= 0
}
export function canAskDowsing(state: FightState, side: FightSide): boolean {
  return (
    !state[side].dowsingSession &&
    dowsingBodyReady(state[side]) &&
    voiceAvailable(state, side) &&
    state[side].aura >= DOWSING_COST &&
    dowsingFaceToFace(state, side)
  )
}

export function dowsingBodyReady(fighter: ArcadeFighter): boolean {
  if (!ownsDowsing(fighter) || !voluntaryNenAvailable(fighter, { requireReserve: true }))
    return false
  return (
    canAct(fighter) &&
    !fighter.attack &&
    !fighter.arsenalSleep &&
    !fighter.hanzoProjection &&
    !fighter.needlePuppet &&
    !mindControlled(fighter)
  )
}
function mindControlled(fighter: ArcadeFighter): boolean {
  return [
    fighter.hatsuEffects.manipulatedFrames,
    fighter.hatsuEffects.possessedFrames,
    fighter.hatsuEffects.momozeFrames,
  ].some((frames) => frames > 0)
}
