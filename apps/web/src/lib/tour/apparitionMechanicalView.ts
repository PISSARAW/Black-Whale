import type { Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

function wheel(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const iron = glow(seen.colour, 0.9)
  const spun = new THREE.Group()
  spun.add(
    new THREE.Mesh(new THREE.TorusGeometry(seen.size, seen.size * 0.11, 8, 28), iron),
  )
  spun.add(
    new THREE.Mesh(
      new THREE.TorusGeometry(seen.size * 0.88, seen.size * 0.025, 5, 32),
      iron,
    ),
  )
  spun.add(
    new THREE.Mesh(
      new THREE.TorusGeometry(seen.size * 0.74, seen.size * 0.05, 6, 24),
      iron,
    ),
  )
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
    stud.position.set(
      Math.cos(angle) * seen.size * 0.74,
      Math.sin(angle) * seen.size * 0.74,
      0,
    )
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
    cross.position.set(
      Math.cos(angle) * seen.size * 1.02,
      Math.sin(angle) * seen.size * 1.02,
      0,
    )
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
    tick.position.set(
      Math.cos(angle) * seen.size * 0.88,
      Math.sin(angle) * seen.size * 0.88,
      0,
    )
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
      new THREE.ConeGeometry(
        seen.size * (0.065 + (i % 4) * 0.012),
        seen.size * (0.36 + (i % 5) * 0.12),
        5,
      ),
      glow(0x241923, 0.68),
    )
    flame.position.set(
      Math.cos(angle) * seen.size * 1.27,
      Math.sin(angle) * seen.size * 1.27,
      0,
    )
    flame.rotation.z = angle - Math.PI / 2 + Math.sin(i * 2.3) * 0.13
    fire.add(flame)
  }
  root.add(fire)
  return root
}

function coin(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const worth = Math.min(6, Math.log10(Math.max(1, seen.stage)) + 1)
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size, seen.size, seen.size * 0.12 * worth, 20),
    glow(seen.colour, 1),
  )
  disc.rotation.x = Math.PI / 2
  root.add(disc)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(seen.size * 0.7, seen.size * 0.06, 6, 18),
    glow(seen.colour, 0.7),
  )
  root.add(rim)
  return root

}

function tysonGuardian(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const flesh = glow(seen.colour, 0.8)
  const ball = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 16, 12), flesh)
  ball.scale.set(1.12, 1, 0.68)
  root.add(ball)
  for (const side of [-1, 1]) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.66, 14, 10), flesh)
    lobe.scale.set(0.92, 0.9, 0.7)
    lobe.position.set(side * seen.size * 0.43, seen.size * 0.38, 0)
    root.add(lobe)
  }
  const point = new THREE.Mesh(
    new THREE.ConeGeometry(seen.size * 0.92, seen.size * 1.25, 18),
    flesh,
  )
  point.rotation.z = Math.PI
  point.position.y = -seen.size * 0.48
  point.scale.z = 0.68
  root.add(point)
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
  const pupil = new THREE.Mesh(
    new THREE.CircleGeometry(seen.size * 0.31, 18),
    glow(0x14101a, 1),
  )
  pupil.scale.x = 1.45
  pupil.position.z = seen.size * 0.72
  root.add(pupil)
  const wings = new THREE.Group()
  wings.name = 'wings'
  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 3; tier++) {
      const wing = new THREE.Group()
      wing.position.set(
        side * seen.size * (0.96 + tier * 0.04),
        seen.size * (0.52 - tier * 0.47),
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
