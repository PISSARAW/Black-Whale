import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK } from './nenModelPrimitives'
import { sculptKit } from './nenSculptPrimitives'
import { buildNenFemaleFace } from './nenFemaleFace'

/** Momoze's one mouse-shaped guardian and its smaller copies share an anatomy. */
export function momoze(seen: Apparition, context: BasicApparitionContext) {
  const k = sculptKit(context, seen.size)
  const hide = 0xd3c9c3
  k.oval({ name: 'mouse-body', at: [0, 1.12, 0], radii: [0.83, 1.12, 0.62], colour: hide })
  k.loft({
    name: 'mouse-head',
    colour: hide,
    sections: [
      [1.48, 0.7, 0.36, 0],
      [1.6, 0.94, 0.45, 0],
      [2.15, 1.02, 0.5, 0],
      [2.55, 0.88, 0.45, 0],
      [2.82, 0.52, 0.3, 0],
      [2.9, 0, 0, 0],
    ],
  })
  for (const side of [-1, 1]) {
    k.oval({
      name: `round-ear-${side}`,
      at: [side * 0.82, 2.72, 0],
      radii: [0.51, 0.55, 0.19],
      colour: hide,
    })
    k.oval({
      name: `inner-ear-${side}`,
      at: [side * 0.82, 2.72, 0.16],
      radii: [0.34, 0.38, 0.04],
      colour: 0xb8aaa2,
    })
    k.oval({
      name: `small-lateral-eye-${side}`,
      at: [side * 0.67, 2.24, 0.39],
      radii: [0.074, 0.074, 0.025],
      colour: INK,
    })
    k.tube({
      name: `arm-${side}`,
      points: [
        [side * 0.7, 1.7, 0],
        [side * 1.03, 1.1, 0.1],
        [side * 1, 0.75, 0.3],
      ],
      radius: 0.17,
      colour: hide,
    })
    k.hand({
      name: `mouse-hand-${side}`,
      at: [side * 1, 0.7, 0.3],
      scale: 0.8,
      colour: hide,
      into: undefined,
      fingers: 4,
    })
    k.oval({
      name: `foot-${side}`,
      at: [side * 0.47, 0.17, 0.27],
      radii: [0.34, 0.17, 0.48],
      colour: hide,
    })
  }
  for (let i = 0; i < 2; i++) {
    const y = 2.7 - i * 0.21
    k.oval({
      name: `central-mark-rim-${i}`,
      at: [0, y, 0.5],
      radii: [0.105, 0.105, 0.025],
      colour: INK,
    })
    k.oval({
      name: `central-mark-centre-${i}`,
      at: [0, y, 0.522],
      radii: [0.082, 0.082, 0.012],
      colour: BONE,
    })
    k.oval({
      name: `central-mark-slit-${i}`,
      at: [0, y, 0.538],
      radii: [0.018, 0.065, 0.008],
      colour: INK,
    })
  }
  k.patch({
    name: 'rectangular-mouth',
    at: [0, 0, 0.505],
    colour: INK,
    points: [
      [-0.41, 2.27],
      [0.41, 2.27],
      [0.41, 1.65],
      [-0.41, 1.65],
    ],
  })
  for (let i = 0; i < 5; i++)
    k.patch({
      name: `upper-triangular-tooth-${i}`,
      at: [(i - 2) * 0.162, 2.27, 0.54],
      colour: BONE,
      points: [
        [-0.079, 0],
        [0.079, 0],
        [0, -0.235],
      ],
    })
  k.heart({ name: 'belly-heart', at: [0, 1.04, 0.6], width: 0.48, colour: INK })
  k.tube({
    name: 'mouse-tail',
    points: [
      [0, 0.5, -0.5],
      [-0.9, 0.35, -0.9],
      [-1.5, 0.7, -0.6],
      [-1.45, 1.15, -0.4],
    ],
    radius: 0.045,
    colour: hide,
  })
  return context.root
}

