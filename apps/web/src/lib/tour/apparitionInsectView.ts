import type { Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

function insect(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const shell = glow(seen.colour, 0.3)
  const chitin = glow(0x171419, 0.98)
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 14, 10), chitin)
  abdomen.scale.set(1.5, 0.46, 0.92)
  abdomen.position.x = -seen.size * 0.3
  root.add(abdomen)
  // Two rigid wing cases meet along the centre of the back, as on a
  // cockroach; they are not the broad exposed wings of the old fly.
  for (const side of [-1, 1]) {
    const caseWing = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * 0.72, 10, 7),
      glow(0x29222a, 1),
    )
    caseWing.scale.set(1.55, 0.18, 0.54)
    caseWing.position.set(-seen.size * 0.36, seen.size * 0.38, side * seen.size * 0.26)
    root.add(caseWing)
  }
  const pronotum = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.52, 12, 8), chitin)
  pronotum.scale.set(1.05, 0.42, 0.9)
  pronotum.position.set(seen.size * 0.72, seen.size * 0.05, 0)
  root.add(pronotum)
  const head = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.32, 10, 7), chitin)
  head.scale.set(0.82, 0.68, 0.9)
  head.position.set(seen.size * 1.14, -seen.size * 0.16, 0)
  root.add(head)

  const legs = new THREE.Group()
  legs.name = 'little-eye-legs'
  for (let pair = 0; pair < 3; pair++) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group()
      leg.position.set(
        seen.size * (0.62 - pair * 0.62),
        -seen.size * 0.12,
        side * seen.size * 0.44,
      )
      const upper = new THREE.Mesh(
        new THREE.CylinderGeometry(
          seen.size * 0.025,
          seen.size * 0.018,
          seen.size * 0.7,
          5,
        ),
        chitin,
      )
      upper.rotation.x = side * 0.95
      leg.add(upper)
      const lower = new THREE.Mesh(
        new THREE.CylinderGeometry(
          seen.size * 0.018,
          seen.size * 0.01,
          seen.size * 0.72,
          5,
        ),
        chitin,
      )
      lower.position.set(
        seen.size * (0.12 - pair * 0.08),
        -seen.size * 0.27,
        side * seen.size * 0.4,
      )
      lower.rotation.x = side * -0.72
      lower.rotation.z = (pair - 1) * 0.28
      leg.add(lower)
      for (let thorn = 0; thorn < 4; thorn++) {
        const spine = new THREE.Mesh(
          new THREE.ConeGeometry(seen.size * 0.012, seen.size * 0.1, 3),
          chitin,
        )
        spine.position.set(
          seen.size * (0.03 - pair * 0.02),
          -seen.size * (0.12 + thorn * 0.11),
          side * seen.size * (0.18 + thorn * 0.07),
        )
        spine.rotation.x = (side * Math.PI) / 2
        leg.add(spine)
      }
      legs.add(leg)
    }
  }
  root.add(legs)

  for (const side of [-1, 1]) {
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(seen.size * 0.01, seen.size * 0.005, seen.size * 1.55, 4),
      chitin,
    )
    antenna.position.set(seen.size * 1.72, -seen.size * 0.05, side * seen.size * 0.28)
    antenna.rotation.z = -Math.PI / 2.8
    antenna.rotation.x = side * 0.3
    root.add(antenna)
    const palp = new THREE.Mesh(
      new THREE.CylinderGeometry(seen.size * 0.012, seen.size * 0.007, seen.size * 0.28, 4),
      chitin,
    )
    palp.position.set(seen.size * 1.38, -seen.size * 0.38, side * seen.size * 0.12)
    palp.rotation.z = -0.55
    palp.rotation.x = side * 0.35
    root.add(palp)
  }
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 2.1, 10, 8), shell)
  root.add(sphere)
  return legs
}

export function buildInsectApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  if (seen.kind !== 'insect') return undefined
  return insect(seen, context)
}
