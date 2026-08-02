import type { Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

type SpriteBuilder = (seen: Apparition, context: BasicApparitionContext) => void

function bear(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const fur = glow(seen.colour, 0.85)
  const body = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 12, 9), fur)
  body.scale.set(1.02, 1.35, 0.82)
  root.add(body)
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.5, 10, 8), fur)
    ear.scale.z = 0.62
    ear.position.set(side * seen.size * 0.58, seen.size * 1.08, 0)
    root.add(ear)
  }
  const grin = new THREE.Mesh(
    new THREE.PlaneGeometry(seen.size * 0.7, seen.size * 0.44),
    glow(0x15121a, 1),
  )
  grin.scale.set(0.42, 0.7, 1)
  grin.position.set(seen.size * 0.48, seen.size * 0.22, seen.size * 0.79)
  root.add(grin)
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(seen.size * 0.1, 8, 6),
    glow(0x15121a, 1),
  )
  eye.position.set(seen.size * 0.48, seen.size * 0.54, seen.size * 0.78)
  root.add(eye)
  for (let tooth = 0; tooth < 2; tooth++) {
    const incisor = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.1, seen.size * 0.2, seen.size * 0.05),
      glow(0xfff7e8, 1),
    )
    incisor.position.set(
      seen.size * (0.43 + tooth * 0.11),
      seen.size * 0.06,
      seen.size * 0.84,
    )
    root.add(incisor)
  }
  const tail = new THREE.Mesh(
    new THREE.TorusGeometry(seen.size * 1.05, seen.size * 0.045, 6, 24, Math.PI * 1.45),
    fur,
  )
  tail.position.set(-seen.size * 0.85, -seen.size * 0.35, -seen.size * 0.35)
  tail.rotation.set(Math.PI / 2, 0.5, 0)
  root.add(tail)

}

function jelly(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const fur = glow(seen.colour, 0.85)
  const cap = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.62, 12, 9), fur)
  cap.position.y = seen.size * 0.42
  root.add(cap)
  for (let i = 0; i < 9; i++) {
    const spot = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * (0.09 + (i % 3) * 0.025), 7, 5),
      glow(0x171318, 1),
    )
    const around = (Math.PI * 2 * i) / 9
    spot.position.set(
      Math.cos(around) * seen.size * 0.52,
      seen.size * (0.42 + ((i % 3) - 1) * 0.22),
      Math.sin(around) * seen.size * 0.52,
    )
    root.add(spot)
  }
  const fringe = new THREE.Group()
  fringe.name = 'fringe'
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8
    const strand = new THREE.Group()
    strand.position.set(
      Math.cos(angle) * seen.size * 0.55,
      seen.size * 0.05,
      Math.sin(angle) * seen.size * 0.55,
    )
    for (let bead = 0; bead < 6; bead++) {
      const filament = new THREE.Mesh(
        new THREE.SphereGeometry(seen.size * (0.055 - bead * 0.005), 6, 4),
        glow(seen.colour, 0.72),
      )
      filament.position.set(
        Math.sin(bead * 0.9 + i) * seen.size * 0.08,
        -bead * seen.size * 0.2,
        Math.cos(bead + i) * seen.size * 0.06,
      )
      strand.add(filament)
    }
    fringe.add(strand)
  }
  root.add(fringe)

}

function wolf(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const fur = glow(seen.colour, 0.85)
  for (let segmentIndex = 0; segmentIndex < 8; segmentIndex++) {
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * (0.46 - segmentIndex * 0.018), 10, 7),
      fur,
    )
    body.scale.set(1.2, 0.72, 0.86)
    body.position.x = -segmentIndex * seen.size * 0.62
    root.add(body)
    const dorsal = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.08, seen.size * 0.3, 4),
      glow(seen.colour, 0.98),
    )
    dorsal.position.set(-segmentIndex * seen.size * 0.62, seen.size * 0.42, 0)
    root.add(dorsal)
  }
  const snout = new THREE.Mesh(
    new THREE.ConeGeometry(seen.size * 0.34, seen.size * 0.95, 6),
    fur,
  )
  snout.rotation.z = -Math.PI / 2
  snout.position.x = seen.size * 0.88
  root.add(snout)
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.13, seen.size * 0.62, 4),
      fur,
    )
    ear.position.set(seen.size * 0.38, seen.size * 0.48, side * seen.size * 0.22)
    root.add(ear)
    for (let pair = 0; pair < 4; pair++) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(
          seen.size * 0.08,
          seen.size * 0.05,
          seen.size * 0.8,
          5,
        ),
        fur,
      )
      leg.position.set(
        -pair * seen.size * 1.18,
        -seen.size * 0.62,
        side * seen.size * 0.26,
      )
      root.add(leg)
    }
  }
  for (let tooth = 0; tooth < 7; tooth++) {
    const fang = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.04, seen.size * 0.18, 3),
      glow(0xfff7e8, 1),
    )
    fang.position.set(
      seen.size * (0.68 + tooth * 0.06),
      -seen.size * 0.13,
      seen.size * 0.31,
    )
    root.add(fang)
  }

}

function blob(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const fur = glow(seen.colour, 0.85)
  const blob = new THREE.Mesh(
    new THREE.BoxGeometry(seen.size * 1.45, seen.size * 2.05, seen.size * 1.05),
    fur,
  )
  blob.position.y = seen.size * 0.35
  root.add(blob)
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      new THREE.TorusGeometry(seen.size * 0.38, seen.size * 0.13, 8, 18),
      fur,
    )
    ear.position.set(side * seen.size * 0.64, seen.size * 1.47, 0)
    root.add(ear)
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * 0.075, 7, 5),
      glow(0x171318, 1),
    )
    eye.position.set(side * seen.size * 0.32, seen.size * 0.64, seen.size * 0.54)
    root.add(eye)
  }
  const mouth = new THREE.Mesh(
    new THREE.PlaneGeometry(seen.size * 0.72, seen.size * 0.56),
    glow(0x171318, 1),
  )
  mouth.position.set(0, seen.size * 0.2, seen.size * 0.54)
  root.add(mouth)
  for (let tooth = 0; tooth < 10; tooth++) {
    const fang = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.045, seen.size * 0.2, 3),
      glow(0xfff7e8, 1),
    )
    const upper = tooth < 5
    fang.position.set(
      ((tooth % 5) - 2) * seen.size * 0.13,
      seen.size * (upper ? 0.35 : 0.05),
      seen.size * 0.57,
    )
    fang.rotation.z = upper ? Math.PI : 0
    root.add(fang)
  }
  const tail = new THREE.Mesh(
    new THREE.TorusGeometry(seen.size * 1.15, seen.size * 0.055, 6, 28, Math.PI * 1.45),
    fur,
  )
  tail.position.set(-seen.size * 0.9, seen.size * 0.05, -seen.size * 0.45)
  tail.rotation.x = Math.PI / 2
  root.add(tail)

}

const SHAPES: SpriteBuilder[] = [bear, jelly, wolf, blob]

export function buildSpriteApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  if (seen.kind !== 'sprite') return undefined
  SHAPES[seen.stage % SHAPES.length](seen, context)
  return context.root
}
