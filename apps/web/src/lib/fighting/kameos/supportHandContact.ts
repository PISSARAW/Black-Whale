import type { AnimatedHuman } from '$lib/tour/humanAnimation'
import { fightRigOf } from '../fightRig'

/** Two-bone contact in the chest's space, after the head's expressive turn. */
export function placeSupportHand(options: {
  human: AnimatedHuman
  target: readonly [number, number, number]
  strength: number
}) {
  const { human, strength } = options
  const rig = fightRigOf(human)
  const arm = human.arms[1],
    elbow = rig.elbows[1],
    hand = rig.wrists[1]
  const target = human.head.localToWorld(human.head.position.clone().set(...options.target))
  const shoulder = arm.position.clone()
  arm.parent!.worldToLocal(target)
  const direction = target.clone().sub(shoulder)
  const upper = elbow.position.length(),
    lower = hand.position.length()
  const distance = Math.max(0.001, Math.min(upper + lower - 0.001, direction.length()))
  direction.normalize()
  const along = (upper ** 2 - lower ** 2 + distance ** 2) / (2 * distance)
  const bend = Math.sqrt(Math.max(0, upper ** 2 - along ** 2))
  const normal = direction.clone().set(0, 0, 1).addScaledVector(direction, -direction.z).normalize()
  const pivot = shoulder.clone().addScaledVector(direction, along).addScaledVector(normal, bend)
  const down = shoulder.clone().set(0, -1, 0)
  const upperTurn = arm.quaternion
    .clone()
    .setFromUnitVectors(down, pivot.clone().sub(shoulder).normalize())
  const lowerDirection = target.sub(pivot).normalize().applyQuaternion(upperTurn.clone().invert())
  const lowerTurn = elbow.quaternion.clone().setFromUnitVectors(down, lowerDirection)
  arm.quaternion.slerp(upperTurn, strength)
  elbow.quaternion.slerp(lowerTurn, strength)
}
