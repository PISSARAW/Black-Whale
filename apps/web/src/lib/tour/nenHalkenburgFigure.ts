import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK, type Point } from './nenModelPrimitives'
import { sculptKit } from './nenSculptPrimitives'

const HIDE = 0xafa99e
const DARK_HIDE = 0x8a847a
const CREASE = 0x827b70

function hornRidges(k: ReturnType<typeof sculptKit>, side: number) {
  const ridges: readonly Point[] = [
    [side * 0.38, 2.62, 0.18],
    [side * 0.52, 2.69, 0.12],
    [side * 0.64, 2.67, 0.04],
    [side * 0.74, 2.61, -0.05],
    [side * 0.82, 2.52, -0.12],
    [side * 0.86, 2.4, -0.18],
    [side * 0.78, 2.26, -0.21],
  ]
  ridges.forEach(([x, y, z], i) => {
    k.oval({
      name: `horn-ridge-${side}-${i}`,
      at: [x, y, z],
      radii: [0.12 - i * 0.012, 0.026, 0.12 - i * 0.012],
      colour: DARK_HIDE,
    })
  })
}

function ramHorns(k: ReturnType<typeof sculptKit>, hide: number) {
  for (const side of [-1, 1]) {
    const hornPoints: readonly Point[] = [
      [side * 0.28, 2.54, 0.22],
      [side * 0.52, 2.7, 0.12],
      [side * 0.74, 2.62, -0.05],
      [side * 0.88, 2.42, -0.18],
      [side * 0.68, 2.12, -0.22],
    ]
    k.taper({
      name: `ram-horn-${side}`,
      colour: hide,
      radii: [0.15, 0.13, 0.1, 0.065, 0.025],
      points: hornPoints,
    })
    hornRidges(k, side)
  }
}

function crownCrest(k: ReturnType<typeof sculptKit>, hide: number) {
  const crestSpikes: readonly { from: Point; to: Point; radius: number }[] = [
    { from: [-0.18, 2.62, 0.3], to: [-0.22, 2.82, 0.28], radius: 0.045 },
    { from: [-0.09, 2.65, 0.32], to: [-0.11, 2.88, 0.3], radius: 0.05 },
    { from: [0, 2.67, 0.34], to: [0, 2.92, 0.32], radius: 0.055 },
    { from: [0.09, 2.65, 0.32], to: [0.11, 2.88, 0.3], radius: 0.05 },
    { from: [0.18, 2.62, 0.3], to: [0.22, 2.82, 0.28], radius: 0.045 },
  ]
  crestSpikes.forEach((s, i) => {
    k.spike({
      name: `crown-crest-${i}`,
      from: s.from,
      to: s.to,
      radius: s.radius,
      colour: hide,
    })
  })
}

function templeSpines(k: ReturnType<typeof sculptKit>, hide: number) {
  for (const side of [-1, 1]) {
    const spines: readonly { from: Point; to: Point; r: number }[] = [
      { from: [side * 0.34, 2.44, 0.32], to: [side * 0.68, 2.46, 0.18], r: 0.06 },
      { from: [side * 0.38, 2.28, 0.42], to: [side * 0.82, 2.32, 0.26], r: 0.075 },
      { from: [side * 0.4, 2.1, 0.5], to: [side * 0.78, 2.12, 0.36], r: 0.07 },
      { from: [side * 0.36, 1.9, 0.54], to: [side * 0.68, 1.88, 0.44], r: 0.06 },
      { from: [side * 0.28, 1.7, 0.56], to: [side * 0.52, 1.64, 0.48], r: 0.05 },
    ]
    spines.forEach((s, i) => {
      k.taper({
        name: `temple-spine-${side}-${i}`,
        colour: hide,
        radii: [s.r, s.r * 0.7, 0],
        points: [
          s.from,
          [
            (s.from[0] + s.to[0]) * 0.5,
            (s.from[1] + s.to[1]) * 0.5 + 0.02,
            (s.from[2] + s.to[2]) * 0.5 - 0.02,
          ],
          s.to,
        ],
      })
    })
  }
}

