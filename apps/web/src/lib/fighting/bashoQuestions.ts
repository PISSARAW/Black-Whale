import { bashoEffectPoem, availableBashoPoem } from './bashoPoem'
import { dowsingAnswerText } from './dowsingAnswers'
import { DOWSING_QUESTIONS, type DowsingQuestion } from './dowsingTypes'
import { speakPaperWords, voiceAvailable } from './kallutoListening'
import { recipientHears } from './fightSpeechRecipient'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

interface BashoInquiry {
  question: DowsingQuestion
  target: FightSide
  frame: number
  paperId: string
}
interface BashoPrompt {
  asker: FightSide
  question: DowsingQuestion
  frame: number
  paperId: string
}
declare module './types' {
  interface ArcadeFighter {
    bashoInquiry?: BashoInquiry
    bashoPrompt?: BashoPrompt
  }
}
export function performBashoQuestion(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  return command.action === 'basho-ask'
    ? ask(state, side, command.target)
    : answer(state, side, command.target)
}
function ask(state: FightState, side: FightSide, question?: string): FightState {
  if (!question || !Object.hasOwn(DOWSING_QUESTIONS, question)) return state
  const poem = availableBashoPoem(state, side, 'ignite-liar'),
    target = other(side)
  if (
    !poem?.paperId ||
    !voiceAvailable(state, side) ||
    !recipientHears(state, side, { seat: target })
  )
    return state
  const spoken = speakPaperWords(state, side, DOWSING_QUESTIONS[question as DowsingQuestion].fr)
  if (spoken.phase !== 'fighting' || spoken.catsName || spoken[side].health <= 0) return spoken
  const shared = {
    question: question as DowsingQuestion,
    frame: state.frame,
    paperId: poem.paperId,
  }
  return {
    ...spoken,
    [side]: { ...spoken[side], bashoInquiry: { ...shared, target } },
    [target]: { ...spoken[target], bashoPrompt: { ...shared, asker: side } },
  }
}
function answer(state: FightState, side: FightSide, choice?: string): FightState {
  if (!['sincere', 'lie'].includes(choice ?? '') || !voiceAvailable(state, side)) return state
  const prompt = state[side].bashoPrompt
  if (!prompt || !validQuestion(state, side, prompt)) return state
  const lie = choice === 'lie'
  const spoken = speakPaperWords(state, side, {
    text: dowsingAnswerText(state[side], prompt.question, lie),
    statementIntent: lie,
  })
  if (spoken.phase !== 'fighting' || spoken.catsName || spoken[side].health <= 0) return spoken
  const cleared = {
    ...spoken,
    [side]: { ...spoken[side], bashoPrompt: undefined },
    [prompt.asker]: { ...spoken[prompt.asker], bashoInquiry: undefined },
  }
  if (!lie) return cleared
  const burned = {
    ...cleared,
    [side]: {
      ...cleared[side],
      health: 0,
      attack: null,
      bufferedAttack: null,
      bashoBurn: { owner: prompt.asker, remainingFrames: 90 },
    },
  }
  return resolveFightOutcome(
    recordFightDeath(burned, {
      victimSide: side,
      killerSide: prompt.asker,
      cause: 'heat',
      fatalCondition: true,
    }),
  )
}
function validQuestion(state: FightState, side: FightSide, prompt: BashoPrompt): boolean {
  const inquiry = state[prompt.asker].bashoInquiry
  return Boolean(
    inquiry &&
    inquiry.target === side &&
    inquiry.frame === prompt.frame &&
    inquiry.question === prompt.question &&
    availableBashoPoem(state, prompt.asker, 'ignite-liar')?.paperId === prompt.paperId &&
    recipientHears(state, side, { seat: prompt.asker }),
  )
}
export function advanceBashoQuestions(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const prompt = next[side].bashoPrompt
    if (prompt && !validQuestion(next, side, prompt))
      next = {
        ...next,
        [side]: { ...next[side], bashoPrompt: undefined },
        [prompt.asker]: { ...next[prompt.asker], bashoInquiry: undefined },
      }
  }
  return next
}
function canPresentBashoReply(state: FightState, side: FightSide): boolean {
  const prompt = state[side].bashoPrompt
  return Boolean(
    prompt && voiceAvailable(state, side) && recipientHears(state, side, { seat: prompt.asker }),
  )
}
export function bashoQuestionOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const commands: ArsenalCommand[] = []
  if (bashoEffectPoem(state[side], 'ignite-liar'))
    for (const question of Object.keys(DOWSING_QUESTIONS))
      commands.push({ action: 'basho-ask', target: question })
  if (state[side].bashoPrompt)
    for (const answer of ['sincere', 'lie'])
      commands.push({ action: 'basho-answer', target: answer })
  return commands.map((command) => ({
    command,
    ready:
      command.action === 'basho-answer'
        ? canPresentBashoReply(state, side)
        : performBashoQuestion(state, side, command) !== state,
    labelFr:
      command.action === 'basho-ask'
        ? `Great Hiker · ${DOWSING_QUESTIONS[command.target as DowsingQuestion].fr}`
        : command.target === 'lie'
          ? 'Répondre en mentant · danger mortel'
          : 'Répondre sincèrement à Basho',
    labelEn:
      command.action === 'basho-ask'
        ? `Great Hiker · ${DOWSING_QUESTIONS[command.target as DowsingQuestion].en}`
        : command.target === 'lie'
          ? 'Knowingly lie · lethal danger'
          : 'Answer Basho sincerely',
    conditionFr:
      'Poème contre les réponses mensongères réellement écrit. Question audible, réponse volontaire à cette question et feu mortel en cas de mensonge conscient. Le silence ne déclenche rien ; aucune parole libre n’est classée automatiquement.',
    conditionEn:
      'The liar-answer poem must actually be written. An audible question and a voluntary knowing lie in reply trigger its lethal fire. Silence does nothing; arbitrary free text is never classified automatically.',
  }))
}
function other(side: FightSide): FightSide {
  return side === 'player' ? 'opponent' : 'player'
}
