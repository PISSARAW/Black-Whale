import { Mesh, ShaderMaterial } from 'three'
import type { Material, Object3D } from 'three'

/** Quiet Nen rim for the resurrection portrait; facial features stay free of additive shells. */
export function softenCamillaPortrait(root: Object3D, head: Object3D) {
  const restores: Array<() => void> = []
  const touched = new Set<Material>()
  let suppressedFaceMeshes = 0
  head.traverse((node) => {
    if (!node.name.startsWith('nen-')) return
    const visible = node.visible
    node.visible = false
    suppressedFaceMeshes++
    restores.push(() => {
      node.visible = visible
    })
  })
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.name.startsWith('nen-')) return
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      if (touched.has(material)) continue
      touched.add(material)
      if (material instanceof ShaderMaterial && material.uniforms.u_opacity) {
        const opacity = material.uniforms.u_opacity.value
        const inflate = material.uniforms.u_inflate?.value
        material.uniforms.u_opacity.value = opacity * 0.08
        if (inflate !== undefined) material.uniforms.u_inflate.value = inflate * 0.3
        restores.push(() => {
          material.uniforms.u_opacity.value = opacity
          if (inflate !== undefined) material.uniforms.u_inflate.value = inflate
        })
      } else {
        const opacity = material.opacity
        material.opacity *= 0.08
        restores.push(() => {
          material.opacity = opacity
        })
      }
    }
  })
  return {
    suppressedFaceMeshes,
    auraMultiplier: 0.08,
    restore: () => restores.reverse().forEach((restore) => restore()),
  }
}
