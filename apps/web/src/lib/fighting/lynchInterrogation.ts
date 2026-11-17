import { witnessedHatsuState } from './nenWitness'
import { hasBodyAndSoul, lynchTargetConscious } from './lynchRules'
import { LYNCH_ANSWER_COST, type LynchReply } from './lynchTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

const PUNCH_SLOTS = ['standingLight', 'standingHeavy', 'forwardLight', 'backHeavy', 'airLight']

/** Run against both snapshots: a punch that incapacitates the target cannot extract a reply. */
export function resolveLynchContact(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightState {
  const fighter = before[side]
  const question = fighter.lynchQuestion
  if (!question || !hasBodyAndSoul(fighter, question.sourceMoveId)) return after
  if (fighter.aura < LYNCH_ANSWER_COST || !fistContact(fighter, after, side)) return after
  if (after[side].aura < LYNCH_ANSWER_COST) return after
  const target = question.target
  if (!lynchTargetConscious(before[target]) || !lynchTargetConscious(after[target])) return after
  const reply = truthfulReply(before, side)
  return recordReply(after, side, reply)
}

function recordReply(state: FightState, side: FightSide, reply: LynchReply): FightState {
  const target = reply.target
  return {
    ...state,
    [side]: {
      ...state[side],
      lynchQuestion: borrowedUseComplete(state[side]) ? undefined : state[side].lynchQuestion,
      aura: Math.max(0, state[side].aura - LYNCH_ANSWER_COST),
      bodyAndSoulReplies: [...(state[side].bodyAndSoulReplies ?? []), reply].slice(-6),
    },
    [target]: {
      ...state[target],
      hatsuEffects: {
        ...state[target].hatsuEffects,
        ...witnessedHatsuState(state, { side, source: 'lynch' }),
      },
      bodyAndSoulReplies: [...(state[target].bodyAndSoulReplies ?? []), reply].slice(-6),
    },
  }
}

function fistContact(fighter: ArcadeFighter, state: FightState, side: FightSide): boolean {
  const impact = state.impact
  if (
    !impact ||
    impact.attacker !== side ||
    impact.avoided ||
    impact.parried ||
    impact.projectileId !== null
  )
    return false
  const attack = fighter.attack
  if (!attack || !['light', 'heavy'].includes(attack.kind) || attack.variant === 'throw')
    return false
  return PUNCH_SLOTS.some((slot) => attack.moveId?.endsWith(`:${slot}`))
}

function truthfulReply(state: FightState, side: FightSide): LynchReply {
  const question = state[side].lynchQuestion!
  const target = state[question.target]
  const reply: LynchReply = {
    frame: state.frame,
    question: question.id,
    questioner: side,
    target: question.target,
  }
  if (question.id === 'identity') return { ...reply, identity: target.nenOwner ?? target.id }
  if (question.id === 'in') return { ...reply, concealed: target.nen.in }
  return { ...reply, nenMode: target.nen.on ? 'on' : target.nen.mode }
}

export function advanceLynchQuestions(state: FightState): FightState {
  const next = { ...state }
  for (const side of ['player', 'opponent'] as const) {
    const fighter = state[side]
    const question = fighter.lynchQuestion
    if (question && !hasBodyAndSoul(fighter, question.sourceMoveId))
      next[side] = { ...fighter, lynchQuestion: undefined }
  }
  return next
}

/** No public event, audio cue or status string carries the answer. */
export function privateLynchReplies(state: FightState, viewer?: FightSide): readonly LynchReply[] {
  if (!viewer) return []
  return (state[viewer].bodyAndSoulReplies ?? []).filter(
    (reply) => reply.questioner === viewer || reply.target === viewer,
  )
}

function borrowedUseComplete(fighter: ArcadeFighter): boolean {
  const held = fighter.kurapika?.held
  return Boolean(held?.used && held.source === 'lynch')
}
