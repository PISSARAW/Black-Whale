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
        new THREE.CylinderGeometry(seen.size * 0.045, seen.size * 0.035, seen.size * 0.72, 5),
        markings,
      )
      upper.position.set(0, -seen.size * 0.34, side * seen.size * 0.72)
      upper.rotation.x = side * 0.9
      segment.add(upper)
      const lower = new THREE.Mesh(
        new THREE.CylinderGeometry(seen.size * 0.035, seen.size * 0.02, seen.size * 0.62, 5),
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
    const eye = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.25, 10, 8), glow(0x120d0a, 1))
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

function mouths(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const flesh = glow(seen.colour, 0.84)
  const core = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 16, 12), flesh)
  core.scale.set(1.08, 0.96, 1)
  root.add(core)
  // Overlapping lobes break the perfect sphere into the soft, potato-
  // like head shown in the source; none is an eye or a separate limb.
  const bulges = [
    [-0.7, 0.42, 0.1, 0.48],
    [0.62, 0.48, -0.16, 0.44],
    [-0.55, -0.48, -0.28, 0.42],
    [0.58, -0.4, 0.22, 0.5],
    [0.08, 0.72, -0.25, 0.38],
  ] as const
  for (const [x, y, z, radius] of bulges) {
    const bulge = new THREE.Mesh(new THREE.SphereGeometry(seen.size * radius, 10, 7), flesh)
    bulge.position.set(x * seen.size, y * seen.size, z * seen.size)
    root.add(bulge)
  }
  const lips = new THREE.Group()
  lips.name = 'mouths'
  const mouths = [
    [-0.62, 0.2, 0.78, 0.34, 1],
    [0.42, 0.42, 0.84, 0.3, 1],
    [0.48, -0.55, 0.66, 0.38, 1],
    [-0.14, -0.7, 0.7, 0.34, 1],
    [0.02, 0.78, 0.62, 0.24, 1],
    [-0.35, -0.2, 0.94, 0.15, 0],
    [0.08, 0.05, 1.02, 0.13, 0],
    [0.55, -0.05, 0.86, 0.14, 0],
    [-0.48, 0.58, 0.7, 0.12, 0],
  ] as const
  for (let i = 0; i < mouths.length; i++) {
    const [x, y, z, radius, toothed] = mouths[i]
    const mouth = new THREE.Group()
    mouth.position.set(x * seen.size, y * seen.size, z * seen.size)
    mouth.rotation.z = ((i % 3) - 1) * 0.22
    const dark = new THREE.Mesh(new THREE.CircleGeometry(seen.size * radius, 16), glow(0x1a1420, 1))
    dark.scale.set(1, toothed ? 0.62 : 0.34, 1)
    mouth.add(dark)
    for (const lip of [-1, 1]) {
      const line = new THREE.Mesh(
        new THREE.CapsuleGeometry(seen.size * radius * 0.16, seen.size * radius * 1.55, 3, 7),
        glow(seen.colour, 1),
      )
      line.rotation.z = Math.PI / 2
      line.position.set(0, lip * seen.size * radius * (toothed ? 0.45 : 0.24), 0.012)
      mouth.add(line)
    }
    if (toothed) {
      for (let toothIndex = 0; toothIndex < 8; toothIndex++) {
        const upper = toothIndex < 4
        const tooth = new THREE.Mesh(
          new THREE.ConeGeometry(seen.size * radius * 0.09, seen.size * radius * 0.3, 3),
          glow(0xfff8e9, 1),
        )
        tooth.position.set(
          ((toothIndex % 4) - 1.5) * seen.size * radius * 0.4,
          (upper ? 1 : -1) * seen.size * radius * 0.25,
          0.025,
        )
        tooth.rotation.z = upper ? Math.PI : 0
        mouth.add(tooth)
      }
    }
    lips.add(mouth)
  }
  root.add(lips)
  return lips
}

const BUILDERS: Partial<
  Record<Apparition['kind'], (seen: Apparition, context: BasicApparitionContext) => Object3D>
> = { centipede, mouths }

export function buildCrawlingApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}
