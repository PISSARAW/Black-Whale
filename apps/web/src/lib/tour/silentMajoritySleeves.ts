import type { Group, Material, Shape } from 'three'
import {
  graded,
  place,
  voluteGeometry,
  type Geometry,
  type Kit,
  type Outlined,
  type Three,
} from './silentMajorityParts'

export interface SleeveBuild {
  THREE: Three
  geometry: Geometry
  outlined: Outlined
  arms: Group[]
  cloth: Material
  ink: Material
  pale: Material
}

const FRONT = 0.1
const LINING_FRONT = 0.078
const CUFF = -0.18

/** Outer cuffs, hanging panels and exposed knuckles from the front view in ch. 370. */
export function addSilentMajoritySleeves(build: SleeveBuild): void {
  const { THREE, arms } = build
  arms.forEach((arm, index) => {
    const side = index === 0 ? -1 : 1
    const sleeve = new THREE.Group()
    sleeve.name = side < 0 ? 'silent-sleeve-left' : 'silent-sleeve-right'
    sleeve.scale.x = side
    sleeve.position.set(side * 0.02, -0.34, 0)
    arm.add(sleeve)
    addSleeveCloth(build, sleeve)
    addCrests(build, sleeve)
    addRearCrests(build, sleeve)
    addFist(build, sleeve)
    const rigHand = arm.getObjectByName(side < 0 ? 'hand-left' : 'hand-right')
    if (rigHand) rigHand.visible = false
  })
}

function panelGeometry(THREE: Three, outline: Shape, front: number) {
  const panel = new THREE.ExtrudeGeometry(outline, { depth: front * 2, bevelEnabled: false })
  panel.translate(0, 0, -front)
  return graded(THREE, panel, [0.85, 0.42])
}

function addSleeveCloth(build: SleeveBuild, sleeve: Group): void {
  const { THREE, geometry, outlined, ink, cloth } = build
  const outer = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:sleeve', () => {
      const outline = new THREE.Shape()
      outline.moveTo(-0.2, 0.5)
      outline.quadraticCurveTo(-0.03, 0.5, 0.04, 0.4)
      outline.quadraticCurveTo(0.09, 0.32, 0.12, CUFF + 0.008)
      outline.quadraticCurveTo(0.005, CUFF - 0.012, -0.096, CUFF)
      outline.lineTo(-0.085, 0.2)
      outline.closePath()
      return panelGeometry(THREE, outline, FRONT)
    }),
    material: cloth,
    ink,
    scale: 1.025,
  })
  outer.name = 'silent-outer-cuff'
  sleeve.add(outer)

  const lining = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:sleeve-lining', () => {
      const outline = new THREE.Shape()
      outline.moveTo(-0.055, CUFF + 0.035)
      outline.lineTo(0.103, CUFF + 0.035)
      outline.lineTo(0.117, -0.433)
      outline.quadraticCurveTo(0.045, -0.459, -0.076, -0.438)
      outline.closePath()
      return panelGeometry(THREE, outline, LINING_FRONT)
    }),
    material: cloth,
    ink,
    scale: 1.025,
  })
  lining.name = 'silent-hanging-cuff'
  sleeve.add(lining)
}

function addCrests(build: SleeveBuild, sleeve: Group): void {
  const { THREE, geometry, pale } = build
  const kit: Kit = { THREE, geometry }
  const crests: Array<[x: number, y: number, z: number, radius: number, turn: number]> = [
    [-0.018, 0.342, FRONT, 0.046, 0],
    [0.053, -0.258, LINING_FRONT, 0.035, 0.5],
    [0.047, -0.373, LINING_FRONT, 0.044, Math.PI],
  ]
  for (const [x, y, z, radius, turn] of crests) {
    place(kit, sleeve, {
      key: `silent:crest-volute:${radius}`,
      make: () => voluteGeometry(THREE, { radius, turns: 2.15, thickness: 0.006 }),
      material: pale,
      at: [x, y, z + 0.004],
      turn,
    })
  }
  const hooks: Array<[x: number, y: number, turn: number, size: number]> = [
    [-0.028, 0.245, 0.4, 1],
    [0.028, 0.212, 2.2, 1],
    [0.041, 0.155, -0.6, 0.82],
    [0.013, -0.058, 0.7, 1.3],
    [0.054, -0.108, 3.05, 1.3],
  ]
  for (const [x, y, turn, size] of hooks) {
    place(kit, sleeve, {
      key: 'silent:crest-hook',
      make: () => voluteGeometry(THREE, { radius: 0.032, turns: 0.84, thickness: 0.0065 }),
      material: pale,
      at: [x, y, FRONT + 0.004],
      turn,
      scale: [size, size],
    })
  }
}

function addRearCrests({ THREE, geometry, pale }: SleeveBuild, sleeve: Group): void {
  const kit: Kit = { THREE, geometry }
  const mark = new THREE.Group()
  mark.name = 'silent-sleeve-rear-crest'
  mark.rotation.y = Math.PI
  sleeve.add(mark)
  const curls: Array<
    [x: number, y: number, z: number, radius: number, turns: number, turn: number]
  > = [
    [0.018, 0.313, FRONT, 0.064, 1.95, 0.66],
    [0.006, -0.222, LINING_FRONT, 0.054, 0.86, -0.86],
    [-0.012, -0.347, LINING_FRONT, 0.067, 1.7, -0.18],
    [-0.086, -0.389, LINING_FRONT, 0.041, 0.73, 1.22],
  ]
  for (const [x, y, z, radius, turns, turn] of curls) {
    place(kit, mark, {
      key: `silent:rear-cuff-volute:${radius}`,
      make: () => voluteGeometry(THREE, { radius, turns, thickness: 0.008 }),
      material: pale,
      at: [x, y, z + 0.005],
      turn,
    })
  }
}

function addFist({ THREE, geometry, outlined, ink, pale }: SleeveBuild, sleeve: Group): void {
  const fist = outlined({
    THREE,
    geometry: geometry(THREE, 'silent:fist', () => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.026, 0.05)
      shape.lineTo(0.025, 0.05)
      shape.lineTo(0.024, -0.034)
      shape.quadraticCurveTo(0.021, -0.068, 0.005, -0.065)
      shape.quadraticCurveTo(-0.007, -0.079, -0.019, -0.068)
      shape.quadraticCurveTo(-0.031, -0.077, -0.036, -0.061)
      shape.quadraticCurveTo(-0.054, -0.063, -0.049, -0.043)
      shape.quadraticCurveTo(-0.063, -0.027, -0.044, -0.015)
      shape.lineTo(-0.027, 0.004)
      shape.closePath()
      const made = new THREE.ExtrudeGeometry(shape, { depth: 0.042, bevelEnabled: false })
      made.translate(0, 0, -0.021)
      return graded(THREE, made, [1, 0.84])
    }),
    material: pale,
    ink,
    scale: 1.07,
  })
  fist.name = 'silent-fist'
  fist.position.set(-0.037, CUFF - 0.045, FRONT - 0.006)
  sleeve.add(fist)
}
