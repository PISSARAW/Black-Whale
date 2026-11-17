import { Color, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import type { Material } from 'three'
import type { VictoryContext } from './types'
import type { ShizukuVictoryPose } from './shizukuPose'
import { SHIZUKU_CLEAN, SHIZUKU_CONSUMED, SHIZUKU_DEATH } from './shizukuPose'
import { ease } from './resources'

export function createShizukuAbsorption() {
  const materials = new Map<Material, MeshBasicMaterial>()
  return {
    sync(context: VictoryContext, pose: ShizukuVictoryPose, mouth: Vector3) {
      const { victim, age } = context
      const next = (source: Material) => {
        if (!(source instanceof MeshBasicMaterial)) return source
        const material =
          materials.get(source) ??
          new MeshBasicMaterial({
            side: source.side,
            transparent: source.transparent,
            opacity: source.opacity,
            depthWrite: source.depthWrite,
            blending: source.blending,
          })
        materials.set(source, material)
        const colour = (source as MeshBasicMaterial).color ?? new Color(0x777777)
        material.color.copy(colour).lerp(new Color(0xaaa3a2), pose.drain * 0.6)
        return material
      }
      victim.root.traverse((node) => {
        if (!(node instanceof Mesh)) return
        context.material(
          node,
          Array.isArray(node.material) ? node.material.map(next) : next(node.material),
        )
      })
      const absorption = ease((age - SHIZUKU_CLEAN) / (SHIZUKU_CONSUMED - SHIZUKU_CLEAN))
      if (age < SHIZUKU_DEATH) return absorption
      victim.root.traverse((node) => {
        if (
          !node.userData.visitModel &&
          !['shizuku-blinky', 'chrollo-open-book', 'chrollo-closed-book'].includes(node.name)
        )
          return
        context.save(node)
        node.visible = false
      })
      if (absorption > 0) {
        victim.root.scale.multiplyScalar(1 - absorption * 0.995)
        victim.root.updateWorldMatrix(true, true)
        const scaled = pose.collapse
          .clone()
          .sub(victim.root.position)
          .multiplyScalar(1 - absorption * 0.995)
          .add(victim.root.position)
        const destination = pose.collapse.clone().lerp(mouth, absorption)
        victim.root.position.add(destination.sub(scaled))
      }
      victim.root.visible = age < SHIZUKU_CONSUMED
      return absorption
    },
    dispose() {
      materials.forEach((material) => material.dispose())
      materials.clear()
    },
  }
}
