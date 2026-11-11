import type * as Three from 'three'
import {
  SalonSurface,
  SALON_GOLD,
  SALON_STONE,
  SALON_WOOD,
  salonFrame,
} from './royalSalonDetailSurface'

/** Original, low-relief silhouettes. No manga image is stored or used as a texture. */
function silhouette(
  THREE: typeof Three,
  surface: SalonSurface,
  options: {
    points: readonly (readonly [number, number])[]
    z: number
    colour: number
  },
): void {
  const shape = new THREE.Shape()
  options.points.forEach(([x, y], index) => (index ? shape.lineTo(x, y) : shape.moveTo(x, y)))
  shape.closePath()
  surface.add(new THREE.ShapeGeometry(shape), [0, 0, options.z], options.colour)
}

function landscape(THREE: typeof Three, surface: SalonSurface): void {
  const w = surface.width * 0.46,
    h = surface.structure.height
  const z = surface.depth / 2 + 0.04
  surface.glowBox([w * 2, h * 0.91, 0.015], {
    at: [0, h / 2, z],
    colour: 0xa9c7ce,
  })
  surface.glowBox([w * 2, h * 0.38, 0.017], {
    at: [0, h * 0.24, z + 0.01],
    colour: 0x668b78,
  })
  for (let ripple = 0; ripple < 7; ripple++) {
    const width = w * (1.55 - ripple * 0.11)
    surface.box(
      [width, 0.012, 0.012],
      [(ripple % 2 ? -1 : 1) * w * 0.07, h * (0.11 + ripple * 0.035), z + 0.035],
      ripple % 2 ? 0xb9d5cc : 0x456c5d,
    )
  }
  surface.sphere([h * 0.055, h * 0.055, 0.015], [w * 0.32, h * 0.7, z + 0.025], 0xe7d69a)
  for (let layer = 0; layer < 3; layer++) {
    const line: [number, number][] = Array.from({ length: 17 }, (_, index) => {
      const x = -w + (index * w) / 8
      const crest = Math.sin(index * 0.63 + layer * 2) * 0.12 + Math.cos(index * 1.7) * 0.035
      return [x, h * (0.22 + layer * 0.12 + crest)]
    })
    silhouette(THREE, surface, {
      points: [[-w, h * 0.05], [w, h * 0.05], ...line.reverse()],
      z: z + 0.015 + (3 - layer) * 0.008,
      colour: [0x244a32, 0x426b48, 0x698563][layer],
    })
  }
  for (const side of [-1, 1]) {
    for (let crown = 0; crown < 5; crown++) {
      surface.sphere(
        [w * 0.16, h * 0.11, 0.018],
        [side * w * (0.48 + crown * 0.09), h * (0.48 + (crown % 2) * 0.08), z + 0.045],
        crown % 2 ? 0x315b39 : 0x24482f,
      )
    }
  }
}

function battle(THREE: typeof Three, surface: SalonSurface): void {
  const w = surface.width,
    h = surface.structure.height,
    z = surface.depth / 2 + 0.055
  surface.box([w * 0.91, h * 0.9, 0.02], [0, h / 2, z], 0x414638)
  for (let index = 0; index < 5; index++) {
    const x = (index - 2) * w * 0.15
    const y = h * (0.28 + (index % 2) * 0.11)
    surface.sphere([w * 0.075, h * 0.11, 0.025], [x, y, z + 0.025], 0x9a957a)
    surface.sphere([w * 0.025, h * 0.08, 0.02], [x + w * 0.075, y + h * 0.11, z + 0.03], 0xafa98d)
    for (const side of [-1, 1]) {
      silhouette(THREE, surface, {
        points: [
          [x + side * w * 0.05, y],
          [x + side * w * 0.065, y - h * 0.21],
          [x + side * w * 0.035, y - h * 0.2],
        ],
        z: z + 0.06,
        colour: 0x9a957a,
      })
    }
    surface.sphere([w * 0.022, h * 0.065, 0.02], [x, y + h * 0.28, z + 0.05], SALON_STONE)
    silhouette(THREE, surface, {
      points: [
        [x - w * 0.05, y + h * 0.07],
        [x - w * 0.025, y + h * 0.23],
        [x + w * 0.025, y + h * 0.23],
        [x + w * 0.065, y + h * 0.09],
      ],
      z: z + 0.07,
      colour: 0x747b6c,
    })
    surface.curve(
      [
        [x - w * 0.06, y + h * 0.15, z + 0.08],
        [x + w * 0.07, y + h * 0.51, z + 0.08],
      ],
      0.012,
      SALON_STONE,
    )
  }
}

function smallPicture(THREE: typeof Three, surface: SalonSurface, index: number): void {
  const w = surface.width,
    h = surface.structure.height,
    z = surface.depth / 2 + 0.04
  surface.box([w * 0.9, h * 0.9, 0.015], [0, h / 2, z], index % 2 ? 0x363b32 : 0x646e5c)
  if (index % 3 === 0) {
    landscape(THREE, surface)
    return
  }
  surface.sphere([w * 0.12, h * 0.13, 0.014], [0, h * 0.68, z + 0.02], 0xb7ad90)
  silhouette(THREE, surface, {
    points: [
      [-w * 0.31, h * 0.13],
      [-w * 0.22, h * 0.45],
      [0, h * 0.53],
      [w * 0.2, h * 0.43],
      [w * 0.28, h * 0.13],
    ],
    z: z + 0.045,
    colour: index % 2 ? 0x807b69 : 0x42382d,
  })
}

function ornamentedFrame(surface: SalonSurface): void {
  const w = surface.width,
    h = surface.structure.height,
    z = surface.depth / 2 + 0.1
  for (const inset of [0, 0.075, 0.15]) {
    salonFrame(surface, {
      width: w - inset * 2,
      height: h - inset * 2,
      y: h / 2,
      z: z + (inset === 0.075 ? 0.035 : 0),
      trim: inset === 0 ? 0.09 : 0.035,
    })
  }
  for (const side of [-1, 1]) {
    for (const end of [0, 1]) {
      const x = side * (w / 2 - 0.05),
        y = 0.08 + end * (h - 0.16)
      for (const petal of [-1, 0, 1]) {
        surface.sphere(
          [0.045, 0.09, 0.025],
          [x + petal * 0.045, y + Math.abs(petal) * 0.02, z + 0.06],
          SALON_GOLD,
        )
      }
    }
    surface.box([w * 0.6, 0.025, 0.02], [0, h / 2 + side * (h / 2 - 0.23), z + 0.01], SALON_WOOD)
  }
}

export function dressRoyalSalonPicture(
  THREE: typeof Three,
  surface: SalonSurface,
  index: number,
): void {
  if (surface.structure.id.endsWith('-landscape-panel')) landscape(THREE, surface)
  else if (surface.structure.id.endsWith('-great-window')) battle(THREE, surface)
  else smallPicture(THREE, surface, index)
  ornamentedFrame(surface)
}