function cyclopsEye(k: ReturnType<typeof sculptKit>, hide: number) {
  const at: Point = [0, 2.12, 0.7]
  k.oval({ name: 'cyclops-sclera', at, radii: [0.34, 0.19, 0.06], colour: BONE })
  k.oval({
    name: 'cyclops-iris',
    at: [at[0], at[1], at[2] + 0.035],
    radii: [0.17, 0.16, 0.03],
    colour: hide,
  })
  k.tube({
    name: 'cyclops-iris-rim',
    radius: 0.012,
    colour: INK,
    points: [
      [-0.14, at[1] + 0.08, at[2] + 0.045],
      [0, at[1] + 0.15, at[2] + 0.05],
      [0.14, at[1] + 0.08, at[2] + 0.045],
      [0.16, at[1] - 0.04, at[2] + 0.045],
      [0, at[1] - 0.14, at[2] + 0.05],
      [-0.14, at[1] - 0.04, at[2] + 0.045],
      [-0.14, at[1] + 0.08, at[2] + 0.045],
    ],
  })
  k.oval({
    name: 'cyclops-pupil',
    at: [at[0], at[1], at[2] + 0.052],
    radii: [0.085, 0.085, 0.02],
    colour: INK,
  })
  k.taper({
    name: 'cyclops-upper-hood',
    colour: hide,
    radii: [0.04, 0.07, 0.07, 0.04],
    points: [
      [-0.38, at[1] + 0.06, at[2] + 0.01],
      [-0.18, at[1] + 0.18, at[2] + 0.04],
      [0.18, at[1] + 0.18, at[2] + 0.04],
      [0.38, at[1] + 0.06, at[2] + 0.01],
    ],
  })
  k.tube({
    name: 'cyclops-upper-crease',
    radius: 0.012,
    colour: INK,
    points: [
      [-0.34, at[1] + 0.05, at[2] + 0.03],
      [0, at[1] + 0.16, at[2] + 0.05],
      [0.34, at[1] + 0.05, at[2] + 0.03],
    ],
  })
  k.tube({
    name: 'cyclops-lower-lid',
    radius: 0.01,
    colour: INK,
    points: [
      [-0.32, at[1] - 0.02, at[2] + 0.025],
      [0, at[1] - 0.14, at[2] + 0.04],
      [0.32, at[1] - 0.02, at[2] + 0.025],
    ],
  })
}

function facialFoldsAndSnout(k: ReturnType<typeof sculptKit>, hide: number) {
  k.taper({
    name: 'massive-brow',
    colour: hide,
    radii: [0.05, 0.11, 0.11, 0.05],
    points: [
      [-0.45, 2.32, 0.48],
      [-0.22, 2.31, 0.68],
      [0.22, 2.31, 0.68],
      [0.45, 2.32, 0.48],
    ],
  })
  k.oval({ name: 'broad-nasal-pad', at: [0, 1.88, 0.68], radii: [0.36, 0.14, 0.19], colour: hide })
  for (const side of [-1, 1]) {
    k.oval({
      name: `deep-nostril-${side}`,
      at: [side * 0.16, 1.94, 0.846],
      radii: [0.065, 0.034, 0.015],
      colour: INK,
    })
    k.taper({
      name: `nasal-wing-${side}`,
      colour: CREASE,
      radii: [0.008, 0.016, 0.006],
      points: [
        [side * 0.08, 2.02, 0.8],
        [side * 0.22, 1.94, 0.83],
        [side * 0.16, 1.86, 0.78],
      ],
    })
    k.taper({
      name: `under-eye-crease-${side}`,
      colour: CREASE,
      radii: [0.005, 0.014, 0.005],
      points: [
        [side * 0.06, 1.98, 0.72],
        [side * 0.24, 1.99, 0.68],
        [side * 0.36, 2.06, 0.6],
      ],
    })
    k.taper({
      name: `cheek-fold-${side}`,
      colour: CREASE,
      radii: [0.008, 0.018, 0.004],
      points: [
        [side * 0.39, 2.08, 0.56],
        [side * 0.44, 1.89, 0.58],
        [side * 0.3, 1.69, 0.62],
      ],
    })
    for (let i = 0; i < 3; i++) {
      k.taper({
        name: `forehead-crease-${side}-${i}`,
        colour: CREASE,
        radii: [0.002, 0.009, 0.001],
        points: [
          [side * (0.07 + i * 0.08), 2.62 - i * 0.04, 0.38],
          [side * (0.13 + i * 0.09), 2.46 - i * 0.03, 0.5],
          [side * (0.24 + i * 0.07), 2.34, 0.54],
        ],
      })
    }
  }
  k.oval({
    name: 'downturned-mouth',
    at: [0, 1.67, 0.635],
    radii: [0.28, 0.085, 0.025],
    colour: INK,
  })
  k.taper({
    name: 'heavy-lower-lip',
    colour: hide,
    radii: [0.015, 0.07, 0.015],
    points: [
      [-0.28, 1.65, 0.65],
      [0, 1.59, 0.71],
      [0.28, 1.65, 0.65],
    ],
  })
}

function ribbedChin(k: ReturnType<typeof sculptKit>, hide: number) {
  k.oval({
    name: 'chin-base-pad',
    at: [0, 1.48, 0.62],
    radii: [0.26, 0.16, 0.18],
    colour: hide,
  })
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.062
    k.taper({
      name: `chin-ridge-${i}`,
      colour: CREASE,
      radii: [0.004, 0.014, 0.004],
      points: [
        [x, 1.58, 0.69 - Math.abs(x) * 0.12],
        [x * 1.05, 1.47, 0.72 - Math.abs(x) * 0.12],
        [x * 0.9, 1.36, 0.65 - Math.abs(x) * 0.12],
      ],
    })
  }
}

