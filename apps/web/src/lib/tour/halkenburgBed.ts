import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'

const LINEN = 0xdcd8cb,
  WOOD = 0x8d8069,
  TRIM = 0xb6ad97

function headboard(surface: ApartmentSurface): void {
  const w = surface.width,
    z = -surface.depth / 2 + 0.08
  surface.box([w, 1.23, 0.12], [0, 0.72, z], WOOD)
  surface.box([w - 0.18, 0.65, 0.07], [0, 0.98, z + 0.08], LINEN)
  surface.curve(
    [
      [-w / 2, 1.3, z],
      [0, 1.43, z],
      [w / 2, 1.3, z],
    ],
    0.055,
    TRIM,
  )
  for (let x = -w / 2 + 0.17; x < w / 2 - 0.1; x += 0.12)
    surface.sphere(
      [0.025, 0.035, 0.017],
      [x, 1.32 + 0.1 * Math.cos((x / w) * Math.PI), z + 0.065],
      TRIM,
    )
}

function headCurtains(THREE: typeof Three, surface: ApartmentSurface): void {
  const w = surface.width,
    z = -surface.depth / 2 + 0.12
  surface.box([w + 0.65, 0.06, 0.1], [0, 2.66, z], TRIM)
  for (const side of [-1, 1]) {
    const cloth = new THREE.PlaneGeometry(w * 0.3, 1.16, 16, 12)
    const points = cloth.attributes.position
    for (let i = 0; i < points.count; i++) {
      const u = points.getX(i),
        y = points.getY(i) + 2.04
      const x = side * w * 0.48 + u * (0.7 + (y - 1.46) * 0.25)
      points.setXYZ(i, x, y, z + 0.04 * Math.sin(u * 42))
    }
    cloth.computeVertexNormals()
    surface.add(cloth, [0, 0, 0], LINEN)
  }
  const valance = new THREE.PlaneGeometry(w + 0.52, 0.25, 30, 6)
  const points = valance.attributes.position
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i),
      sag = 0.14 * Math.cos((x / (w + 0.52)) * Math.PI)
    points.setXYZ(i, x, points.getY(i) + 2.51 - sag, z + 0.035 * Math.sin(x * 24))
  }
  valance.computeVertexNormals()
  surface.add(valance, [0, 0, 0], LINEN)
}

function bedding(THREE: typeof Three, surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  const cloth = new THREE.PlaneGeometry(w + 0.12, d * 0.93, 28, 22).rotateX(-Math.PI / 2)
  const points = cloth.attributes.position
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i),
      z = points.getZ(i) + d * 0.08
    const fold = 0.035 * Math.sin(x * 9 + z * 6) + 0.022 * Math.cos(z * 12 - x * 5)
    const drop = Math.min(
      0.43,
      Math.max(0, Math.abs(x) - w / 2 + 0.1) * 2 + Math.max(0, z - d * 0.42) * 1.8,
    )
    points.setXYZ(i, x, h + 0.08 + fold - drop, z)
  }
  cloth.computeVertexNormals()
  surface.add(cloth, [0, 0, 0], LINEN)
  for (const x of [-w * 0.24, w * 0.24])
    surface.sphere([w * 0.21, 0.09, 0.28], [x, h + 0.14, -d * 0.3], LINEN)
}

/** Ch. 366 p. 5: rounded carved head, pale pillows, loose sheet and curtains behind the head. */
export function dressHalkenburgBed(THREE: typeof Three, surface: ApartmentSurface): void {
  const w = surface.width,
    d = surface.depth,
    h = surface.structure.height
  surface.box([w, 0.3, d], [0, 0.22, 0], WOOD)
  surface.box([w - 0.05, 0.23, d - 0.05], [0, h - 0.08, 0], LINEN)
  for (const side of [-1, 1]) surface.box([0.03, 0.35, d], [(side * w) / 2, 0.28, 0], LINEN)
  surface.box([w, 0.35, 0.03], [0, 0.28, d / 2], LINEN)
  headboard(surface)
  headCurtains(THREE, surface)
  bedding(THREE, surface)
}
