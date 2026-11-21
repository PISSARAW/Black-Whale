import type { Object3D, Vector3 } from 'three'
import type { HumanAppearance } from './humanAppearance'
import { EYE_HEIGHT } from './sceneOptics'

/**
 * The arms of a body the camera is wearing.
 *
 * The authored guard and strike are drawn to be read from across a room: the
 * fists stay at chest height, a third of a metre under the eyes, which from
 * inside the head is the bottom edge of the view. A fighter's own guard is
 * held up to the chin and a straight is thrown at the face, so these lift the
 * arms into the eyes' field; every other pose is left as authored.
 *
 * Bodies differ (Kurapika's shoulders sit lower than Hisoka's), so the
 * shoulder is not given an angle: it is turned until the fist sits at a fixed
 * angle under the eyes, the way a fighter raises a guard to where they see it.
 */

/** How far the eyes sit in front of the neck, where the camera is. */
export const FIRST_PERSON_EYES_FORWARD = 0.17

interface ArmAim {
  /** Radians under the eye line the fist settles at. */
  below: number
  roll: number
  elbow: number
}

const GUARD: ArmAim = { below: 0.26, roll: 0.3, elbow: -0.75 }
const STRIKE: ArmAim = { below: 0.18, roll: 0.1, elbow: -0.05 }
const PITCHES = Array.from({ length: 14 }, (_, index) => -0.8 - index * 0.1)

export interface FirstPersonRig {
  /** Stands on the floor, facing +z: the camera is at `EYE_HEIGHT` above it. */
  root: Object3D
  arms: readonly Object3D[]
}

export function firstPersonArms(rig: FirstPersonRig, pose: HumanAppearance['pose']): void {
  if (pose !== 'guard' && pose !== 'attack') return
  rig.arms.forEach((_, index) => {
    const striking = pose === 'attack' && index === 1
    aimArm(rig, index, striking ? STRIKE : GUARD)
  })
}

function aimArm(rig: FirstPersonRig, index: number, aim: ArmAim): void {
  const arm = rig.arms[index]
  const hand = arm.getObjectByName(index === 0 ? 'hand-left' : 'hand-right')
  if (!hand) return
  const side = index === 0 ? -1 : 1
  arm.children[1].rotation.x = aim.elbow
  let best = { pitch: arm.rotation.x, miss: Infinity }
  for (const pitch of PITCHES) {
    arm.rotation.set(pitch, 0, side * -aim.roll)
    const miss = Math.abs(angleUnderEyes(rig, hand) - aim.below)
    if (miss < best.miss) best = { pitch, miss }
  }
  arm.rotation.set(best.pitch, 0, side * -aim.roll)
}

/** The angle, seen from the camera, between the eye line and the fist. */
function angleUnderEyes(rig: FirstPersonRig, hand: Object3D): number {
  const fist: Vector3 = rig.root.worldToLocal(hand.getWorldPosition(hand.position.clone()))
  return Math.atan2(EYE_HEIGHT - fist.y, fist.z - FIRST_PERSON_EYES_FORWARD)
}
