import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK, modelKit } from './nenModelPrimitives'
import { sculptKit } from './nenSculptPrimitives'

/** Chapter 97: exposed vertebrae and paired ribs, rather than a solid fish body. */
export function indoorFish(seen: Apparition, context: BasicApparitionContext) {
  const k = sculptKit(context, seen.size)
  k.tube({
    name: 'vertebral-column',
    points: [
      [-0.9, 0, 0],
      [-0.2, 0.08, 0],
      [0.7, 0.06, 0],
      [1.65, 0.2, 0],
    ],
    radius: 0.055,
    colour: BONE,
  })
  for (let i = 0; i < 12; i++) {
    const x = -0.65 + i * 0.18
    const r = Math.sin(((i + 1) / 14) * Math.PI) * 0.48
    k.oval({ name: `vertebra-${i}`, at: [x, 0.06, 0], radii: [0.065, 0.075, 0.09], colour: BONE })
    for (const side of [-1, 1]) {
      k.tube({
        name: `rib-${i}-${side}`,
        points: [
          [x, 0.06, 0],
          [x + 0.04, -r * 0.35, side * r],
          [x + 0.1, -r, side * r * 0.48],
        ],
        radius: 0.035,
        colour: BONE,
      })
      k.spike({
        name: `dorsal-${i}-${side}`,
        from: [x, 0.08, 0],
        to: [x + 0.15, r * 1.2, side * 0.035],
        radius: 0.035,
        colour: BONE,
      })
    }
  }
  const skull = new context.THREE.Shape()
  skull.moveTo(-0.52, -0.24)
  skull.lineTo(-0.56, 0.12)
  skull.lineTo(-0.12, 0.5)
  skull.lineTo(0.25, 0.22)
  skull.lineTo(0.2, -0.2)
  skull.closePath()
  k.add({
    name: 'volumetric-skull',
    at: [-1.05, 0, -0.12],
    colour: BONE,
    geometry: new context.THREE.ExtrudeGeometry(skull, {
      depth: 0.24,
      bevelEnabled: true,
      bevelSize: 0.065,
      bevelThickness: 0.065,
      bevelSegments: 2,
    }).scale(seen.size, seen.size, seen.size),
  })
  for (const side of [-1, 1]) {
    k.oval({
      name: `eye-socket-${side}`,
      at: [-1.12, 0.18, side * 0.19],
      radii: [0.085, 0.11, 0.02],
      colour: INK,
    })
    k.taper({
      name: `zygomatic-arch-${side}`,
      colour: 0xc5bdab,
      radii: [0.015, 0.023, 0.01],
      points: [
        [-1.35, 0.17, side * 0.19],
        [-1.25, 0, side * 0.195],
        [-0.89, -0.14, side * 0.18],
      ],
    })
    k.taper({
      name: `jaw-ramus-${side}`,
      colour: BONE,
      radii: [0.04, 0.035, 0.025],
      points: [
        [-0.88, -0.12, side * 0.15],
        [-1, -0.34, side * 0.15],
        [-1.49, -0.3, side * 0.1],
      ],
    })
  }
  k.tube({
    name: 'lower-jaw',
    points: [
      [-1.55, -0.2, 0],
      [-1.3, -0.4, 0],
      [-0.85, -0.28, 0],
    ],
    radius: 0.045,
    colour: BONE,
  })
  for (let i = 0; i < 7; i++) {
    const x = -1.5 + i * 0.09
    k.spike({
      name: `tooth-${i}`,
      from: [x, -0.2, 0.08],
      to: [x + 0.015, -0.32, 0.08],
      radius: 0.025,
      colour: BONE,
    })
  }
  k.patch({
    name: 'caudal-fin',
    points: [
      [0, 0],
      [0.65, 0.65],
      [0.43, 0.03],
      [0.7, -0.5],
    ],
    at: [1.55, 0.2, -0.025],
    colour: BONE,
  })
  for (const side of [-1, 1]) {
    const fin = k.patch({
      name: `pectoral-fin-${side}`,
      points: [
        [0, 0],
        [0.45, -0.75],
        [0.5, -0.1],
      ],
      at: [-0.55, -0.25, side * 0.2],
      colour: BONE,
    })
    fin.rotation.y = side * 0.5
    for (let ray = 0; ray < 4; ray++)
      k.taper({
        name: `pectoral-ray-${side}-${ray}`,
        colour: 0xa89e8a,
        radii: [0.008, 0.005, 0],
        points: [
          [-0.55, -0.25, side * 0.23],
          [-0.35 + ray * 0.045, -0.47, side * 0.3],
          [-0.16 + ray * 0.025, -0.91 + ray * 0.14, side * 0.4],
        ],
      })
  }
  return context.root
}

