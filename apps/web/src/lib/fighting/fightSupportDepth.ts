import { Vector3 } from 'three'
import type { FightRig } from './fightRig'

/** Preserve the authored low pelvis before foot IK: a fixed sole must not straighten an entire crouch. */
export function preserveSupportDepth(rig: FightRig, targets: Vector3[], kicking?: number): void {
  const planted = [0, 1].filter((index) => index !== kicking)
  if (planted.some((index) => Math.abs(rig.human.knees[index].rotation.x) < 0.75)) return
  const drop = Math.max(...planted.map((index) => kneeDepthDrop(rig, index, targets[index])))
  if (drop <= 0.002) return
  const figure = rig.human.figure,
    parent = figure.parent
  if (!parent) return
  const position = figure.getWorldPosition(new Vector3())
  position.y -= Math.min(0.4, drop)
  figure.position.copy(parent.worldToLocal(position))
  figure.updateWorldMatrix(false, true)
}

function kneeDepthDrop(rig: FightRig, index: number, target: Vector3): number {
  const hip = rig.human.legs[index].getWorldPosition(new Vector3())
  const knee = rig.human.knees[index].getWorldPosition(new Vector3())
  const sole = rig.ankles[index].getWorldPosition(new Vector3())
  const a = hip.distanceTo(knee),
    b = knee.distanceTo(sole)
  const flex = Math.min(2.3, Math.abs(rig.human.knees[index].rotation.x))
  const reachSquared = a * a + b * b + 2 * a * b * Math.cos(flex)
  const horizontal = (hip.x - target.x) ** 2 + (hip.z - target.z) ** 2
  const vertical = Math.sqrt(Math.max(0.01, reachSquared - horizontal))
  return Math.max(0, hip.y - target.y - vertical)
}
