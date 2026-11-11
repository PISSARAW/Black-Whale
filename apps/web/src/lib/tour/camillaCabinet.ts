import {
  CamillaSurface,
  CAMILLA_WOOD as WOOD,
  CAMILLA_STONE as STONE,
  CAMILLA_GOLD as GOLD,
} from './camillaDetailSurface'

/** Ch. 389 p. 16: a tall framed cabinet silhouette; the interior contents are unreadable. */
export function dressCamillaArchedCabinet(surface: CamillaSurface): void {
  surface.box([0.96, 0.09, 0.94], [0, 0.05, 0], WOOD)
  surface.box([0.87, 0.69, 0.82], [0, 0.43, 0], WOOD)
  for (const x of [-0.22, 0.22]) {
    surface.box([0.38, 0.28, 0.04], [x, 0.24, -0.43], STONE)
    surface.sphere([0.018, 0.014, 0.015], [x * 0.35, 0.27, -0.46], GOLD)
  }
  // The curved head is built in geometry, with no sampled image or invented contents.
  const shape = new surface.THREE.Shape()
  shape.moveTo(-0.43, 0.4)
  shape.lineTo(0.43, 0.4)
  shape.lineTo(0.43, 0.8)
  shape.quadraticCurveTo(0.43, 0.98, 0, 0.98)
  shape.quadraticCurveTo(-0.43, 0.98, -0.43, 0.8)
  shape.closePath()
  surface.add(new surface.THREE.ShapeGeometry(shape), {
    at: [0, 0, -0.42],
    colour: 0x878879,
    rotation: [0, Math.PI, 0],
  })
  // ShapeGeometry faces +Z; build the front outline in the cabinet's -Z convention.
  surface.curve(
    [
      [-0.46, 0.39, -0.45],
      [-0.46, 0.79, -0.45],
      [-0.34, 0.93, -0.45],
      [0, 0.98, -0.45],
      [0.34, 0.93, -0.45],
      [0.46, 0.79, -0.45],
      [0.46, 0.39, -0.45],
    ],
    0.018,
    WOOD,
  )
  for (const x of [-0.23, 0, 0.23]) surface.box([0.018, 0.43, 0.03], [x, 0.62, -0.46], STONE)
  surface.box([0.9, 0.025, 0.06], [0, 0.4, -0.44], GOLD)
}