function neckMane(k: ReturnType<typeof sculptKit>, neckCurve: import('three').CatmullRomCurve3) {
  for (let i = 0; i < 16; i++) {
    const p = neckCurve.getPoint(0.12 + i * 0.044)
    for (const side of [-1, 1])
      k.taper({
        name: `curled-neck-mane-${i}-${side}`,
        colour: 0x554943,
        radii: [0.03, 0.045, 0.026, 0],
        points: [
          [p.x, p.y + 0.14, side * 0.12],
          [p.x - 0.08, p.y + 0.28, side * 0.23],
          [p.x + 0.07, p.y + 0.36, side * 0.32],
          [p.x + 0.15, p.y + 0.27, side * 0.3],
        ],
      })
  }
}

/** Ch. 362/384: equine trunk, human forearms, heels, ringed neck and flail tail. */
export function tserriednichGuardian(seen: Apparition, context: BasicApparitionContext) {
  const k = sculptKit(context, seen.size)
  const hide = 0xc2b4ad
  k.oval({ name: 'equine-trunk', at: [0.1, 1.35, 0], radii: [1.12, 0.67, 0.53], colour: hide })
  k.oval({ name: 'raised-withers', at: [-0.56, 1.79, 0], radii: [0.47, 0.48, 0.4], colour: hide })
  for (const side of [-1, 1]) {
    k.oval({
      name: `haunch-${side}`,
      at: [0.78, 1.3, side * 0.33],
      radii: [0.43, 0.62, 0.33],
      colour: hide,
    })
    k.oval({
      name: `pectoral-${side}`,
      at: [-0.59, 1.39, side * 0.35],
      radii: [0.37, 0.53, 0.3],
      colour: hide,
    })
    k.oval({
      name: `forearm-flexor-${side}`,
      at: [-0.86, 0.73, side * 0.46],
      radii: [0.17, 0.29, 0.15],
      colour: hide,
    })
    k.taper({
      name: `hind-calf-${side}`,
      colour: hide,
      radii: [0.16, 0.12, 0.075],
      points: [
        [0.96, 0.72, side * 0.4],
        [0.86, 0.45, side * 0.41],
        [0.69, 0.18, side * 0.43],
      ],
    })
    k.tube({
      name: `hind-leg-${side}`,
      points: [
        [0.82, 1.1, side * 0.4],
        [0.96, 0.66, side * 0.4],
        [0.69, 0.18, side * 0.43],
      ],
      radius: 0.12,
      colour: hide,
    })
    k.box({
      name: `high-heel-shoe-${side}`,
      at: [0.64, 0.11, side * 0.43],
      dimensions: [0.4, 0.12, 0.17],
      colour: INK,
    })
    k.spike({
      name: `stiletto-${side}`,
      from: [0.82, 0.16, side * 0.43],
      to: [0.86, 0, side * 0.43],
      radius: 0.035,
      colour: INK,
    })
    k.tube({
      name: `human-forearm-${side}`,
      points: [
        [-0.67, 1.5, side * 0.37],
        [-0.86, 0.86, side * 0.46],
        [-0.91, 0.33, side * 0.48],
      ],
      radius: 0.13,
      colour: hide,
    })
    k.hand({ name: `human-hand-${side}`, at: [-0.94, 0.3, side * 0.48], scale: 0.6, colour: hide })
    for (let i = 0; i < 5; i++)
      k.spike({
        name: `long-nail-${side}-${i}`,
        from: [-1.04 + i * 0.05, 0.07, side * 0.48 + 0.07],
        to: [-1.13 + i * 0.05, 0.02, side * 0.48 + 0.18],
        radius: 0.018,
        colour: INK,
      })
  }
  const path = [
    [-0.65, 1.65, 0],
    [-1, 2.15, 0],
    [-1.55, 2.3, 0],
    [-1.95, 1.8, 0],
    [-2, 1.25, 0],
  ] as const
  k.tube({ name: 'extended-neck', points: path, radius: 0.21, colour: hide })
  const neckCurve = new context.THREE.CatmullRomCurve3(
    path.map((p) => new context.THREE.Vector3(...p)),
  )
  for (let i = 0; i < 19; i++) {
    const t = i / 18
    const point = neckCurve.getPoint(t)
    const ring = k.add({
      geometry: new context.THREE.TorusGeometry(seen.size * 0.22, seen.size * 0.025, 6, 20),
      colour: 0x71655f,
      at: [point.x, point.y, point.z],
      name: `neck-ring-${i}`,
    })
    ring.quaternion.setFromUnitVectors(
      new context.THREE.Vector3(0, 0, 1),
      neckCurve.getTangent(t).normalize(),
    )
  }
  neckMane(k, neckCurve)
  const head = new context.THREE.Group()
  head.name = 'female-head'
  head.position.set(-2 * seen.size, 1.1 * seen.size, 0)
  head.rotation.set(0, -Math.PI / 2, -0.32)
  const h = buildNenFemaleFace(
    { ...context, root: head },
    {
      size: seen.size,
      skin: hide,
      width: 0.27,
      height: 0.41,
      depth: 0.225,
      eye: 0.095,
    },
  )
  for (const side of [-1, 1]) {
    h.taper({
      name: `swept-horn-${side}`,
      points: [
        [side * 0.23, 0.28, -0.05],
        [side * 0.42, 0.54, -0.17],
        [side * 0.67, 0.84, -0.35],
      ],
      radii: [0.105, 0.08, 0],
      colour: hide,
    })
  }
  for (let i = 0; i < 42; i++) {
    const a = (i * Math.PI * 2) / 42
    h.taper({
      name: `mane-lock-${i}`,
      points: [
        [Math.cos(a) * 0.28, Math.sin(a) * 0.36, -0.07],
        [Math.cos(a) * 0.48, Math.sin(a) * 0.6, -0.18],
        [Math.cos(a) * 0.59 + Math.sin(i) * 0.1, Math.max(-0.68, Math.sin(a) * 0.78 - 0.16), -0.07],
        [Math.cos(a) * 0.68, Math.max(-0.72, Math.sin(a) * 0.84 - 0.28), 0.02],
        [Math.cos(a) * 0.65 - Math.sin(i) * 0.08, Math.max(-0.78, Math.sin(a) * 0.89 - 0.39), 0.04],
      ],
      radii: [0.045, 0.055, 0.045, 0.025, 0],
      colour: 0x554943,
    })
  }
  // This is the mouth's revealed head, never an unrelated animal on the back.
  if (seen.stage > 0) {
    h.oval({ name: 'revealed-mouth', at: [0, -0.2, 0.28], radii: [0.22, 0.23, 0.05], colour: INK })
    h.oval({ name: 'inner-head', at: [0, -0.18, 0.37], radii: [0.12, 0.17, 0.1], colour: hide })
    for (const side of [-1, 1])
      h.tube({
        name: `oral-tendril-${side}`,
        points: [
          [side * 0.13, -0.2, 0.35],
          [side * 0.33, -0.33, 0.55],
          [side * 0.25, -0.56, 0.65],
        ],
        radius: 0.035,
        colour: hide,
      })
  }
  context.root.add(head)
  k.tube({
    name: 'flail-tail',
    points: [
      [1.1, 1.65, 0],
      [1.65, 1.95, 0],
      [1.8, 2.6, 0],
      [1.43, 2.96, 0],
    ],
    radius: 0.075,
    colour: INK,
  })
  k.oval({ name: 'flail-head', at: [1.43, 3.02, 0], radii: [0.22, 0.25, 0.22], colour: hide })
  for (let i = 0; i < 9; i++) {
    const a = (i * Math.PI * 2) / 9
    k.spike({
      name: `flail-spike-${i}`,
      from: [1.43 + Math.cos(a) * 0.2, 3.02, Math.sin(a) * 0.2],
      to: [1.43 + Math.cos(a) * 0.47, 3.12, Math.sin(a) * 0.47],
      radius: 0.055,
      colour: hide,
    })
  }
  return head
}
