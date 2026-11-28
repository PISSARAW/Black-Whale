import type { Group, Material } from 'three'
import { graded, type Geometry, type Outlined, type Three } from './silentMajorityParts'

export interface HairBuild {
  THREE: Three
  geometry: Geometry
  outlined: Outlined
  ink: Material
  hair: Material
  head: Group
}

/** Where the fringe is cut: the top of the opening the mask shows through. */
export const FRINGE = 0.04

const RADIUS = 0.245
const CROWN = 0.314
/** Half the opening left for the plate, as an angle about the head's axis. */
const OPENING = 0.5

/**
 * The puppet's hair: one black helmet, not a cap with two boards beside it.
 *
 * A full crown down to the fringe, then a fall that rounds under the jaw
 * with a raised hem beside the collar.
 *
 * Both go through `outlined` although hair and ink are the same black. The
 * inverted hull closes the inside of the wall at oblique angles.
 */
export function addSilentMajorityHair({
  THREE,
  geometry,
  outlined,
  ink,
  hair,
  head,
}: HairBuild): void {
  const crown = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:hair-crown', () => {
      // Bottom to top, so the faces turn outwards.
      const points = []
      for (let i = 0; i <= 12; i += 1) {
        const angle = (i / 12) * (Math.PI / 2)
        const radius = Math.cos(angle) ** 0.68 * RADIUS
        points.push(new THREE.Vector2(radius, FRINGE + Math.sin(angle) * CROWN))
      }
      return graded(THREE, new THREE.LatheGeometry(points, 32), [1, 1])
    }),
    material: hair,
    ink,
    scale: 1.03,
  })
  crown.name = 'silent-hair'
  head.add(crown)

  const fall = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:hair-fall', () => roundHairFall(THREE)),
    material: hair,
    ink,
    scale: 1.03,
  })
  fall.name = 'silent-hair-fall'
  head.add(fall)
}

function roundHairFall(THREE: Three) {
  const profile = new THREE.SplineCurve([
    new THREE.Vector2(0.163, -0.224),
    new THREE.Vector2(0.215, -0.203),
    new THREE.Vector2(0.25, -0.164),
    new THREE.Vector2(0.264, -0.107),
    new THREE.Vector2(0.252, -0.03),
    new THREE.Vector2(RADIUS, FRINGE),
  ])
  const geometry = new THREE.LatheGeometry(
    profile.getPoints(24),
    36,
    OPENING,
    Math.PI * 2 - OPENING * 2,
  )
  const vertices = geometry.getAttribute('position')
  for (let i = 0; i < vertices.count; i += 1) {
    const x = vertices.getX(i)
    const y = vertices.getY(i)
    const z = vertices.getZ(i)
    const depth = z / Math.hypot(x, z)
    const nearCollar = THREE.MathUtils.smoothstep(Math.abs(depth), 0.45, 0.9)
    const nape = THREE.MathUtils.smoothstep(-depth, 0.74, 1)
    const nearHem = 1 - THREE.MathUtils.smoothstep(y, -0.224, -0.13)
    vertices.setY(i, y + nearHem * (0.051 * nearCollar + 0.075 * nape))
  }
  geometry.computeVertexNormals()
  return graded(THREE, geometry, [1, 0.93])
}
