import { voluntaryNenAvailable } from './nenAccess'
import { chainAbilitySealed } from './kurapika'
import { attackPhase, otherSide } from './frameData'
import { sweetHomeHandTouches, sweetHomeRightBody } from './sweetHomeHands'
import type { FightSide, FightState } from './types'

export { SWEET_HOME_HAND_REACH } from './sweetHomeHands'

export interface SweetHomeContacts {
  right: FightSide | null
  left: FightSide | null
}

/** The left hand alone suffices for the owner's wounds (chapter 399). */
export function sweetHomeCanTouch(state: FightState, side: FightSide): boolean {
  return sweetHomeHandTouches(state[side], state[otherSide(side)])
}

/** Contacts exist only during active frames, and are checked before impact recoil. */
export function sweetHomeContacts(state: FightState, side: FightSide): SweetHomeContacts | null {
  const owner = state[side]
  if (!sweetHomeAvailable(state, side) || attackPhase(owner) !== 'active') return null
  if (owner.attack?.hatsuSource !== 'terebellum') return null
  const target = sweetHomeCanTouch(state, side) ? otherSide(side) : null
  // A right hand protecting the ally is not also on the opponent.
  const right = sweetHomeRightBody(state, side, target)
  switch (owner.attack.moveId) {
    // An explicit two-hand link: absorb the other person's wound into one's own body.
    case 'terebellum:forwardSpecial':
      return { right, left: owner.sweetHomeObject ? null : side }
    // Absorbing without a left-hand recipient wounds the owner's left hand.
    case 'terebellum:downSpecial':
      return { right, left: null }
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
