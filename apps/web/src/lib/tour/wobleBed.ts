import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'

const WOOD = 0x91816a,
  TRIM = 0xbfb297,
  LINEN = 0xdcd6c8

function headboard(s: ApartmentSurface): void {
  s.box([s.width - 0.15, 0.55, 0.08], [0, 0.72, -s.depth / 2 + 0.06], LINEN)
  s.curve(
    [
      [-s.width * 0.46, 1, -s.depth / 2 + 0.1],
      [0, 1.08, -s.depth / 2 + 0.1],
      [s.width * 0.46, 1, -s.depth / 2 + 0.1],
    ],
    0.035,
    TRIM,
  )
}

function frame(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth
  s.box([w, 0.25, d], [0, 0.3, 0], WOOD)
  s.box([w - 0.07, 0.22, d - 0.07], [0, s.structure.height - 0.08, 0], LINEN)
  for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) {
    for (const z of [-d / 2 + 0.05, d / 2 - 0.05]) {
      s.cylinder({ radius: 0.045, height: 2.83 }, [x, 1.44, z], WOOD)
      for (const y of [0.25, 0.6, 2.55, 2.77]) s.sphere([0.065, 0.045, 0.065], [x, y, z], TRIM)
      s.sphere([0.085, 0.12, 0.085], [x, 2.97, z], TRIM)
    }
  }
  for (const z of [-d / 2 + 0.05, d / 2 - 0.05]) {
    s.box([w, 0.12, 0.09], [0, 2.78, z], WOOD)
    s.curve(
      [
        [-w / 2, 2.85, z],
        [-w * 0.25, 2.91, z],
        [0, 3.08, z],
        [w * 0.25, 2.91, z],
        [w / 2, 2.85, z],
      ],
      0.045,
      TRIM,
    )
    for (const side of [-1, 1])
      s.curve(
        [
          [side * w * 0.47, 2.74, z],
          [side * w * 0.26, 2.59, z],
          [0, 2.72, z],
        ],
        0.035,
        LINEN,
      )
  }
  for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) s.box([0.09, 0.12, d], [x, 2.78, 0], WOOD)
}

/** Cloth is visible from inside and outside the canopy while the room uses a single-sided batch. */
function clothSides(s: ApartmentSurface, geometry: Three.BufferGeometry): void {
  const back = geometry.clone(),
    indices = back.getIndex()!
  for (let i = 0; i < indices.count; i += 3) {
    const first = indices.getX(i)
    indices.setX(i, indices.getX(i + 2))
    indices.setX(i + 2, first)
  }
  back.computeVertexNormals()
  s.add(geometry, [0, 0, 0], LINEN)
  s.add(back, [0, 0, 0], LINEN)
}

function valance(THREE: typeof Three, s: ApartmentSurface): void {
  const w = s.width,
    z = s.depth / 2 - 0.055
  const cloth = new THREE.PlaneGeometry(w - 0.12, 0.28, 36, 8),
    p = cloth.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      v = (p.getY(i) + 0.14) / 0.28
    const sag = 0.12 * Math.abs(Math.sin((x / w + 0.5) * Math.PI * 2))
    p.setXYZ(i, x, 2.79 - (1 - v) * (0.22 + sag), z + 0.025 * Math.sin(x * 40))
  }
  cloth.computeVertexNormals()
  clothSides(s, cloth)
  for (const side of [-1, 1]) {
    s.curve(
      [
        [side * w * 0.47, 2.8, z + 0.035],
        [side * w * 0.25, 2.87, z + 0.035],
        [0, 3.02, z + 0.035],
      ],
      0.025,
      WOOD,
    )
    s.curve(
      [
        [side * w * 0.35, 2.83, z + 0.05],
        [side * w * 0.25, 2.94, z + 0.05],
        [side * w * 0.15, 2.88, z + 0.05],
      ],
      0.02,
      TRIM,
    )
  }
}

function curtains(THREE: typeof Three, s: ApartmentSurface): void {
  for (const side of [-1, 1]) {
    const cloth = new THREE.PlaneGeometry(0.62, 2.27, 24, 20),
      p = cloth.attributes.position
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) + 1.52,
        u = p.getX(i)
      const gather = 0.35 + 0.65 * Math.min(1, Math.abs(y - 1.1) / 1.2)
      p.setXYZ(
        i,
        side * (s.width / 2 - 0.18) + u * gather,
        y,
        s.depth / 2 - 0.08 + 0.055 * Math.sin(u * 46),
      )
    }
    cloth.computeVertexNormals()
    clothSides(s, cloth)
    for (let u = -0.25; u <= 0.25; u += 0.1)
      s.curve(
        [
          [side * (s.width / 2 - 0.18) + u * 0.7, 0.39, s.depth / 2 - 0.015],
          [side * (s.width / 2 - 0.18) + u * 0.35, 1.1, s.depth / 2 - 0.015],
          [side * (s.width / 2 - 0.18) + u, 2.65, s.depth / 2 - 0.015],
        ],
        0.006,
        0xb5ad9b,
      )
    s.box([0.25, 0.055, 0.15], [side * (s.width / 2 - 0.18), 1.1, s.depth / 2 - 0.04], TRIM)
  }
}

function bedding(THREE: typeof Three, s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  const cloth = new THREE.PlaneGeometry(w + 0.15, d + 0.12, 34, 28).rotateX(-Math.PI / 2),
    p = cloth.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i) + 0.1
    const drop = Math.min(
      0.4,
      Math.max(0, Math.abs(x) - w / 2 + 0.14) * 2 + Math.max(0, z - d * 0.42) * 1.9,
    )
    const folds = 0.035 * Math.sin(x * 8 + z * 5) + 0.025 * Math.cos(z * 10 - x * 4)
    p.setXYZ(i, x, h + 0.08 + folds - drop, z)
  }
  cloth.computeVertexNormals()
  s.add(cloth, [0, 0, 0], LINEN)
  for (const x of [-w * 0.25, w * 0.25])
    s.sphere([w * 0.21, 0.1, 0.29], [x, h + 0.16, -d * 0.32], LINEN)
}

/** Ch. 371 p. 4: broad pale bed, four columns, scalloped valance and tied-open curtains; no infant crib is established by this panel. */
export function dressWobleBed(THREE: typeof Three, surface: ApartmentSurface): void {
  frame(surface)
  headboard(surface)
  curtains(THREE, surface)
  valance(THREE, surface)
  bedding(THREE, surface)
}
