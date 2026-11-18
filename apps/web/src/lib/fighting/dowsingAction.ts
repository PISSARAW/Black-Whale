import { performDowsingEvidence, advanceDowsingEvidence } from './dowsingEvidence'
export { dowsingAnswerText } from './dowsingAnswers'
import { speakDeclaredFact } from './recordedStatements'
import { observePersonalEncounters } from './personalEncounters'
import { performDowsingVideo, videoDowsingFocus } from './dowsingVideo'
import { triggerHatsuAction } from './hatsu'
import { judgmentActionBreach } from './judgmentAction'
import { speakPaperWords, voiceAvailable } from './kallutoListening'
import { dowsingAnswerText } from './dowsingAnswers'
import { canAskDowsing, dowsingBodyReady, dowsingFaceToFace, ownsDowsing } from './dowsingRules'
import { DOWSING_MOVE, DOWSING_COST, DOWSING_QUESTIONS } from './dowsingTypes'
import type { DowsingQuestion, DowsingPrompt } from './dowsingTypes'
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
  if (
    command.action !== 'dowsing-ask' ||
    !command.target ||
    !Object.hasOwn(DOWSING_QUESTIONS, command.target)
  )
    return state
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
  return askDowsing(state, side, command.target as DowsingQuestion)
}
function askDowsing(state: FightState, side: FightSide, question: DowsingQuestion): FightState {
  const target = other(side)
  const spoken = speakPaperWords(state, side, DOWSING_QUESTIONS[question].fr)
  if (spoken.phase !== 'fighting') return spoken
  const witnessed = triggerHatsuAction({
    state: spoken,
    side,
    source: 'kurapika',
    moveId: DOWSING_MOVE,
  })
  return {
    ...witnessed,
    [side]: {
      ...witnessed[side],
      aura: state[side].aura - DOWSING_COST,
      dowsingSession: { question, target, startedAt: state.frame },
    },
    [target]: {
      ...witnessed[target],
      dowsingPrompt: { asker: side, question, askedAt: state.frame },
    },
  }
}
function answerDowsing(state: FightState, side: FightSide, answer?: string): FightState {
  if (!['sincere', 'lie'].includes(answer ?? '') || !voiceAvailable(state, side)) return state
  const prompt = state[side].dowsingPrompt
  if (!prompt || !currentQuestion(state, side, prompt)) return state
  const text = dowsingAnswerText(state[side], prompt.question, answer === 'lie')
  const spoken = speakDeclaredFact(state, side, {
    question: prompt.question,
    lie: answer === 'lie',
  })
  if (spoken.phase !== 'fighting' || spoken.catsName || spoken[side].health <= 0) return spoken
  // Only this explicit voluntary response declares its intent. Free text is never guessed truthful.
  const swings = answer === 'lie'
  return {
    ...spoken,
    [side]: { ...spoken[side], dowsingPrompt: undefined },
    [prompt.asker]: {
      ...spoken[prompt.asker],
      dowsingSession: { ...spoken[prompt.asker].dowsingSession!, readingAt: state.frame, swings },
      dowsingReading: { frame: state.frame, text, swings },
    },
  }
}
function currentQuestion(state: FightState, side: FightSide, prompt: DowsingPrompt): boolean {
  const session = state[prompt.asker].dowsingSession
  return Boolean(
    session &&
    session.target === side &&
    session.startedAt === prompt.askedAt &&
    session.question === prompt.question &&
    session.readingAt === undefined &&
    dowsingBodyReady(state[prompt.asker]) &&
    dowsingFaceToFace(state, prompt.asker),
  )
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
  const video = state[side].dowsingSession?.video
  return video ? videoDowsingFocus(state, side, video.deviceId) : dowsingFaceToFace(state, side)
}
