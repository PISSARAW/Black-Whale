import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK, modelKit } from './nenModelPrimitives'

function benjamin(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size),
    hide = 0xaaa49d
  k.oval({ name: 'beetle-thorax', at: [0, 1.3, 0], radii: [0.62, 0.85, 0.4], colour: hide })
  k.oval({ name: 'elongated-head', at: [0, 2.38, 0.05], radii: [0.38, 0.7, 0.33], colour: hide })
  k.oval({ name: 'head-cap', at: [0, 2.94, 0.08], radii: [0.44, 0.25, 0.36], colour: hide })
  k.oval({ name: 'large-maw', at: [0, 2.08, 0.34], radii: [0.34, 0.27, 0.05], colour: INK })
  k.oval({ name: 'throat-mouth', at: [0, 1.63, 0.4], radii: [0.24, 0.1, 0.03], colour: INK })
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++)
      k.oval({
        name: `eye-bead-${side}-${i}`,
        at: [side * (0.13 + i * 0.055), 2.57 - i * 0.14, 0.33],
        radii: [0.035, 0.04, 0.025],
        colour: INK,
      })
    k.spike({
      name: `temple-spike-${side}`,
      from: [side * 0.33, 2.5, 0],
      to: [side * 0.8, 2.72, -0.2],
      radius: 0.15,
      colour: hide,
    })
    k.tube({
      name: `arm-${side}`,
      points: [
        [side * 0.5, 1.72, 0],
        [side * 0.94, 1.1, 0.03],
        [side * 0.75, 0.63, 0.33],
      ],
      radius: 0.15,
      colour: hide,
    })
    k.hand({ name: `clawed-hand-${side}`, at: [side * 0.75, 0.6, 0.33], scale: 0.85, colour: hide })
    k.tube({
      name: `leg-${side}`,
      points: [
        [side * 0.3, 0.85, 0],
        [side * 0.46, 0.42, 0.15],
        [side * 0.42, 0.09, 0.36],
      ],
      radius: 0.16,
      colour: hide,
    })
    const wing = k.patch({
      name: `cape-wing-${side}`,
      points: [
        [0, 0],
        [side * 0.9, -0.4],
        [side * 1.05, -1.55],
        [side * 0.65, -1.35],
        [side * 0.4, -1.7],
        [0, -1.45],
      ],
      at: [side * 0.39, 1.9, -0.3],
      colour: 0x49413c,
    })
    wing.rotation.y = side * 0.2
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12
    k.spike({
      name: `collar-spine-${i}`,
      from: [Math.cos(a) * 0.42, 1.7 + Math.sin(a) * 0.24, 0.1],
      to: [Math.cos(a) * 0.91, 1.7 + Math.sin(a) * 0.65, 0.02],
      radius: 0.07,
      colour: hide,
    })
  }
  for (let i = 0; i < 9; i++)
    for (const row of [-1, 1])
      k.spike({
        name: `tooth-${row}-${i}`,
        from: [(i - 4) * 0.068, 2.08 + row * 0.18, 0.39],
        to: [(i - 4) * 0.068, 2.08 + row * 0.05, 0.41],
        radius: 0.035,
        colour: BONE,
      })
  return context.root
}

function halkenburg(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size),
    hide = 0xafa99e
  k.oval({ name: 'ogre-chest', at: [0, 1.15, 0], radii: [0.95, 0.95, 0.5], colour: hide })
  k.oval({ name: 'cyclops-head', at: [0, 2.06, 0.24], radii: [0.64, 0.59, 0.42], colour: hide })
  k.eye({ name: 'single-eye', at: [0, 2.23, 0.64], radius: 0.29 })
  k.oval({ name: 'muzzle', at: [0, 1.84, 0.58], radii: [0.38, 0.25, 0.22], colour: hide })
  k.tube({
    name: 'frown',
    points: [
      [-0.26, 1.75, 0.76],
      [0, 1.81, 0.81],
      [0.26, 1.75, 0.76],
    ],
    radius: 0.025,
    colour: INK,
  })
  for (const side of [-1, 1]) {
    k.tube({
      name: `horn-${side}`,
      points: [
        [side * 0.45, 2.37, 0],
        [side * 0.62, 2.74, -0.13],
        [side * 0.42, 3, -0.3],
      ],
      radius: 0.13,
      colour: hide,
    })
    k.tube({
      name: `powerful-arm-${side}`,
      points: [
        [side * 0.8, 1.6, 0],
        [side * 1.12, 0.83, 0.3],
        [side * 0.75, 0.4, 0.74],
      ],
      radius: 0.27,
      colour: hide,
    })
    k.hand({ name: `ogre-hand-${side}`, at: [side * 0.75, 0.4, 0.74], scale: 1.4, colour: hide })
    k.oval({
      name: `crouched-thigh-${side}`,
      at: [side * 0.55, 0.4, 0],
      radii: [0.4, 0.45, 0.4],
      colour: hide,
    })
    // Layered narrow feathers, not bat wings or a fur ball.
    for (let row = 0; row < 4; row++)
      for (let i = 0; i < 8; i++) {
        const x = side * (0.55 + i * 0.14 + row * 0.05),
          y = 1.9 - row * 0.31 - i * 0.07
        const feather = k.oval({
          name: `feather-${side}-${row}-${i}`,
          at: [x, y, -0.17 - row * 0.06],
          radii: [0.1, 0.42, 0.045],
          colour: BONE,
        })
        feather.rotation.z = side * -0.38
      }
  }
  k.oval({ name: 'back-orifice', at: [0, 1.45, -0.49], radii: [0.18, 0.25, 0.035], colour: INK })
  return context.root
}

