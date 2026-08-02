import type { Object3D } from 'three'
import { BOOKMARK_RIBBON, type Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { buildDealer } from './dealer'

type Builder = (seen: Apparition, context: BasicApparitionContext) => Object3D | null

const CHAIN_LINKS = 14

function gum(seen: Apparition, { THREE, root, skin }: BasicApparitionContext) {
  const strand = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.035, seen.size * 0.035, seen.size * 2, 6),
    skin,
  )
  strand.rotation.z = Math.PI / 2
  root.add(strand)
  const blob = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.16, 8, 6), skin)
  blob.scale.set(1, 0.7, 1)
  root.add(blob)
  return root
}

function double(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const material = glow(seen.colour, 0.42)
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(seen.size * 0.3, seen.size * 1.1, 4, 8),
    material,
  )
  body.position.y = seen.size * 0.15
  root.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.26, 10, 8), material)
  head.position.y = seen.size * 1.05
  root.add(head)
  return root
}

function fish(seen: Apparition, { THREE, glow, root, skin }: BasicApparitionContext) {
  const body = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 8, 6), skin)
  body.scale.set(1.7, 0.75, 0.75)
  root.add(body)
  const tail = new THREE.Mesh(new THREE.ConeGeometry(seen.size * 0.55, seen.size, 4), skin)
  tail.rotation.z = Math.PI / 2
  tail.position.x = seen.size * 1.7
  root.add(tail)
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(seen.size * 0.16, 6, 5),
    glow(0xfff3d0, 1),
  )
  eye.position.set(-seen.size * 1.1, seen.size * 0.2, seen.size * 0.35)
  root.add(eye)
  return root
}

function paper(seen: Apparition, { THREE, root, skin }: BasicApparitionContext) {
  root.add(new THREE.Mesh(new THREE.PlaneGeometry(seen.size, seen.size * 1.4), skin))
  const head = new THREE.Mesh(new THREE.CircleGeometry(seen.size * 0.3, 8), skin)
  head.position.y = seen.size * 0.85
  root.add(head)
  return root
}

function puppet(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const ink = glow(seen.colour, 1)
  const pale = glow(0xefe7dd, 1)
  const kimono = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.34, seen.size * 0.62, seen.size * 1.35, 8),
    ink,
  )
  kimono.position.y = seen.size * 0.68
  root.add(kimono)
  const obi = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.38, seen.size * 0.41, seen.size * 0.22, 10),
    pale,
  )
  obi.position.y = seen.size * 0.85
  root.add(obi)
  for (const side of [-1, 1]) {
    const lapel = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.1, seen.size * 0.45, seen.size * 0.05),
      pale,
    )
    lapel.rotation.z = side * 0.5
    lapel.position.set(0, seen.size * 1.15, seen.size * (0.31 + side * 0.01))
    root.add(lapel)
    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.3, seen.size * 0.62, seen.size * 0.3),
      ink,
    )
    sleeve.position.set(side * seen.size * 0.45, seen.size * 0.95, 0)
    root.add(sleeve)
  }
  const face = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.24, 10, 8), pale)
  face.position.y = seen.size * 1.6
  root.add(face)
  const zipper = new THREE.Mesh(
    new THREE.BoxGeometry(seen.size * 0.03, seen.size * 0.28, seen.size * 0.02),
    ink,
  )
  zipper.position.set(0, seen.size * 1.57, seen.size * 0.235)
  root.add(zipper)
  for (const side of [-1, 1]) {
    const crossV = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.03, seen.size * 0.15, seen.size * 0.02),
      ink,
    )
    crossV.position.set(side * seen.size * 0.12, seen.size * 1.58, seen.size * 0.21)
    root.add(crossV)
    const crossH = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.1, seen.size * 0.03, seen.size * 0.02),
      ink,
    )
    crossH.position.set(side * seen.size * 0.12, seen.size * 1.6, seen.size * 0.21)
    root.add(crossH)
  }
  const hair = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.28, seen.size * 0.3, seen.size * 0.42, 10),
    ink,
  )
  hair.position.y = seen.size * 1.68
  root.add(hair)
  return root
}