/** Blinky's face belongs to the nozzle; the hose remains continuous. */
export function blinky(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  const body = 0xc0b9cc
  k.oval({ name: 'vacuum-bag', at: [-0.3, -0.05, 0], radii: [0.48, 0.72, 0.38], colour: body })
  k.box({ name: 'bag-collar', at: [-0.3, 0.5, 0], dimensions: [0.55, 0.15, 0.5], colour: 0x70647e })
  k.tube({
    name: 'flexible-hose',
    points: [
      [-0.3, 0.53, 0],
      [-0.35, 1.1, -0.15],
      [0.35, 1.24, -0.3],
      [0.78, 0.8, -0.05],
    ],
    radius: 0.1,
    colour: 0x70647e,
  })
  k.oval({ name: 'nozzle-head', at: [0.9, 0.75, 0.2], radii: [0.5, 0.34, 0.35], colour: body })
  k.oval({ name: 'open-mouth', at: [0.9, 0.67, 0.49], radii: [0.42, 0.21, 0.07], colour: INK })
  for (const side of [-1, 1])
    k.eye({ name: `blinky-eye-${side}`, at: [0.9 + side * 0.26, 1.02, 0.35], radius: 0.18 })
  for (let i = 0; i < 7; i++) {
    for (const lip of [-1, 1]) {
      const x = 0.59 + i * 0.103
      k.spike({
        name: `tooth-${lip}-${i}`,
        from: [x, 0.67 + lip * 0.14, 0.55],
        to: [x, 0.67 + lip * 0.04, 0.57],
        radius: 0.045,
        colour: BONE,
      })
    }
  }
  k.tube({
    name: 'tongue',
    points: [
      [0.93, 0.59, 0.55],
      [0.92, 0.48, 0.78],
      [0.85, 0.35, 0.91],
      [0.78, 0.38, 0.94],
    ],
    radius: 0.09,
    colour: 0xd88eaa,
  })
  for (const side of [-1, 1])
    k.oval({
      name: `bag-foot-${side}`,
      at: [-0.3 + side * 0.3, -0.65, 0.15],
      radii: [0.15, 0.09, 0.22],
      colour: 0x70647e,
    })
  return null
}

/** Chapter 373: an enormous black cat with long arms, hands and a curved tail. */
export function catsName(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  const fur = 0x18151c
  k.oval({ name: 'cat-torso', at: [0, 1.22, 0], radii: [0.62, 1.05, 0.43], colour: fur })
  k.oval({ name: 'cat-head', at: [0, 2.34, 0.05], radii: [0.65, 0.5, 0.4], colour: fur })
  for (const side of [-1, 1]) {
    k.patch({
      name: `ear-${side}`,
      points: [
        [-0.22, 0],
        [0, 0.65],
        [0.22, 0],
      ],
      at: [side * 0.44, 2.58, 0],
      colour: fur,
      into: undefined,
      depth: 0.15,
    })
    const eye = k.oval({
      name: `eye-${side}`,
      at: [side * 0.28, 2.4, 0.41],
      radii: [0.19, 0.11, 0.025],
      colour: BONE,
    })
    eye.rotation.z = side * 0.24
    k.tube({
      name: `arm-${side}`,
      points: [
        [side * 0.55, 1.95, 0],
        [side * 0.98, 1.35, 0.2],
        [side * 0.8, 0.72, 0.75],
      ],
      radius: 0.18,
      colour: fur,
    })
    k.hand({ name: `hand-${side}`, at: [side * 0.72, 0.68, 0.8], scale: 1.4, colour: fur })
    k.tube({
      name: `leg-${side}`,
      points: [
        [side * 0.36, 0.7, 0],
        [side * 0.48, 0.28, 0.1],
        [side * 0.5, 0.1, 0.5],
      ],
      radius: 0.22,
      colour: fur,
    })
    k.oval({
      name: `paw-${side}`,
      at: [side * 0.5, 0.12, 0.5],
      radii: [0.3, 0.12, 0.4],
      colour: fur,
    })
    for (let i = 0; i < 3; i++)
      k.tube({
        name: `whisker-${side}-${i}`,
        points: [
          [side * 0.22, 2.19, 0.42],
          [side * 0.6, 2.15 + i * 0.07, 0.46],
          [side * 0.94, 2.12 + i * 0.1, 0.45],
        ],
        radius: 0.012,
        colour: BONE,
      })
  }
  const tail = new context.THREE.Group()
  tail.name = 'cat-tail'
  k.tube({
    name: 'curved-tail',
    points: [
      [0, 0.55, -0.3],
      [0.55, 0.3, -0.8],
      [1.1, 0.7, -0.9],
      [1.12, 1.4, -0.6],
      [0.85, 1.65, -0.5],
    ],
    radius: 0.12,
    colour: fur,
    into: tail,
  })
  context.root.add(tail)
  return tail
}