function nasubi(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size),
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
          radii: [0.29, 0.24, 0.28],
          colour: flesh,
        })
        k.oval({
          name: `mound-tip-${side}-${row}-${col}`,
          at: [x, y, 0.47],
          radii: [0.065, 0.065, 0.045],
          colour: 0x918176,
        })
      }
    for (let i = 0; i < 5; i++) {
      const y = 0.5 + i * 0.57
      k.tube({
        name: `jointed-leg-${side}-${i}`,
        points: [
          [side * 1.4, y, -0.05],
          [side * 2.02, y + 0.3, -0.04],
          [side * 2.22, y - 0.38, 0.18],
        ],
        radius: 0.055,
        colour: flesh,
      })
      k.hand({
        name: `human-hand-${side}-${i}`,
        at: [side * 2.22, y - 0.4, 0.18],
        scale: 0.75,
        colour: flesh,
      })
    }
    k.oval({
      name: `enormous-ear-${side}`,
      at: [side * 0.38, 2.1, 0.3],
      radii: [0.25, 0.4, 0.1],
      colour: flesh,
    })
    k.tube({
      name: `ear-fold-${side}`,
      points: [
        [side * 0.3, 2.35, 0.4],
        [side * 0.47, 2.32, 0.42],
        [side * 0.45, 1.97, 0.42],
      ],
      radius: 0.025,
      colour: INK,
    })
    for (let lock = 0; lock < 12; lock++)
      k.tube({
        name: `long-hair-${side}-${lock}`,
        points: [
          [side * (0.1 + lock * 0.035), 2.65, 0],
          [side * (0.35 + lock * 0.045), 1.8, -0.05],
          [side * (0.45 + lock * 0.04), 0.45, 0.12],
        ],
        radius: 0.025,
        colour: INK,
      })
  }
  k.oval({
    name: 'elongated-forehead',
    at: [0, 2.25, 0.29],
    radii: [0.3, 0.62, 0.19],
    colour: flesh,
  })
  for (const side of [-1, 1])
    k.eye({ name: `human-eye-${side}`, at: [side * 0.16, 2.1, 0.47], radius: 0.09 })
  k.oval({ name: 'vertical-mouth', at: [0, 1.65, 0.48], radii: [0.14, 0.4, 0.03], colour: INK })
  for (let i = 0; i < 12; i++)
    for (const side of [-1, 1])
      k.spike({
        name: `tooth-${side}-${i}`,
        from: [side * 0.12, 1.34 + i * 0.055, 0.52],
        to: [side * 0.045, 1.36 + i * 0.055, 0.53],
        radius: 0.025,
        colour: BONE,
      })
  k.tube({
    name: 'long-tongue',
    points: [
      [0, 1.65, 0.52],
      [0, 1.15, 0.6],
      [0, 0.75, 0.78],
      [0.1, 0.62, 0.9],
    ],
    radius: 0.065,
    colour: 0x9f787d,
  })
  return context.root
}

/** Tserriednich's own beast (ch. 384), distinct from the urn's horse. */
function secondBeast(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size),
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
  k.oval({ name: 'hooded-head', at: [0, 2.26, 0], radii: [0.42, 0.58, 0.3], colour: INK })
  for (const side of [-1, 1]) {
    k.tube({
      name: `hood-horn-${side}`,
      points: [
        [side * 0.25, 2.46, 0],
        [side * 0.52, 2.9, 0],
        [side * 0.31, 3.16, 0.1],
      ],
      radius: 0.1,
      colour: hide,
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
        radii: [0.2, 0.2, 0.2],
        colour: hide,
      })
      k.hand({
        name: `arm-hand-${side}-${i}`,
        at: [side * (0.7 + i * 0.24), 1.66 - i * 0.2, 0.04],
        scale: 0.55,
        colour: hide,
      })
    }
    k.tube({
      name: `leg-${side}`,
      points: [
        [side * 0.3, 0.6, 0],
        [side * 0.4, 0.27, 0.02],
        [side * 0.5, 0.07, 0.3],
      ],
      radius: 0.17,
      colour: hide,
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
  'benjamin-guardian': benjamin,
  'halkenburg-guardian': halkenburg,
  'nasubi-guardian': nasubi,
  'tserriednich-second': secondBeast,
}
export function buildRoyalBeastApparition(seen: Apparition, context: BasicApparitionContext) {
  return BUILDERS[seen.kind as keyof typeof BUILDERS]?.(seen, context)
}
