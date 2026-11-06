import { tserriednichGuardian } from './apparitionMangaGuardianView'
import { modelKit } from './nenModelPrimitives'
import type { Object3D } from 'three'
import { TENTACLES, type Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

function medusa(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const hide = glow(seen.colour, 1)
  const kit = modelKit({ THREE, glow, root, skin: hide }, seen.size)
  const canopy = new THREE.Group()
  canopy.name = 'camilla-eye-canopy'
  const rings = [1, 8, 13, 17]
  for (let ring = 0; ring < rings.length; ring++) {
    const count = rings[ring]
    const radius = ring * seen.size * 0.58
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + ring * 0.31
      const pod = new THREE.Group()
      pod.userData.bakeStatic = true
      const lobe = new THREE.Mesh(
        new THREE.LatheGeometry(
          [
            [0, -0.44],
            [0.08, -0.36],
            [0.2, -0.23],
            [0.36, 0.02],
            [0.37, 0.2],
            [0.22, 0.36],
            [0, 0.42],
          ].map(([x, y]) => new THREE.Vector2(x * seen.size, y * seen.size)),
          18,
        ),
        hide,
      )
      lobe.scale.set(1.15, 0.9, 0.85)
      pod.add(lobe)
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(seen.size * 0.055, 7, 5),
        glow(0x171318, 1),
      )
      eye.position.set(0, -seen.size * 0.26, -seen.size * 0.18)
      pod.add(eye)
      pod.position.set(
        Math.cos(angle) * radius,
        seen.size * (0.48 - ring * 0.14 + (i % 3) * 0.05),
        Math.sin(angle) * radius * 0.68,
      )
      pod.rotation.y = angle + Math.PI / 2
      canopy.add(pod)
      kit.tube({
        name: `canopy-branch-${ring}-${i}`,
        points: [
          [0, 0.05, 0],
          [Math.cos(angle) * radius * 0.55, 0.22 - ring * 0.08, Math.sin(angle) * radius * 0.38],
          [Math.cos(angle) * radius, 0.3 - ring * 0.14, Math.sin(angle) * radius * 0.68],
        ],
        radius: 0.045,
        colour: seen.colour,
        into: canopy,
      })
    }
  }
  root.add(canopy)

  const body = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0.78, -0.92],
        [0.56, -0.68],
        [0.49, -0.2],
        [0.48, 0.45],
        [0.55, 0.9],
      ].map(([x, y]) => new THREE.Vector2(x * seen.size, y * seen.size)),
      24,
    ),
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

function toad(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const kit = modelKit({ THREE, glow, root, skin: glow(seen.colour, 1) }, seen.size)
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
      for (let spoke = 0; spoke < 8; spoke++) {
        const angle = (spoke * Math.PI) / 4
        const y = -(0.2 + wheel * 0.38)
        const z = 0.18 - wheel * 0.28
        kit.tube({
          name: `wheel-${side}-${wheel}-spoke-${spoke}`,
          points: [
            [side * 1.32, y, z],
            [
              side * 1.32,
              y + Math.cos(angle) * (0.31 - wheel * 0.04),
              z + Math.sin(angle) * (0.31 - wheel * 0.04),
            ],
          ],
          radius: 0.025,
          colour: seen.colour,
        })
      }
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

function wog(seen: Apparition, context: BasicApparitionContext): Object3D {
  const limbs = new context.THREE.Group()
  limbs.name = 'eyewog-limbs'
  const l = modelKit({ ...context, root: limbs }, seen.size)
  l.oval({ name: 'ocular-head', at: [0, 0, 0], radii: [0.27, 0.33, 0.13], colour: 0xf8f2e8 })
  l.oval({ name: 'large-pupil', at: [0, 0, 0.13], radii: [0.12, 0.19, 0.025], colour: 0x171318 })
  for (const side of [-1, 1])
    for (const upper of [-1, 1]) {
      l.tube({
        name: `bent-limb-${side}-${upper}`,
        points: [
          [side * 0.11, upper * 0.13, -0.05],
          [side * 0.36, upper * 0.36, -0.01],
          [side * 0.48, upper * 0.18, 0.03],
        ],
        radius: 0.025,
        colour: 0x171318,
      })
      l.hand({
        name: `prehensile-hand-${side}-${upper}`,
        at: [side * 0.48, upper * 0.18, 0.03],
        scale: 0.32,
        colour: 0x171318,
        into: undefined,
        fingers: 3,
      })
    }
  l.tube({
    name: 'flexible-tail',
    points: [
      [0, 0.24, -0.04],
      [0.06, 0.62, -0.08],
      [-0.07, 0.98, 0],
      [0.05, 1.2, 0],
    ],
    radius: 0.025,
    colour: 0x171318,
  })
  l.oval({ name: 'tail-club', at: [0.06, 1.23, 0], radii: [0.1, 0.17, 0.06], colour: 0x171318 })
  context.root.add(limbs)
  return limbs
}

const BUILDERS: Partial<
  Record<Apparition['kind'], (seen: Apparition, context: BasicApparitionContext) => Object3D>
> = { medusa, chimera: tserriednichGuardian, toad, wog }

export function buildGuardianApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}
