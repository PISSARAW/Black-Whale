import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightState } from './types'

/** Physical flames mark the target of the written condition, never a permanent aura buff. */
export function createBashoFireScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const geometry = new THREE.ConeGeometry(0.15, 0.65, 5)
  const material = new THREE.MeshBasicMaterial({ color: 0xff821e, transparent: true, opacity: 0.8 })
  const flames = ['player', 'opponent'].flatMap(() =>
    Array.from({ length: 5 }, () => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.visible = false
      scene.add(mesh)
      return mesh
    }),
  )
  return {
    sync: (state: FightState, seconds: number) => {
      flames.forEach((flame, index) => {
        const fighter = index < 5 ? state.player : state.opponent
        flame.visible = Boolean(fighter.bashoBurn)
        if (!flame.visible) return
        const phase = seconds * 11 + index * 1.7
        flame.position.set(
          options.worldX(fighter.x) + Math.sin(index * 2.3) * 0.28,
          options.worldY(fighter.y) + 0.35 + (index % 5) * 0.24 + Math.sin(phase) * 0.07,
          0.3,
        )
        flame.scale.setScalar(0.7 + (Math.sin(phase) + 1) * 0.25)
      })
    },
    dispose: () => {
      flames.forEach((flame) => scene.remove(flame))
      geometry.dispose()
      material.dispose()
    },
  }
}
