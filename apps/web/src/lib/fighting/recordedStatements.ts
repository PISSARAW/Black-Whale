import { performBashoQuestion } from './bashoQuestions'
import { dowsingAnswerText } from './dowsingAnswers'
import { speakPaperWords, voiceAvailable } from './kallutoListening'
import { DOWSING_QUESTIONS } from './dowsingTypes'
import type { DowsingQuestion } from './dowsingTypes'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

/** The player declares their own conscious intent; free text is never guessed true or false. */
export function performRecordedStatement(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (!['statement-sincere', 'statement-lie'].includes(command.action)) return state
  if (
    !command.target ||
    !Object.hasOwn(DOWSING_QUESTIONS, command.target) ||
    !voiceAvailable(state, side)
  )
    return state
  const lie = command.action === 'statement-lie'
  return speakDeclaredFact(state, side, { question: command.target as DowsingQuestion, lie })
}
export function speakDeclaredFact(
  state: FightState,
  side: FightSide,
  statement: { question: DowsingQuestion; lie: boolean },
): FightState {
  const { question, lie } = statement
  if (state[side].bashoPrompt?.question === question) {
    const answered = performBashoQuestion(state, side, {
      action: 'basho-answer',
      target: lie ? 'lie' : 'sincere',
    })
    if (answered !== state) return answered
  }
  return speakPaperWords(state, side, {
    text: dowsingAnswerText(state[side], question, lie),
    statementIntent: lie,
  })
}

export function recordedStatementOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!state.battlefield?.entities.some((e) => e.device?.recording)) return []
  return Object.entries(DOWSING_QUESTIONS).flatMap(([question, label]) =>
    (['statement-sincere', 'statement-lie'] as const).map((action) => ({
      command: { action, target: question },
      labelFr: `${action === 'statement-lie' ? 'Mentir' : 'Déclarer sincèrement'} · ${label.fr}`,
      labelEn: `${action === 'statement-lie' ? 'Knowingly lie' : 'State sincerely'} · ${label.en}`,
      ready: voiceAvailable(state, side),
      conditionFr:
        'Parole volontaire sur un fait conscient représenté. La caméra doit réellement capter le visage et la voix pour permettre une analyse ultérieure.',
      conditionEn:
        'Voluntary speech about a represented conscious fact. A camera must actually capture the face and voice to permit later screening.',
    })),
  )
}
