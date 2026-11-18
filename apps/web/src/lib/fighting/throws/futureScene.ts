import type { Group, Material, Mesh } from 'three'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'

/** Only a real diverging forecast supplies the position of this remembered body. */
export function createThrowFuture(options: EffectSceneOptions) {
  let ghost: Group | null = null,
    sequence = -1
  const materials = new Set<Material>()
  function dispose() {
    ghost?.removeFromParent()
    ghost = null
    materials.forEach((material) => material.dispose())
    materials.clear()
  }
  return {
    hide: () => {
      if (ghost) ghost.visible = false
    },
    sync(frame: ThrowCinematicFrame) {
      if (options.viewer?.() !== frame.attacker) return
      if (!frame.future || options.comfort?.().flashes === false) return
      const source = options.figureOf?.(frame.attacker)
      if (!source) return
      if (!ghost || sequence !== frame.sequence) {
        dispose()
        sequence = frame.sequence
        ghost = source.clone(true) as Group
        ghost.name = 'throw-signature:predicted-body'
        ghost.traverse((node) => {
          const mesh = node as Mesh
          if (!mesh.isMesh) return
          mesh.material = [mesh.material].flat().map((material) => {
            const own = material.clone()
            own.transparent = true
            own.opacity = 0.2
            own.depthWrite = false
            materials.add(own)
            return own
          })
          mesh.castShadow = false
        })
        options.scene.add(ghost)
        const parent = source.parent!
        ghost.quaternion
          .copy(parent.getWorldQuaternion(new options.THREE.Quaternion()))
          .multiply(source.quaternion)
        ghost.scale.copy(source.getWorldScale(new options.THREE.Vector3()))
      }
      ghost.visible = frame.age / frame.duration < 0.6
      ghost.position.set(options.worldX(frame.future.x), options.worldY(frame.future.y) + 0.15, 0)
    },
    dispose,
  }
}
