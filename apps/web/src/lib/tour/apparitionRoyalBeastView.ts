import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK } from './nenModelPrimitives'
import { buildBenjaminFigure } from './nenBenjaminFigure'
import { buildHalkenburgFigure } from './nenHalkenburgFigure'
import { sculptKit } from './nenSculptPrimitives'

function nasubi(seen: Apparition, context: BasicApparitionContext) {
  const k = sculptKit(context, seen.size),
    flesh = 0xc7bcb0
  for (const side of [-1, 1]) {
    k.oval({
      name: `lateral-body-${side}`,
      at: [side * 0.9, 1.7, -0.2],
      radii: [0.95, 1.45, 0.4],
      colour: flesh,
    })
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 2; col++) {
        const x = side * (0.6 + col * 0.55),
          y = 0.5 + row * 0.37
        k.oval({
          name: `flesh-mound-${side}-${row}-${col}`,
          at: [x, y, 0.2],
          radii: [0.34, 0.29, 0.3],
          colour: flesh,
        })
        k.taper({
          name: `mound-tip-${side}-${row}-${col}`,
          points: [
            [x, y, 0.45],
            [x + side * 0.045, y - 0.02, 0.58],
            [x + side * 0.065, y - 0.03, 0.64],
          ],
          radii: [0.085, 0.075, 0.055],
          colour: 0x918176,
        })
        k.taper({
          name: `mound-fold-${side}-${row}-${col}`,
          colour: 0x9d9084,
          radii: [0.003, 0.008, 0.003],
          points: [
            [x - 0.24, y + 0.13, 0.34],
            [x - 0.14, y - 0.19, 0.4],
            [x + 0.19, y - 0.2, 0.36],
          ],
        })
      }
    for (let i = 0; i < 5; i++) {
      const y = 0.5 + i * 0.57
      k.taper({
        name: `jointed-leg-${side}-${i}`,
        points: [
          [side * 1.4, y, -0.05],
          [side * 2.02, y + 0.3, -0.04],
          [side * 2.22, y - 0.38, 0.18],
        ],
        radii: [0.1, 0.065, 0.04],
        colour: flesh,
      })
      for (let spike = 0; spike < 5; spike++) {
        const x = side * (1.47 + spike * 0.1)
        k.spike({
          name: `limb-spine-${side}-${i}-${spike}`,
          colour: flesh,
          radius: 0.025,
          from: [x, y + spike * 0.05, -0.05],
          to: [x + side * 0.08, y + 0.21 + spike * 0.05, -0.09],
        })
      }
      k.hand({
        name: `human-hand-${side}-${i}`,
        at: [side * 2.22, y - 0.4, 0.18],
        scale: 0.75,
        colour: flesh,
      })
    }
    k.oval({
      name: `enormous-ear-${side}`,
      at: [side * 0.47, 2.1, 0.55],
      radii: [0.19, 0.37, 0.07],
      colour: flesh,
    })
    k.tube({
      name: `ear-fold-${side}`,
      points: [
        [side * 0.39, 2.35, 0.62],
        [side * 0.55, 2.32, 0.63],
        [side * 0.53, 1.97, 0.63],
      ],
      radius: 0.025,
      colour: INK,
    })
    for (let lock = 0; lock < 20; lock++)
      k.taper({
        name: `long-hair-${side}-${lock}`,
        points: [
          [side * (0.08 + lock * 0.015), 2.8, 0.1],
          [side * (0.31 + lock * 0.025), 1.8, 0.65],
          [side * (0.4 + lock * 0.027), 0.56 + Math.sin(lock) * 0.09, 0.7],
        ],
        radii: [0.03, 0.035, 0.001],
        colour: INK,
      })
  }
  k.loft({
    name: 'elongated-human-mask',
    colour: BONE,
    sections: [
      [1.28, 0, 0, 0.35],
      [1.4, 0.18, 0.12, 0.35],
      [1.8, 0.27, 0.16, 0.33],
      [2.16, 0.29, 0.19, 0.3],
      [2.62, 0.2, 0.14, 0.25],
      [2.72, 0.15, 0.11, 0.23],
      [2.81, 0.08, 0.07, 0.21],
      [2.86, 0, 0, 0.2],
    ],
  })
  for (const side of [-1, 1]) {
    const at = [side * 0.155, 2.13, 0.485] as const
    k.oval({ name: `round-eye-rim-${side}`, at, radii: [0.105, 0.105, 0.025], colour: INK })
    k.oval({
      name: `round-eye-white-${side}`,
      at: [at[0], at[1], 0.506],
      radii: [0.082, 0.082, 0.016],
      colour: BONE,
    })
    k.oval({
      name: `round-eye-pupil-${side}`,
      at: [at[0], at[1], 0.523],
      radii: [0.052, 0.055, 0.012],
      colour: INK,
    })
    k.taper({
      name: `mask-cheek-fold-${side}`,
      colour: 0x89786e,
      radii: [0.001, 0.009, 0.002],
      points: [
        [side * 0.27, 2.01, 0.44],
        [side * 0.24, 1.76, 0.46],
        [side * 0.17, 1.5, 0.47],
      ],
    })
    k.taper({
      name: `vertical-mouth-lip-${side}`,
      colour: 0xa29386,
      radii: [0.007, 0.022, 0.02, 0.007],
      points: [
        [0, 2.23, 0.505],
        [side * 0.08, 1.92, 0.51],
        [side * 0.18, 1.53, 0.49],
        [side * 0.11, 1.33, 0.46],
      ],
    })
  }
  k.patch({
    name: 'inverted-v-mouth-cavity',
    colour: INK,
    at: [0, 0, 0.5],
    points: [
      [0, 2.23],
      [-0.07, 1.94],
      [-0.17, 1.55],
      [-0.12, 1.35],
      [0.12, 1.35],
      [0.17, 1.55],
      [0.07, 1.94],
    ],
  })
  for (let i = 0; i < 12; i++)
    for (const side of [-1, 1])
      k.spike({
        name: `tooth-${side}-${i}`,
        from: [side * (0.15 - i * 0.009), 1.45 + i * 0.057, 0.535],
        to: [side * (0.11 - i * 0.007), 1.46 + i * 0.057, 0.55],
        radius: 0.018,
        colour: BONE,
      })
  const tongue = k.taper({
    name: 'long-tongue',
    points: [
      [0, 1.65, 0.52],
      [0, 1.15, 0.6],
      [0, 0.75, 0.78],
      [0.1, 0.62, 0.9],
    ],
    radii: [0.1, 0.1, 0.09, 0.065],
    colour: 0x9f787d,
  })
  tongue.scale.z = 0.62
  tongue.position.z = 0.22 * seen.size
  return context.root
}

