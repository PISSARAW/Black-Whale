import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK } from './nenModelPrimitives'
import { sculptKit } from './nenSculptPrimitives'
import { buildNenFemaleFace } from './nenFemaleFace'

function cookieHead(seen: Apparition, context: BasicApparitionContext) {
  const head = new context.THREE.Group()
  head.name = 'cookie-portrait'
  head.position.set(0, 1.55 * seen.size, 0.02 * seen.size)
  context.root.add(head)
  const k = buildNenFemaleFace(
    { ...context, root: head },
    {
      size: seen.size,
      skin: 0xe7d3be,
      width: 0.155,
      height: 0.205,
      depth: 0.135,
      eye: 0.19,
    },
  )
  const hair = 0xb9adb2
  k.loft({
    name: 'side-part-hair-crown',
    colour: hair,
    sections: [
      [-0.13, 0.17, 0.12, -0.07],
      [0.12, 0.18, 0.15, -0.045],
      [0.24, 0.12, 0.1, -0.02],
      [0.265, 0, 0, -0.02],
    ],
  })
  for (const side of [-1, 1]) {
    k.oval({
      name: `ear-${side}`,
      at: [side * 0.153, -0.01, 0],
      radii: [0.03, 0.055, 0.026],
      colour: 0xe7d3be,
    })
    for (let i = 0; i < 12; i++) {
      const x = side * (0.1 + i * 0.006)
      k.taper({
        name: `straight-hair-${side}-${i}`,
        colour: hair,
        radii: [0.018, 0.017, 0.012, 0.001],
        points: [
          [x, 0.12, -0.09],
          [side * (0.15 + i * 0.004), -0.06, -0.14],
          [side * (0.16 + i * 0.003), -0.29, -0.18],
          [side * (0.15 + i * 0.004), -0.57 + i * 0.004, -0.2],
        ],
      })
    }
    k.tube({
      name: `lash-${side}`,
      colour: INK,
      radius: 0.007,
      points: [
        [side * 0.103, 0.06, 0.139],
        [side * 0.133, 0.071, 0.128],
        [side * 0.143, 0.088, 0.113],
      ],
    })
  }
  // Long sweep from the left part to the right temple; the face stays uncovered.
  for (let i = 0; i < 9; i++)
    k.taper({
      name: `swept-fringe-${i}`,
      colour: hair,
      radii: [0.016, 0.02, 0.014, 0.001],
      points: [
        [-0.07 - i * 0.009, 0.19 - i * 0.004, 0.09],
        [0.02, 0.21 - i * 0.007, 0.12],
        [0.13, 0.13 - i * 0.008, 0.13],
        [0.17, 0.04 - i * 0.007, 0.04],
      ],
    })
}

export function buildCookieFigure(seen: Apparition, context: BasicApparitionContext) {
  const k = sculptKit(context, seen.size),
    skin = 0xe7d3be
  k.loft({
    name: 'fitted-dress',
    colour: BONE,
    sections: [
      [0.36, 0.3, 0.17, 0],
      [0.62, 0.27, 0.16, 0],
      [0.94, 0.15, 0.105, 0],
      [1.12, 0.2, 0.14, 0],
      [1.27, 0.22, 0.13, 0],
      [1.32, 0.17, 0.095, 0],
    ],
  })
  k.taper({
    name: 'neck',
    colour: skin,
    radii: [0.065, 0.055, 0.06],
    points: [
      [0, 1.26, 0],
      [0, 1.34, 0],
      [0, 1.4, 0.01],
    ],
  })
  k.patch({
    name: 'fitted-dark-apron',
    colour: INK,
    at: [0, 0, 0.167],
    points: [
      [-0.17, 1.22],
      [0.17, 1.22],
      [0.12, 0.96],
      [0.16, 0.83],
      [0.28, 0.4],
      [-0.28, 0.4],
      [-0.16, 0.83],
      [-0.12, 0.96],
    ],
  })
  for (let i = 0; i < 3; i++)
    k.heart({
      name: `apron-heart-button-${i}`,
      at: [0, 1.15 - i * 0.12, 0.2],
      width: 0.044,
      colour: BONE,
    })
  for (const side of [-1, 1]) {
    k.patch({
      name: `wide-collar-${side}`,
      colour: BONE,
      at: [0, 0, 0.183],
      points: [
        [side * 0.06, 1.36],
        [side * 0.19, 1.31],
        [side * 0.17, 1.15],
        [0, 1.22],
      ],
    })
    k.oval({
      name: `short-sleeve-${side}`,
      at: [side * 0.235, 1.24, 0],
      radii: [0.093, 0.12, 0.105],
      colour: BONE,
    })
    k.taper({
      name: `arm-${side}`,
      colour: skin,
      radii: [0.052, 0.045, 0.032],
      points: [
        [side * 0.26, 1.19, 0],
        [side * 0.36, 1.01, 0.09],
        [side * 0.29, 0.87, 0.27],
      ],
    })
    k.hand({
      name: `massage-hand-${side}`,
      at: [side * 0.29, 0.87, 0.27],
      scale: 0.3,
      colour: skin,
    })
    k.taper({
      name: `leg-${side}`,
      colour: skin,
      radii: [0.065, 0.05, 0.035],
      points: [
        [side * 0.12, 0.39, 0],
        [side * 0.12, 0.23, 0],
        [side * 0.12, 0.07, 0.01],
      ],
    })
    k.oval({
      name: `shoe-${side}`,
      at: [side * 0.12, 0.045, 0.045],
      radii: [0.06, 0.045, 0.12],
      colour: INK,
    })
    k.patch({
      name: `back-bow-${side}`,
      colour: INK,
      at: [0, 0.97, -0.13],
      points: [
        [0, 0],
        [side * 0.15, 0.08],
        [side * 0.15, -0.065],
      ],
    })
  }
  k.box({
    name: 'blank-name-badge',
    at: [0.105, 1.19, 0.215],
    dimensions: [0.11, 0.06, 0.01],
    colour: BONE,
  })
  cookieHead(seen, context)
  return context.root
}
