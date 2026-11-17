import { Quaternion, Vector3 } from 'three'
import type { VictoryActor, VictoryContext } from './types'

export function victoryShot(
  context: VictoryContext,
  options: { target: Vector3; offset: Vector3; width: number; height: number },
) {
  const { camera } = context,
    { target, offset, width, height } = options
  const half = Math.tan((camera.fov * Math.PI) / 360) * 0.82
  const required = Math.max(height / (2 * half), width / (2 * half * camera.aspect))
  const distance = Math.max(offset.length(), required)
  camera.up.set(0, 1, 0)
  camera.position.copy(target).addScaledVector(offset.clone().normalize(), distance)
  camera.lookAt(target)
  camera.updateMatrixWorld(true)
}
export function victoryPortrait(context: VictoryContext, actor = context.hero) {
  const centre = actor.head.getWorldPosition(new Vector3())
  const q = actor.head.getWorldQuaternion(new Quaternion())
  const size = Math.max(0.3, actor.height * 0.22)
  const target = centre.clone().add(new Vector3(-0.06, 0, 0.03).applyQuaternion(q))
  victoryShot(context, {
    target,
    offset: new Vector3(0, 0.01, size * 3).applyQuaternion(q),
    width: size * 1.5,
    height: size * 1.35,
  })
}
export function victoryWide(context: VictoryContext, extraHeight = 0) {
  const height = Math.max(context.hero.height, context.victim.height, extraHeight)
  victoryShot(context, {
    target: new Vector3(context.centre, height * 0.5, 0),
    offset: new Vector3(0.25, 0.25, 6),
    width: context.gap + context.hero.width + context.victim.width + 0.6,
    height: height + 0.45,
  })
}
export function victoryActorShot(context: VictoryContext, actor: VictoryActor) {
  const target = actor.head.getWorldPosition(new Vector3())
  target.y -= actor.height * 0.3
  victoryShot(context, {
    target,
    offset: new Vector3(0.3, 0.04, 3.5),
    width: actor.width + 0.8,
    height: actor.height * 0.9,
  })
}
