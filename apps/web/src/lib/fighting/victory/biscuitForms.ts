import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import type { VictoryContext } from './types'
import { victoryActor, resetVictoryActor, groundVictoryActor } from './actors'
import { ease } from './resources'

export const BISCUIT_REVEAL = 210
export const BISCUIT_IMPACT = 330
export const BISCUIT_RETURN = 420

/** Both authored bodies are presentation models; the winner's native form never changes. */
export function createBiscuitVictoryForms() {
  let forms: ReturnType<typeof buildFightFigure>[] | undefined
  const materials = new Set<THREE.Material>()
  const glow = (color: number, opacity = 1) => {
    const material = new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
    materials.add(material)
    return material
  }
  return {
    sync(context: VictoryContext) {
      const fighter = context.state[context.frame.winner]
      forms ??= [false, true].map((biscuitTrueForm) =>
        buildFightFigure({ THREE, glow, fighter: { ...fighter, biscuitTrueForm } }),
      )
      const original = context.hero
      original.root.visible = false
      const large = context.age >= BISCUIT_REVEAL && context.age < BISCUIT_RETURN
      const model = forms[large ? 1 : 0]
      const actor = victoryActor(model.root, 'biscuit')
      resetVictoryActor(actor, () => {})
      model.root.scale.setScalar(1)
      model.root.position.copy(original.root.position)
      model.root.rotation.set(0, 1.15, 0)
      const growth = large ? 0.58 + ease((context.age - BISCUIT_REVEAL) / 42) * 0.42 : 1
      model.root.scale.multiplyScalar(growth)
      model.root.updateWorldMatrix(true, true)
      const current = victoryActor(model.root, 'biscuit')
      groundVictoryActor(current)
      context.hero = current
      context.add(model.root)
      return { large, growth }
    },
    dispose() {
      // Human geometry belongs to shared caches. Only our materials and private meshes are released.
      forms?.forEach((model) => {
        model.root.removeFromParent()
        model.root.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return
          if (!node.geometry.userData.sharedHuman) node.geometry.dispose()
          const list = Array.isArray(node.material) ? node.material : [node.material]
          list.forEach((material) => materials.add(material))
          if (node instanceof THREE.InstancedMesh) node.dispose()
        })
      })
      materials.forEach((material) => material.dispose())
    },
  }
}
