import type { Euler, Object3D } from 'three'
import { keepHumanJointMotion } from './humanJointMotion'

type Range = readonly [number, number]

interface JointRange {
  x: Range
  y: Range
  /** Outward swing for side-dependent joints, plain z otherwise. */
  z: Range
  sided?: boolean
}

export const HUMAN_JOINT_LIMITS = {
  // Neck: about 45° down, 40° up, 75° either side, 35° ear to shoulder.
  head: { x: [-0.8, 0.7], y: [-1.3, 1.3], z: [-0.6, 0.6] },
  // Spine above the belt: about 80° forward, 35° back, 57° twist, 35° side bend.
  chest: { x: [-0.6, 1.4], y: [-1, 1], z: [-0.6, 0.6] },
  // Flexion up past vertical, ~60° extension, humeral twist, adduction across the chest.
  shoulder: { x: [-3.3, 1.1], y: [-1.4, 1.4], z: [-1.3, 3], sided: true },
  // A hinge: it folds forward to ~150° and never past straight.
  elbow: { x: [-2.6, 0], y: [-0.6, 0.6], z: [-0.1, 0.1] },
  // Flexion/extension ~75°, forearm roll, radial/ulnar deviation ~40°.
  wrist: { x: [-1.35, 1.25], y: [-1, 1], z: [-0.7, 0.7] },
  // High kick ~140°, extension ~40°, leg twist ~45°, wide split but little crossing.
  hip: { x: [-2.4, 0.7], y: [-0.8, 0.8], z: [-0.45, 1.5], sided: true },
  // A hinge: it folds backward to ~150° and never past straight.
  knee: { x: [0, 2.6], y: [-0.1, 0.1], z: [-0.1, 0.1] },
  // Pointing and lifting the foot, a little twist and roll: never a turned foot.
  ankle: { x: [-0.9, 0.9], y: [-0.35, 0.35], z: [-0.35, 0.35] },
} as const satisfies Record<string, JointRange>

function clamp(value: number, [low, high]: Range): number {
  // Euler extraction returns +/-pi branches of the same rotation. An arm at
  // +178 degrees is also at -182 degrees; clamping the former to +63 degrees
  // created a sudden shoulder reversal although the latter is in range.
  if (value >= low && value <= high) return value
  const centre = (low + high) / 2
  const equivalent = value + Math.round((centre - value) / (Math.PI * 2)) * Math.PI * 2
  return Math.min(high, Math.max(low, equivalent))
}

export function limitEuler(rotation: Euler, range: JointRange, side: 1 | -1): void {
  const outward = range.sided ? side : 1
  const x = clamp(rotation.x, range.x)
  // Axial play closes near extension; a straight supporting knee must not
  // retain the twist allowed to a flexed leg. Stay within the rig's envelope.
  const twist =
    range === HUMAN_JOINT_LIMITS.knee ? 0.02 + 0.08 * Math.min(1, x / (Math.PI / 2)) : Infinity
  const y = Math.min(twist, Math.max(-twist, clamp(rotation.y, range.y)))
  const z = clamp(rotation.z * outward, range.z) * outward
  if (x !== rotation.x || y !== rotation.y || z !== rotation.z) rotation.set(x, y, z)
}

/** Constrain a named articulated joint; feet may supply their anatomical name. */
export function keepHumanJoint(part: Object3D, kind = part.name.split('-')[0]): void {
  const key = kind === 'fight' ? 'chest' : kind
  if (!(key in HUMAN_JOINT_LIMITS)) return
  limitEuler(
    part.rotation,
    HUMAN_JOINT_LIMITS[key as keyof typeof HUMAN_JOINT_LIMITS],
    part.name.endsWith('-left') ? -1 : 1,
  )
  keepHumanJointMotion(part, key)
}
