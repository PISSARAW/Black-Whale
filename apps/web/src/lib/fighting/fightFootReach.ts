import { Quaternion, Vector3 } from 'three'
import type { LimbChain } from './fightLimbReach'
import { constrainCombatJoint } from './fightAnatomy'

const AXIS = new Vector3(1, 0, 0)
const MAX_KNEE = 2.6

/**
 * A supporting knee is a hinge. Solve in the hip parent's space, including
 * the rig's nonuniform leg scale and the shoe's offset from the shin axis.
 * World-space bone lengths alone cannot reconstruct that scaled triangle.
 */
export function reachFightFoot(
  chain: LimbChain,
  target: Vector3,
  options: { preferredKnee?: number; kneeTravel?: number } = {},
): number {
  const { root, hinge, end } = chain
  const preferredKnee = options.preferredKnee ?? hinge.rotation.x
  const kneeTravel = options.kneeTravel ?? Infinity
  const before = end.getWorldPosition(new Vector3()).distanceTo(target)
  if (!root.parent || (before < 0.0001 && Math.abs(hinge.rotation.x - preferredKnee) <= kneeTravel))
    return before
  const goal = root.parent.worldToLocal(target.clone()).sub(root.position)
  if (goal.lengthSq() < 1e-10) return before
  const hip = root.quaternion.clone(),
    knee = hinge.quaternion.clone()
  const lower = end.position.clone().multiply(hinge.scale)
  const offset = (angle: number) =>
    lower.clone().applyAxisAngle(AXIS, angle).add(hinge.position).multiply(root.scale)
  const length = (angle: number) => {
    const c = Math.cos(angle),
      s = Math.sin(angle)
    return Math.hypot(
      (hinge.position.x + lower.x) * root.scale.x,
      (hinge.position.y + lower.y * c - lower.z * s) * root.scale.y,
      (hinge.position.z + lower.y * s + lower.z * c) * root.scale.z,
    )
  }
  let angle = kneeAngle(length, goal.length(), preferredKnee)
  // Millimetres of sole drift do not justify switching a nearly straight knee
  // to the other valid triangle branch. Ease small corrections into the pose.
  const p = Math.min(1, before / 0.008)
  angle = hinge.rotation.x + (angle - hinge.rotation.x) * p * p * (3 - 2 * p)
  angle = continuousKnee(angle, { preferredKnee, kneeTravel })
  hinge.rotation.set(angle, 0, 0)
  const from = offset(angle).applyQuaternion(hip).normalize()
  root.quaternion.premultiply(new Quaternion().setFromUnitVectors(from, goal.normalize()))
  constrainCombatJoint(root, 'hip')
  const error = end.getWorldPosition(new Vector3()).distanceTo(target)
  // Keep the authored pose when a limit would increase error beyond sole tolerance.
  if (error > Math.max(before + 0.0001, 0.003)) {
    root.quaternion.copy(hip)
    hinge.quaternion.copy(knee)
    return before
  }
  return error
}

function continuousKnee(
  angle: number,
  input: { preferredKnee: number; kneeTravel: number },
): number {
  if (Math.max(angle, input.preferredKnee) >= 0.5) return angle
  return Math.max(
    input.preferredKnee - input.kneeTravel,
    Math.min(input.preferredKnee + input.kneeTravel, angle),
  )
}

function kneeAngle(length: (angle: number) => number, distance: number, current: number): number {
  // The offset shoe puts maximum extension just above zero knee flexion.
  let low = 0,
    high = MAX_KNEE
  for (let i = 0; i < 20; i++) {
    const a = low + (high - low) / 3,
      b = high - (high - low) / 3
    if (length(a) < length(b)) low = a
    else high = b
  }
  const peak = (low + high) / 2
  if (distance >= length(peak)) return peak
  const candidates: number[] = []
  for (const [a, b] of [
    [0, peak],
    [peak, MAX_KNEE],
  ]) {
    const ascending = length(a) < length(b)
    if (distance < Math.min(length(a), length(b)) || distance > Math.max(length(a), length(b)))
      continue
    let left = a,
      right = b
    for (let i = 0; i < 20; i++) {
      const middle = (left + right) / 2
      if (length(middle) < distance === ascending) left = middle
      else right = middle
    }
    candidates.push((left + right) / 2)
  }
  return candidates.length
    ? candidates.reduce((best, angle) =>
        Math.abs(angle - current) < Math.abs(best - current) ? angle : best,
      )
    : MAX_KNEE
}
