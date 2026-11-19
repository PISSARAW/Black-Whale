import { canUseMovesetMove, moveById } from './movesets'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState, FightSide } from './types'

export function performIllumiNeedleApplication(
  options: ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, command } = options
  if (command.loan || state[side].id !== 'illumi') return state
  return perform({
    state,
    side,
    kind: 'special',
    moveId: 'illumi:neutralSpecial',
    auraCharged: false,
  })
}
export function nativeIllumiNeedleOption(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'illumi' || state[side].dolphinExecution) return []
  const move = moveById('illumi:neutralSpecial')
  return [
    {
      command: { action: 'illumi-needle-apply' },
      labelFr: 'Illumi · Exécuter la technique d’aiguilles choisie',
      labelEn: 'Illumi · Execute the selected needle technique',
      ready: Boolean(move && canUseMovesetMove(state, side, move)),
      conditionFr:
        'Effectue l’attaque réelle, avec sa préparation exposée et son contact à la tête. Aiguilles physiques et main libre requises ; garde, parade et esquive restent applicables.',
      conditionEn:
        'Performs the actual attack with exposed startup and head contact. Physical needles and a free hand required; guard, parry and evasion still apply.',
    },
  ]
}
