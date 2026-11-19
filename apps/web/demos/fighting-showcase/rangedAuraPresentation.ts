import type { Object3D, Scene } from 'three'

/** Resting Ten remains in the HUD; omit its duplicate outline in this presentation. */
export function presentRangedAura(scene: Scene) {
  const held: Object3D[] = []
  scene.traverse((node) => {
    if (node.name === 'nen-skin-ten' && node.visible) {
      held.push(node)
      node.visible = false
    }
  })
  return () => held.forEach((node) => (node.visible = true))
}
