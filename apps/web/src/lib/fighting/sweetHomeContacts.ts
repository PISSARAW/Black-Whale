import { voluntaryNenAvailable } from './nenAccess'
import { chainAbilitySealed } from './kurapika'
import { attackPhase, boxesOverlap, hurtboxes, otherSide } from './frameData'
import type { FightSide, FightState } from './types'

/** Contact uses a short hand box, never the special's much longer attack box. */
export const SWEET_HOME_HAND_REACH = 5

export interface SweetHomeContacts {
  right: FightSide | null
  left: FightSide | null
}

/** The left hand alone suffices for the owner's wounds (chapter 399). */
export function sweetHomeCanTouch(state: FightState, side: FightSide): boolean {
  const owner = state[side]
  const target = state[otherSide(side)]
  const handX = owner.x + owner.facing * SWEET_HOME_HAND_REACH
  const handY = owner.y + (owner.crouching ? 4 : 7)
  const hand = {
    left: Math.min(owner.x, handX),
    right: Math.max(owner.x, handX),
    bottom: handY - 1,
    top: handY + 1,
  }
  return target.health > 0 && hurtboxes(target).some((box) => boxesOverlap(hand, box))
}

/** Contacts exist only during active frames, and are checked before impact recoil. */
export function sweetHomeContacts(state: FightState, side: FightSide): SweetHomeContacts | null {
  const owner = state[side]
  if (!sweetHomeAvailable(state, side) || attackPhase(owner) !== 'active') return null
  if (owner.attack?.hatsuSource !== 'terebellum') return null
  const target = sweetHomeCanTouch(state, side) ? otherSide(side) : null
  switch (owner.attack.moveId) {
    // An explicit two-hand link: absorb the other person's wound into one's own body.
    case 'terebellum:forwardSpecial':
      return { right: target, left: owner.sweetHomeObject ? null : side }
    // Absorbing without a left-hand recipient wounds the owner's left hand.
    case 'terebellum:downSpecial':
      return { right: target, left: null }
    default:
      return { right: null, left: owner.sweetHomeObject ? null : target }
  }
}

export function sweetHomeAvailable(state: FightState, side: FightSide): boolean {
  const owner = state[side]
  return (
    voluntaryNenAvailable(owner) &&
    owner.hitStun === 0 &&
    owner.blockStun === 0 &&
    owner.knockdownFrames === 0 &&
    !chainAbilitySealed(owner, 'terebellum:neutralSpecial')
  )
}
