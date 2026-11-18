import { canAct } from './fightActorState'
import { recipientHears } from './fightSpeechRecipient'
import { dowsingAnswerText } from './dowsingAction'
import { DOWSING_QUESTIONS, type DowsingQuestion } from './dowsingTypes'
import { speakPaperWords, voiceAvailable, PAPER_VOICE_RANGE } from './kallutoListening'
import { canHear, soundDistance } from './melodyRules'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

/** Chapter 68: a physiological clue, not Dowsing Chain's supernatural verdict.
 * Delivery and truth are independent: an anxious truth and a nervous lie sound alike.
 */
const DELIVERIES = [
  ['sincere-calm', 'Réponse sincère · calme', 'Truthful answer · calm'],
  ['sincere-stressed', 'Réponse sincère · anxieuse', 'Truthful answer · anxious'],
  ['lie-calm', 'Mensonge · calme', 'Lie · calm'],
  ['lie-stressed', 'Mensonge · nerveux', 'Lie · nervous'],
] as const
export const SPEECH_PULSE_FRAMES = 120

export function performMelodyQuestion({ state, side, command }: ArsenalInvocation): FightState {
  if (command.action === 'melody-answer') return answerMelody({ state, side, command })
  if (
    command.action !== 'melody-ask' ||
    !command.target ||
    !Object.hasOwn(DOWSING_QUESTIONS, command.target) ||
    !canAskMelody(state, side)
  )
    return state
  const question = command.target as DowsingQuestion
  const spoken = speakPaperWords(state, side, DOWSING_QUESTIONS[question].fr)
  if (spoken.phase !== 'fighting') return spoken
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...spoken,
    [side]: { ...spoken[side], melodyAskedAt: state.frame },
    [other]: { ...spoken[other], melodyPrompt: { owner: side, askedAt: state.frame, question } },
  }
}
function answerMelody({ state, side, command }: ArsenalInvocation): FightState {
  const delivery = DELIVERIES.find(([target]) => target === command.target)
  if (!delivery || !melodyQuestionCurrent(state, side) || !voiceAvailable(state, side)) return state
  const prompt = state[side].melodyPrompt!
  const spoken = speakPaperWords(
    state,
    side,
    dowsingAnswerText(state[side], prompt.question, delivery[0].startsWith('lie')),
  )
  if (spoken.phase !== 'fighting') return spoken
  return {
    ...spoken,
    [side]: {
      ...spoken[side],
      melodyPrompt: undefined,
      speechPulse: {
        frame: state.frame,
        shape: delivery[0].endsWith('stressed') ? 'sudden' : 'gradual',
      },
    },
  }
}

export function canAskMelody(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    other = side === 'player' ? 'opponent' : 'player'
  return (
    actor.id === 'melody' &&
    canAct(actor) &&
    !actor.attack &&
    !actor.melodyPerformance &&
    voiceAvailable(state, side) &&
    canHear(actor) &&
    recipientHears(state, side, { seat: other }) &&
    melodyQuestionCooldown(state, side)
  )
}
function melodyQuestionCooldown(state: FightState, side: FightSide): boolean {
  return state.frame - (state[side].melodyAskedAt ?? -180) >= 180
}
export function melodyQuestionCurrent(state: FightState, side: FightSide): boolean {
  const prompt = state[side].melodyPrompt
  if (!prompt) return false
  const owner = state[prompt.owner]
  return (
    owner.id === 'melody' &&
    owner.health > 0 &&
    owner.melodyAskedAt === prompt.askedAt &&
    state.frame - prompt.askedAt < 180 &&
    canHear(owner) &&
    soundDistance(owner, state[side]) <= PAPER_VOICE_RANGE
  )
}
export function melodyQuestionOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const options: ArsenalOption[] = []
  if (state[side].id === 'melody')
    for (const [target, names] of Object.entries(DOWSING_QUESTIONS))
      options.push({
        command: { action: 'melody-ask', target },
        labelFr: `Interroger · ${names.fr}`,
        labelEn: `Ask · ${names.en}`,
        ready: canAskMelody(state, side),
        conditionFr:
          'Question audible et réponse volontaire. L’ouïe corporelle distingue une accélération brusque ou progressive, sans verdict de vérité ni coût de Nen.',
        conditionEn:
          'Audible question and voluntary reply. Bodily hearing distinguishes sudden or gradual acceleration, without a truth verdict or Nen cost.',
      })
  if (melodyQuestionCurrent(state, side))
    for (const [target, fr, en] of DELIVERIES)
      options.push({
        command: { action: 'melody-answer', target },
        labelFr: fr,
        labelEn: en,
        ready: voiceAvailable(state, side),
        conditionFr:
          'Choix de jeu de la réponse et du stress physiologique. Melody entend le rythme, jamais cette intention privée ; une vérité anxieuse et un mensonge nerveux produisent le même indice.',
        conditionEn:
          'Choose the reply and physiological stress for this duel. Melody hears rhythm, never this private intent; an anxious truth and a nervous lie produce the same clue.',
      })
  return options
}
