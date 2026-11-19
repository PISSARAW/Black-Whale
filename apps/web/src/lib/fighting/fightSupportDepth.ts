import { Vector3 } from 'three'
import type { FightRig } from './fightRig'

/** Preserve the authored low pelvis before foot IK: a fixed sole must not straighten an entire crouch. */
export function preserveSupportDepth(
  rig: FightRig,
  targets: Vector3[],
  options: { kicking?: number; allowExtension?: boolean } = {},
): void {
  const planted = [0, 1].filter((index) => index !== options.kicking)
  const drop = Math.max(
    ...planted.map((index) =>
      kneeDepthDrop(rig, targets[index], {
        index,
        allowExtension: options.allowExtension,
      }),
    ),
  )
  if (drop <= 1e-6) return
  const figure = rig.human.figure,
    parent = figure.parent
  if (!parent) return
  const position = figure.getWorldPosition(new Vector3())
  position.y -= Math.min(0.4, drop)
  figure.position.copy(parent.worldToLocal(position))
  figure.updateWorldMatrix(false, false)
}

function kneeDepthDrop(
  rig: FightRig,
  target: Vector3,
  { index, allowExtension }: { index: number; allowExtension?: boolean },
): number {
  const hip = rig.human.legs[index].getWorldPosition(new Vector3())
  const sole = rig.ankles[index].getWorldPosition(new Vector3())
  // Measure the actual authored reach: the shoe offset and scaled thigh make
  // a second cosine-law estimate from the knee angle a different triangle.
  const reachSquared = hip.distanceToSquared(sole)
  // An old world-space anchor may trail behind a lunge. That extra horizontal
  // distance must extend/replant the leg, not manufacture a deeper crouch.
  const horizontal = Math.min(
    (hip.x - target.x) ** 2 + (hip.z - target.z) ** 2,
    allowExtension ? (hip.x - sole.x) ** 2 + (hip.z - sole.z) ** 2 : Infinity,
  )
  const vertical = Math.sqrt(Math.max(0.01, reachSquared - horizontal))
  return Math.max(0, hip.y - target.y - vertical)
}
