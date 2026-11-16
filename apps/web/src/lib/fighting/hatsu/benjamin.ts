import { benjaminMoveAvailable, benjaminNenActive } from '../benjaminBaton'
import { releaseCuldceptCard } from '../benjaminCuldcept'
import { attackPhase, boxesOverlap, hurtboxes, otherSide, worldBox } from '../frameData'
import type { FightSide, FightState } from '../types'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const benjaminHatsu: FighterHatsu = {
  id: 'benjamin',
  sourceFor: (fighter, moveId) => {
    if (fighter.id !== 'benjamin' || moveId === 'benjamin:backSpecial') return null
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
  if (fighter.attack.moveId === 'benjamin:finisher') return releaseCuldceptCard(state, side)
  if (fighter.attack.moveId !== 'benjamin:forwardSpecial' || fighter.attack.impacted) return state
  return markSecretWindow(state, side)
}

/** Musse's contact bird watches actions; it neither reads hidden aura nor paralyses. */
function markSecretWindow(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const baton = fighter.hatsuEffects.baton
  const targetSide = otherSide(side)
  const target = state[targetSide]
  if (!baton || target.blocking || target.wakeupInvulnerableFrames > 0) return state
  const contact = worldBox(fighter, { left: 0, right: 6, bottom: 3, top: 10 })
  if (!hurtboxes(target).some((box) => boxesOverlap(contact, box))) return state
  return {
    ...state,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack!, impacted: true, confirmedHit: true },
      hatsuEffects: { ...fighter.hatsuEffects, baton: { ...baton, markedTarget: targetSide } },
    },
  }
}
