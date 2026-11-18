import { arsenalMindAvailable } from './arsenalMind'
import { controlledEntities, releasePreparedControl } from './preparationActions'
import { updateEntity } from './preparationWorld'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

const ORDERS = [
  ['little-eye-left', 'Aller à gauche', 'Move left'],
  ['little-eye-right', 'Aller à droite', 'Move right'],
  ['little-eye-stay', 'Rester sur place', 'Stay here'],
  ['little-eye-look-left', 'Regarder à gauche', 'Look left'],
  ['little-eye-look-right', 'Regarder à droite', 'Look right'],
  ['little-eye-release', 'Libérer l’animal', 'Release the animal'],
] as const
export function littleEyeOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].dolphinLoan && !state[side].dolphinLoanChannel) return []
  if (!controlledEntities(state, side, 'sayird').length) return []
  return ORDERS.map(([action, labelFr, labelEn]) => ({
    command: { action },
    labelFr: `Little Eye · ${labelFr}`,
    labelEn: `Little Eye · ${labelEn}`,
    ready: arsenalMindAvailable(state[side]),
    conditionFr:
      'Ordre du véritable utilisateur ; la vue et l’ouïe proviennent du petit animal contrôlé.',
    conditionEn:
      'The actual user commands; sight and hearing come from the controlled small animal.',
  }))
}
export function performLittleEyeCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (!arsenalMindAvailable(state[side])) return state
  const animal = controlledEntities(state, side, 'sayird')[0]
  if (!animal?.littleEye) return state
  if (command.action === 'little-eye-release') return releasePreparedControl(state, side, 'sayird')
  const action = command.action
  if (!ORDERS.some(([id]) => id === action)) return state
  if (action === 'little-eye-stay')
    return updateEntity(state, animal.id, {
      littleEye: { ...animal.littleEye, destinationX: undefined },
    })
  const facing = action.endsWith('left') ? -1 : 1
  const destinationX = action.startsWith('little-eye-look')
    ? animal.littleEye.destinationX
    : facing === -1
      ? 0
      : 100
  return updateEntity(state, animal.id, { littleEye: { facing, destinationX } })
}
