import type { Object3D, Vector3 } from 'three'

const MAX_LIFT = 0.032
const MIN_LIFT = -0.008
const MAX_PROTRACT = 0.028
const MIN_PROTRACT = -0.016
const MAX_TUCK = 0.014

/**
 * Procedural clavicle offset for each shoulder joint in chest-local space.
 * Raising or reaching an arm lifts and protracts the shoulder slightly so the
 * upper arm moves with the torso instead of pivoting like a pinned dowel.
 */
export function applyProceduralClavicles(
  arms: readonly Object3D[],
  restShoulders: readonly Vector3[],
): void {
  for (let index = 0; index < arms.length; index++) {
    const arm = arms[index]
    const rest = restShoulders[index]
    if (!arm || !rest) continue
    const offset = clavicleOffset(arm.rotation.x, rest.x)
    arm.position.set(rest.x + offset[0], rest.y + offset[1], rest.z + offset[2])
  }
}

export function clavicleOffset(
  shoulderPitch: number,
  restX: number,
): readonly [number, number, number] {
  const reach = -shoulderPitch
  const lift = clamp(reach * 0.014, MIN_LIFT, MAX_LIFT)
  const protract = clamp(reach * 0.016, MIN_PROTRACT, MAX_PROTRACT)
  const overhead = Math.max(0, reach - 1.3)
  const tuck = Math.min(MAX_TUCK, overhead * 0.012)
  const inward = restX === 0 ? 0 : -Math.sign(restX) * tuck
  return [inward, lift, protract]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
