import type * as Three from 'three'
import {
  BenjaminRoomSurface,
  BENJAMIN_BRONZE,
  BENJAMIN_GOLD_TRIM,
  BENJAMIN_STONE,
  benjaminMouldedFrame,
} from './benjaminRoomDetailSurface'

interface SilhouetteOptions {
  points: readonly (readonly [number, number])[]
  z: number
  colour: number
}

function silhouette(
  THREE: typeof Three,
  surface: BenjaminRoomSurface,
  options: SilhouetteOptions,
): void {
  const shape = new THREE.Shape()
  options.points.forEach(([x, y], index) => (index ? shape.lineTo(x, y) : shape.moveTo(x, y)))
  shape.closePath()
  surface.add(new THREE.ShapeGeometry(shape), [0, 0, options.z], options.colour)
}

function martialCanvas(THREE: typeof Three, surface: BenjaminRoomSurface): void {
  const w = surface.width
  const h = surface.structure.height
  const z = surface.depth / 2 + 0.04

  // Stormy sky background
  surface.box([w * 0.92, h * 0.91, 0.015], [0, h / 2, z], 0x3d433b)
  surface.box([w * 0.88, h * 0.45, 0.018], [0, h * 0.7, z + 0.005], 0x5a5342)

  // Distant rugged mountains
  for (let layer = 0; layer < 2; layer++) {
    const half = w * 0.45
    const pts: [number, number][] = Array.from({ length: 11 }, (_, i) => {
      const x = -half + (i * (half * 2)) / 10
      const peak = Math.sin(i * 1.1 + layer) * 0.18 + Math.cos(i * 2.3) * 0.08
      return [x, h * (0.35 + layer * 0.12 + peak)]
    })
    silhouette(THREE, surface, {
      points: [[-half, h * 0.15], [half, h * 0.15], ...pts.reverse()],
      z: z + 0.02 + layer * 0.01,
      colour: layer === 0 ? 0x2b302a : 0x383e35,
    })
  }

  // Foreground army phalanx, spears and cavalry charge
  const phalanxBase = h * 0.18
  for (let i = 0; i < 7; i++) {
    const sx = (i - 3) * (w * 0.12)
    const sy = phalanxBase + (i % 2) * 0.08
    surface.sphere([0.05, 0.09, 0.02], [sx, sy + 0.22, z + 0.04], BENJAMIN_STONE)
    surface.box([0.07, 0.22, 0.02], [sx, sy + 0.1, z + 0.04], 0x222622)
    // Spear / standard
    surface.box([0.012, 0.55, 0.015], [sx + 0.04, sy + 0.35, z + 0.045], BENJAMIN_GOLD_TRIM)
    surface.box([0.08, 0.06, 0.015], [sx + 0.08, sy + 0.56, z + 0.045], 0x8a3324)
  }

  // Central commander on rearing warhorse
  const cx = 0.15
  const cy = phalanxBase + 0.15
  surface.sphere([0.16, 0.11, 0.03], [cx, cy + 0.14, z + 0.05], 0x1f1f1d)
  surface.sphere([0.08, 0.14, 0.025], [cx + 0.12, cy + 0.25, z + 0.055], 0x1f1f1d)
  surface.sphere([0.06, 0.08, 0.025], [cx - 0.02, cy + 0.35, z + 0.06], BENJAMIN_GOLD_TRIM)
  surface.box([0.02, 0.42, 0.018], [cx + 0.08, cy + 0.48, z + 0.065], BENJAMIN_BRONZE)
}

function heroicFrame(surface: BenjaminRoomSurface): void {
  const w = surface.width
  const h = surface.structure.height
  const z = surface.depth / 2 + 0.08

  for (const inset of [0, 0.06, 0.12]) {
    benjaminMouldedFrame(surface, {
      width: w - inset * 2,
      height: h - inset * 2,
      y: h / 2,
      z: z + (inset === 0.06 ? 0.03 : 0),
      trim: inset === 0 ? 0.09 : 0.04,
    })
  }

  // Imperial bronze crest at top center
  surface.box([0.35, 0.14, 0.08], [0, h + 0.03, z + 0.02], BENJAMIN_BRONZE)
  surface.sphere([0.14, 0.09, 0.05], [0, h + 0.06, z + 0.05], BENJAMIN_GOLD_TRIM)
  surface.cylinder(
    { radius: 0.06, height: 0.06, sides: 8 },
    [0, h + 0.12, z + 0.04],
    BENJAMIN_BRONZE,
  )

  // Bronze rosettes at the 4 corners
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const rx = (sx * (w - 0.14)) / 2
      const ry = h / 2 + (sy * (h - 0.14)) / 2
      surface.cylinder({ radius: 0.06, height: 0.04, sides: 12 }, [rx, ry, z + 0.05], BENJAMIN_BRONZE)
      surface.sphere([0.03, 0.03, 0.02], [rx, ry, z + 0.07], BENJAMIN_GOLD_TRIM)
    }
  }
}

export function dressBenjaminRoomPicture(
  THREE: typeof Three,
  surface: BenjaminRoomSurface,
  _index: number,
): void {
  martialCanvas(THREE, surface)
  heroicFrame(surface)
}
