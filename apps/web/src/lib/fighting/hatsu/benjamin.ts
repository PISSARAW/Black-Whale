import { benjaminMoveAvailable, benjaminNenActive } from '../benjaminBaton'
import { releaseCuldceptCard } from '../benjaminCuldcept'
import { attackPhase } from '../frameData'
import { attachSecretWindow } from '../secretWindowContact'
import { startSecretWindowListening } from '../secretWindowListening'
import type { FightSide, FightState } from '../types'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const benjaminHatsu: FighterHatsu = {
  id: 'benjamin',
  sourceFor: (fighter, moveId) => {
    if (fighter.id !== 'benjamin') return null
    return benjaminMoveAvailable(fighter, moveId) ? 'benjamin' : null
  },
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => tickSide(tickSide(state, 'player'), 'opponent'),
}

function tickSide(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (fighter.id !== 'benjamin' || !benjaminNenActive(fighter)) return state
  if (attackPhase(fighter) !== 'active' || fighter.attack?.hatsuSource !== 'benjamin') return state
  if (fighter.attack.moveId === 'benjamin:backSpecial')
    return startSecretWindowListening(state, side)
  if (fighter.attack.moveId === 'benjamin:finisher') return releaseCuldceptCard(state, side)
  if (fighter.attack.moveId !== 'benjamin:forwardSpecial' || fighter.attack.impacted) return state
  return attachSecretWindow(state, side)
}
