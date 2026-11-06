import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK } from './nenModelPrimitives'
import { sculptKit } from './nenSculptPrimitives'

function ogreFace(k: ReturnType<typeof sculptKit>, hide: number) {
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
  k.almond({ name: 'single-horizontal-eye', at: [0, 2.115, 0.704], width: 0.35, height: 0.1 })
  k.taper({
    name: 'massive-brow',
    colour: hide,
    radii: [0.04, 0.1, 0.1, 0.04],
    points: [
      [-0.45, 2.29, 0.48],
      [-0.23, 2.27, 0.66],
      [0.23, 2.27, 0.66],
      [0.45, 2.29, 0.48],
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
      name: `cheek-fold-${side}`,
      colour: 0x827b70,
      radii: [0.008, 0.018, 0.004],
      points: [
        [side * 0.39, 2.08, 0.56],
        [side * 0.44, 1.89, 0.58],
        [side * 0.3, 1.69, 0.62],
      ],
    })
    for (let i = 0; i < 3; i++)
      k.taper({
        name: `forehead-crease-${side}-${i}`,
        colour: 0x827b70,
        radii: [0.002, 0.009, 0.001],
        points: [
          [side * (0.09 + i * 0.08), 2.62 - i * 0.04, 0.34],
          [side * (0.15 + i * 0.09), 2.44 - i * 0.03, 0.46],
          [side * (0.27 + i * 0.07), 2.3, 0.48],
        ],
      })
  }
  k.oval({
    name: 'downturned-mouth',
    at: [0, 1.67, 0.635],
    radii: [0.27, 0.085, 0.025],
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

export function buildHalkenburgFigure(seen: Apparition, context: BasicApparitionContext) {
  const k = sculptKit(context, seen.size),
    hide = 0xafa99e
  k.oval({
    name: 'hunched-shoulder-girdle',
    at: [0, 1.84, -0.15],
    radii: [1.1, 0.87, 0.57],
    colour: hide,
  })
  k.oval({ name: 'crouched-body', at: [0, 1.04, -0.05], radii: [0.62, 0.74, 0.43], colour: hide })
  for (const side of [-1, 1]) {
    k.taper({
      name: `muscular-arm-${side}`,
      colour: hide,
      radii: [0.32, 0.29, 0.2],
      points: [
        [side * 0.85, 1.65, 0.02],
        [side * 1.12, 0.94, 0.23],
        [side * 0.62, 0.74, 0.87],
      ],
    })
    k.oval({
      name: `forearm-flexor-${side}`,
      at: [side * 0.9, 0.88, 0.58],
      radii: [0.35, 0.23, 0.25],
      colour: hide,
    })
    k.hand({ name: `massive-hand-${side}`, at: [side * 0.59, 0.71, 0.9], scale: 1.5, colour: hide })
    k.oval({
      name: `crouched-thigh-${side}`,
      at: [side * 0.49, 0.5, -0.07],
      radii: [0.36, 0.46, 0.37],
      colour: hide,
    })
    for (let i = 0; i < 3; i++) {
      const y = 2.29 + i * 0.18
      k.taper({
        name: `temple-horn-${side}-${i}`,
        colour: hide,
        radii: [0.11, 0.095, 0.055, 0],
        points: [
          [side * 0.37, y, 0.03],
          [side * (0.69 + i * 0.1), y + 0.03, 0],
          [side * (0.79 + i * 0.1), y + 0.18, -0.1],
          [side * (0.7 + i * 0.1), y + 0.33, -0.16],
        ],
      })
    }
  }
  featherMantle(k)
  ogreFace(k, hide)
  const crown = new context.THREE.Group()
  crown.name = 'dorsal-orifice'
  crown.position.set(0, 2.73 * seen.size, -0.17 * seen.size)
  crown.rotation.x = -0.65
  const c = sculptKit({ ...context, root: crown }, seen.size)
  c.oval({ name: 'raised-orifice-rim', at: [0, 0, 0], radii: [0.2, 0.3, 0.08], colour: hide })
  c.oval({ name: 'dark-orifice', at: [0, 0, 0.075], radii: [0.12, 0.22, 0.015], colour: INK })
  context.root.add(crown)
  return context.root
}
