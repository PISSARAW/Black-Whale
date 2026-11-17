import { triggerHatsuAction } from './hatsu'
import { judgmentActionBreach } from './judgmentAction'
import { speakPaperWords, voiceAvailable } from './kallutoListening'
import { fighterDefinition } from './roster'
import { canAskDowsing, dowsingBodyReady, dowsingFaceToFace, ownsDowsing } from './dowsingRules'
import { DOWSING_MOVE, DOWSING_COST, DOWSING_QUESTIONS } from './dowsingTypes'
import type { DowsingQuestion, DowsingPrompt } from './dowsingTypes'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function performDowsingCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
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
  const spoken = speakPaperWords(state, side, text)
  if (spoken.phase !== 'fighting') return spoken
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
export function dowsingAnswerText(
  fighter: ArcadeFighter,
  question: DowsingQuestion,
  lie: boolean,
): string {
  if (question === 'identity') return identityAnswer(fighter, lie)
  if (question === 'in')
    return (lie ? !fighter.nen.in : fighter.nen.in)
      ? 'Je dissimule mon aura avec In.'
      : 'Je ne dissimule pas mon aura avec In.'
  const mode = fighter.nen.on ? 'on' : fighter.nen.mode
  return `Mon état de Nen est ${lie ? (mode === 'zetsu' ? 'ten' : 'zetsu') : mode}.`
}
function identityAnswer(fighter: ArcadeFighter, lie: boolean): string {
  const identity = fighter.nenOwner ?? fighter.id
  const stated = lie ? (identity === 'hisoka' ? 'kurapika' : 'hisoka') : identity
  return `Je suis ${fighterDefinition(stated).name}.`
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
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const session = next[side].dowsingSession
    if (
      session &&
      (!dowsingBodyReady(next[side]) ||
        !dowsingFaceToFace(next, side) ||
        readingAnimationOver(next, side))
    )
      next = stopDowsing(next, side)
  }
  return next
}
function readingAnimationOver(state: FightState, side: FightSide): boolean {
  const at = state[side].dowsingSession?.readingAt
  return at !== undefined && state.frame - at >= 90
}
function other(side: FightSide): FightSide {
  return side === 'player' ? 'opponent' : 'player'
}
