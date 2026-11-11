/**
 * The stride, for a body that was built standing some other way.
 *
 * A guard is built with their forearms up, and a body built that way and then
 * set walking swung its legs under a boxer's guard. So the arms are let down
 * to how the limb builder hung them first, before any pose touched them —
 * `rememberHang` keeps that on the arm — and swing from there.
 */
import type { Euler, Group, Object3D, Vector3 } from 'three'

/** How an arm hung when it was built, before a pose raised it. */
interface Hang {
  position: Vector3
  rotation: Euler
  elbow: Euler
}

interface Walking {
  arms: Group[]
  legs: Group[]
  knees: Object3D[]
}

/** Keeps how this arm hangs, the first time a pose is about to move it. */
export function rememberHang(arm: Group): void {
  const elbow = arm.children[1]
  if (arm.userData.hang || !elbow) return
  const hang: Hang = {
    position: arm.position.clone(),
    rotation: arm.rotation.clone(),
    elbow: elbow.rotation.clone(),
  }
  arm.userData.hang = hang
}

/**
 * One frame of the stride.
 *
 * `hips` are the legs' resting angles about the axis they swing on, read once
 * when the animation was set up; the arms swing about their own hanging angle.
 */
export function stride(rig: Walking, motion: { seconds: number; hips: readonly number[] }): void {
  const swing = Math.sin(motion.seconds * 5.2) * 0.42
  rig.arms.forEach((arm, index) => {
    const hang = arm.userData.hang as Hang | undefined
    if (hang) {
      arm.position.copy(hang.position)
      arm.rotation.copy(hang.rotation)
      arm.children[1]!.rotation.copy(hang.elbow)
    }
    arm.rotation.x += (index === 0 ? -swing : swing) * 0.7
  })
  rig.legs.forEach((leg, index) => {
    leg.rotation.x = motion.hips[index]! + (index === 0 ? swing : -swing)
  })
  rig.knees[0]!.rotation.x = Math.max(0, -swing) * 0.7
  rig.knees[1]!.rotation.x = Math.max(0, swing) * 0.7
}
