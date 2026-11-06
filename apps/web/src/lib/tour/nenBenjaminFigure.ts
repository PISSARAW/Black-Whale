import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK } from './nenModelPrimitives'
import { sculptKit } from './nenSculptPrimitives'

function benjaminHead(k: ReturnType<typeof sculptKit>, hide: number) {
  k.loft({
    name: 'elongated-beetle-head',
    colour: hide,
    sections: [
      [1.93, 0.08, 0.1, 0.03],
      [2.06, 0.22, 0.18, 0.04],
      [2.23, 0.4, 0.26, 0.04],
      [2.42, 0.29, 0.24, 0],
      [2.73, 0.16, 0.16, -0.05],
      [2.94, 0.28, 0.23, -0.06],
      [3.04, 0.26, 0.23, -0.06],
      [3.13, 0.2, 0.19, -0.06],
      [3.18, 0.11, 0.11, -0.06],
      [3.2, 0, 0, -0.06],
    ],
  })
  k.oval({ name: 'large-maw', at: [0, 2.25, 0.29], radii: [0.27, 0.205, 0.035], colour: INK })
  k.oval({ name: 'throat-mouth', at: [0, 1.99, 0.2], radii: [0.11, 0.1, 0.025], colour: INK })
  for (const side of [-1, 1]) {
    k.taper({
      name: `maw-fold-${side}`,
      colour: 0x786e63,
      radii: [0.014, 0.023, 0.01],
      points: [
        [side * 0.18, 2.5, 0.2],
        [side * 0.31, 2.28, 0.235],
        [side * 0.16, 2.05, 0.2],
      ],
    })
    for (let i = 0; i < 4; i++)
      k.oval({
        name: `eye-bead-${side}-${i}`,
        at: [side * (0.1 + i * 0.027), 2.79 - i * 0.083, 0.14 + i * 0.018],
        radii: [0.025, 0.038, 0.02],
        colour: INK,
      })
    k.spike({
      name: `flat-temple-spike-${side}`,
      from: [side * 0.32, 2.3, 0],
      to: [side * 0.69, 2.28, -0.04],
      radius: 0.095,
      colour: hide,
    }).scale.z = 0.45
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * 0.068
      k.loft({
        name: `broad-tooth-${side}-${i}`,
        colour: BONE,
        at: [x, 2.25, 0.32],
        sections: [
          [side * 0.015, 0.023, 0.014, 0],
          [side * 0.075, 0.029, 0.02, 0],
          [side * (0.165 - Math.abs(x) * 0.2), 0.031, 0.021, -0.012],
        ].sort((a, b) => a[0] - b[0]) as [number, number, number, number][],
      })
    }
  }
}

export function buildBenjaminFigure(seen: Apparition, context: BasicApparitionContext) {
  const k = sculptKit(context, seen.size),
    hide = 0xaaa49d
  k.loft({
    name: 'narrow-waisted-thorax',
    colour: hide,
    sections: [
      [0.68, 0, 0, 0],
      [0.8, 0.23, 0.24, 0],
      [1.13, 0.25, 0.2, 0],
      [1.5, 0.44, 0.26, 0],
      [1.76, 0.58, 0.25, 0],
      [1.85, 0.35, 0.17, 0],
    ],
  })
  for (const side of [-1, 1]) {
    k.oval({
      name: `pectoral-${side}`,
      at: [side * 0.22, 1.56, 0.2],
      radii: [0.24, 0.2, 0.13],
      colour: hide,
    })
    for (let i = 0; i < 4; i++)
      k.taper({
        name: `exposed-rib-${side}-${i}`,
        colour: BONE,
        radii: [0.045, 0.05, 0.02],
        points: [
          [side * 0.04, 1.12 + i * 0.13, 0.25],
          [side * 0.22, 1.08 + i * 0.13, 0.29],
          [side * 0.34, 1.17 + i * 0.13, 0.1],
        ],
      })
    k.taper({
      name: `long-arm-${side}`,
      colour: hide,
      radii: [0.13, 0.1, 0.075],
      points: [
        [side * 0.5, 1.7, 0],
        [side * 0.75, 1.08, 0.1],
        [side * 0.72, 0.52, 0.36],
      ],
    })
    k.hand({
      name: `clawed-hand-${side}`,
      at: [side * 0.72, 0.49, 0.36],
      scale: 0.85,
      colour: hide,
    })
    for (let i = 0; i < 5; i++)
      k.taper({
        name: `talon-${side}-${i}`,
        colour: BONE,
        radii: [0.028, 0.018, 0],
        points: [
          [side * 0.72 + (i - 2) * 0.072, 0.13, 0.49],
          [side * 0.72 + (i - 2) * 0.083, 0.09, 0.6],
          [side * 0.72 + (i - 2) * 0.09, 0.13, 0.67],
        ],
      })
    k.taper({
      name: `crouched-leg-${side}`,
      colour: hide,
      radii: [0.24, 0.26, 0.1],
      points: [
        [side * 0.26, 0.93, -0.03],
        [side * 0.65, 0.86, 0.06],
        [side * 0.46, 0.32, 0.3],
      ],
    })
    const wing = k.patch({
      name: `cape-wing-${side}`,
      colour: 0x777068,
      at: [side * 0.43, 1.79, -0.19],
      points: [
        [0, 0],
        [side * 0.38, -0.25],
        [side * 0.88, -1.67],
        [side * 0.53, -1.42],
        [side * 0.38, -1.73],
        [side * 0.13, -1.31],
        [0, -0.37],
      ],
    })
    wing.rotation.y = side * 0.18
    for (let i = 0; i < 4; i++)
      k.taper({
        name: `wing-rib-${side}-${i}`,
        colour: hide,
        radii: [0.028, 0.02, 0.005],
        points: [
          [side * 0.48, 1.76, -0.15],
          [side * (0.65 + i * 0.06), 1.18, -0.15],
          [side * (0.76 + i * 0.13), 0.25 + i * 0.08, -0.13],
        ],
      })
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12
    k.spike({
      name: `collar-spine-${i}`,
      colour: hide,
      radius: 0.055,
      from: [Math.cos(a) * 0.35, 1.77 + Math.sin(a) * 0.18, 0.04],
      to: [Math.cos(a) * 0.69, 1.79 + Math.sin(a) * 0.35, 0.02],
    })
  }
  benjaminHead(k, hide)
  return context.root
}
