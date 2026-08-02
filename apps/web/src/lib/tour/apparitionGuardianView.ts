import type { Object3D } from 'three'
import { TENTACLES, type Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

function medusa(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const hide = glow(seen.colour, 0.82)
  const canopy = new THREE.Group()
  canopy.name = 'camilla-eye-canopy'
  const rings = [1, 8, 13, 17]
  for (let ring = 0; ring < rings.length; ring++) {
    const count = rings[ring]
    const radius = ring * seen.size * 0.58
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + ring * 0.31
      const pod = new THREE.Group()
      const lobe = new THREE.Mesh(
        new THREE.SphereGeometry(seen.size * (ring === 3 ? 0.37 : 0.4), 10, 7),
        hide,
      )
      lobe.scale.set(1.25, 0.82, 0.92)
      pod.add(lobe)
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(seen.size * 0.055, 7, 5),
        glow(0x171318, 1),
      )
      eye.position.set(0, seen.size * 0.02, -seen.size * 0.37)
      pod.add(eye)
      pod.position.set(
        Math.cos(angle) * radius,
        seen.size * (0.48 - ring * 0.14 + (i % 3) * 0.05),
        Math.sin(angle) * radius * 0.68,
      )
      pod.rotation.y = angle + Math.PI / 2
      canopy.add(pod)
    }
  }
  root.add(canopy)

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.48, seen.size * 0.78, seen.size * 1.85, 12),
    hide,
  )
  body.position.y = -seen.size * 0.75
  root.add(body)

  for (let row = 0; row < 6; row++) {
    for (let i = 0; i < 7; i++) {
      const angle = (Math.PI * 2 * i) / 7 + (row % 2) * 0.35
      const scale = new THREE.Mesh(
        new THREE.SphereGeometry(seen.size * 0.11, 7, 5),
        glow(seen.colour, 0.94),
      )
      scale.scale.set(0.72, 1.25, 0.35)
      scale.position.set(
        Math.cos(angle) * seen.size * 0.51,
        seen.size * (0.02 - row * 0.26),
        Math.sin(angle) * seen.size * 0.51,
      )
      root.add(scale)
    }
  }

  const skirt = new THREE.Group()
  skirt.name = 'camilla-skirt'
  for (let i = 0; i < TENTACLES; i++) {
    const angle = (Math.PI * 2 * i) / TENTACLES
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.42, 9, 6), hide)
    lobe.scale.set(1.35, 0.42, 0.72)
    lobe.position.set(
      Math.cos(angle) * seen.size * 0.7,
      -seen.size * 1.72,
      Math.sin(angle) * seen.size * 0.7,
    )
    lobe.rotation.y = -angle
    skirt.add(lobe)
  }
  root.add(skirt)
  return skirt

}

export function buildGuardianApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  if (seen.kind !== 'medusa') return undefined
  return medusa(seen, context)
}
