import type { Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

type Builder = (seen: Apparition, context: BasicApparitionContext) => Object3D

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

const BUILDERS: Partial<Record<Apparition['kind'], Builder>> = {
  gum,
  double,
  fish,
  paper,
  puppet,
}

export function buildObjectApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}
