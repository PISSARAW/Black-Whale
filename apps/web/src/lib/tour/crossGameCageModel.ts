import type { BasicApparitionContext } from './apparitionBasicView'

/** A closed white lattice volume, shared by the reference preview and the duel effect. */
export function buildCrossGameCage(
  THREE: BasicApparitionContext['THREE'],
  dimensions = { width: 1.65, height: 2.5, depth: 1.25 },
) {
  const { width, height, depth } = dimensions
  const points: number[] = []
  const segment = (a: readonly number[], b: readonly number[]) => points.push(...a, ...b)
  for (const side of [-1, 1]) {
    for (let i = 0; i <= 8; i++) {
      const x = -width / 2 + (i * width) / 8
      segment([x, -height / 2, (side * depth) / 2], [x, height / 2, (side * depth) / 2])
    }
    for (let i = 0; i <= 12; i++) {
      const y = -height / 2 + (i * height) / 12
      segment([-width / 2, y, (side * depth) / 2], [width / 2, y, (side * depth) / 2])
      segment([(side * width) / 2, y, -depth / 2], [(side * width) / 2, y, depth / 2])
    }
    for (let i = 0; i <= 6; i++) {
      const z = -depth / 2 + (i * depth) / 6
      segment([(side * width) / 2, -height / 2, z], [(side * width) / 2, height / 2, z])
      segment([-width / 2, (side * height) / 2, z], [width / 2, (side * height) / 2, z])
    }
    for (let i = 0; i <= 8; i++) {
      const x = -width / 2 + (i * width) / 8
      segment([x, (side * height) / 2, -depth / 2], [x, (side * height) / 2, depth / 2])
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  const material = new THREE.LineBasicMaterial({
    color: 0xf1f0e9,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
  })
  const cage = new THREE.LineSegments(geometry, material)
  cage.name = 'cross-game-cubic-lattice'
  return cage
}
