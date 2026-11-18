import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import { seesCombatBody } from './fightCounterplay'
import { recipientHears } from './fightSpeechRecipient'
import { voiceAvailable } from './kallutoListening'
import { physicalHandOccupancy, physicalHandsBusy } from './deviceHands'
import { DOWSING_MOVE, DOWSING_COST } from './dowsingTypes'
import type { DowsingPrompt, DowsingSession } from './dowsingTypes'
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
    dowsingHandReady(state, side) &&
    seesCombatBody(actor) &&
    voiceAvailable(state, target) &&
    recipientHears(state, side, { seat: target }) &&
    recipientHears(state, target, { seat: side }) &&
    facingSubject(actor, subject) &&
    facingSubject(subject, actor)
  )
}
export function dowsingHandReady(state: FightState, side: FightSide): boolean {
  return !physicalHandsBusy(state[side]) && !physicalHandOccupancy(state, side).has('right')
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
/** A relay cannot answer or receive an interview begun by a different physical member. */
export function currentDowsingQuestion(
  state: FightState,
  side: FightSide,
  prompt: DowsingPrompt,
): boolean {
  const session = state[prompt.asker].dowsingSession
  if (!session || session.readingAt !== undefined) return false
  return (
    session.target === side &&
    dowsingInterviewBodiesMatch(state, prompt.asker, session) &&
    session.startedAt === prompt.askedAt &&
    session.question === prompt.question &&
    dowsingBodyReady(state[prompt.asker]) &&
    dowsingFaceToFace(state, prompt.asker)
  )
}
export function dowsingInterviewBodiesMatch(
  state: FightState,
  side: FightSide,
  session: Pick<DowsingSession, 'askerMember' | 'targetMember' | 'target'>,
): boolean {
  return (
    (session.askerMember ?? 0) === (state.teamMatch?.seats[side].active ?? 0) &&
    (session.targetMember ?? 0) === (state.teamMatch?.seats[session.target].active ?? 0)
  )
}
function mindControlled(fighter: ArcadeFighter): boolean {
  return [
    fighter.hatsuEffects.manipulatedFrames,
    fighter.hatsuEffects.possessedFrames,
    fighter.hatsuEffects.momozeFrames,
  ].some((frames) => frames > 0)
}
