import type { Three } from './silentMajorityParts'
import { mergeHumanDetails } from './humanDetailGeometry'

/** A side lock has a rounded edge and an uneven tip rather than a box silhouette. */
export function hairLockGeometry(THREE: Three) {
  const lock = new THREE.Shape()
  lock.moveTo(-0.06, 0.18)
  lock.lineTo(0.045, 0.18)
  lock.quadraticCurveTo(0.074, 0.04, 0.054, -0.15)
  lock.lineTo(0.025, -0.2)
  lock.lineTo(0.003, -0.172)
  lock.lineTo(-0.034, -0.205)
  lock.quadraticCurveTo(-0.07, -0.04, -0.06, 0.18)
  const made = new THREE.ExtrudeGeometry(lock, {
    depth: 0.14,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 1,
    steps: 1,
    curveSegments: 4,
  })
  made.translate(0, 0, -0.07)
  return made
}

/** Curved parting lines follow the shell, with one merged draw per hairstyle. */
export function hairFlowGeometry(THREE: Three) {
  const parts = []
  for (let strand = 0; strand < 9; strand++) {
    const phi = (strand / 9) * Math.PI * 2
    const points = []
    for (let step = 0; step <= 8; step++) {
      const theta = 0.22 + (step / 8) * 0.91
      const sweep = phi + 0.12 * Math.sin(theta)
      points.push(
        new THREE.Vector3(
          -0.198 * Math.cos(sweep) * Math.sin(theta),
          0.198 * Math.cos(theta),
          0.198 * Math.sin(sweep) * Math.sin(theta),
        ),
      )
    }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 8, 0.0012, 3, false))
  }
  return mergeHumanDetails(parts)
}
