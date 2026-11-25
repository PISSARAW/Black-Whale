import type { BufferGeometry, Mesh } from 'three'
import type { HumanFigureBuild } from '../humanFigure'

const CACHE = new WeakMap<BufferGeometry, BufferGeometry>()

/** A curved lip keeps its authored tube topology instead of being treated as a flat polygon. */
export function prepareCurveExpressionMouth(options: {
  THREE: HumanFigureBuild['THREE']
  mouth: Mesh
}) {
  const { THREE, mouth } = options
  const source = mouth.geometry
  let geometry = CACHE.get(source)
  if (!geometry) {
    geometry = source.clone()
    geometry.userData.sharedHuman = true
    geometry.morphTargetsRelative = true
    const position = geometry.getAttribute('position')
    geometry.computeBoundingBox()
    const halfWidth = Math.max(0.001, geometry.boundingBox!.max.x)
    geometry.morphAttributes.position = [0, 1, 2].map((kind) => {
      const delta = new Float32Array(position.count * 3)
      const curve = [-0.003, 0.013, -0.008][kind]
      for (let i = 0; i < position.count; i++) {
        const edge = position.getX(i) / halfWidth
        delta[i * 3] = edge * (kind === 1 ? 0.003 : 0.001)
        delta[i * 3 + 1] = (1 - Math.min(1, edge * edge)) * curve
      }
      return new THREE.Float32BufferAttribute(delta, 3)
    })
    geometry.computeBoundingSphere()
    CACHE.set(source, geometry)
  }
  mouth.geometry = geometry
  mouth.updateMorphTargets()
}
