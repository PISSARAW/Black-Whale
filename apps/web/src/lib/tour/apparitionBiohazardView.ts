import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK, modelKit } from './nenModelPrimitives'

/** Only the camera-cat and handcuff-pigeons actually shown in ch. 390–391. */
export function buildBiohazardApparition(seen: Apparition, context: BasicApparitionContext) {
  if (seen.kind !== 'animal-object') return undefined
  const k = modelKit(context, seen.size)
  if (seen.stage === 0) {
    k.oval({ name: 'camera-cat-body', at: [0, 0.45, 0], radii: [0.3, 0.3, 0.58], colour: BONE })
    k.oval({ name: 'camera-cat-head', at: [0, 0.7, 0.48], radii: [0.3, 0.27, 0.25], colour: BONE })
    for (const side of [-1, 1]) {
      k.spike({
        name: `cat-ear-${side}`,
        from: [side * 0.19, 0.87, 0.46],
        to: [side * 0.23, 1.2, 0.4],
        radius: 0.15,
        colour: BONE,
      })
      k.eye({ name: `cat-eye-${side}`, at: [side * 0.12, 0.73, 0.7], radius: 0.075 })
      for (const front of [-1, 1])
        k.tube({
          name: `cat-leg-${side}-${front}`,
          points: [
            [side * 0.22, 0.45, front * 0.36],
            [side * 0.22, 0.1, front * 0.36],
            [side * 0.22, 0.07, front * 0.36 + 0.1],
          ],
          radius: 0.065,
          colour: BONE,
        })
      for (let i = 0; i < 3; i++)
        k.tube({
          name: `cat-whisker-${side}-${i}`,
          points: [
            [side * 0.08, 0.59, 0.72],
            [side * 0.28, 0.58 + i * 0.04, 0.75],
            [side * 0.46, 0.56 + i * 0.06, 0.74],
          ],
          radius: 0.008,
          colour: INK,
        })
    }
    k.oval({
      name: 'cat-nose',
      at: [0, 0.62, 0.74],
      radii: [0.035, 0.025, 0.015],
      colour: 0x8e6c71,
    })
    k.tube({
      name: 'cat-tail',
      points: [
        [0, 0.5, -0.5],
        [0.2, 0.7, -0.9],
        [0.24, 1.2, -1],
        [0.1, 1.4, -0.9],
      ],
      radius: 0.045,
      colour: BONE,
    })
  } else {
    for (const side of [-1, 1]) {
      k.oval({
        name: `pigeon-body-${side}`,
        at: [side * 0.5, 0.38, 0],
        radii: [0.2, 0.3, 0.32],
        colour: 0xa6a7aa,
      })
      k.oval({
        name: `pigeon-head-${side}`,
        at: [side * 0.5, 0.73, 0.2],
        radii: [0.15, 0.15, 0.16],
        colour: 0x858c8c,
      })
      k.spike({
        name: `pigeon-beak-${side}`,
        from: [side * 0.5, 0.71, 0.33],
        to: [side * 0.5, 0.68, 0.49],
        radius: 0.045,
        colour: BONE,
      })
      k.oval({
        name: `pigeon-wing-${side}`,
        at: [side * 0.67, 0.4, -0.04],
        radii: [0.035, 0.24, 0.28],
        colour: 0x797e81,
      })
      k.oval({
        name: `pigeon-eye-${side}`,
        at: [side * 0.61, 0.77, 0.29],
        radii: [0.025, 0.025, 0.012],
        colour: INK,
      })
      const cuff = k.add({
        geometry: new context.THREE.TorusGeometry(0.19 * seen.size, 0.03 * seen.size, 8, 20),
        colour: 0xaaaeb3,
        at: [side * 0.5, 0.09, 0],
        name: `retained-cuff-${side}`,
      })
      cuff.rotation.x = Math.PI / 2
    }
    k.tube({
      name: 'handcuff-link',
      points: [
        [-0.4, 0.09, 0],
        [0, 0.03, 0],
        [0.4, 0.09, 0],
      ],
      radius: 0.025,
      colour: 0xaaaeb3,
    })
  }
  return context.root
}
