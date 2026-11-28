import type { Object3D } from 'three'

/** Tiny, separated movements keep the masked figure's posture doll-like. */
export function poseSilentMajority(
  parts: { head: Object3D; arms: readonly Object3D[]; legs: readonly Object3D[] },
  seconds: number,
): void {
  const turn = Math.sin(seconds * 0.92)
  parts.head.rotation.y = turn * 0.065
  parts.head.rotation.z = -0.085 + Math.sin(seconds * 0.7) * 0.034
  parts.arms[0].rotation.set(-0.115, 0, -0.036 - turn * 0.012)
  parts.arms[1].rotation.set(-0.055, 0, 0.036 + turn * 0.012)
  parts.legs[0].rotation.z = -0.1
  parts.legs[1].rotation.z = 0.1
}