function hoover(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const canister = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.55, seen.size * 0.6, seen.size * 1.1, 12),
    glow(seen.colour, 1),
  )
  root.add(canister)
  const hose = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.12, seen.size * 0.12, seen.size * 1.6, 6),
    glow(seen.colour, 0.9),
  )
  hose.rotation.z = Math.PI / 2.6
  hose.position.set(seen.size * 0.7, seen.size * 0.5, -seen.size * 0.4)
  root.add(hose)
  const nozzle = new THREE.Mesh(
    new THREE.ConeGeometry(seen.size * 0.34, seen.size * 0.6, 8),
    glow(seen.colour, 1),
  )
  nozzle.rotation.x = -Math.PI / 2
  nozzle.position.set(seen.size * 1.25, seen.size * 0.95, -seen.size * 0.9)
  root.add(nozzle)
  if (seen.stage) {
    root.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(seen.size * 0.42, 10, 8),
        glow(0x9be8ff, Math.min(0.85, 0.25 + seen.stage * 0.14)),
      ),
    )
  }
  return null
}

function chain(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const steel = glow(seen.colour, 1)
  root.add(new THREE.Mesh(new THREE.SphereGeometry(seen.size, 12, 10), steel))
  for (let index = 0; index < CHAIN_LINKS; index++) {
    root.add(
      new THREE.Mesh(
        new THREE.TorusGeometry(seen.size * 0.4, seen.size * 0.12, 4, 8),
        steel,
      ),
    )
  }
  return null
}

function book(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const wide = seen.size
  const long = seen.size * 1.35
  const board = glow(seen.colour, 1)
  const paper = glow(0xf4eeff, 0.96)
  const ink = glow(seen.colour, 0.5)
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group()
    leaf.rotation.z = side * 0.2
    const cover = new THREE.Mesh(new THREE.BoxGeometry(wide, 0.006, long), board)
    cover.position.set((side * wide) / 2, -0.004, 0)
    leaf.add(cover)
    const sheet = new THREE.Mesh(
      new THREE.BoxGeometry(wide * 0.9, 0.002, long * 0.9),
      paper,
    )
    sheet.position.set((side * wide) / 2, 0.002, 0)
    leaf.add(sheet)
    for (let index = 0; index < 5; index++) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(wide * 0.6, 0.001, long * 0.035),
        ink,
      )
      line.position.set((side * wide) / 2, 0.004, (index - 2) * long * 0.14)
      leaf.add(line)
    }
    root.add(leaf)
    if ((side < 0 ? 0 : 1) === seen.stage) addBookmark(seen, { THREE, glow, leaf, side })
  }
  return null
}

interface BookmarkContext {
  THREE: BasicApparitionContext['THREE']
  glow: BasicApparitionContext['glow']
  leaf: import('three').Group
  side: number
}

function addBookmark(seen: Apparition, { THREE, glow, leaf, side }: BookmarkContext) {
  const wide = seen.size
  const long = seen.size * 1.35
  const silk = glow(BOOKMARK_RIBBON, 1)
  const along = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.16, 0.002, long * 1.05), silk)
  along.position.set(side * wide * 0.58, 0.006, 0)
  leaf.add(along)
  const tail = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.16, long * 0.5, 0.002), silk)
  tail.position.set(side * wide * 0.58, -long * 0.25, -long * 0.52)
  leaf.add(tail)
}

function flute(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const silver = glow(seen.colour, 1)
  const bore = seen.size * 0.055
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(bore, bore * 0.92, seen.size * 2, 10),
    silver,
  )
  tube.rotation.z = Math.PI / 2
  root.add(tube)
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(bore * 1.25, bore * 1.25, seen.size * 0.1, 10),
    silver,
  )
  crown.rotation.z = Math.PI / 2
  crown.position.x = -seen.size
  root.add(crown)
  const lip = new THREE.Mesh(
    new THREE.CylinderGeometry(bore * 0.85, bore * 0.85, bore * 1.2, 8),
    silver,
  )
  lip.position.set(-seen.size * 0.78, bore * 0.9, 0)
  root.add(lip)
  const holes = glow(0x2a2a30, 1)
  for (let index = 0; index < 6; index++) {
    const key = new THREE.Mesh(
      new THREE.CylinderGeometry(bore * 0.62, bore * 0.62, bore * 0.9, 8),
      holes,
    )
    key.position.set(-seen.size * 0.34 + index * seen.size * 0.24, bore * 0.85, 0)
    root.add(key)
  }
  return null
}

function dealer(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  root.add(buildDealer({ THREE, glow, seen }))
  return null
}

const BUILDERS: Partial<Record<Apparition['kind'], Builder>> = {
  gum,
  double,
  fish,
  paper,
  puppet,
  hoover,
  chain,
  book,
  flute,
  dealer,
}

export function buildObjectApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | null | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}