/** Tserriednich's own beast (ch. 384), distinct from the urn's horse. */
function secondBeast(seen: Apparition, context: BasicApparitionContext) {
  const k = sculptKit(context, seen.size),
    hide = 0x8a8179
  k.oval({ name: 'ribbed-torso', at: [0, 1.45, 0], radii: [0.65, 0.82, 0.34], colour: hide })
  k.oval({ name: 'bulbous-abdomen', at: [0, 0.62, 0.12], radii: [0.43, 0.46, 0.4], colour: hide })
  for (let row = 0; row < 7; row++)
    for (const side of [-1, 1])
      k.tube({
        name: `rib-${side}-${row}`,
        points: [
          [side * 0.05, 1.05 + row * 0.15, 0.34],
          [side * 0.5, 0.96 + row * 0.15, 0.3],
          [side * 0.63, 1.05 + row * 0.15, 0.02],
        ],
        radius: 0.055,
        colour: 0xb1a59a,
      })
  k.loft({
    name: 'faceless-hood',
    colour: INK,
    sections: [
      [1.93, 0.24, 0.14, 0],
      [2.2, 0.2, 0.2, 0],
      [2.57, 0.18, 0.17, -0.02],
      [2.8, 0.09, 0.1, -0.04],
      [2.83, 0, 0, -0.04],
    ],
  })
  k.taper({
    name: 'hooked-hood-tip',
    colour: INK,
    radii: [0.12, 0.1, 0.045, 0],
    points: [
      [-0.04, 2.65, -0.03],
      [0.04, 2.95, -0.03],
      [0.36, 3.1, -0.02],
      [0.49, 2.86, 0.02],
    ],
  })
  for (const side of [-1, 1]) {
    k.oval({
      name: `deltoid-${side}`,
      at: [side * 0.57, 1.92, -0.08],
      radii: [0.37, 0.28, 0.32],
      colour: hide,
    })
    for (let i = 0; i < 4; i++)
      k.taper({
        name: `shoulder-spine-${side}-${i}`,
        colour: hide,
        radii: [0.055, 0.025, 0],
        points: [
          [side * (0.14 + i * 0.09), 2.02, -0.16],
          [side * (0.4 + i * 0.15), 2.25 + i * 0.08, -0.16],
          [side * (0.88 + i * 0.19), 2.38 + i * 0.14, -0.17],
        ],
      })
    k.tube({
      name: `knotted-arm-${side}`,
      points: [
        [side * 0.52, 1.86, 0],
        [side * 1.04, 1.6, 0.02],
        [side * 1.38, 1.1, 0.1],
      ],
      radius: 0.16,
      colour: hide,
    })
    for (let i = 0; i < 4; i++) {
      k.oval({
        name: `arm-node-${side}-${i}`,
        at: [side * (0.64 + i * 0.24), 1.83 - i * 0.2, 0.03],
        radii: [0.24, 0.24, 0.24],
        colour: hide,
      })
      k.hand({
        name: `arm-hand-${side}-${i}`,
        at: [side * (0.7 + i * 0.24), 1.66 - i * 0.2, 0.04],
        scale: 0.7,
        colour: hide,
      })
    }
    k.taper({
      name: `leg-${side}`,
      points: [
        [side * 0.3, 0.6, 0],
        [side * 0.4, 0.27, 0.02],
        [side * 0.5, 0.07, 0.3],
      ],
      radii: [0.22, 0.2, 0.11],
      colour: hide,
    })
    for (let i = 0; i < 3; i++)
      k.oval({
        name: `leg-node-${side}-${i}`,
        colour: hide,
        at: [side * (0.3 + i * 0.06), 0.55 - i * 0.19, 0.08],
        radii: [0.23, 0.2, 0.25],
      })
  }
  const seal = k.add({
    geometry: new context.THREE.TorusGeometry(seen.size * 0.25, seen.size * 0.04, 8, 24),
    colour: BONE,
    at: [0, 1, 0.42],
    name: 'abdominal-seal',
  })
  // The three repeated curls are the visible 666 motif, not invented text.
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3
    const curl = k.add({
      geometry: new context.THREE.TorusGeometry(
        seen.size * 0.07,
        seen.size * 0.018,
        6,
        16,
        Math.PI * 1.7,
      ),
      colour: INK,
      at: [Math.cos(a) * 0.13, 1 + Math.sin(a) * 0.13, 0.45],
      name: `seal-six-${i}`,
    })
    curl.rotation.z = a
  }
  seal.name = '666-seal-rim'
  return context.root
}

const BUILDERS = {
  'benjamin-guardian': buildBenjaminFigure,
  'halkenburg-guardian': buildHalkenburgFigure,
  'nasubi-guardian': nasubi,
  'tserriednich-second': secondBeast,
}
export function buildRoyalBeastApparition(seen: Apparition, context: BasicApparitionContext) {
  return BUILDERS[seen.kind as keyof typeof BUILDERS]?.(seen, context)
}
