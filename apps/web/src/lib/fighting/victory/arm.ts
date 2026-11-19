import type { Object3D } from 'three'
import type { Vector3 } from 'three'
import { reachHumanLimb } from '$lib/tour/humanLimbReach'
import { previousVictoryArm } from './poseContinuity'

/** Two real arm segments meet the card grip without stretching the figure. */
export function reachCinematicHand(
  root: Object3D,
  options: { side: 'left' | 'right'; target: Vector3; pole: Vector3 },
) {
  const { side, target, pole } = options
  const upper = root.getObjectByName(`shoulder-${side}`)!
  const lower = root.getObjectByName(`elbow-${side}`)!
  const hand = root.getObjectByName(`hand-${side}`)!
  return reachHumanLimb({ root: upper, hinge: lower, end: hand }, target, {
    pole,
    reference: previousVictoryArm(root, side),
  })
}
