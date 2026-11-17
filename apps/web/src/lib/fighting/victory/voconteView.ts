import { Mesh, Raycaster, Vector3 } from 'three'
import type { VictoryContext } from './types'

/** Tall arena shots look past foreground roof panels; every hidden mesh is restored. */
export function clearVoconteView(context: VictoryContext) {
  const origin = context.camera.getWorldPosition(new Vector3()),
    hidden = new Set<Mesh>()
  const targets = [context.hero.head, context.victim.head].map((node) =>
    node.getWorldPosition(new Vector3()),
  )
  targets.push(new Vector3(context.centre + 0.8, 0, 0))
  context.scenery.updateWorldMatrix(true, true)
  for (const target of targets) {
    const direction = target.clone().sub(origin),
      distance = direction.length()
    const hits = new Raycaster(
      origin,
      direction.normalize(),
      0,
      Math.max(0, distance - 0.2),
    ).intersectObject(context.scenery, true)
    for (const hit of hits) {
      if (!(hit.object instanceof Mesh) || hidden.has(hit.object)) continue
      hidden.add(hit.object)
      context.save(hit.object)
      hit.object.visible = false
    }
  }
}
