import type { BufferGeometry, Material, Group } from 'three'
import type { Three, Geometry } from './silentMajorityParts'
import { mergeHumanDetails } from './humanDetailGeometry'

export interface CluckPlume {
  length: number
  width: number
  at: readonly [number, number, number]
  turn: readonly [number, number, number]
}

/** A solid white blade, teal diamond tip and fine shaft remain readable from either side. */
export function cluckFeatherParts(THREE: Three, plume: CluckPlume) {
  const { length, width, at, turn } = plume
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.quadraticCurveTo(-width * 0.3, length * 0.23, -width, length * 0.6)
  shape.quadraticCurveTo(-width * 0.9, length * 0.82, 0, length)
  shape.quadraticCurveTo(width * 0.9, length * 0.82, width, length * 0.6)
  shape.quadraticCurveTo(width * 0.3, length * 0.23, 0, 0)
  const white = new THREE.ExtrudeGeometry(shape, {
    depth: 0.006,
    bevelEnabled: false,
    curveSegments: 10,
  }).translate(0, 0, -0.003)
  const mark = new THREE.Shape()
  mark.moveTo(0, length)
  mark.lineTo(-width * 0.64, length * 0.77)
  mark.lineTo(0, length * 0.6)
  mark.lineTo(width * 0.64, length * 0.77)
  mark.closePath()
  const teal = new THREE.ExtrudeGeometry(mark, { depth: 0.008, bevelEnabled: false }).translate(
    0,
    0,
    -0.004,
  )
  const shaft = new THREE.CylinderGeometry(0.0017, 0.0022, length * 0.92, 5).translate(
    0,
    length * 0.46,
    0.005,
  )
  for (const part of [white, teal, shaft])
    part
      .rotateX(turn[0])
      .rotateY(turn[1])
      .rotateZ(turn[2])
      .translate(...at)
  return { white, teal, shaft }
}

export function cluckPlumage(options: {
  THREE: Three
  geometry: Geometry
  key: string
  plumes: readonly CluckPlume[]
  materials: { white: Material; teal: Material; shaft: Material }
}): Group {
  const { THREE, geometry, key, plumes, materials } = options
  const group = new THREE.Group()
  group.name = key
  for (const type of ['white', 'teal', 'shaft'] as const) {
    const mesh = new THREE.Mesh(
      geometry(THREE, `${key}:${type}`, () => {
        const parts: BufferGeometry[] = []
        for (const plume of plumes) {
          const made = cluckFeatherParts(THREE, plume)
          for (const other of ['white', 'teal', 'shaft'] as const) {
            if (other === type) parts.push(made[other])
            else made[other].dispose()
          }
        }
        return mergeHumanDetails(parts)
      }),
      materials[type],
    )
    mesh.name = `${key}-${type}`
    group.add(mesh)
  }
  return group
}
