import { Mesh, ShaderMaterial } from 'three'
import type { Object3D } from 'three'

function snapshot(root: Object3D) {
  const nodes: Object3D[] = []
  root.traverse((node) => nodes.push(node))
  return nodes.map((node) => ({
    node,
    position: node.position.clone(),
    rotation: node.quaternion.clone(),
    scale: node.scale.clone(),
  }))
}
const poses = new WeakMap<Object3D, ReturnType<typeof snapshot>>()

/** The corpse keeps exactly one pose throughout the eye opening; no standing or victory animation. */
export function freezeCamillaPortrait(root: Object3D) {
  const original = snapshot(root)
  const held = poses.get(root) ?? original
  poses.set(root, held)
  const apply = (pose: typeof held) =>
    pose.forEach(({ node, position, rotation, scale }) => {
      node.position.copy(position)
      node.quaternion.copy(rotation)
      node.scale.copy(scale)
    })
  apply(held)
  const clocks = new Map<{ value: number }, number>()
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.name.startsWith('nen-')) return
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      if (!(material instanceof ShaderMaterial)) continue
      const clock = material.uniforms.u_time
      if (!clock || clocks.has(clock)) continue
      clocks.set(clock, clock.value)
      clock.value = 0
    }
  })
  root.updateWorldMatrix(true, true)
  return () => {
    apply(original)
    clocks.forEach((value, clock) => {
      clock.value = value
    })
    root.updateWorldMatrix(true, true)
  }
}
