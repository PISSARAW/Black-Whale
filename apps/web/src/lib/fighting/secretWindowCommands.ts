import { secretWindowNenActive } from './secretWindow'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function performSecretWindowCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action !== 'window-recall' || !state[side].secretWindow) return state
  const owner = state[side]
  const baton = owner.hatsuEffects.baton
  return {
    ...state,
    [side]: {
      ...owner,
      secretWindow: undefined,
      hatsuEffects: baton
        ? { ...owner.hatsuEffects, baton: { ...baton, markedTarget: null } }
        : owner.hatsuEffects,
    },
  }
}

export function secretWindowOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!state[side].secretWindow) return []
  return [
    {
      command: { action: 'window-recall' },
      labelFr: 'Secret Window : rappeler le hibou',
      labelEn: 'Secret Window: recall owl',
      ready: secretWindowNenActive(state[side]),
      conditionFr:
        'Arrête la surveillance du corps marqué. Une nouvelle cible exige un nouveau contact réel ; aucun transfert au remplaçant lors d’un relais.',
      conditionEn:
        'Ends surveillance of the marked body. A new subject needs actual touch; a relay never transfers the bird to the replacement.',
    },
  ]
}
