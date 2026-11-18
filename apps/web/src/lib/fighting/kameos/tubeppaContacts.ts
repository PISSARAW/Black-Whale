import type { HumanMotion } from '$lib/tour/humanAnimation'
import { fightRigOf } from '../fightRig'
import { KAMEO_CATALOGUE } from './catalogue'
import type { KameoSlot } from './types'

/** Final contact follows the real head after its expressive turn, in either orientation. */
export function tubeppaGlassesMotion(slot: KameoSlot): HumanMotion | undefined {
  if (slot.phase !== 'entering') return
  const progress = Math.min(1, Math.max(0, slot.phaseFrames / KAMEO_CATALOGUE.tubeppa.timing.enter))
  const strength = Math.sin(progress * Math.PI) ** 2
  return (human) => {
    const rig = fightRigOf(human)
    // Anatomical right arm: the spectacles never swap to a screen-relative hand.
    const arm = human.arms[1],
      elbow = rig.elbows[1],
      hand = rig.wrists[1]
    const target = human.head.localToWorld(human.head.position.clone().set(0.116, -0.025, 0.214))
    const shoulder = arm.position.clone()
    arm.parent!.worldToLocal(target)
    const direction = target.clone().sub(shoulder)
    const upper = elbow.position.length(),
      lower = hand.position.length()
    const distance = Math.max(0.001, Math.min(upper + lower - 0.001, direction.length()))
    direction.normalize()
    const along = (upper ** 2 - lower ** 2 + distance ** 2) / (2 * distance)
    const bend = Math.sqrt(Math.max(0, upper ** 2 - along ** 2))
    const normal = direction
      .clone()
      .set(0, 0, 1)
      .addScaledVector(direction, -direction.z)
      .normalize()
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
}
