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

interface ChimeraFootContext {
  THREE: BasicApparitionContext['THREE']
  leg: import('three').Group
  dark: import('three').MeshBasicMaterial
}

function addChimeraFoot(seen: Apparition, context: ChimeraFootContext, front: number) {
  const { THREE, leg, dark } = context
  const geometry =
    front < 0
      ? new THREE.SphereGeometry(seen.size * 0.16, 8, 6)
      : new THREE.BoxGeometry(seen.size * 0.18, seen.size * 0.14, seen.size * 0.42)
  const foot = new THREE.Mesh(geometry, dark)
  foot.position.set(0, -seen.size * 1.42, front < 0 ? seen.size * 0.08 : 0)
  leg.add(foot)
  if (front >= 0) return
  for (let claw = 0; claw < 3; claw++) {
    const talon = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.04, seen.size * 0.24, 4),
      dark,
    )
    talon.rotation.x = Math.PI / 2
    talon.position.set((claw - 1) * seen.size * 0.1, -seen.size * 1.45, seen.size * 0.24)
    leg.add(talon)
  }
}

function chimera(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const coat = glow(seen.colour, 0.78)
  const dark = glow(0x1b151d, 0.98)
  const barrel = new THREE.Mesh(
    new THREE.CapsuleGeometry(seen.size * 0.58, seen.size * 1.12, 5, 12),
    coat,
  )
  barrel.rotation.z = Math.PI / 2
  barrel.position.y = seen.size * 0.48
  barrel.scale.set(1, 1.08, 1.18)
  root.add(barrel)
  for (const front of [-1, 1]) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group()
      const upper = new THREE.Mesh(
        new THREE.CapsuleGeometry(seen.size * 0.14, seen.size * 0.72, 4, 7),
        coat,
      )
      upper.position.y = -seen.size * 0.3
      leg.add(upper)
      const shin = new THREE.Mesh(
        new THREE.CylinderGeometry(seen.size * 0.1, seen.size * 0.06, seen.size * 0.78, 7),
        coat,
      )
      shin.position.y = -seen.size * 1.0
      leg.add(shin)
      addChimeraFoot(seen, { THREE, leg, dark }, front)
      leg.position.set(front * seen.size * 0.62, 0, side * seen.size * 0.36)
      root.add(leg)
    }
  }
  // The neck and the head, which are the part that moves: it looks at
  // whoever comes near the thing it has just touched.
  const head = new THREE.Group()
  head.position.set(-seen.size * 0.72, seen.size * 0.72, 0)
  for (let neckIndex = 0; neckIndex < 9; neckIndex++) {
    const along = neckIndex / 8
    const neck = new THREE.Mesh(
      new THREE.TorusGeometry(seen.size * (0.24 - along * 0.055), seen.size * 0.085, 6, 10),
      coat,
    )
    neck.rotation.y = Math.PI / 2
    neck.position.set(-along * seen.size * 0.95, seen.size * (0.25 - along * 1.1), 0)
    head.add(neck)
  }
  const skull = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.24, 12, 9), coat)
  skull.scale.set(0.8, 1.18, 0.78)
  skull.position.set(-seen.size * 0.98, -seen.size * 0.98, 0)
  head.add(skull)
  // Two horns, swept back over the neck: the one thing about this
  // animal nobody mistakes for a horse.
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.07, seen.size * 0.8, 5),
      glow(seen.colour, 0.9),
    )
    horn.position.set(-seen.size * 1.0, -seen.size * 0.68, side * seen.size * 0.13)
    horn.rotation.set(0, side * 0.22, side * 0.18)
    head.add(horn)
    const eye = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.045, 7, 5), dark)
    eye.position.set(-seen.size * 1.18, -seen.size * 0.94, side * seen.size * 0.16)
    head.add(eye)
  }
  for (let lock = 0; lock < 8; lock++) {
    const hair = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.055, seen.size * (0.45 + (lock % 3) * 0.18), 4),
      dark,
    )
    hair.position.set(
      -seen.size * (0.78 + (lock % 3) * 0.12),
      -seen.size * (0.82 + Math.floor(lock / 3) * 0.2),
      (lock - 3.5) * seen.size * 0.075,
    )
    hair.rotation.z = -0.35 + (lock % 2) * 0.25
    head.add(hair)
  }
  root.add(head)

  const crown = new THREE.Group()
  crown.position.set(seen.size * 0.52, seen.size * 1.02, 0)
  const eye = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.18, 9, 7), coat)
  eye.scale.set(0.7, 1, 0.7)
  crown.add(eye)
  for (let tendril = 0; tendril < 9; tendril++) {
    const ribbon = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.06, seen.size * (0.7 + (tendril % 4) * 0.22), 4),
      dark,
    )
    const angle = (Math.PI * 2 * tendril) / 9
    ribbon.position.set(
      Math.cos(angle) * seen.size * 0.25,
      seen.size * 0.35,
      Math.sin(angle) * seen.size * 0.25,
    )
    ribbon.rotation.z = Math.cos(angle) * 1.05
    ribbon.rotation.x = Math.sin(angle) * 1.05
    crown.add(ribbon)
  }
  root.add(crown)
  return head

}

const BUILDERS: Partial<
  Record<Apparition['kind'], (seen: Apparition, context: BasicApparitionContext) => Object3D>
> = { medusa, chimera }


export function buildGuardianApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}
