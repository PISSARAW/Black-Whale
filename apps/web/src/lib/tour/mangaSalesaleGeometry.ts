import type { HumanHeadBuild } from './humanHead'

export function salesaleSkullGeometry(THREE: HumanHeadBuild['THREE']) {
  const profile = [
    [0, -0.22],
    [0.075, -0.22],
    [0.139, -0.189],
    [0.18, -0.13],
    [0.195, -0.045],
    [0.185, 0.05],
    [0.175, 0.14],
    [0.15, 0.22],
    [0.095, 0.26],
    [0, 0.278],
  ]
  const sections = profile.flatMap(([r, y], index) => {
    if (index === 0) return [new THREE.Vector2(r, y)]
    const [a, b] = profile[index - 1]
    return Array.from({ length: 5 }, (_, step) => {
      const t = (step + 1) / 5
      return new THREE.Vector2(a + (r - a) * t, b + (y - b) * t)
    })
  })
  const shape = new THREE.LatheGeometry(sections, 40)
  const positions = shape.getAttribute('position')
  for (let i = 0; i < positions.count; i++) {
    const z = positions.getZ(i)
    positions.setZ(i, z > 0 ? Math.min(0.174, z * 1.28) : z * 0.94)
  }
  shape.computeVertexNormals()
  return shape
}
