import type * as Three from 'three'
import {
  QueenUnmaSurface,
  UNMA_GOLD,
  UNMA_WOOD,
  UNMA_STONE,
  unmaFrame,
} from './queenUnmaDetailSurface'

function silhouette(
  THREE: typeof Three,
  surface: QueenUnmaSurface,
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

function dynasticCrestCanvas(THREE: typeof Three, surface: QueenUnmaSurface, z: number): void {
  const w = surface.width * 0.4
  const h = surface.structure.height
  const midY = h * 0.52

  // Central shield
  silhouette(THREE, surface, {
    points: [
      [-w * 0.45, midY + h * 0.22],
      [w * 0.45, midY + h * 0.22],
      [w * 0.45, midY - h * 0.05],
      [0, midY - h * 0.25],
      [-w * 0.45, midY - h * 0.05],
    ],
    z: z + 0.015,
    colour: 0x6e2534,
  })

  // Golden eagle / crest crown
  silhouette(THREE, surface, {
    points: [
      [-w * 0.25, midY + h * 0.22],
      [-w * 0.35, midY + h * 0.32],
      [-w * 0.1, midY + h * 0.26],
      [0, midY + h * 0.36],
      [w * 0.1, midY + h * 0.26],
      [w * 0.35, midY + h * 0.32],
      [w * 0.25, midY + h * 0.22],
    ],
    z: z + 0.02,
    colour: UNMA_GOLD,
  })

  // Inner heraldic star / diamond
  surface.sphere([w * 0.12, h * 0.12, 0.015], [0, midY, z + 0.025], UNMA_GOLD)
}

function landscapeCanvas(THREE: typeof Three, surface: QueenUnmaSurface, z: number): void {
  const w = surface.width * 0.42
  const h = surface.structure.height

  // Mountain / hill layers
  for (let layer = 0; layer < 3; layer++) {
    const points: [number, number][] = []
    points.push([-w, h * 0.1])
    for (let i = 0; i <= 8; i++) {
      const x = -w + (i * w * 2) / 8
      const crest = Math.sin(i * 0.78 + layer * 1.5) * h * 0.08
      points.push([x, h * (0.24 + layer * 0.12) + crest])
    }
    points.push([w, h * 0.1])
    silhouette(THREE, surface, {
      points,
      z: z + 0.01 + layer * 0.006,
      colour: [0x2f3d32, 0x48584b, 0x6e7d70][layer],
    })
  }

  // Distant glowing sun / moon
  surface.sphere([w * 0.14, h * 0.14, 0.01], [w * 0.32, h * 0.74, z + 0.012], 0xded2b0)
}

export function dressQueenUnmaPicture(
  THREE: typeof Three,
  surface: QueenUnmaSurface,
  index: number,
): void {
  const { width: w, structure } = surface
  const h = structure.height
  const z = surface.depth / 2 + 0.02

  // Backing panel and canvas
  surface.box([w + 0.05, h + 0.05, 0.025], [0, h / 2, z - 0.01], UNMA_WOOD)
  surface.box([w * 0.94, h * 0.93, 0.02], [0, h / 2, z], 0x1f1b17)

  // Double molded gilded frame
  unmaFrame(surface, { width: w * 0.96, height: h * 0.95, y: h / 2, z: z + 0.012 })
  unmaFrame(surface, {
    width: w * 0.88,
    height: h * 0.86,
    y: h / 2,
    z: z + 0.018,
    trim: 0.035,
    colour: UNMA_STONE,
  })

  // Hanging chain / cord to ceiling
  surface.box([0.018, 0.65, 0.01], [0, h + 0.32, z + 0.01], UNMA_GOLD)

  // Brass picture light fixture mounted above frame
  const lightZ = z + 0.16
  surface.box([0.02, 0.02, 0.14], [-w * 0.18, h * 0.98, z + 0.08], UNMA_GOLD)
  surface.box([0.02, 0.02, 0.14], [w * 0.18, h * 0.98, z + 0.08], UNMA_GOLD)
  surface.into.cylinder(
    { radius: 0.024, height: w * 0.52, sides: 12 },
    {
      at: surface.point([0, h * 0.98, lightZ]),
      rotation: [0, surface.angle, Math.PI / 2],
      colour: UNMA_GOLD,
    },
  )
  surface.into.box([w * 0.48, 0.014, 0.018], {
    at: surface.point([0, h * 0.965, lightZ]),
    colour: 0xfff4da,
    glow: true,
  })

  if (index === 0 || structure.id.includes('centre')) {
    dynasticCrestCanvas(THREE, surface, z)
  } else {
    landscapeCanvas(THREE, surface, z)
  }
}
