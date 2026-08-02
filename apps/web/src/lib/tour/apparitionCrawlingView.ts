import type { Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

function centipede(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const shell = glow(seen.colour, 0.88)
  const markings = glow(0x2a1920, 0.92)
  const body = new THREE.Group()
  body.name = 'segments'
  for (let i = 0; i < 11; i++) {
    const segment = new THREE.Group()
    segment.position.set(-i * seen.size * 0.7, seen.size * (0.2 + i * 0.07), 0)
    const ring = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * (0.82 - i * 0.025), 12, 9),
      shell,
    )
    ring.scale.set(0.68, 1, 1.05)
    segment.add(ring)
    for (let patch = 0; patch < 5; patch++) {
      const blot = new THREE.Mesh(
        new THREE.SphereGeometry(seen.size * (0.07 + (patch % 2) * 0.025), 6, 4),
        markings,
      )
      blot.scale.set(1.8, 0.55, 0.25)
      blot.position.set(
        seen.size * 0.42,
        seen.size * (0.45 - patch * 0.2),
        seen.size * (0.58 - (patch % 3) * 0.12),
      )
      segment.add(blot)
    }
    for (const side of [-1, 1]) {
      const upper = new THREE.Mesh(
        new THREE.CylinderGeometry(
          seen.size * 0.045,
          seen.size * 0.035,
          seen.size * 0.72,
          5,
        ),
        markings,
      )
      upper.position.set(0, -seen.size * 0.34, side * seen.size * 0.72)
      upper.rotation.x = side * 0.9
      segment.add(upper)
      const lower = new THREE.Mesh(
        new THREE.CylinderGeometry(
          seen.size * 0.035,
          seen.size * 0.02,
          seen.size * 0.62,
          5,
        ),
        markings,
      )
      lower.position.set(0, -seen.size * 0.68, side * seen.size * 0.98)
      lower.rotation.x = side * -0.55
      segment.add(lower)
    }
    body.add(segment)
  }
  root.add(body)
  const skull = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.82, 14, 10), shell)
  skull.scale.set(1.08, 0.66, 1.35)
  skull.position.set(seen.size * 0.72, -seen.size * 0.1, 0)
  root.add(skull)
  // Two black eyes and a ring of teeth: the head in the source is read
  // entirely off those two things.
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * 0.25, 10, 8),
      glow(0x120d0a, 1),
    )
    eye.scale.set(0.52, 1, 0.35)
    eye.position.set(seen.size * 1.34, seen.size * 0.1, side * seen.size * 0.48)
    root.add(eye)
  }
  const mouthDark = new THREE.Mesh(new THREE.CircleGeometry(seen.size * 0.46, 18), markings)
  mouthDark.scale.set(1, 0.42, 1)
  mouthDark.rotation.y = Math.PI / 2
  mouthDark.position.set(seen.size * 1.53, -seen.size * 0.36, 0)
  root.add(mouthDark)
  const jaw = new THREE.Group()
  jaw.name = 'jaw'
  jaw.position.x = seen.size * 1.55
  for (let i = 0; i < 12; i++) {
    const tooth = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.055, seen.size * 0.2, 3),
      glow(0xfdf3e6, 1),
    )
    const across = (i / 5 - 0.5) * seen.size * 0.78
    const lower = i >= 6
    tooth.position.set(0, -seen.size * (lower ? 0.47 : 0.27), across)
    tooth.rotation.z = lower ? 0 : Math.PI
    jaw.add(tooth)
  }
  root.add(jaw)
  return jaw

}

const BUILDERS: Partial<
  Record<Apparition['kind'], (seen: Apparition, context: BasicApparitionContext) => Object3D>
> = { centipede }

export function buildCrawlingApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}
