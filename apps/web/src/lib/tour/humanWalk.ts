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
  figure?: Group
  arms: Group[]
  legs: Group[]
  knees: Object3D[]
}

/** Two alternating steps, in the unit-sized rig's ground space. */
export const WALK_STRIDE_METRES = 1.04
export const WALK_STRIDE_SECONDS = (2 * Math.PI) / 5.2

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
  const cycle = (((motion.seconds / WALK_STRIDE_SECONDS) % 1) + 1) % 1
  const compression = 0.045
  if (rig.figure) rig.figure.position.y -= compression * rig.legs[0].scale.y * rig.figure.scale.y
  rig.legs.forEach((leg, index) => {
    const knee = rig.knees[index]
    const foot = knee.children[1]
    if (!foot) {
      leg.rotation.x = motion.hips[index]! + (index === 0 ? swing : -swing)
      knee.rotation.x = Math.max(0, index === 0 ? -swing : swing) * 0.7
      return
    }
    const phase = (cycle + index * 0.5) % 1
    const swingPhase = (phase - 0.5) * 2
    const airborne = phase >= 0.5
    const progress = airborne ? swingPhase * swingPhase * (3 - 2 * swingPhase) : phase * 2
    const z = ((airborne ? progress - 0.5 : 0.5 - progress) * WALK_STRIDE_METRES) / 2
    const lift = airborne ? Math.sin(swingPhase * Math.PI) * 0.07 : 0
    const upper = Math.abs(knee.position.y)
    const lower = Math.hypot(foot.position.y, foot.position.z)
    const down = upper - foot.position.y - compression - lift
    const forward = foot.position.z + z
    const bend = Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          (down * down + forward * forward - upper * upper - lower * lower) / (2 * upper * lower),
        ),
      ),
    )
    const pitch =
      Math.atan2(-forward, down) -
      Math.atan2(lower * Math.sin(bend), upper + lower * Math.cos(bend))
    const restPitch = Math.atan2(-foot.position.z, -foot.position.y)
    leg.rotation.x = pitch
    knee.rotation.x = bend - restPitch
    foot.rotation.x = -(pitch + knee.rotation.x)
  })
}
