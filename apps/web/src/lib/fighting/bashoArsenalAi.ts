import {
  BASHO_ATTESTED_POEMS,
  bashoEffectPoem,
  bashoCanWrite,
  hasBashoPoem,
  type BashoEffect,
} from './bashoPoem'
import { composeBashoPoem } from './bashoAction'
import { performBashoQuestion } from './bashoQuestions'
import { performBashoWard } from './bashoWard'
import { performWritingKitCommand } from './bashoMaterials'
import { judgmentForbidsContact } from './judgmentCommunication'
import { perceivedOpponentGap } from './opponentAwareness'
import { chrolloHasActivePage } from './chrolloBook'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

export function bashoArsenalAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const reply = answerPoet(state)
  if (reply) return reply
  if (!hasBashoPoem(state.opponent)) return null
  const utility = useWrittenPoem(state)
  if (utility) return utility
  const effect = neededPoem(state)
  if (!effect) return null
  const prepared = prepareWriting(state, perform)
  if (prepared) return prepared
  if (!bashoCanWrite(state, 'opponent')) return null
  const written = composeBashoPoem(
    { state, side: 'opponent', text: BASHO_ATTESTED_POEMS[effect].fr },
    perform,
  )
  return written === state ? null : written
}
function answerPoet(state: FightState): FightState | null {
  const prompt = state.opponent.bashoPrompt
  if (
    !prompt ||
    state.frame - prompt.frame < 30 ||
    judgmentForbidsContact(state.opponent, state[prompt.asker].id)
  )
    return null
  const next = performBashoQuestion(state, 'opponent', {
    action: 'basho-answer',
    target: 'sincere',
  })
  return next === state ? null : next
}
function useWrittenPoem(state: FightState): FightState | null {
  if (bashoEffectPoem(state.opponent, 'ward-weak-spirits') && needsWard(state)) {
    const next = performBashoWard(state, 'opponent', { action: 'basho-ward', target: 'opponent' })
    if (next !== state) return next
  }
  if (!state.opponent.bashoInquiry && bashoEffectPoem(state.opponent, 'ignite-liar')) {
    const next = performBashoQuestion(state, 'opponent', {
      action: 'basho-ask',
      target: 'identity',
    })
    if (next !== state) return next
  }
  return null
}
function neededPoem(state: FightState): BashoEffect | null {
  if (needsWard(state) && !bashoEffectPoem(state.opponent, 'ward-weak-spirits'))
    return 'ward-weak-spirits'
  if (perceivedOpponentGap(state) <= 10) return null
  if (!bashoEffectPoem(state.opponent, 'ignite-punched-target')) return 'ignite-punched-target'
  return !bashoEffectPoem(state.opponent, 'ignite-liar') ? 'ignite-liar' : null
}
function needsWard(state: FightState): boolean {
  return (
    (state.opponent.bashoWard?.remainingFrames ?? 0) <= 0 &&
    Boolean(
      state.battlefield?.entities.some((e) => e.present && e.weakSpirit?.target === 'opponent'),
    )
  )
}
function prepareWriting(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const actor = state.opponent
  if (!actor.writingKit) {
    const kit = state.battlefield?.entities.find(
      (e) => e.present && e.writingKit && Math.abs(e.x - actor.x) <= 4,
    )
    if (!kit) return null
    const next = performWritingKitCommand(state, 'opponent', {
      action: 'writing-take',
      target: kit.id,
    })
    return next === state ? null : next
  }
  return prepareWritingBook(state, perform)
}
function prepareWritingBook(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const actor = state.opponent
  if (actor.id !== 'chrollo' || !actor.chrolloBook?.open || !chrolloHasActivePage(actor, 'basho'))
    return null
  const next = perform({
    state,
    side: 'opponent',
    kind: 'special',
    moveId:
      actor.chrolloBook.pages[actor.chrolloBook.page]?.split(':')[0] === 'basho'
        ? 'chrollo:downSpecial'
        : 'chrollo:backSpecial',
    auraCharged: false,
  })
  return next === state ? null : next
}
