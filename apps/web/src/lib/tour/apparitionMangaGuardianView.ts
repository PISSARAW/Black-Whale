import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK, modelKit } from './nenModelPrimitives'

/** Momoze's one mouse-shaped guardian and its smaller copies share an anatomy. */
export function momoze(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  const hide = 0xd3c9c3
  k.oval({ name: 'mouse-body', at: [0, 1.12, 0], radii: [0.83, 1.12, 0.62], colour: hide })
  k.oval({ name: 'mouse-head', at: [0, 2.12, 0], radii: [0.94, 0.78, 0.55], colour: hide })
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
      colour: INK,
    })
    k.oval({
      name: `forehead-eye-mark-${side}`,
      at: [side * 0.32, 2.47, 0.49],
      radii: [0.11, 0.26, 0.025],
      colour: INK,
    })
    k.oval({
      name: `eye-mark-centre-${side}`,
      at: [side * 0.32, 2.47, 0.515],
      radii: [0.04, 0.15, 0.012],
      colour: BONE,
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
  k.oval({ name: 'grinning-mouth', at: [0, 1.98, 0.53], radii: [0.67, 0.32, 0.055], colour: INK })
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 0.13
    for (const side of [-1, 1])
      k.spike({
        name: `tooth-${side}-${i}`,
        from: [x, 1.98 + side * (0.22 - Math.abs(x) * 0.1), 0.59],
        to: [x, 1.98 + side * 0.04, 0.61],
        radius: 0.065,
        colour: BONE,
      })
  }
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

/** Ch. 362/384: equine trunk, human forearms, heels, ringed neck and flail tail. */
export function tserriednichGuardian(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  const hide = 0xc2b4ad
  k.oval({ name: 'equine-trunk', at: [0.1, 1.35, 0], radii: [1.12, 0.67, 0.53], colour: hide })
  for (const side of [-1, 1]) {
    k.oval({
      name: `haunch-${side}`,
      at: [0.78, 1.3, side * 0.33],
      radii: [0.43, 0.62, 0.33],
      colour: hide,
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
  for (let i = 0; i < 11; i++) {
    const t = i / 10
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
  const head = new context.THREE.Group()
  head.name = 'female-head'
  head.position.set(-2 * seen.size, 1.1 * seen.size, 0)
  head.rotation.y = -Math.PI / 2
  const h = modelKit({ ...context, root: head }, seen.size)
  h.oval({ name: 'face', at: [0, 0, 0], radii: [0.3, 0.39, 0.23], colour: hide })
  h.oval({ name: 'nose', at: [0, -0.02, 0.23], radii: [0.055, 0.12, 0.09], colour: hide })
  for (const side of [-1, 1]) {
    h.tube({
      name: `swept-horn-${side}`,
      points: [
        [side * 0.23, 0.28, -0.05],
        [side * 0.4, 0.62, -0.15],
        [side * 0.48, 0.88, -0.4],
        [side * 0.4, 1.1, -0.6],
      ],
      radius: 0.075,
      colour: hide,
    })
    h.eye({ name: `human-eye-${side}`, at: [side * 0.13, 0.09, 0.21], radius: 0.065 })
    h.tube({
      name: `brow-${side}`,
      points: [
        [side * 0.05, 0.18, 0.22],
        [side * 0.13, 0.2, 0.23],
        [side * 0.23, 0.16, 0.17],
      ],
      radius: 0.025,
      colour: INK,
    })
  }
  h.tube({
    name: 'lips',
    points: [
      [-0.12, -0.18, 0.2],
      [0, -0.2, 0.25],
      [0.12, -0.18, 0.2],
    ],
    radius: 0.025,
    colour: INK,
  })
  for (let i = 0; i < 28; i++) {
    const a = (i * Math.PI * 2) / 28
    h.tube({
      name: `mane-lock-${i}`,
      points: [
        [Math.cos(a) * 0.28, Math.sin(a) * 0.36, -0.07],
        [Math.cos(a) * 0.56, Math.sin(a) * 0.65, -0.1],
        [Math.cos(a) * 0.63 + Math.sin(i) * 0.13, Math.max(-0.7, Math.sin(a) * 0.85 - 0.2), 0.02],
        [Math.cos(a) * 0.7, Math.max(-0.7, Math.sin(a) * 0.9 - 0.42), 0.03],
      ],
      radius: 0.055,
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
