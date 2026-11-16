import { fighterDefinition } from './roster'
import { canAskLynchQuestion } from './lynchRules'
import type { LynchReply } from './lynchTypes'
import type { FightState } from './types'

export function lynchReplyText(reply: LynchReply, language: 'fr' | 'en'): string {
  const fr = language === 'fr'
  if (reply.identity) return `${fr ? 'Je suis' : 'I am'} ${fighterDefinition(reply.identity).name}.`
  if (reply.question === 'in')
    return reply.concealed
      ? fr
        ? 'Oui, j’utilise In.'
        : 'Yes, I am using In.'
      : fr
        ? 'Non, je n’utilise pas In.'
        : 'No, I am not using In.'
  return `${fr ? 'Mon état actuel est' : 'My current state is'} ${reply.nenMode?.toUpperCase()}.`
}

export function lynchSpecialPresentation(state: FightState, language: 'fr' | 'en') {
  return {
    label: language === 'fr' ? 'Body and Soul · Question' : 'Body and Soul · Question',
    ready: canAskLynchQuestion(state, 'player'),
    hint:
      language === 'fr'
        ? 'L : poser la question, puis J/K : toucher du poing · 10 aura par réponse · lecture privée dans le panneau'
        : 'L: ask, then J/K: land a fist · 10 aura per reply · read privately in the panel',
  }
}
