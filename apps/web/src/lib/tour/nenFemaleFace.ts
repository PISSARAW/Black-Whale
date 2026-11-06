import type { BasicApparitionContext } from './apparitionBasicView'
import { INK } from './nenModelPrimitives'
import { sculptKit } from './nenSculptPrimitives'

/** Local origin at the face centre. Proportions are specific to each drawn face. */
export function buildNenFemaleFace(
  context: BasicApparitionContext,
  options: {
    size: number
    skin: number
    width: number
    height: number
    depth: number
    eye: number
  },
) {
  const { width: w, height: h, depth: d, skin } = options
  const k = sculptKit(context, options.size)
  k.loft({
    name: 'contoured-face',
    colour: skin,
    sections: [
      [-h, 0, 0, d * 0.2],
      [-h * 0.88, w * 0.38, d * 0.43, d * 0.18],
      [-h * 0.55, w * 0.72, d * 0.68, d * 0.1],
      [-h * 0.12, w * 0.98, d * 0.85, 0],
      [h * 0.28, w, d, 0],
      [h * 0.7, w * 0.86, d * 0.93, -d * 0.07],
      [h, 0, 0, -d * 0.1],
    ],
  })
  k.loft({
    name: 'nose-bridge',
    colour: skin,
    sections: [
      [-h * 0.28, 0, 0, d],
      [-h * 0.21, w * 0.12, d * 0.14, d],
      [-h * 0.12, w * 0.1, d * 0.24, d],
      [h * 0.3, w * 0.04, d * 0.02, d * 0.96],
    ],
  })
  for (const side of [-1, 1]) {
    const x = side * w * 0.46
    k.almond({
      name: `human-eye-${side}`,
      at: [x, h * 0.17, d * 0.98],
      width: w * 0.37,
      height: h * options.eye,
    })
    k.taper({
      name: `eyebrow-${side}`,
      colour: INK,
      radii: [w * 0.018, w * 0.038, 0.001],
      points: [
        [side * w * 0.18, h * 0.45, d * 0.93],
        [side * w * 0.5, h * 0.52, d * 0.91],
        [side * w * 0.83, h * 0.41, d * 0.75],
      ],
    })
    k.oval({
      name: `nostril-${side}`,
      at: [side * w * 0.09, -h * 0.23, d * 1.12],
      radii: [w * 0.035, h * 0.017, d * 0.015],
      colour: 0x78645d,
    })
  }
  k.tube({
    name: 'upper-lip',
    colour: 0x8f6e6b,
    radius: h * 0.019,
    points: [
      [-w * 0.24, -h * 0.49, d * 0.86],
      [-w * 0.08, -h * 0.46, d * 0.94],
      [0, -h * 0.49, d * 0.97],
      [w * 0.08, -h * 0.46, d * 0.94],
      [w * 0.24, -h * 0.49, d * 0.86],
    ],
  })
  k.taper({
    name: 'lower-lip',
    colour: 0xc19b91,
    radii: [0.001, h * 0.035, 0.001],
    points: [
      [-w * 0.23, -h * 0.51, d * 0.86],
      [0, -h * 0.55, d * 0.98],
      [w * 0.23, -h * 0.51, d * 0.86],
    ],
  })
  return k
}
