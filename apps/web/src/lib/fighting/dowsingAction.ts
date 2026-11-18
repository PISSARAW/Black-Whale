import { performDowsingEvidence, advanceDowsingEvidence } from './dowsingEvidence'
export { dowsingAnswerText } from './dowsingAnswers'
import { speakDeclaredFact } from './recordedStatements'
import { observePersonalEncounters } from './personalEncounters'
import { performDowsingVideo, videoDowsingFocus } from './dowsingVideo'
import { triggerHatsuAction } from './hatsu'
import { judgmentActionBreach } from './judgmentAction'
import { speakPaperWords, voiceAvailable } from './kallutoListening'
import { dowsingInquiry, dowsingReply, type DowsingInquiry } from './dowsingInterview'
import {
  canAskDowsing,
  currentDowsingQuestion,
  dowsingBodyReady,
  dowsingFaceToFace,
  dowsingInterviewBodiesMatch,
  ownsDowsing,
} from './dowsingRules'
import { DOWSING_MOVE, DOWSING_COST } from './dowsingTypes'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function performDowsingCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (
    command.action === 'dowsing-locate' ||
    (command.action === 'dowsing-video' && command.target?.includes('|'))
  )
    return performDowsingEvidence({ state, side, command })
  return performDowsingQuestion(state, side, command)
}
function performDowsingQuestion(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action === 'dowsing-video') return performDowsingVideo(state, side, command.target)
  if (command.action === 'dowsing-stop') return stopDowsing(state, side)
  if (command.action === 'dowsing-answer') return answerDowsing(state, side, command.target)
  const inquiry = command.action === 'dowsing-ask' ? dowsingInquiry(command.target) : null
  if (!inquiry) return state
  if (!ownsDowsing(state[side])) return state
  const breach = judgmentActionBreach({
    state,
    side,
    kind: 'special',
    moveId: DOWSING_MOVE,
    auraCharged: false,
  })
  if (breach) return breach
  if (!canAskDowsing(state, side)) return state
  return askDowsing(state, side, inquiry)
}
function askDowsing(state: FightState, side: FightSide, inquiry: DowsingInquiry): FightState {
  const target = other(side)
  const spoken = speakPaperWords(state, side, inquiry.text)
  if (spoken.phase !== 'fighting') return spoken
  const witnessed = triggerHatsuAction({
    state: spoken,
    side,
    source: 'kurapika',
    moveId: DOWSING_MOVE,
  })
  const members = {
    askerMember: state.teamMatch?.seats[side].active ?? 0,
    targetMember: state.teamMatch?.seats[target].active ?? 0,
  }
  return {
    ...witnessed,
    [side]: {
      ...witnessed[side],
      aura: state[side].aura - DOWSING_COST,
      dowsingSession: { ...inquiry, ...members, target, startedAt: state.frame },
    },
    [target]: {
      ...witnessed[target],
      dowsingPrompt: { ...inquiry, ...members, asker: side, askedAt: state.frame },
    },
  }
}
function answerDowsing(state: FightState, side: FightSide, answer?: string): FightState {
  const prompt = state[side].dowsingPrompt
  if (!prompt || !voiceAvailable(state, side) || !currentDowsingQuestion(state, side, prompt))
    return state
  const message = dowsingReply(state[side], answer)
  if (message && prompt.question !== 'free')
    return speakDeclaredFact(state, side, {
      question: prompt.question,
      lie: message.statementIntent === true,
    })
  return message ? speakPaperWords(state, side, message) : state
}
export function stopDowsing(state: FightState, side: FightSide): FightState {
  if (!state[side].dowsingSession) return state
  const target = other(side)
  return {
    ...state,
    [side]: { ...state[side], dowsingSession: undefined },
    [target]: {
      ...state[target],
      dowsingPrompt:
        state[target].dowsingPrompt?.asker === side ? undefined : state[target].dowsingPrompt,
    },
  }
}
export function advanceDowsing(state: FightState): FightState {
  let next = observePersonalEncounters(state)
  for (const side of ['player', 'opponent'] as const) {
    const session = next[side].dowsingSession
    if (
      session &&
      (!dowsingBodyReady(next[side]) ||
        !dowsingSessionFocus(next, side) ||
        readingAnimationOver(next, side))
    )
      next = stopDowsing(next, side)
  }
  return advanceDowsingEvidence(next)
}
function readingAnimationOver(state: FightState, side: FightSide): boolean {
  const at = state[side].dowsingSession?.readingAt
  return at !== undefined && state.frame - at >= 90
}
function other(side: FightSide): FightSide {
  return side === 'player' ? 'opponent' : 'player'
}

function dowsingSessionFocus(state: FightState, side: FightSide): boolean {
  const session = state[side].dowsingSession!
  const video = session.video
  if (video) return videoDowsingFocus(state, side, video.deviceId)
  return dowsingInterviewBodiesMatch(state, side, session) && dowsingFaceToFace(state, side)
}
