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
  pale: Material
  hair: Material
  brass: Material
  head: Group
}

const FACE = 0.236
const MARK = FACE + 0.003
const ZIPPER_TOP = FRINGE - 0.008
const ZIPPER_BOTTOM = -0.216
const ZIPPER_LENGTH = ZIPPER_TOP - ZIPPER_BOTTOM

/** Porcelain plate and hardware, drawn from the frontal reveal in ch. 369. */
export function addSilentMajorityMask(build: MaskBuild): void {
  const { THREE, geometry, outlined, ink, pale, head } = build
  const kit: Kit = { THREE, geometry }
  const plate = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:mask-plate', () => {
      const outline = new THREE.Shape()
      outline.moveTo(-0.143, FRINGE)
      outline.quadraticCurveTo(0, FRINGE - 0.01, 0.143, FRINGE)
      outline.bezierCurveTo(0.143, -0.009, 0.139, -0.083, 0.115, -0.132)
      outline.quadraticCurveTo(0.086, -0.189, 0.025, -0.219)
      outline.quadraticCurveTo(0, -0.228, -0.025, -0.219)
      outline.quadraticCurveTo(-0.086, -0.189, -0.115, -0.132)
      outline.bezierCurveTo(-0.139, -0.083, -0.143, -0.009, -0.143, FRINGE)
      outline.closePath()
      const made = new THREE.ExtrudeGeometry(outline, { depth: 0.03, bevelEnabled: false })
      return graded(THREE, made, [1, 0.93])
    }),
    material: pale,
    ink,
    scale: 1.03,
  })
  plate.name = 'silent-mask'
  plate.position.z = FACE - 0.03
  head.add(plate)

  addSilentMajorityHair(build)
  addCrosses(kit, build)
  addZipper(kit, build)
  addNape(kit, build)
}

function addNape(kit: Kit, { THREE, ink, pale, brass, head }: MaskBuild): void {
  const nape = new THREE.Group()
  nape.name = 'silent-nape'
  nape.rotation.y = Math.PI
  head.add(nape)
  place(kit, nape, {
    key: 'silent:nape-plate',
    make: () => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.104, -0.218)
      shape.quadraticCurveTo(-0.098, -0.105, 0, -0.089)
      shape.quadraticCurveTo(0.098, -0.105, 0.104, -0.218)
      shape.closePath()
      return new THREE.ShapeGeometry(shape)
    },
    material: pale,
    at: [0, 0, 0.182],
  })
  const zipper = place(kit, nape, {
    key: 'silent:nape-zipper',
    make: () => new THREE.PlaneGeometry(0.037, 0.124),
    material: ink,
    at: [0, -0.154, 0.185],
  })
  zipper.name = 'silent-nape-zipper'
  for (let tooth = 0; tooth < 7; tooth += 1) {
    place(kit, nape, {
      key: 'silent:nape-zipper-tooth',
      make: () => new THREE.PlaneGeometry(0.019, 0.005),
      material: brass,
      at: [tooth % 2 === 0 ? -0.005 : 0.005, -0.101 - tooth * 0.015, 0.187],
    })
  }
}

function crossGeometry(THREE: Three, inset: number) {
  const cross = new THREE.Shape()
  const half = 0.013 - inset
  const rail = 0.038 - inset
  const top = 0.037 - inset
  const foot = -0.071 + inset
  cross.moveTo(-half, top)
  cross.lineTo(half, top)
  cross.lineTo(half, half)
  cross.lineTo(rail, half)
  cross.lineTo(rail, -half)
  cross.lineTo(half, -half)
  cross.lineTo(half, foot)
  cross.lineTo(-half, foot)
  cross.lineTo(-half, -half)
  cross.lineTo(-rail, -half)
  cross.lineTo(-rail, half)
  cross.lineTo(-half, half)
  cross.closePath()
  return new THREE.ShapeGeometry(cross)
}

