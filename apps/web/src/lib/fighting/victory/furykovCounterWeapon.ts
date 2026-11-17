import * as THREE from 'three'
import type { FurykovCounterKind } from './furykovCounterPlan'
import { disposeVictoryObject } from './resources'

function material(color: number) {
  return new THREE.MeshBasicMaterial({ color })
}
function blade(points: number[][], metal: THREE.Material) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  return new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false }),
    metal,
  )
}
function weapon(kind: FurykovCounterKind) {
  const root = new THREE.Group()
  root.name = `furykov-prepared-counterweapon:${kind}`
  const steel = material(0xd3dce5),
    dark = material(0x1a2d3d),
    edge = material(0x8ab9c6)
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.26, 10), dark)
  grip.position.y = 0.035
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.65, 10), steel)
  shaft.position.y = 0.32
  root.add(grip, shaft)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 24), edge)
  collar.rotation.x = Math.PI / 2
  collar.position.y = 0.18
  root.add(collar)
  const designs = {
    sever: [
      [-0.09, 0.46],
      [-0.16, 0.78],
      [-0.08, 0.92],
      [-0.08, 0.69],
      [0, 0.62],
      [0.08, 0.69],
      [0.08, 0.92],
      [0.16, 0.78],
      [0.09, 0.46],
    ],
    intercept: [
      [-0.2, 0.31],
      [-0.22, 0.65],
      [0, 0.82],
      [0.22, 0.65],
      [0.2, 0.31],
      [0, 0.38],
    ],
    pierce: [
      [-0.11, 0.49],
      [-0.055, 0.69],
      [0, 0.86],
      [0.055, 0.69],
      [0.11, 0.49],
    ],
    reach: [
      [-0.045, 0.44],
      [-0.075, 0.82],
      [0, 1],
      [0.075, 0.82],
      [0.045, 0.44],
    ],
  }
  root.add(blade(designs[kind], steel))
  if (kind === 'sever')
    root.add(
      blade(
        [
          [-0.025, 0.66],
          [0, 0.92],
          [0.025, 0.66],
        ],
        edge,
      ),
    )
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.35, 0.045), edge)
  spine.position.set(0, 0.55, 0.025)
  root.add(spine)
  return root
}
export function createFurykovCounterWeapons() {
  const models = new Map<FurykovCounterKind, THREE.Group>()
  return {
    get(kind: FurykovCounterKind) {
      const model = models.get(kind) ?? weapon(kind)
      models.set(kind, model)
      return model
    },
    dispose() {
      models.forEach(disposeVictoryObject)
      models.clear()
    },
  }
}
