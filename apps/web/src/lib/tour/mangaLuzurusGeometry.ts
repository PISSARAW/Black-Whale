import type { HumanHeadBuild } from './humanHead'

/** The same rectangular skull is used by the skin and the closely swept scalp. */
export function luzurusSkullGeometry(THREE: HumanHeadBuild['THREE']) {
  const profile = [
    [0, -0.215],
    [0.087, -0.215],
    [0.112, -0.189],
    [0.139, -0.12],
    [0.154, -0.045],
    [0.157, 0.04],
    [0.15, 0.13],
    [0.128, 0.19],
    [0.087, 0.23],
    [0, 0.245],
  ]
  const sections = profile.flatMap(([r, y], index) => {
    if (index === 0) return [new THREE.Vector2(r, y)]
    const [previousRadius, previousY] = profile[index - 1]
    return Array.from({ length: 8 }, (_, step) => {
      const t = (step + 1) / 8
      return new THREE.Vector2(
        previousRadius + (r - previousRadius) * t,
        previousY + (y - previousY) * t,
      )
    })
  })
  const made = new THREE.LatheGeometry(sections, 40)
  const positions = made.getAttribute('position')
  for (let i = 0; i < positions.count; i++) {
    const z = positions.getZ(i)
    positions.setZ(i, z > 0 ? Math.min(0.171, z * 1.32) : z * 0.93)
  }
  made.computeVertexNormals()
  return made
}
