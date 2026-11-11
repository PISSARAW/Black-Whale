import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x928069,
  TRIM = 0xb9a783,
  LINEN = 0xdbd3c0

function headboard(surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    z = -d / 2 + 0.06
  surface.box([w, 1.05, 0.14], [0, 1.05, z], WOOD)
  surface.box([w - 0.17, 0.79, 0.06], [0, 1.05, z + 0.1], 0xb5ac96)
  for (let x = -w / 2 + 0.22; x < w / 2 - 0.13; x += 0.075)
    surface.box([0.009, 0.58, 0.012], [x, 1.01, z + 0.14], 0xa19882)
  surface.curve(
    [
      [-w / 2, 1.6, z],
      [-w * 0.27, 1.79, z],
      [0, 1.86, z],
      [w * 0.27, 1.79, z],
      [w / 2, 1.6, z],
    ],
    0.065,
    TRIM,
  )
  for (const side of [-1, 1]) {
    const x = side * (w / 2 + 0.025)
    surface.cylinder({ radius: 0.055, height: 1.84 }, [x, 1.08, z], WOOD)
    surface.sphere([0.09, 0.12, 0.09], [x, 2.04, z], TRIM)
    for (let i = 0; i < 5; i++) surface.sphere([0.075, 0.03, 0.075], [x, 0.35 + i * 0.32, z], TRIM)
    surface.curve(
      [
        [x, 1.82, z + 0.1],
        [side * w * 0.3, 1.64, z + 0.12],
        [0, 1.76, z + 0.12],
      ],
      0.05,
      LINEN,
    )
  }
}

/** A sheet hangs in broad swags between the two rear posts, rather than a rope. */
function headCloth(THREE: typeof Three, surface: ApartmentSurface): void {
  const w = surface.width,
    z = -surface.depth / 2 + 0.19
  for (const side of [-1, 1]) {
    const cloth = new THREE.PlaneGeometry(w / 2, 0.33, 18, 5)
    const p = cloth.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + (side * w) / 4,
        t = (x + w / 2) / w
      const sag = 0.3 * Math.sin(t * Math.PI * 2) ** 2
      p.setXYZ(i, x, p.getY(i) + 1.83 - sag, z + Math.sin(t * Math.PI * 14) * 0.018)
    }
    cloth.computeVertexNormals()
    surface.add(cloth, [0, 0, 0], LINEN)
  }
}

function blanket(THREE: typeof Three, surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  const cloth = new THREE.PlaneGeometry(w + 0.18, d * 0.93, 26, 18).rotateX(-Math.PI / 2)
  const p = cloth.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i) + d * 0.1
    const fold =
      Math.sin(x * 7 + z * 4) * 0.065 +
      Math.cos(z * 8 - x * 3) * 0.045 +
      0.13 * Math.sin(x * 3 + z * 2) ** 2
    const drop = Math.max(0, Math.abs(x) - w / 2 + 0.15) * 2 + Math.max(0, z - d * 0.4) * 1.4
    p.setXYZ(i, x, h + 0.1 + fold - Math.min(0.58, drop), z)
  }
  cloth.computeVertexNormals()
  surface.add(cloth, [0, 0, 0], LINEN)
}

/** Chs. 366 p. 6 and 381 p. 15: broad bed, curved head rail, rear posts and loose bedding. */
export function dressSalesaleBed(THREE: typeof Three, surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.3, d], [0, 0.25, 0], WOOD)
  surface.box([w - 0.07, 0.23, d - 0.07], [0, h - 0.09, 0], LINEN)
  headboard(surface)
  headCloth(THREE, surface)
  for (let i = 0; i < 18; i++) {
    const x = ((i + 0.5) * w) / 18 - w / 2
    surface.box([w / 18 + 0.004, 0.5, 0.04], [x, 0.31, d / 2], i % 2 ? 0xc8bfaa : LINEN)
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 16; i++) {
      const z = ((i + 0.5) * d) / 16 - d / 2
      surface.box([0.045, 0.5, d / 16 + 0.004], [(side * w) / 2, 0.31, z], i % 2 ? 0xc8bfaa : LINEN)
    }
  }
  blanket(THREE, surface)
  for (const x of [-w * 0.29, 0, w * 0.29])
    surface.sphere([w * 0.16, 0.13, 0.34], [x, h + 0.15, -d * 0.31], LINEN)
}
