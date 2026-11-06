import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK, modelKit } from './nenModelPrimitives'
import { buildCookieFigure } from './nenCookieFigure'

function dolphin(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  k.oval({ name: 'dolphin-body', at: [0, 0.2, 0], radii: [0.28, 1.05, 0.23], colour: BONE })
  k.oval({ name: 'dolphin-rostrum', at: [0, -0.84, 0.15], radii: [0.1, 0.3, 0.16], colour: BONE })
  for (const side of [-1, 1]) {
    k.patch({
      name: `tail-fluke-${side}`,
      points: [
        [0, 0],
        [side * 0.66, 0.25],
        [side * 0.57, -0.03],
        [side * 0.15, -0.16],
      ],
      at: [0, 1.13, 0],
      colour: BONE,
    })
    k.patch({
      name: `pectoral-fin-${side}`,
      points: [
        [0, 0],
        [side * 0.65, 0.13],
        [side * 0.78, -0.02],
        [side * 0.3, -0.2],
      ],
      at: [side * 0.1, -0.3, 0],
      colour: BONE,
    })
    k.box({
      name: `syringe-barrel-${side}`,
      at: [side * 0.78, -0.33, 0.08],
      dimensions: [0.09, 0.4, 0.11],
      colour: BONE,
    })
    k.spike({
      name: `syringe-needle-${side}`,
      from: [side * 0.78, -0.53, 0.08],
      to: [side * 0.78, -0.95, 0.08],
      radius: 0.018,
      colour: BONE,
    })
    k.eye({ name: `tail-eye-${side}`, at: [side * 0.3, 1.12, 0.045], radius: 0.075 })
  }
  // The floral inlay is part of the device shown in ch. 361, not a skin tint.
  for (let row = 0; row < 5; row++) {
    const y = -0.52 + row * 0.32,
      x = row % 2 ? -0.1 : 0.1
    for (let petal = 0; petal < 6; petal++) {
      const a = (petal * Math.PI) / 3
      k.oval({
        name: `flower-${row}-${petal}`,
        at: [x + Math.cos(a) * 0.055, y + Math.sin(a) * 0.055, 0.22],
        radii: [0.03, 0.03, 0.01],
        colour: 0x706477,
      })
    }
  }
  k.tube({
    name: 'centre-inlay',
    points: [
      [0, -0.8, 0.27],
      [0, 0.25, 0.25],
      [0, 1.13, 0.11],
    ],
    radius: 0.015,
    colour: INK,
  })
  return context.root
}

/** The ch. 375 counter-design is used only against Salé-salé's smoke. */
function predator(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size),
    hide = 0xb7ada3
  k.oval({ name: 'maw-cavity', at: [0, 0, 0], radii: [0.82, 0.82, 0.27], colour: INK })
  for (let lobe = 0; lobe < 4; lobe++) {
    const a = Math.PI / 4 + (lobe * Math.PI) / 2
    k.patch({
      name: `maw-lobe-${lobe}`,
      points: [
        [-0.45, 0],
        [0, 0.95],
        [0.45, 0],
      ],
      at: [Math.cos(a) * 0.57, Math.sin(a) * 0.57, -0.12],
      colour: hide,
    }).rotation.z = a - Math.PI / 2
    k.tube({
      name: `prehensile-limb-${lobe}`,
      points: [
        [Math.cos(a) * 0.7, Math.sin(a) * 0.7, -0.25],
        [Math.cos(a) * 1.16, Math.sin(a) * 1.1, -0.3],
        [Math.cos(a) * 1.35, Math.sin(a) * 0.85, 0.1],
      ],
      radius: 0.055,
      colour: hide,
    })
    k.hand({
      name: `predator-hand-${lobe}`,
      at: [Math.cos(a) * 1.35, Math.sin(a) * 0.85, 0.1],
      scale: 0.6,
      colour: hide,
    })
  }
  for (let row = 0; row < 4; row++)
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12 + row * 0.1,
        r = 0.28 + row * 0.14
      k.spike({
        name: `radial-tooth-${row}-${i}`,
        from: [Math.cos(a) * r, Math.sin(a) * r, 0.22],
        to: [Math.cos(a) * (r - 0.1), Math.sin(a) * (r - 0.1), 0.3],
        radius: 0.025,
        colour: BONE,
      })
    }
  for (const side of [-1, 1])
    for (let i = 0; i < 12; i++)
      k.tube({
        name: `hair-${side}-${i}`,
        points: [
          [side * 0.7, 0.65 - i * 0.07, -0.2],
          [side * (1 + i * 0.02), -0.1, -0.15],
          [side * (0.8 + i * 0.035), -0.85, -0.05],
        ],
        radius: 0.025,
        colour: INK,
      })
  return context.root
}

function spider(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  k.oval({ name: 'spider-abdomen', at: [0, 0.12, -0.2], radii: [0.24, 0.2, 0.32], colour: BONE })
  k.oval({ name: 'spider-head', at: [0, 0.12, 0.2], radii: [0.17, 0.14, 0.17], colour: BONE })
  for (const side of [-1, 1])
    for (let i = 0; i < 4; i++)
      k.tube({
        name: `spider-leg-${side}-${i}`,
        points: [
          [side * 0.12, 0.1, 0.2 - i * 0.15],
          [side * 0.42, 0.3, 0.4 - i * 0.25],
          [side * 0.58, 0, 0.5 - i * 0.3],
        ],
        radius: 0.025,
        colour: BONE,
      })
  return context.root
}

function bloodSnake(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  k.tube({
    name: 'white-snake-body',
    points: [
      [0, 0, -0.5],
      [0.3, 0.08, -0.2],
      [0, 0.15, 0],
      [0, 0.7, 0],
    ],
    radius: 0.13,
    colour: BONE,
  })
  k.oval({ name: 'upright-head', at: [0, 0.9, 0], radii: [0.22, 0.28, 0.16], colour: BONE })
  for (const side of [-1, 1])
    k.oval({
      name: `black-eye-${side}`,
      at: [side * 0.11, 0.99, 0.14],
      radii: [0.055, 0.095, 0.015],
      colour: INK,
    })
  for (let row = 0; row < 2; row++) {
    const y = 0.84 - row * 0.28
    k.oval({
      name: `human-mouth-${row}`,
      at: [0, y, 0.16],
      radii: [0.15, 0.075, 0.025],
      colour: INK,
    })
    for (const lip of [-1, 1])
      k.tube({
        name: `human-lip-${row}-${lip}`,
        points: [
          [-0.14, y, 0.19],
          [0, y + lip * 0.065, 0.21],
          [0.14, y, 0.19],
        ],
        radius: 0.022,
        colour: 0xc6a7a0,
      })
  }
  return context.root
}

const BUILDERS = {
  dolphin,
  cookie: buildCookieFigure,
  'predator-salesale': predator,
  'nen-spider': spider,
  'blood-snake': bloodSnake,
}
export function buildSupportBeastApparition(seen: Apparition, context: BasicApparitionContext) {
  return BUILDERS[seen.kind as keyof typeof BUILDERS]?.(seen, context)
}
