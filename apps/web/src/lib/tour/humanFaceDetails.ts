import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import type { Three } from './silentMajorityParts'

/** Keep the named eye as parent: closed eyes and Gyo still carry every detail. */
export function addEyeDetails(build: HumanHeadBuild, eye: Mesh): void {
  const { THREE, geometry, glow, materials } = build
  const white = new THREE.Mesh(
    geometry(THREE, 'face:eye-white', () => humanEyeGeometry(THREE).scale(0.81, 0.64, 1)),
    glow(0xf5eee3, 1),
  )
  white.name = 'eye-sclera'
  white.position.z = 0.001
  const pupil = new THREE.Mesh(
    geometry(THREE, 'face:eye-pupil', () => new THREE.CircleGeometry(0.008, 10)),
    materials.ink,
  )
  pupil.name = 'eye-pupil'
  pupil.scale.x = 0.8
  pupil.position.z = 0.002
  eye.add(white, pupil)
}

/** Shapes the chin in the buffer; hair and signatures retain their own coordinates. */
export function humanSkullGeometry(build: HumanHeadBuild) {
  const { THREE, profile } = build
  const skull = new THREE.SphereGeometry(0.19, 16, 12)
  const positions = skull.getAttribute('position')
  const taper = { square: 0.12, round: 0.2, narrow: 0.3 }[profile.face]
  for (let i = 0; i < positions.count; i++) {
    const lower = Math.max(0, -positions.getY(i) / 0.19)
    positions.setX(i, positions.getX(i) * (1 - taper * lower))
  }
  skull.computeVertexNormals()
  return skull
}

export function addFaceDetails(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, profile, seen, glow } = build
  // Morena's scars and the puppet's mask supply their own facial drawing.
  if (seen.human?.role === 'morena' || seen.human?.role === 'silent-majority') return
  const relief = new THREE.Mesh(
    geometry(THREE, 'face:relief', () =>
      mergeHumanDetails([
        new THREE.SphereGeometry(0.016, 8, 6).scale(0.6, 2.7, 0.7).translate(0, 0.003, 0.176),
        new THREE.SphereGeometry(0.028, 8, 6).scale(0.95, 0.32, 0.24).translate(0, -0.107, 0.165),
      ]),
    ),
    materials.skin,
  )
  relief.name = 'face-relief'
  head.add(relief)

  const earShade = new THREE.Color(profile.skin).multiplyScalar(0.67).getHex()
  const ears = new THREE.Mesh(
    geometry(THREE, 'face:inner-ears', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          new THREE.SphereGeometry(0.018, 8, 6)
            .scale(0.55, 1.45, 0.65)
            .translate(side * 0.198, 0, 0.022),
        ),
      ),
    ),
    glow(earShade, 1),
  )
  ears.name = 'face-inner-ears'
  head.add(ears)
}

/** Almond outline, shared by the white and the eyelid instead of rectangular stamps. */
export function humanEyeGeometry(THREE: Three) {
  const eye = new THREE.Shape()
  eye.moveTo(-0.03, -0.002)
  eye.quadraticCurveTo(0, 0.024, 0.03, 0.002)
  eye.quadraticCurveTo(0, -0.021, -0.03, -0.002)
  return new THREE.ShapeGeometry(eye, 6)
}
