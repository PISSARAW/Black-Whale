import { Quaternion, Vector3 } from 'three'
import type { FightRig } from './fightRig'

const LANE_ROLL_AXIS = new Vector3(0, 0, 1)

/** Articulate at the waist when both planted feet trail the torso in the same direction. */
export function balanceGroundedTorso(rig: FightRig): void {
  const { human, chest, waist } = rig
  const pivot = human.figure.localToWorld(new Vector3(0, waist, 0))
  const [left, right] = rig.ankles.map((ankle) => ankle.getWorldPosition(new Vector3()))
  const center = human.arms[0]
    .getWorldPosition(new Vector3())
    .lerp(human.arms[1].getWorldPosition(new Vector3()), 0.5)
    .sub(pivot)
  if (center.y <= 0) return
  const direction = Math.sign(center.x)
  const trail = Math.min((pivot.x - left.x) * direction, (pivot.x - right.x) * direction)
  const unsupported = smoothUnit((trail / center.y - 0.18) / 0.36)
  const roll = Math.atan2(center.x, center.y)
  const excess = Math.max(0, Math.abs(roll) - 0.12) * direction
  if (unsupported === 0 || excess === 0) return

  const figureRotation = human.figure.getWorldQuaternion(new Quaternion())
  const worldRoll = new Quaternion().setFromAxisAngle(LANE_ROLL_AXIS, excess * unsupported)
  chest.quaternion.premultiply(
    figureRotation.clone().invert().multiply(worldRoll).multiply(figureRotation),
  )
  // Keep the anatomical waist pivot fixed while the upper body counterbalances.
  chest.position.set(0, waist, 0).applyQuaternion(chest.quaternion).multiplyScalar(-1)
  chest.position.y += waist
}

function smoothUnit(value: number): number {
  const progress = Math.max(0, Math.min(1, value))
  return progress * progress * (3 - 2 * progress)
}
