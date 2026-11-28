import { Line3, Vector3, type Object3D } from 'three'
import type { FightImpact, FightSide, FightState } from './types'
import { FEITAN_FINAL_REVERSAL } from './personalSignatureMoves'

export const FEITAN_SECOND_CUT = 'feitan:scabbard-reversal-transition'
export { FEITAN_FINAL_REVERSAL }

/** Put the effect on the finite cutting edge of the final posed weapon. */
export function feitanBladeSpark(
  origin: Vector3,
  options: {
    state: FightState
    impact: FightImpact
    figureOf?: (side: FightSide) => Object3D
  },
): Vector3 {
  const { state, impact, figureOf } = options
  const moveId = state[impact.attacker].attack?.moveId
  if (moveId !== FEITAN_SECOND_CUT && moveId !== FEITAN_FINAL_REVERSAL) return origin
  if (impact.projectileId !== null || impact.transfer || impact.objectTransfer) return origin
  const blade = bladeForSide(figureOf, impact.attacker)
  if (!blade?.visible) return origin
  const base = blade.localToWorld(new Vector3(0, -0.15, 0))
  const tip = blade.localToWorld(new Vector3(0, -0.95, 0))
  return new Line3(base, tip).closestPointToPoint(origin, true, origin)
}

function bladeForSide(figureOf: ((side: FightSide) => Object3D) | undefined, side: FightSide) {
  return figureOf?.(side)?.getObjectByName(`feitan-blade:${side}`)
}
