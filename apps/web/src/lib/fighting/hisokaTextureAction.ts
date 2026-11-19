import type { ArsenalInvocation } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

export function performTextureApplication(
  { state, side, command }: ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  if (command.loan || state[side].id !== 'hisoka' || state[side].dolphinExecution) return state
  return perform({ state, side, kind: 'special', moveId: 'hisoka:downSpecial', auraCharged: false })
}
