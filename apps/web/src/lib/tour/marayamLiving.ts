import type * as Three from 'three'
import type { ApartmentSurface } from './apartmentDetailSurface'
import { dressApartmentFurniture } from './apartmentFurniture'

const WOOD = 0x92836d,
  PALE = 0xd6cfbe,
  DARK = 0x535d51

function car(s: ApartmentSurface, at: { x: number; z: number }): void {
  s.box([0.3, 0.09, 0.13], [at.x, 0.09, at.z], WOOD)
  s.box([0.16, 0.075, 0.12], [at.x - 0.025, 0.17, at.z], PALE)
  for (const x of [-0.1, 0.1]) {
    for (const z of [-0.075, 0.075])
      s.sphere([0.045, 0.045, 0.022], [at.x + x, 0.082, at.z + z], DARK)
  }
}

/** Ch. 372 p. 16: bordered play rug, cars, scattered blocks and folded paper on the floor. */
export function dressMarayamPlayArea(THREE: typeof Three, s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth
  s.box([w, 0.024, d], [0, 0.025, 0], 0xb3ac97)
  for (const side of [-1, 1]) {
    s.box([w - 0.12, 0.012, 0.07], [0, 0.045, side * (d / 2 - 0.08)], DARK)
    s.box([0.07, 0.012, d - 0.12], [side * (w / 2 - 0.08), 0.045, 0], DARK)
  }
  car(s, { x: -w * 0.27, z: -d * 0.22 })
  car(s, { x: w * 0.16, z: d * 0.2 })
  for (let i = 0; i < 10; i++)
    s.box(
      [0.09, 0.07 + (i % 2) * 0.035, 0.09],
      [Math.sin(i * 2.4) * w * 0.25, 0.07, Math.cos(i * 1.7) * d * 0.24],
      i % 2 ? PALE : WOOD,
    )
  const shape = new THREE.Shape()
  shape.moveTo(0, -0.17)
  shape.lineTo(-0.13, 0.12)
  shape.lineTo(0, 0.06)
  shape.lineTo(0.13, 0.12)
  shape.closePath()
  const paper = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2)
  s.add(paper, [w * 0.3, 0.04, -d * 0.25], PALE)
}

export function dressMarayamToyBox(s: ApartmentSurface): void {
  const w = s.width,
    d = s.depth,
    h = s.structure.height
  s.box([w, 0.04, d], [0, 0.035, 0], WOOD)
  for (const side of [-1, 1]) {
    s.box([w, h, 0.04], [0, h / 2, side * (d / 2 - 0.02)], PALE)
    s.box([0.04, h, d], [side * (w / 2 - 0.02), h / 2, 0], PALE)
  }
  for (let i = 0; i < 5; i++)
    s.box(
      [0.13, 0.11, 0.12],
      [((i % 3) - 1) * w * 0.2, h * 0.7, ((i % 2) - 0.5) * d * 0.35],
      i % 2 ? DARK : WOOD,
    )
}

export function dressMarayamShelf(s: ApartmentSurface): void {
  dressApartmentFurniture(s)
  const w = s.width,
    d = s.depth
  for (const y of [0.5, 1, 1.5]) {
    s.box([w - 0.1, 0.04, d], [0, y, 0.02], PALE)
    for (let i = 0; i < 6; i++)
      s.box(
        [0.09, 0.25 + (i % 3) * 0.03, 0.15],
        [(i - 2.5) * w * 0.12, y + 0.16, d * 0.3],
        i % 2 ? WOOD : DARK,
      )
  }
}

/** Ch. 367 p. 19: horizontal louvres divided into two fields. */
export function dressMarayamGrille(s: ApartmentSurface): void {
  const w = s.width,
    h = s.structure.height
  s.box([w, h, 0.07], [0, h / 2, 0], WOOD)
  s.box([w - 0.07, h - 0.07, 0.02], [0, h / 2, 0.045], 0x252b27)
  s.box([0.025, h - 0.05, 0.025], [0, h / 2, 0.065], PALE)
  for (let y = 0.065; y < h - 0.04; y += 0.07)
    s.box([w - 0.08, 0.022, 0.04], [0, y, 0.065], 0xa8ad9e)
}

/** Original landscape-like marks, following the light/dark grouping of the framed picture in ch. 366 p. 1. */
export function dressMarayamPainting(s: ApartmentSurface): void {
  const w = s.width,
    h = s.structure.height
  s.box([w, h, 0.045], [0, h / 2, 0], WOOD)
  s.box([w - 0.1, h - 0.1, 0.025], [0, h / 2, 0.035], PALE)
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * w * 0.16
    s.curve(
      [
        [x - 0.08, h * 0.35, 0.055],
        [x + 0.05, h * 0.52, 0.055],
        [x + 0.15, h * 0.42, 0.055],
      ],
      0.02,
      DARK,
    )
  }
}

export function dressMarayamSideTable(s: ApartmentSurface): void {
  const h = s.structure.height
  s.cylinder({ radius: s.width / 2, height: 0.055, sides: 24 }, [0, h - 0.025, 0], PALE)
  for (const side of [-1, 1])
    s.curve(
      [
        [side * 0.32, h - 0.04, 0],
        [side * 0.22, 0.2, 0],
        [side * 0.4, 0.035, 0],
      ],
      0.035,
      WOOD,
    )
}