function darkTorsoAndArms(k: ReturnType<typeof sculptKit>, hide: number) {
  k.oval({
    name: 'black-shadow-torso',
    at: [0, 1.25, 0.08],
    radii: [0.55, 0.68, 0.38],
    colour: INK,
  })
  k.oval({
    name: 'hunched-shoulder-girdle',
    at: [0, 1.95, -0.12],
    radii: [1.12, 0.88, 0.58],
    colour: hide,
  })
  for (const side of [-1, 1]) {
    k.taper({
      name: `muscular-arm-${side}`,
      colour: hide,
      radii: [0.34, 0.3, 0.22],
      points: [
        [side * 0.88, 1.85, 0.02],
        [side * 1.15, 1.25, 0.2],
        [side * 0.82, 1.2, 0.45],
      ],
    })
    k.oval({
      name: `crouched-thigh-${side}`,
      at: [side * 0.49, 0.5, -0.07],
      radii: [0.36, 0.46, 0.37],
      colour: hide,
    })
  }
}

function clawedHands(k: ReturnType<typeof sculptKit>, hide: number) {
  for (const side of [-1, 1]) {
    k.oval({
      name: `claw-palm-${side}`,
      at: [side * 0.48, 1.4, 0.44],
      radii: [0.15, 0.12, 0.14],
      colour: hide,
    })
    for (let c = 0; c < 4; c++) {
      const clawSpread = (c - 1.5) * 0.08
      const xBase = side * (0.45 + clawSpread)
      const yBase = 1.38
      const zBase = 0.48 + (1.5 - Math.abs(c - 1.5)) * 0.03
      k.taper({
        name: `predatory-claw-${side}-${c}`,
        colour: BONE,
        radii: [0.045, 0.038, 0.018, 0.002],
        points: [
          [xBase, yBase, zBase],
          [xBase - side * 0.02, yBase - 0.08, zBase + 0.12],
          [xBase - side * 0.04, yBase - 0.22, zBase + 0.14],
          [xBase - side * 0.05, yBase - 0.32, zBase + 0.08],
        ],
      })
      k.oval({
        name: `claw-knuckle-${side}-${c}`,
        at: [xBase, yBase, zBase],
        radii: [0.042, 0.042, 0.042],
        colour: hide,
      })
    }
  }
}

function featherMantle(k: ReturnType<typeof sculptKit>) {
  for (const side of [-1, 1])
    for (let row = 0; row < 5; row++)
      for (let i = 0; i < 10; i++) {
        const x = side * (0.62 + i * 0.12 + row * 0.04)
        const y = 2.61 - row * 0.29 - i * 0.057
        const z = 0.35 + row * 0.05
        const length = 0.43 + row * 0.045
        const feather = k.patch({
          name: `pointed-feather-${side}-${row}-${i}`,
          colour: row % 2 ? 0xd4cfc3 : BONE,
          at: [x, y, z],
          points: [
            [0, 0.1],
            [-0.075, -0.03],
            [-0.09, -length * 0.48],
            [-0.035, -length],
            [0, -length - 0.12],
            [0.075, -length * 0.47],
            [0.07, -0.02],
          ],
        })
        feather.rotation.z = side * (-0.32 - i * 0.016)
        k.taper({
          name: `feather-quill-${side}-${row}-${i}`,
          colour: 0x8e897e,
          radii: [0.005, 0.005, 0],
          points: [
            [x, y + 0.06, z + 0.03],
            [x - side * 0.065, y - length * 0.5, z + 0.035],
            [x - side * 0.13, y - length, z + 0.03],
          ],
        })
      }
}

function apexOrifice(context: BasicApparitionContext, size: number, hide: number) {
  const crown = new context.THREE.Group()
  crown.name = 'dorsal-orifice'
  crown.position.set(0, 2.82 * size, 0.14 * size)
  crown.rotation.x = -0.22
  const c = sculptKit({ ...context, root: crown }, size)
  c.oval({ name: 'raised-orifice-rim', at: [0, 0, 0], radii: [0.18, 0.26, 0.08], colour: hide })
  c.oval({ name: 'dark-orifice', at: [0, 0, 0.06], radii: [0.11, 0.19, 0.02], colour: INK })
  context.root.add(crown)
}

function ogreHeadLoft(k: ReturnType<typeof sculptKit>, hide: number) {
  k.loft({
    name: 'heavy-forehead-and-jaw',
    colour: hide,
    sections: [
      [1.45, 0, 0, 0.32],
      [1.55, 0.33, 0.28, 0.32],
      [1.8, 0.5, 0.34, 0.29],
      [2.1, 0.49, 0.39, 0.23],
      [2.38, 0.43, 0.36, 0.15],
      [2.65, 0.31, 0.29, 0.08],
      [2.75, 0, 0, 0.04],
    ],
  })
}

export function buildHalkenburgFigure(seen: Apparition, context: BasicApparitionContext) {
  const k = sculptKit(context, seen.size)
  darkTorsoAndArms(k, HIDE)
  clawedHands(k, HIDE)
  featherMantle(k)
  ogreHeadLoft(k, HIDE)
  cyclopsEye(k, HIDE)
  facialFoldsAndSnout(k, HIDE)
  ribbedChin(k, HIDE)
  templeSpines(k, HIDE)
  crownCrest(k, HIDE)
  ramHorns(k, HIDE)
  apexOrifice(context, seen.size, HIDE)
  return context.root
}
