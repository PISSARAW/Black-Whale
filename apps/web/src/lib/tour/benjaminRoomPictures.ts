import type * as Three from 'three'
import { BenjaminRoomSurface, benjaminMouldedFrame } from './benjaminRoomDetailSurface'

function landscape(THREE: typeof Three, surface: BenjaminRoomSurface): void {
  const w = surface.width,
    h = surface.structure.height,
    z = surface.depth / 2 + 0.055
  surface.box([w - 0.18, h - 0.18, 0.018], [0, h / 2, z], 0xa7b2ad)
  for (let layer = 0; layer < 3; layer++) {
    const shape = new THREE.Shape()
    const half = (w - 0.22) / 2
    shape.moveTo(-half, 0.12)
    shape.lineTo(half, 0.12)
    for (let i = 12; i >= 0; i--) {
      const x = -half + (i / 12) * half * 2
      const ridge = Math.sin(i * 1.3 + layer) * 0.09 + Math.cos(i * 0.7) * 0.07
      shape.lineTo(x, h * (0.54 - layer * 0.13 + ridge))
    }
    shape.closePath()
    surface.add(
      new THREE.ShapeGeometry(shape),
      [0, 0, z + 0.015 + layer * 0.012],
      [0x7b8d87, 0x536d63, 0x384e42][layer],
    )
  }
  const water = new THREE.Shape()
  water.moveTo(-w * 0.3, h * 0.18)
  water.lineTo(w * 0.12, h * 0.29)
  water.lineTo(w * 0.24, h * 0.39)
  water.lineTo(w * 0.15, h * 0.31)
  water.lineTo(-w * 0.05, h * 0.21)
  water.closePath()
  surface.add(new THREE.ShapeGeometry(water), [0, 0, z + 0.054], 0x9dada7)
}

/** Ch. 363 p. 13: simple rectangular landscape and caption plate; no martial subjects identified. */
export function dressBenjaminRoomPicture(THREE: typeof Three, surface: BenjaminRoomSurface): void {
  const w = surface.width,
    h = surface.structure.height,
    z = surface.depth / 2 + 0.08
  landscape(THREE, surface)
  for (const inset of [0, 0.07]) {
    benjaminMouldedFrame(surface, {
      width: w - inset * 2,
      height: h - inset * 2,
      y: h / 2,
      z: z + inset / 2,
      trim: 0.045,
    })
  }
  surface.box([0.27, 0.055, 0.02], [0, -0.1, z], 0xc0baa5)
}
