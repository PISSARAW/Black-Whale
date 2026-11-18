import { nenComboDecision } from './nenComboDecision'
import { applyAuraContext } from './nen'
import { focusCommand } from './nenFocusCommand'
import { performOpponentArsenalMove } from './arsenalAiNen'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

export function nativeNenCombo(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  if (!state.opponent.attack) return null
  const decision = nenComboDecision(state, 'opponent')
  if (decision.move)
    return performOpponentArsenalMove({ state, move: decision.move, roll: 0.5 }, perform)
  if (decision.focus)
    return { ...state, opponent: applyAuraContext(state.opponent, focusCommand(decision.focus)) }
  return state
}
