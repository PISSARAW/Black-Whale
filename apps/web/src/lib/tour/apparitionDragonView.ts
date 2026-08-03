import type { Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

function dragon(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const hide = glow(seen.colour, 0.8)
  const bulk = new THREE.Mesh(
    new THREE.CapsuleGeometry(seen.size * 0.72, seen.size * 1.1, 5, 12),
    hide,
  )
  bulk.rotation.x = Math.PI / 2
  bulk.position.set(0, seen.size * 0.9, -seen.size * 0.7)
  bulk.scale.set(1.35, 1.25, 1.12)
  root.add(bulk)
  // Its body coils deep into the room and ends in the enormous raised
  // tail visible behind Marayam, rather than stopping at the shoulders.
  const tail = new THREE.Group()
  tail.name = 'marayam-tail'
  const tailPath = [
    [0, 0.82, -1.45, 0.72],
    [0.62, 0.72, -2.05, 0.64],
    [1.05, 1.02, -2.48, 0.56],
    [1.15, 1.65, -2.62, 0.48],
    [1.05, 2.28, -2.5, 0.38],
  ] as const
  for (const [x, y, z, radius] of tailPath) {
    const segment = new THREE.Mesh(new THREE.SphereGeometry(seen.size * radius, 12, 9), hide)
    segment.scale.set(1, 1.2, 0.92)
    segment.position.set(x * seen.size, y * seen.size, z * seen.size)
    tail.add(segment)
  }
  root.add(tail)

  // Layered scales along the flank keep the long body from reading as
  // a smooth snake or a piece of furniture at room distance.
  for (let i = 0; i < 18; i++) {
    const scale = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.1, seen.size * 0.28, 5),
      glow(seen.colour, 0.96),
    )
    scale.rotation.x = -Math.PI / 2
    scale.position.set(
      ((i % 3) - 1) * seen.size * 0.45,
      seen.size * (0.75 + (i % 2) * 0.24),
      -seen.size * (0.55 + Math.floor(i / 3) * 0.3),
    )
    root.add(scale)
  }
  const head = new THREE.Group()
  head.name = 'jaws'
  head.position.set(0, seen.size * 1.5, seen.size * 0.5)
  const skull = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.42, 12, 9), hide)
  skull.scale.set(1.18, 1.05, 1.75)
  head.add(skull)
  // The snout, and the lower jaw under it as its own piece so it can
  // open: a roar is a mouth, and a mouth that does not move is a face.
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(seen.size * 0.5, seen.size * 0.16, seen.size * 0.85),
    hide,
  )
  jaw.name = 'jaw'
  jaw.position.set(0, -seen.size * 0.26, seen.size * 0.6)
  head.add(jaw)
  for (let i = 0; i < 8; i++) {
    const fang = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.05, seen.size * 0.22, 3),
      glow(0xfdf6ea, 1),
    )
    fang.position.set(
      ((i % 4) / 3 - 0.5) * seen.size * 0.42,
      -seen.size * 0.14,
      seen.size * (0.4 + Math.floor(i / 4) * 0.4),
    )
    fang.rotation.x = Math.PI
    head.add(fang)
  }
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.1, 8, 6), glow(0xffe9a8, 1))
    eye.position.set(side * seen.size * 0.24, seen.size * 0.12, seen.size * 0.5)
    head.add(eye)
    const brow = new THREE.Mesh(new THREE.ConeGeometry(seen.size * 0.11, seen.size * 0.42, 5), hide)
    brow.position.set(side * seen.size * 0.28, seen.size * 0.28, seen.size * 0.38)
    brow.rotation.set(Math.PI / 2, 0, side * -0.34)
    head.add(brow)
    const horn = new THREE.Mesh(new THREE.ConeGeometry(seen.size * 0.12, seen.size * 0.92, 5), hide)
    horn.position.set(side * seen.size * 0.26, seen.size * 0.4, -seen.size * 0.15)
    horn.rotation.set(-0.7, 0, side * 0.35)
    head.add(horn)
    const nostril = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * 0.045, 6, 4),
      glow(0x171318, 1),
    )
    nostril.position.set(side * seen.size * 0.14, -seen.size * 0.08, seen.size * 0.79)
    head.add(nostril)
  }
  root.add(head)
  // The mane, which is most of what the drawing is: a fan of spines
  // running back off the skull.
  for (let i = 0; i < 11; i++) {
    const spine = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.07, seen.size * (0.5 + (i % 3) * 0.28), 4),
      glow(seen.colour, 0.95),
    )
    const across = (i / 10 - 0.5) * Math.PI * 0.9
    spine.position.set(
      Math.sin(across) * seen.size * 0.5,
      seen.size * (1.7 + Math.cos(across) * 0.3),
      -seen.size * 0.1,
    )
    spine.rotation.set(-0.9, 0, -across)
    root.add(spine)
  }
  // Two forelimbs on the deck, because the drawing has them planted:
  // it is not hovering in the doorway, it is sitting in it.
  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    const limb = new THREE.Mesh(
      new THREE.CylinderGeometry(seen.size * 0.16, seen.size * 0.11, seen.size * 1.1, 6),
      hide,
    )
    limb.rotation.z = side * -0.28
    arm.add(limb)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.22, 9, 6), hide)
    hand.scale.set(1.2, 0.5, 1)
    hand.position.y = -seen.size * 0.56
    arm.add(hand)
    for (let claw = 0; claw < 4; claw++) {
      const talon = new THREE.Mesh(
        new THREE.ConeGeometry(seen.size * 0.045, seen.size * 0.3, 4),
        glow(0xf4ead8, 1),
      )
      talon.rotation.x = Math.PI / 2
      talon.position.set((claw - 1.5) * seen.size * 0.1, -seen.size * 0.58, seen.size * 0.22)
      arm.add(talon)
    }
    arm.position.set(side * seen.size * 0.7, seen.size * 0.58, seen.size * 0.15)
    root.add(arm)
  }
  return head
}

export function buildDragonApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  if (seen.kind !== 'dragon') return undefined
  return dragon(seen, context)
}
