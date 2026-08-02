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

const BUILDERS: Partial<
  Record<Apparition['kind'], (seen: Apparition, context: BasicApparitionContext) => Object3D>
> = { wheel }

export function buildMechanicalApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}
