import type { Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK, modelKit } from './nenModelPrimitives'

function blackFlame(THREE: BasicApparitionContext['THREE'], width: number, length: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-width, 0)
  shape.bezierCurveTo(-width * 2, length * 0.25, width * 0.8, length * 0.65, 0, length)
  shape.bezierCurveTo(width * 0.4, length * 0.7, width * 2, length * 0.28, width, 0)
  shape.closePath()
  return new THREE.ExtrudeGeometry(shape, {
    depth: width * 0.3,
    bevelEnabled: false,
    curveSegments: 12,
  })
}

function wheel(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const iron = glow(seen.colour, 0.9)
  const spun = new THREE.Group()
  spun.add(new THREE.Mesh(new THREE.TorusGeometry(seen.size, seen.size * 0.11, 8, 28), iron))
  spun.add(
    new THREE.Mesh(new THREE.TorusGeometry(seen.size * 0.88, seen.size * 0.025, 5, 32), iron),
  )
  spun.add(new THREE.Mesh(new THREE.TorusGeometry(seen.size * 0.74, seen.size * 0.05, 6, 24), iron))
  // Four bars crossing the hub make the canonical eight spokes.
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 1.5, seen.size * 0.05, seen.size * 0.05),
      iron,
    )
    spoke.rotation.z = (Math.PI / 4) * i
    spun.add(spoke)
  }
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i
    const stud = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.08, 6, 5), iron)
    stud.position.set(Math.cos(angle) * seen.size * 0.74, Math.sin(angle) * seen.size * 0.74, 0)
    spun.add(stud)

    // The eight cross-shaped cardinal marks outside the inscribed band.
    const cross = new THREE.Group()
    cross.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(seen.size * 0.22, seen.size * 0.045, seen.size * 0.035),
        iron,
      ),
      new THREE.Mesh(
        new THREE.BoxGeometry(seen.size * 0.045, seen.size * 0.22, seen.size * 0.035),
        iron,
      ),
    )
    cross.position.set(Math.cos(angle) * seen.size * 1.02, Math.sin(angle) * seen.size * 1.02, 0)
    cross.rotation.z = angle
    spun.add(cross)
  }
  // Dense short ticks reproduce the writing-like band around the rim.
  for (let i = 0; i < 40; i++) {
    const angle = (Math.PI * 2 * i) / 40
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.018, seen.size * 0.11, seen.size * 0.025),
      iron,
    )
    tick.position.set(Math.cos(angle) * seen.size * 0.88, Math.sin(angle) * seen.size * 0.88, 0)
    tick.rotation.z = angle
    spun.add(tick)
  }
  root.add(spun)
  // The hub, which does not turn with the rim: a face that rotated with
  // its own wheel would be a face nobody could read.
  const hub = new THREE.Mesh(new THREE.CircleGeometry(seen.size * 0.34, 18), iron)
  hub.position.z = 0.01
  root.add(hub)
  const ink = glow(0x2a2113, 1)
  for (const side of [-1, 1]) {
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.16, seen.size * 0.03, seen.size * 0.02),
      ink,
    )
    lid.position.set(side * seen.size * 0.13, seen.size * 0.07, 0.02)
    root.add(lid)
  }
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(seen.size * 0.26, seen.size * 0.03, seen.size * 0.02),
    ink,
  )
  mouth.position.set(0, -seen.size * 0.1, 0.02)
  root.add(mouth)
  const browMark = new THREE.Group()
  browMark.position.set(0, seen.size * 0.2, 0.025)
  browMark.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.11, seen.size * 0.025, seen.size * 0.018),
      ink,
    ),
    new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.025, seen.size * 0.11, seen.size * 0.018),
      ink,
    ),
  )
  root.add(browMark)
  // And the fire round the outside, which is a group of its own so it
  // can flicker without the rim flickering with it.
  const fire = new THREE.Group()
  fire.name = 'corona'
  for (let i = 0; i < 32; i++) {
    const angle = (Math.PI * 2 * i) / 32
    const flame = new THREE.Mesh(
      blackFlame(THREE, seen.size * (0.065 + (i % 4) * 0.012), seen.size * (0.36 + (i % 5) * 0.12)),
      glow(0x241923, 1),
    )
    flame.position.set(Math.cos(angle) * seen.size * 1.02, Math.sin(angle) * seen.size * 1.02, 0)
    flame.rotation.z = angle - Math.PI / 2 + Math.sin(i * 2.3) * 0.13
    fire.add(flame)
  }
  root.add(fire)
  return root
}

