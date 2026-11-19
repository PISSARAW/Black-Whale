import { moveById, canUseMovesetMove } from './movesets'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState, FightSide } from './types'

export function performIllumiDisguiseApplication(
  options: ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, command } = options
  if (command.loan || state[side].id !== 'illumi') return state
  return perform({ state, side, kind: 'special', moveId: 'illumi:backSpecial', auraCharged: false })
}

export function nativeIllumiFaceOption(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'illumi' || state[side].dolphinExecution) return []
  const move = moveById('illumi:backSpecial')
  return [
    {
      command: { action: 'illumi-face-apply' },
      labelFr: 'Illumi · Exécuter le remodelage du visage',
      labelEn: 'Illumi · Execute face alteration',
      ready: Boolean(move && canUseMovesetMove(state, side, move)),
      conditionFr:
        'Exécute réellement la préparation ou le retour volontaire. Main libre et Nen disponibles ; aucun soin ni acquisition des vêtements et pouvoirs du modèle.',
      conditionEn:
        'Executes the actual preparation or voluntary reversion. Free hand and available Nen; no healing or acquisition of the model’s clothes and powers.',
    },
  ]
}
