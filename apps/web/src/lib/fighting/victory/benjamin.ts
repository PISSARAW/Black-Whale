import { Mesh } from 'three'
import type { Material, ShaderMaterial } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createBenjaminBatonScene } from './benjaminBatonScene'
import { createBenjaminPressure, benjaminDisperseMaterial } from './benjaminPressure'
import { benjaminVictoryPose, benjaminVictoryCamera } from './benjaminPose'
import { disposeVictoryObject, ease } from './resources'

function disperseTarget(context: VictoryContext, cache: Map<Material, ShaderMaterial>) {
  if (context.age < 270) return
  const progress = ease((context.age - 278) / 55)
  context.victim.root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const replace = (source: Material) => {
      const next = cache.get(source) ?? benjaminDisperseMaterial(source)
      cache.set(source, next)
      next.uniforms.progress.value = progress
      return next
    }
    context.material(
      node,
      Array.isArray(node.material) ? node.material.map(replace) : replace(node.material),
    )
  })
}
/** Cinematic exaggeration after the verdict; Baton never acquires the victim's Hatsu. */
export function createBenjaminVictory(): VictoryDriver {
  const baton = createBenjaminBatonScene(),
    pressure = createBenjaminPressure()
  const materials = new Map<Material, ShaderMaterial>()
  return {
    update(context) {
      const pose = benjaminVictoryPose(context)
      disperseTarget(context, materials)
      benjaminVictoryCamera(context, pose)
      baton.sync({ context, palm: pose.palm })
      pressure.sync({ context, ...pose })
      context.add(baton.root)
      context.add(pressure.root)
      context.scene.userData.benjaminVictory = {
        anatomicalHand: 'left',
        palm: pose.palm.toArray(),
        impact: pose.target.toArray(),
        salute: pose.salute,
      }
      context.defer(() => {
        delete context.scene.userData.benjaminVictory
      })
    },
    dispose() {
      disposeVictoryObject(baton.root)
      disposeVictoryObject(pressure.root)
      materials.forEach((material) => material.dispose())
      materials.clear()
    },
  }
}
