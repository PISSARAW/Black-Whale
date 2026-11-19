import { attackPhase, boxesOverlap, hurtboxes, worldBox } from './frameData'
import { hatsuAvoidsImpact, consumeHatsuAvoidance } from './hatsu'
import { wakeHanzoBody } from './hanzoProjection'
import { recordDolphinEffects } from './kurapikaDolphin'
import { observeSecretWindow } from './secretWindow'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** The contact is physical and non-damaging, including against a guarding body. */
export function attachSecretWindow(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  if (target.wakeupInvulnerableFrames > 0) return state
  if (target.attack?.reversal && attackPhase(target) === 'startup') return state
  const contact = worldBox(fighter, { left: 0, right: 6, bottom: 3, top: 10 })
  if (!hurtboxes(target).some((box) => boxesOverlap(contact, box))) return state
  const avoided = hatsuAvoidsImpact(target)
  return recordDolphinEffects(state, touchedState(state, side, avoided), side)
}

function touchedState(state: FightState, side: FightSide, avoided: boolean): FightState {
  const fighter = state[side]
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  const member = state.teamMatch?.seats[targetSide].active ?? 0
  return {
    ...state,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack!, impacted: true, confirmedHit: !avoided },
      hatsuEffects: avoided ? fighter.hatsuEffects : markedBaton(fighter, targetSide),
      secretWindow: avoided
        ? fighter.secretWindow
        : {
            target: targetSide,
            targetMember: member,
            attachedAt: state.frame,
            observation: observeSecretWindow(state, targetSide, member),
          },
    },
    [targetSide]: avoided ? consumeHatsuAvoidance(target) : wakeHanzoBody(target),
  }
}

function markedBaton(fighter: ArcadeFighter, target: FightSide): ArcadeFighter['hatsuEffects'] {
  const baton = fighter.hatsuEffects.baton
  return fighter.id === 'benjamin' && baton
    ? { ...fighter.hatsuEffects, baton: { ...baton, markedTarget: target } }
    : fighter.hatsuEffects
}
