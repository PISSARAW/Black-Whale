import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x96856d,
  TRIM = 0xb6aa8d,
  LINEN = 0xd8d2c2

function bedFrame(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.3, d], [0, 0.26, 0], WOOD)
  surface.box([w - 0.08, 0.22, d - 0.08], [0, h - 0.07, 0], LINEN)
  surface.box([w, 0.48, 0.09], [0, 0.36, d / 2 - 0.04], WOOD)
  surface.box([w - 0.18, 0.3, 0.025], [0, 0.4, d / 2 + 0.015], 0xc4b99f)
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * w * 0.26
    surface.curve(
      [
        [x - w * 0.1, 0.42, d / 2 + 0.035],
        [x, 0.5, d / 2 + 0.035],
        [x + w * 0.1, 0.39, d / 2 + 0.035],
      ],
      0.02,
      TRIM,
    )
  }
  for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) {
    for (const z of [-d / 2 + 0.04, d / 2 - 0.04]) {
      surface.cylinder({ radius: 0.035, height: 2.58 }, [x, 1.31, z], WOOD)
      for (const y of [0.25, 0.65, 2.35]) surface.sphere([0.055, 0.035, 0.055], [x, y, z], TRIM)
      surface.sphere([0.065, 0.09, 0.065], [x, 2.65, z], TRIM)
    }
  }
  for (const z of [-d / 2 + 0.04, d / 2 - 0.04]) surface.box([w, 0.055, 0.055], [0, 2.58, z], TRIM)
  for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) surface.box([0.055, 0.055, d], [x, 2.58, 0], TRIM)
}

function curtain(
  THREE: typeof Three,
  surface: ApartmentSurface,
  options: { width: number; x: number; z: number },
): void {
  const { width, x, z } = options
  const cloth = new THREE.PlaneGeometry(width, 2.06, 32, 14)
  const p = cloth.attributes.position
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i),
      y = p.getY(i) + 1.53
    p.setXYZ(i, u + x, y + 0.014 * Math.cos(u * 20), z + 0.035 * Math.sin(u * 36))
  }
  cloth.computeVertexNormals()
  surface.add(cloth, [0, 0, 0], LINEN)
  for (let u = -width / 2 + 0.07; u < width / 2; u += 0.14) {
    const depth = z + 0.035 * Math.sin(u * 36) + 0.008
    surface.curve(
      [
        [x + u, 0.52, depth],
        [x + u + 0.012, 1.45, depth + 0.007],
        [x + u, 2.54, depth],
      ],
      0.006,
      0xbab39f,
    )
  }
}

function bedding(THREE: typeof Three, surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  const cloth = new THREE.PlaneGeometry(w + 0.12, d * 0.95, 34, 26).rotateX(-Math.PI / 2)
  const p = cloth.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i) + d * 0.07
    const fold = 0.025 * Math.sin(x * 9 + z * 7) + 0.015 * Math.cos(z * 11 - x * 4)
    const drop = Math.min(
      0.42,
      Math.max(0, Math.abs(x) - w / 2 + 0.1) * 2 + Math.max(0, z - d * 0.42) * 1.8,
    )
    p.setXYZ(i, x, h + 0.06 + fold - drop, z)
  }
  cloth.computeVertexNormals()
  surface.add(cloth, [0, 0, 0], LINEN)
  for (const x of [-w * 0.23, w * 0.23])
    surface.sphere([w * 0.21, 0.09, 0.28], [x, h + 0.14, -d * 0.32], LINEN)
}

/** Ch. 366 p. 3 and ch. 374 pp. 9–11: broad column bed, ample pale cloth and curtains. */
export function dressFugetsuBed(THREE: typeof Three, surface: ApartmentSurface): void {
  bedFrame(surface)
  curtain(THREE, surface, { width: surface.width - 0.12, x: 0, z: -surface.depth / 2 + 0.075 })
  for (const side of [-1, 1])
    curtain(THREE, surface, {
      width: 0.34,
      x: side * (surface.width / 2 - 0.17),
      z: surface.depth / 2 - 0.055,
    })
  bedding(THREE, surface)
}
