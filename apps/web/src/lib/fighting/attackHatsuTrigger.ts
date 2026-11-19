import { prepareBlackVoice } from './blackVoice'
import { declareJudgment } from './judgmentAction'
import { triggerHatsuAction } from './hatsu'
import { startPadailleTool } from './padailleWeapon'
import type { FightSide, FightState, FighterId } from './types'

/** Technique-specific start data stays outside the legacy three-argument trigger contract. */
export function triggerAttackHatsu(options: {
  state: FightState
  side: FightSide
  source: FighterId
  moveId?: string
  concealed?: boolean
}): FightState {
  const { side, source, moveId } = options
  if (source === 'chrollo')
    options = { ...options, state: prepareBlackVoice(options.state, side, moveId) }
  const triggered =
    source === 'kurapika'
      ? declareJudgment(triggerHatsuAction(options), side, moveId)
      : triggerHatsuAction(options)
  return source === 'padaille' ? startPadailleTool(triggered, side, moveId) : triggered
}
