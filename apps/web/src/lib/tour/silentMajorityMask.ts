import type { Group, Material } from 'three'
import {
  graded,
  place,
  type Geometry,
  type Kit,
  type Outlined,
  type Three,
} from './silentMajorityParts'
import { addSilentMajorityHair, FRINGE } from './silentMajorityHair'

export interface MaskBuild {
  THREE: Three
  geometry: Geometry
  outlined: Outlined
  ink: Material
  /** The mask is the colour of the face it hides. */
  pale: Material
  head: Group
}

/** Front of the plate, clear of the nose it covers. */
const FACE = 0.236
const MARK = FACE + 0.003

/**
 * Silent Majority's mask, as ch. 369–376 draw it.
 *
 * A plate, not a painted face: flat-sided to the cheek, then cut in to a narrow
 * chin. Two crosses stand where the eyes would be, each drawn in a double line,
 * and one band runs from the fringe to the chin with a key pattern inside it
 * and a row of studs either side. There is no mouth — the earlier row of teeth
 * was not in the drawing.
 */
export function addSilentMajorityMask(build: MaskBuild): void {
  const { THREE, geometry, outlined, ink, pale, head } = build
  const kit: Kit = { THREE, geometry }
  const plate = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:mask-plate', () => {
      const outline = new THREE.Shape()
      outline.moveTo(-0.112, 0.11)
      outline.lineTo(0.112, 0.11)
      outline.lineTo(0.108, -0.07)
      outline.lineTo(0.05, -0.222)
      outline.lineTo(-0.05, -0.222)
      outline.lineTo(-0.108, -0.07)
      outline.closePath()
      // Thin: in profile the plate should lie on the face, not stand off it.
      const made = new THREE.ExtrudeGeometry(outline, { depth: 0.03, bevelEnabled: false })
      made.translate(0, 0, -0.015)
      // One value: a plate has no jaw to shade.
      return graded(THREE, made, [1, 1])
    }),
    material: pale,
    ink,
    scale: 1.03,
  })
  plate.name = 'silent-mask'
  plate.position.z = FACE - 0.015
  head.add(plate)

  // The fringe comes down to the crosses: the plate has no forehead of its own.
  addSilentMajorityHair({ THREE, geometry, outlined, ink, head })

  addCrosses(kit, build)
  addBand(kit, build)
}

function addCrosses(kit: Kit, { THREE, ink, pale, head }: MaskBuild): void {
  for (const side of [-1, 1]) {
    for (const turn of [0, Math.PI / 2]) {
      place(kit, head, {
        key: 'silent:mask-cross',
        make: () => new THREE.PlaneGeometry(0.072, 0.026),
        material: ink,
        at: [side * 0.07, FRINGE - 0.048, MARK],
        turn,
      })
      // The pale line inside the stroke is what makes it a drawn cross rather
      // than a blot at walking distance.
      place(kit, head, {
        key: 'silent:mask-cross-line',
        make: () => new THREE.PlaneGeometry(0.058, 0.007),
        material: pale,
        at: [side * 0.07, FRINGE - 0.048, MARK + 0.002],
        turn,
      })
    }
  }
}

function addBand(kit: Kit, { THREE, ink, pale, head }: MaskBuild): void {
  // The band is the dark value and its key pattern the pale one: the drawing
  // reads as a black strip down the face before it reads as a pattern.
  place(kit, head, {
    key: 'silent:mask-band',
    make: () => new THREE.PlaneGeometry(0.05, 0.31),
    material: ink,
    at: [0, -0.065, MARK],
  })
  for (const side of [-1, 1]) {
    place(kit, head, {
      key: 'silent:mask-cheek-line',
      make: () => new THREE.PlaneGeometry(0.005, 0.11),
      material: ink,
      at: [side * 0.062, -0.085, MARK],
    })
    for (let i = 0; i < 6; i += 1) {
      place(kit, head, {
        key: 'silent:mask-stud',
        make: () => new THREE.CircleGeometry(0.0065, 8),
        material: ink,
        at: [side * 0.042, -0.03 - i * 0.031, MARK],
      })
    }
  }
  // The key pattern, reduced to what survives the distance: a rung, and a tick
  // that changes side from one rung to the next.
  for (let i = 0; i < 9; i += 1) {
    const y = 0.07 - i * 0.033
    const side = i % 2 === 0 ? 1 : -1
    place(kit, head, {
      key: 'silent:mask-rung',
      make: () => new THREE.PlaneGeometry(0.03, 0.006),
      material: pale,
      at: [0, y, MARK + 0.002],
    })
    place(kit, head, {
      key: 'silent:mask-tick',
      make: () => new THREE.PlaneGeometry(0.006, 0.02),
      material: pale,
      at: [side * 0.012, y - 0.013, MARK + 0.002],
    })
  }
}