function coin(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const kit = modelKit({ THREE, glow, root, skin: glow(seen.colour, 1) }, seen.size)
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size, seen.size, seen.size * 0.12, 40),
    glow(seen.colour, 1),
  )
  disc.rotation.x = Math.PI / 2
  root.add(disc)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(seen.size * 0.7, seen.size * 0.06, 6, 18),
    glow(seen.colour, 0.7),
  )
  root.add(rim)
  const digits = String(Math.max(1, Math.floor(seen.stage)))
  const segments: Record<string, number[]> = {
    '0': [0, 1, 2, 4, 5, 6],
    '1': [2, 5],
    '2': [0, 2, 3, 4, 6],
    '3': [0, 2, 3, 5, 6],
    '4': [1, 2, 3, 5],
    '5': [0, 1, 3, 5, 6],
    '6': [0, 1, 3, 4, 5, 6],
    '7': [0, 2, 5],
    '8': [0, 1, 2, 3, 4, 5, 6],
    '9': [0, 1, 2, 3, 5, 6],
  }
  const positions = [
    [0, 0.45],
    [-0.2, 0.23],
    [0.2, 0.23],
    [0, 0],
    [-0.2, -0.23],
    [0.2, -0.23],
    [0, -0.45],
  ]
  const scale = Math.min(1, 2 / digits.length)
  for (let i = 0; i < digits.length; i++)
    for (const segment of segments[digits[i]]) {
      const [x, y] = positions[segment],
        horizontal = segment === 0 || segment === 3 || segment === 6
      kit.box({
        name: `coin-value-${i}-${segment}`,
        at: [((i - (digits.length - 1) / 2) * 0.55 + x) * scale, y * scale, 0.067],
        dimensions: [horizontal ? 0.34 * scale : 0.045, horizontal ? 0.045 : 0.37 * scale, 0.012],
        colour: INK,
      })
    }
  const reverse = new THREE.Group()
  reverse.rotation.y = Math.PI
  const portrait = modelKit({ THREE, glow, root: reverse, skin: glow(BONE, 1) }, seen.size)
  portrait.oval({
    name: 'guardian-face-engraving',
    at: [0, 0, 0.075],
    radii: [0.3, 0.3, 0.02],
    colour: 0xc6a75a,
  })
  for (const side of [-1, 1])
    portrait.box({
      name: `engraved-eye-${side}`,
      at: [side * 0.12, 0.06, 0.1],
      dimensions: [0.13, 0.025, 0.012],
      colour: INK,
    })
  portrait.box({
    name: 'engraved-mouth',
    at: [0, -0.1, 0.1],
    dimensions: [0.22, 0.025, 0.012],
    colour: INK,
  })
  for (let spoke = 0; spoke < 8; spoke++) {
    const a = (spoke * Math.PI) / 4
    portrait.tube({
      name: `engraved-spoke-${spoke}`,
      points: [
        [Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0.09],
        [Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.09],
      ],
      radius: 0.025,
      colour: INK,
    })
  }
  root.add(reverse)
  return root
}

function tysonGuardian(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const flesh = glow(seen.colour, 1)
  const heart = new THREE.Shape()
  heart.moveTo(0, -seen.size * 1.1)
  heart.bezierCurveTo(
    -seen.size * 1.55,
    -seen.size * 0.05,
    -seen.size * 1.15,
    seen.size * 1.45,
    0,
    seen.size * 0.62,
  )
  heart.bezierCurveTo(
    seen.size * 1.15,
    seen.size * 1.45,
    seen.size * 1.55,
    -seen.size * 0.05,
    0,
    -seen.size * 1.1,
  )
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(heart, {
      depth: seen.size * 0.3,
      bevelEnabled: true,
      bevelSize: seen.size * 0.1,
      bevelThickness: seen.size * 0.12,
      bevelSegments: 4,
      curveSegments: 32,
    }),
    flesh,
  )
  body.name = 'heart-shaped-guardian'
  body.position.z = -seen.size * 0.1
  root.add(body)
  const eyeShape = new THREE.Shape()
  eyeShape.moveTo(-seen.size * 0.78, 0)
  eyeShape.bezierCurveTo(
    -seen.size * 0.38,
    seen.size * 0.3,
    seen.size * 0.38,
    seen.size * 0.3,
    seen.size * 0.78,
    0,
  )
  eyeShape.bezierCurveTo(
    seen.size * 0.38,
    -seen.size * 0.28,
    -seen.size * 0.38,
    -seen.size * 0.28,
    -seen.size * 0.78,
    0,
  )
  const white = new THREE.Mesh(new THREE.ShapeGeometry(eyeShape, 16), glow(0xfdf6fb, 1))
  white.position.z = seen.size * 0.7
  root.add(white)
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(seen.size * 0.31, 18), glow(0x14101a, 1))
  pupil.scale.x = 1.45
  pupil.position.z = seen.size * 0.72
  root.add(pupil)
  const wings = new THREE.Group()
  wings.name = 'wings'
  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 2; tier++) {
      const wing = new THREE.Group()
      wing.position.set(
        side * seen.size * (0.96 + tier * 0.04),
        seen.size * (0.46 - tier * 0.8),
        -seen.size * 0.08,
      )
      for (let i = 0; i < 3; i++) {
        const feather = new THREE.Mesh(
          new THREE.CircleGeometry(seen.size * (0.22 - i * 0.035), 9, 0, Math.PI),
          glow(0xfdf6fb, 0.88),
        )
        feather.scale.set(1.55, 0.72, 1)
        feather.position.x = side * seen.size * i * 0.16
        feather.rotation.z = side * (-0.15 - i * 0.08)
        wing.add(feather)
      }
      wings.add(wing)
    }
  }
  root.add(wings)
  // The fringe under it, which is where the aura it has taken runs out.
  const fringe = new THREE.Mesh(
    new THREE.SphereGeometry(seen.size * 0.43, 12, 7),
    glow(seen.colour, 0.68),
  )
  fringe.scale.set(1, 0.34, 0.46)
  fringe.position.y = -seen.size * 1.03
  root.add(fringe)
  for (let i = 0; i < 6; i++) {
    const drip = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * 0.065, 6, 5),
      glow(seen.colour, 0.6),
    )
    drip.scale.y = 1.7
    drip.position.set((i - 2.5) * seen.size * 0.16, -seen.size * (1.22 + (i % 3) * 0.15), 0)
    root.add(drip)
  }
  return wings
}

const BUILDERS: Partial<
  Record<Apparition['kind'], (seen: Apparition, context: BasicApparitionContext) => Object3D>
> = { wheel, coin, 'tyson-guardian': tysonGuardian }

export function buildMechanicalApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}
