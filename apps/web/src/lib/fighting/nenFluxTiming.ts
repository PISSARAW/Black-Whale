import { attackData } from './frameData'
import type { ArcadeFighter } from './types'

/** A live transfer owns its clock; interpolated shares must not restart the visible flux each frame. */
export function nenFluxTiming(fighter: ArcadeFighter, pulse: { age: number }) {
  const attack = fighter.attack
  const transfer = fighter.nenTransfer
  const travel = attack ? pulse.age + attackData(attack.kind, fighter).startup - attack.frame : 8
  return {
    age: transfer?.age ?? pulse.age,
    travelFrames: transfer?.duration ?? Math.max(2, Math.min(8, travel)),
    zone: transfer?.zone,
  }
}
