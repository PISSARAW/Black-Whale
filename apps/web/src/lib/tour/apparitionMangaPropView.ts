import { buildPainPackerModel } from './painPackerModel'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK, modelKit } from './nenModelPrimitives'

function phone(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  const love = seen.stage === 1
  k.box({
    name: 'handset-body',
    at: [0, 0, 0],
    dimensions: [0.62, 1.45, 0.22],
    colour: love ? 0xcab8cb : 0x9ebaa8,
  })
  k.box({ name: 'phone-display', at: [0, 0.3, 0.12], dimensions: [0.45, 0.4, 0.015], colour: INK })
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 3; x++)
      k.oval({
        name: `key-${x}-${y}`,
        at: [(x - 1) * 0.17, -0.08 - y * 0.15, 0.13],
        radii: [0.055, 0.045, 0.02],
        colour: BONE,
      })
  k.tube({
    name: 'phone-antenna',
    points: [
      [0.21, 0.7, 0],
      [0.21, 1.1, 0],
    ],
    radius: 0.035,
    colour: INK,
  })
  if (love) k.heart({ name: 'love-dial-heart', at: [0, 0.32, 0.14], width: 0.15, colour: 0xd28b9d })
  else
    for (const side of [-1, 1])
      k.patch({
        name: `beetle-wing-${side}`,
        points: [
          [0, 0],
          [side * 0.42, 0.14],
          [side * 0.34, -0.23],
          [0, -0.12],
        ],
        at: [side * 0.22, 0.75, 0],
        colour: 0x6f9d83,
      })
  return context.root
}

function staff(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  k.tube({
    name: 'extensible-staff',
    points: [
      [0, -1.45, 0],
      [0, 1.45, 0],
    ],
    radius: 0.045,
    colour: 0x4a3934,
  })
  for (const side of [-1, 1]) {
    k.tube({
      name: `staff-end-${side}`,
      points: [
        [0, side * 1.18, 0],
        [0, side * 1.45, 0],
      ],
      radius: 0.063,
      colour: 0xc4b06c,
    })
    for (let i = 0; i < 3; i++)
      k.add({
        geometry: new context.THREE.TorusGeometry(seen.size * 0.067, seen.size * 0.008, 5, 16),
        colour: INK,
        at: [0, side * (1.2 + i * 0.08), 0],
        name: `end-ring-${side}-${i}`,
      }).rotation.x = Math.PI / 2
  }
  return context.root
}

function cloth(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size),
    THREE = context.THREE
  const geometry = new THREE.PlaneGeometry(2 * seen.size, 1.8 * seen.size, 16, 16)
  const p = geometry.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / seen.size,
      y = p.getY(i) / seen.size
    p.setZ(i, (Math.sin(x * 7 + y * 2) * 0.06 - (1 - x * x) * 0.35) * seen.size)
  }
  geometry.computeVertexNormals()
  const mesh = k.add({ geometry: geometry, colour: 0xbca9bf, at: [0, 0, 0], name: 'fun-fun-cloth' })
  // A cloth has a back as well as a front, including when viewed from below.
  mesh.material = context.glow(0xbca9bf, 1).clone()
  mesh.material.side = THREE.DoubleSide
  for (const side of [-1, 1])
    k.tube({
      name: `cloth-border-${side}`,
      points: [
        [side, -0.9, 0],
        [side, 0, -0.05],
        [side, 0.9, 0],
      ],
      radius: 0.025,
      colour: INK,
    })
  return context.root
}

function jupiter(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  k.oval({ name: 'jupiter-sphere', at: [0, 0, 0], radii: [1, 1, 1], colour: 0xc7b39a })
  for (let band = 0; band < 11; band++) {
    const y = -0.86 + band * 0.17,
      r = Math.sqrt(1 - y * y)
    const ring = k.add({
      geometry: new context.THREE.TorusGeometry(r * seen.size, 0.04 * seen.size, 6, 48),
      colour: band % 2 ? 0x9a7768 : 0xd8c6ab,
      at: [0, y, 0],
      name: `cloud-band-${band}`,
    })
    ring.rotation.x = Math.PI / 2
  }
  k.oval({
    name: 'great-spot',
    at: [0.4, -0.35, 0.86],
    radii: [0.24, 0.11, 0.03],
    colour: 0x8d5f50,
  })
  return context.root
}

const BUILDERS = { phone, staff, cloth, jupiter, 'pain-armour': buildPainPackerModel }
export function buildMangaPropApparition(seen: Apparition, context: BasicApparitionContext) {
  return BUILDERS[seen.kind as keyof typeof BUILDERS]?.(seen, context)
}

/** Mizaistom/Kalluto props keep thin silhouettes when seen obliquely. */
export function paperDoll(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  const body = k.patch({
    name: 'cut-paper-body',
    points: [
      [-0.2, 0.45],
      [-0.65, 0.27],
      [-0.6, 0.12],
      [-0.18, 0.23],
      [-0.2, -0.15],
      [-0.44, -0.72],
      [-0.22, -0.76],
      [0, -0.25],
      [0.22, -0.76],
      [0.44, -0.72],
      [0.2, -0.15],
      [0.18, 0.23],
      [0.6, 0.12],
      [0.65, 0.27],
      [0.2, 0.45],
    ],
    at: [0, 0, 0],
    colour: BONE,
    into: undefined,
    depth: 0.006,
  })
  k.oval({ name: 'paper-head', at: [0, 0.66, 0], radii: [0.22, 0.23, 0.008], colour: BONE })
  for (const mesh of [
    body,
    ...context.root.children.filter((part) => part.name === 'paper-head'),
  ]) {
    const surface = mesh as import('three').Mesh
    const edge = new context.THREE.Mesh(
      surface.geometry,
      new context.THREE.MeshBasicMaterial({ color: INK, side: context.THREE.BackSide }),
    )
    edge.scale.setScalar(1.045)
    surface.add(edge)
  }
  return context.root
}
