import { composeBashoPoem } from './bashoAction'
import { BASHO_POEMS, BASHO_TRIAL_POEMS, bashoCanWrite, hasBashoPoem } from './bashoPoem'
import { dowsingAnswerText } from './dowsingAction'
import { DOWSING_QUESTIONS, type DowsingQuestion } from './dowsingTypes'
import { speakPaperWords, voiceAvailable, PAPER_VOICE_RANGE } from './kallutoListening'
import { canHear, soundDistance } from './melodyRules'
import { canAct } from './fightActorState'
import { dolphinCanUse } from './kurapikaDolphin'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Chapter 68 shows the written threat and questioning, not an executed punishment.
 * Never turn that threat into an omniscient lie detector or an invented instant kill.
 */
export function performBashoArsenal(
  options: ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, command } = options
  if (command.action === 'basho-compose') {
    const text =
      command.target === 'trial'
        ? BASHO_TRIAL_POEMS.fr
        : command.target === 'punch'
          ? BASHO_POEMS.fr
          : null
    return text ? composeBashoPoem({ state, side, text }, perform) : state
  }
  if (command.action === 'basho-answer') return answerBasho(options)
  return command.action === 'basho-ask' ? askBasho(options) : state
}
function answerBasho({ state, side, command }: ArsenalInvocation): FightState {
  const prompt = state[side].bashoPrompt
  if (
    !prompt ||
    !['sincere', 'lie'].includes(command.target ?? '') ||
    !voiceAvailable(state, side) ||
    !bashoQuestionCurrent(state, side)
  )
    return state
  const text = dowsingAnswerText(state[side], prompt.question, command.target === 'lie')
  const spoken = speakPaperWords(state, side, text)
  return { ...spoken, [side]: { ...spoken[side], bashoPrompt: undefined } }
}
function askBasho({ state, side, command }: ArsenalInvocation): FightState {
  const other = side === 'player' ? 'opponent' : 'player'
  if (
    command.action !== 'basho-ask' ||
    !command.target ||
    !Object.hasOwn(DOWSING_QUESTIONS, command.target) ||
    !canAskBasho(state, side)
  )
    return state
  const question = command.target as DowsingQuestion
  const poem = state[side].bashoPoem!
  const spoken = speakPaperWords(
    state,
    side,
    `${poem.text.replaceAll('\n', ' ')}. ${DOWSING_QUESTIONS[question].fr}`,
  )
  if (spoken.phase !== 'fighting') return spoken
  return {
    ...spoken,
    [side]: {
      ...spoken[side],
      bashoPoem: { ...poem, declaration: { frame: state.frame, question } },
    },
    [other]: { ...spoken[other], bashoPrompt: { owner: side, askedAt: state.frame, question } },
  }
}

export function canAskBasho(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    other = side === 'player' ? 'opponent' : 'player'
  return (
    readyTrial(actor) &&
    canAct(actor) &&
    !actor.attack &&
    voiceAvailable(state, side) &&
    availableListener(state[other]) &&
    soundDistance(actor, state[other]) <= PAPER_VOICE_RANGE &&
    !state[other].bashoPrompt
  )
}

export function bashoQuestionCurrent(state: FightState, target: FightSide): boolean {
  const prompt = state[target].bashoPrompt
  if (!prompt) return false
  const actor = state[prompt.owner],
    poem = actor.bashoPoem
  return Boolean(
    poem?.ready &&
    poem.effect === 'trial-by-fire' &&
    poem.declaration?.frame === prompt.askedAt &&
    poem.declaration.question === prompt.question &&
    hasBashoPoem(actor, poem.sourceMoveId) &&
    canHear(actor) &&
    soundDistance(actor, state[target]) <= PAPER_VOICE_RANGE,
  )
}

export function bashoArsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side],
    options: ArsenalOption[] = []
  if (actor.id === 'basho' || hasBashoPoem(actor) || bashoLoaded(actor)) {
    for (const [target, fr, en] of [
      ['punch', 'Écrire le poème du poing', 'Write the fist poem'],
      ['trial', 'Écrire la menace du jugement du feu', 'Write the trial-by-fire threat'],
    ])
      options.push({
        command: { action: 'basho-compose', target },
        labelFr: fr,
        labelEn: en,
        ready: bashoCanWrite(state, side) || (bashoLoaded(actor) && dolphinCanUse(state, side)),
        conditionFr:
          'Deux compositions attestées au chapitre 68 ; écriture interruptible et coût de duel de 25 aura. Aucune interprétation de poème libre.',
        conditionEn:
          'Two chapter 68 compositions; interruptible writing and 25 aura duel cost. No free-form poem interpretation.',
      })
    if (actor.bashoPoem?.effect === 'trial-by-fire')
      for (const [target, names] of Object.entries(DOWSING_QUESTIONS))
        options.push({
          command: { action: 'basho-ask', target },
          labelFr: `Menace · ${names.fr}`,
          labelEn: `Threat · ${names.en}`,
          ready: canAskBasho(state, side),
          conditionFr:
            'Lire le poème écrit et poser une question audible. La sanction annoncée n’est pas montrée dans ce combat : aucun verdict automatique.',
          conditionEn:
            'Read the written poem and ask an audible question. The threatened punishment is not shown in that fight: no automatic verdict.',
        })
  }
  return [...options, ...bashoAnswerOptions(state, side)]
}
function bashoAnswerOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side],
    options: ArsenalOption[] = []
  if (!actor.bashoPrompt) return []
  for (const target of ['sincere', 'lie'])
    options.push({
      command: { action: 'basho-answer', target },
      labelFr: target === 'sincere' ? 'Répondre sincèrement à Basho' : 'Mentir à Basho',
      labelEn: target === 'sincere' ? 'Answer Basho truthfully' : 'Lie to Basho',
      ready: voiceAvailable(state, side) && bashoQuestionCurrent(state, side),
      conditionFr:
        'Réponse volontaire de ce joueur. Le silence ne répond pas à sa place ; aucune lecture de vérité n’est révélée à Basho.',
      conditionEn:
        'This player’s voluntary response. Silence supplies no answer; Basho receives no truth reading.',
    })
  return options
}

function readyTrial(actor: ArcadeFighter): boolean {
  const poem = actor.bashoPoem
  return Boolean(
    poem?.ready && poem.effect === 'trial-by-fire' && hasBashoPoem(actor, poem.sourceMoveId),
  )
}

function bashoLoaded(actor: ArcadeFighter): boolean {
  const held = actor.kurapika?.held
  return actor.id === 'kurapika' && held?.source === 'basho' && held.loaded && !held.used
}
function availableListener(target: ArcadeFighter): boolean {
  return (
    canHear(target) &&
    !target.arsenalSleep &&
    !target.hanzoProjection &&
    !target.kurapika?.blackoutFrames
  )
}
