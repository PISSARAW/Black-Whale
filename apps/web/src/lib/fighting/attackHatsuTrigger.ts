import { triggerHatsu } from './hatsu'
import { startPadailleTool } from './padailleWeapon'
import type { FightSide, FightState, FighterId } from './types'

/** Technique-specific start data stays outside the legacy three-argument trigger contract. */
export function triggerAttackHatsu(options: {
  state: FightState
  side: FightSide
  source: FighterId
  moveId?: string
}): FightState {
  const { state, side, source, moveId } = options
  const triggered = triggerHatsu(state, side, source)
  return source === 'padaille' ? startPadailleTool(triggered, side, moveId) : triggered
}
