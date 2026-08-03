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

function monster(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const hide = glow(seen.colour, 0.85)
  const climb = seen.climb ?? seen.size
  const mass = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 10, 8), hide)
  mass.scale.set(1, Math.max(0.5, climb / (seen.size * 2)), 0.9)
  mass.position.y = climb / 2
  root.add(mass)
  for (let i = 0; i < 9; i++) {
    const angle = (Math.PI * 2 * i) / 9
    const spine = new THREE.Mesh(new THREE.ConeGeometry(seen.size * 0.14, seen.size * 0.9, 4), hide)
    spine.position.set(
      Math.cos(angle) * seen.size * 0.7,
      climb * (0.45 + (i % 3) * 0.2),
      Math.sin(angle) * seen.size * 0.7,
    )
    spine.rotation.z = -Math.cos(angle) * 1.1
    spine.rotation.x = Math.sin(angle) * 1.1
    root.add(spine)
  }
  // Two eyes, because the thing it was had none and that is the tell.
  const glare = glow(0xffe0f0, 1)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.13, 8, 6), glare)
    eye.position.set(seen.size * 0.6, climb * 0.62, side * seen.size * 0.3)
    root.add(eye)
  }
  return root
}

function toad(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const hide = glow(seen.colour, 0.82)
  const raised = glow(seen.colour, 0.98)
  const body = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 14, 10), hide)
  body.scale.set(1.48, 0.82, 1.14)
  body.position.z = -seen.size * 0.12
  root.add(body)
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.72, 12, 8), hide)
  jaw.scale.set(1.2, 0.5, 0.72)
  jaw.position.set(0, -seen.size * 0.46, seen.size * 0.82)
  root.add(jaw)
  for (let i = 0; i < 14; i++) {
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.14, seen.size * (0.4 + (i % 4) * 0.11), seen.size * 0.14),
      raised,
    )
    const angle = Math.PI * (i / 13)
    spine.position.set(
      Math.cos(angle) * seen.size * 1.16,
      seen.size * (0.68 + (i % 3) * 0.04),
      -Math.sin(angle) * seen.size * 0.72,
    )
    spine.rotation.z = Math.cos(angle) * 0.38
    root.add(spine)
  }
  const eyes = new THREE.Group()
  for (const side of [-1, 1]) {
    const socket = new THREE.Mesh(
      new THREE.TorusGeometry(seen.size * 0.15, seen.size * 0.035, 6, 14),
      raised,
    )
    socket.position.set(side * seen.size * 0.58, seen.size * 0.2, seen.size * 1.13)
    eyes.add(socket)
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * 0.065, 8, 6),
      glow(0x1b2418, 1),
    )
    pupil.position.set(side * seen.size * 0.58, seen.size * 0.2, seen.size * 1.15)
    eyes.add(pupil)
  }
  root.add(eyes)
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(seen.size * 0.72, seen.size * 0.035, seen.size * 0.035),
    glow(0x1b2418, 1),
  )
  mouth.position.set(0, -seen.size * 0.37, seen.size * 1.15)
  root.add(mouth)

  for (const side of [-1, 1]) {
    for (let wheel = 0; wheel < 2; wheel++) {
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(seen.size * (0.31 - wheel * 0.04), seen.size * 0.075, 7, 16),
        raised,
      )
      rim.rotation.y = Math.PI / 2
      rim.position.set(
        side * seen.size * 1.32,
        -seen.size * (0.2 + wheel * 0.38),
        seen.size * (0.18 - wheel * 0.28),
      )
      root.add(rim)
    }
  }

  for (let i = 0; i < 28; i++) {
    const angle = i * 2.399
    const wart = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * (0.035 + (i % 3) * 0.012), 6, 4),
      raised,
    )
    wart.position.set(
      Math.cos(angle) * seen.size * (0.72 + (i % 5) * 0.1),
      seen.size * (0.68 - (i % 4) * 0.23),
      seen.size * (0.72 + Math.sin(angle) * 0.28),
    )
    root.add(wart)
  }

  const tail = new THREE.Group()
  tail.name = 'tubeppa-tail'
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.035, seen.size * 0.035, seen.size * 2.2, 7),
    raised,
  )
  cable.rotation.z = Math.PI / 2
  cable.position.set(seen.size * 1.85, -seen.size * 0.45, -seen.size * 0.42)
  tail.add(cable)
  const paddle = new THREE.Mesh(new THREE.CircleGeometry(seen.size * 0.34, 8), hide)
  paddle.position.set(seen.size * 2.95, -seen.size * 0.45, -seen.size * 0.42)
  paddle.rotation.y = -0.25
  tail.add(paddle)
  root.add(tail)
  return root
}

function wog(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const ink = glow(0x171318, 1)
  const stem = new THREE.Group()
  stem.name = 'eyewog-limbs'
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.07, seen.size * 0.055, seen.size * 1.25, 6),
    ink,
  )
  torso.rotation.z = -0.18
  stem.add(torso)

  const eye = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.27, 10, 8), glow(0xf8f2e8, 1))
  eye.scale.set(0.72, 1, 0.5)
  eye.position.set(-seen.size * 0.1, -seen.size * 0.3, seen.size * 0.08)
  stem.add(eye)
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.1, 7, 5), ink)
  pupil.position.set(-seen.size * 0.1, -seen.size * 0.3, seen.size * 0.2)
  stem.add(pupil)

  // Four twig limbs, each ending in the three prehensile fingers shown
  // in the source. Their uneven angles keep the creature insect-like.
  for (let limbIndex = 0; limbIndex < 4; limbIndex++) {
    const side = limbIndex % 2 ? 1 : -1
    const upper = limbIndex < 2
    const limb = new THREE.Group()
    limb.position.set(side * seen.size * 0.05, seen.size * (upper ? 0.32 : -0.38), 0)
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(seen.size * 0.018, seen.size * 0.014, seen.size * 0.52, 4),
      ink,
    )
    arm.rotation.z = side * (upper ? 1.05 : 0.72)
    limb.add(arm)
    for (let finger = 0; finger < 3; finger++) {
      const digit = new THREE.Mesh(
        new THREE.CylinderGeometry(seen.size * 0.01, seen.size * 0.007, seen.size * 0.2, 4),
        ink,
      )
      digit.position.set(side * seen.size * 0.25, -seen.size * 0.16 + finger * seen.size * 0.07, 0)
      digit.rotation.z = side * (0.65 + finger * 0.35)
      limb.add(digit)
    }
    stem.add(limb)
  }

  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.022, seen.size * 0.016, seen.size * 0.92, 5),
    ink,
  )
  tail.position.set(seen.size * 0.06, seen.size * 0.88, 0)
  tail.rotation.z = -0.18
  stem.add(tail)
  const club = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.16, 8, 6), ink)
  club.scale.set(0.7, 1.45, 0.7)
  club.position.set(seen.size * 0.14, seen.size * 1.36, 0)
  club.rotation.z = -0.5
  stem.add(club)
  root.add(stem)
  return stem
}

const BUILDERS: Partial<
  Record<Apparition['kind'], (seen: Apparition, context: BasicApparitionContext) => Object3D>
> = { medusa, chimera, monster, toad, wog }

export function buildGuardianApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}
