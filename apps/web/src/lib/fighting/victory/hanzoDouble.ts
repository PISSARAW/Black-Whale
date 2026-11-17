import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import type { VictoryContext } from './types'
import { victoryActor, resetVictoryActor } from './actors'

/** A second complete native Hanzo; only its private materials flicker or become translucent. */
export function createHanzoVictoryDouble() {
  let model: ReturnType<typeof buildFightFigure> | undefined
  const materials = new Set<THREE.Material>()
  const styles: Array<{ material: THREE.Material; opacity: number; color?: THREE.Color }> = []
  const glow = (color: number, opacity = 1) => {
    const material = new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
    materials.add(material)
    return material
  }
  return {
    get(context: VictoryContext) {
      if (!model) {
        model = buildFightFigure({
          THREE,
          glow,
          fighter: { ...context.state[context.frame.winner], hanzoProjection: undefined },
        })
        model.root.name = 'hanzo-victory-astral-double'
        model.root.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return
          const list = Array.isArray(node.material) ? node.material : [node.material]
          list.forEach((material) => materials.add(material))
        })
        materials.forEach((material) =>
          styles.push({
            material,
            opacity: material.opacity,
            color: 'color' in material ? (material.color as THREE.Color).clone() : undefined,
          }),
        )
      }
      const actor = victoryActor(model.root, 'hanzo')
      resetVictoryActor(actor, () => {})
      model.root.position.set(0, 0, 0)
      model.root.rotation.set(0, -1.15, 0)
      return actor
    },
    style(opacity: number, phase: boolean) {
      styles.forEach(({ material, opacity: base, color }) => {
        material.opacity =
          base * opacity * (opacity < 0.99 && material.side === THREE.BackSide ? 0 : 1)
        material.transparent = opacity < 0.99 || base < 1
        material.depthWrite = opacity >= 0.99
        material.depthTest = !phase
        if (color && 'color' in material)
          (material.color as THREE.Color)
            .copy(color)
            .lerp(new THREE.Color(0xb3dee7), phase ? 0.38 : 0.08)
      })
    },
    dispose() {
      model?.root.removeFromParent()
      model?.root.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        if (!node.geometry.userData.sharedHuman) node.geometry.dispose()
        if (node instanceof THREE.InstancedMesh) node.dispose()
      })
      materials.forEach((material) => material.dispose())
    },
  }
}
