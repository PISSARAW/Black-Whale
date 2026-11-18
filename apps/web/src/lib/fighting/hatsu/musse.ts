import { attackPhase, boxesOverlap, hurtboxes, otherSide, worldBox } from '../frameData'
import { consumeHatsuAvoidance, hatsuAvoidsImpact } from '../hatsu'
import { wakeHanzoBody } from '../hanzoProjection'
import { recordDolphinEffects } from '../kurapikaDolphin'
import {
  advanceSecretWindowFeed,
  observeSecretWindow,
  secretWindowNenActive,
  secretWindowUtility,
} from '../secretWindow'
import type { FightSide, FightState } from '../types'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const musseHatsu: FighterHatsu = {
  id: 'musse',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => tickSide(tickSide(state, 'player'), 'opponent'),
}

function tickSide(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (!secretWindowNenActive(fighter))
    return fighter.secretWindow
      ? { ...state, [side]: { ...fighter, secretWindow: undefined } }
      : state
  if (fighter.secretWindow) {
    return {
      ...state,
      [side]: {
        ...fighter,
        secretWindow: {
          ...fighter.secretWindow,
          ...advanceSecretWindowFeed(state, side),
        },
      },
    }
  }
  if (
    !secretWindowUtility(fighter) ||
    fighter.attack?.impacted ||
    attackPhase(fighter) !== 'active'
  )
    return state
  if (fighter.secretWindowMode === 'listening') {
    const next: FightState = {
      ...state,
      [side]: {
        ...fighter,
        attack: { ...fighter.attack!, impacted: true },
        secretWindow: {
          target: otherSide(side),
          attachedAt: state.frame,
          mode: 'listening',
          observation: { frame: state.frame, action: 'audio-only' },
        },
      },
    }
    return recordDolphinEffects(state, next, side)
  }
  return attachAtContact(state, side)
}

/** Touch can reach a guarding arm; it is not a damaging hit or a guard break. */
function attachAtContact(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const targetSide = otherSide(side)
  const target = state[targetSide]
  if (target.wakeupInvulnerableFrames > 0) return state
  if (target.attack?.reversal && attackPhase(target) === 'startup') return state
  const contact = worldBox(fighter, { left: 0, right: 6, bottom: 3, top: 10 })
  if (!hurtboxes(target).some((box) => boxesOverlap(contact, box))) return state
  const avoided = hatsuAvoidsImpact(target)
  const next: FightState = {
    ...state,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack!, impacted: true, confirmedHit: !avoided },
      secretWindow: avoided
        ? undefined
        : {
            target: targetSide,
            attachedAt: state.frame,
            observation: observeSecretWindow(state, targetSide),
          },
    },
    [targetSide]: avoided ? consumeHatsuAvoidance(target) : wakeHanzoBody(target),
  }
  return recordDolphinEffects(state, next, side)
}
