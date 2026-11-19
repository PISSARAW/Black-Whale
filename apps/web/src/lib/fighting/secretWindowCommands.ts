import { secretWindowNenActive } from './secretWindow'
import { windowListeningMoveId } from './secretWindowListening'
import { canUseMovesetMove, moveById } from './movesets'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function performSecretWindowCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action === 'window-stop-listening')
    return state[side].secretWindowListening
      ? { ...state, [side]: { ...state[side], secretWindowListening: undefined } }
      : state
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
  return [
    ...listenActivationOption(state, side),
    ...contactOptions(state, side),
    ...listeningOptions(state, side),
  ]
}
function contactOptions(state: FightState, side: FightSide): ArsenalOption[] {
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

function listeningOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!state[side].secretWindowListening) return []
  return [
    {
      command: { action: 'window-stop-listening' },
      labelFr: 'Secret Window : arrêter l’écoute',
      labelEn: 'Secret Window: stop listening',
      ready: secretWindowNenActive(state[side]),
      conditionFr: 'Rappeler le hibou d’épaule sans déplacer le hibou posé au contact.',
      conditionEn: 'Recall the shoulder owl without moving the attached contact owl.',
    },
  ]
}

function listenActivationOption(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side]
  const move = moveById(windowListeningMoveId(actor) ?? '')
  if (!move || actor.secretWindowListening) return []
  return [
    {
      command: { action: 'window-listen' },
      labelFr: 'Secret Window : écoute par le hibou d’épaule',
      labelEn: 'Secret Window: shoulder-owl eavesdrop',
      ready: canUseMovesetMove(state, side, move),
      conditionFr:
        'Application d’écoute distincte du contact. Seules les paroles prononcées sont relayées ; 16 aura et la portée de voix sont des réglages du scénario.',
      conditionEn:
        'Eavesdropping application distinct from touch. Relays spoken words only; 16 aura and voice range are scenario tuning.',
    },
  ]
}
