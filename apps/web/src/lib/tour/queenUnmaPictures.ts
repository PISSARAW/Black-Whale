import type * as Three from 'three'
import { QueenUnmaSurface, UNMA_WOOD, UNMA_STONE, unmaFrame } from './queenUnmaDetailSurface'

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
  _index: number,
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

  if (structure.id.endsWith('-mantel-frame')) {
    surface.box([w * 0.84, h * 0.83, 0.018], [0, h * 0.5, z + 0.025], 0xa6afa6)
    for (const side of [-1, 1])
      surface.curve(
        [
          [side * w * 0.3, h * 0.18, z + 0.04],
          [side * w * 0.12, h * 0.6, z + 0.04],
          [side * w * 0.05, h * 0.8, z + 0.04],
        ],
        0.012,
        UNMA_STONE,
      )
  } else landscapeCanvas(THREE, surface, z)
}