function addCrosses(kit: Kit, { THREE, ink, brass, head }: MaskBuild): void {
  for (const side of [-1, 1]) {
    const x = side * 0.085
    const cross = place(kit, head, {
      key: 'silent:mask-cross',
      make: () => crossGeometry(THREE, 0),
      material: ink,
      at: [x, FRINGE - 0.052, MARK],
      turn: side * -0.09,
    })
    cross.name = side < 0 ? 'silent-cross-left' : 'silent-cross-right'
    place(kit, cross, {
      key: 'silent:mask-cross-line',
      make: () => crossGeometry(THREE, 0.0105),
      material: brass,
      at: [0, 0, 0.0015],
    })
    const clasp = place(kit, cross, {
      key: 'silent:mask-cross-clasp',
      make: () => new THREE.PlaneGeometry(0.04, 0.011),
      material: ink,
      at: [0, -0.072, 0.0015],
    })
    place(kit, clasp, {
      key: 'silent:mask-cross-clasp-inlay',
      make: () => new THREE.PlaneGeometry(0.031, 0.004),
      material: brass,
      at: [0, 0, 0.001],
    })
  }
}

function addZipper(kit: Kit, { THREE, ink, pale, brass, head }: MaskBuild): void {
  const middle = (ZIPPER_TOP + ZIPPER_BOTTOM) / 2
  const band = place(kit, head, {
    key: 'silent:mask-band',
    make: () => new THREE.PlaneGeometry(0.044, ZIPPER_LENGTH),
    material: ink,
    at: [0, middle, MARK],
  })
  band.name = 'silent-face-zipper'
  place(kit, head, {
    key: 'silent:mask-band-insert',
    make: () => new THREE.PlaneGeometry(0.039, ZIPPER_LENGTH - 0.006),
    material: pale,
    at: [0, middle, MARK + 0.001],
  })
  place(kit, head, {
    key: 'silent:mask-zipper-teeth-outline',
    make: () => zipperTeeth(THREE, 0.0053),
    material: ink,
    at: [0, ZIPPER_TOP - 0.009, MARK + 0.003],
  })
  const teeth = place(kit, head, {
    key: 'silent:mask-zipper-teeth',
    make: () => zipperTeeth(THREE, 0.0026),
    material: brass,
    at: [0, ZIPPER_TOP - 0.009, MARK + 0.008],
  })
  teeth.name = 'silent-zipper-teeth'
  for (const side of [-1, 1]) addZipperRail(kit, { THREE, ink, pale, brass, head }, side)
}

function zipperTeeth(THREE: Three, radius: number) {
  const points: InstanceType<Three['Vector3']>[] = []
  const pitch = (ZIPPER_LENGTH - 0.018) / 10
  for (let i = 0; i < 10; i += 1) {
    const x = i % 2 === 0 ? 0.012 : -0.012
    const y = -i * pitch
    points.push(new THREE.Vector3(x, y, 0), new THREE.Vector3(x, y - pitch, 0))
  }
  const path = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.19)
  return new THREE.TubeGeometry(path, 80, radius, 6)
}

function addZipperRail(
  kit: Kit,
  { THREE, ink, pale, brass, head }: Pick<MaskBuild, 'THREE' | 'ink' | 'pale' | 'brass' | 'head'>,
  side: number,
): void {
  const length = ZIPPER_LENGTH - 0.033
  const middle = ZIPPER_TOP - length / 2
  place(kit, head, {
    key: 'silent:mask-zipper-rail',
    make: () => new THREE.PlaneGeometry(0.022, length),
    material: ink,
    at: [side * 0.033, middle, MARK],
  })
  place(kit, head, {
    key: 'silent:mask-zipper-rail-inlay',
    make: () => new THREE.PlaneGeometry(0.015, length - 0.006),
    material: pale,
    at: [side * 0.033, middle, MARK + 0.001],
  })
  for (let i = 0; i < 8; i += 1) {
    const stud = place(kit, head, {
      key: 'silent:mask-stud',
      make: () => new THREE.CircleGeometry(0.007, 12),
      material: ink,
      at: [side * 0.033, ZIPPER_TOP - 0.012 - i * ((length - 0.024) / 7), MARK + 0.002],
    })
    place(kit, stud, {
      key: 'silent:mask-stud-head',
      make: () => new THREE.RingGeometry(0.002, 0.0044, 10),
      material: brass,
      at: [0, 0, 0.001],
    })
  }
}
