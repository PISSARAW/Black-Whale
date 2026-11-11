import type * as Three from 'three'
import type { Vec2 } from './types'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'

interface RoyalSalonFloorOptions {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

const IVORY = 0xc9bda8
const WALNUT = 0x6a4a35
const EBONY = 0x211b19

/** Broad parquet fields make the manga's long axial perspective legible at walking height. */
export function dressRoyalSalonFloor(options: RoyalSalonFloorOptions): void {
  const { into, plan, space } = options
  const y = floorOf(space, plan.tier) + 0.014

  for (const x of [-4.7, -1.35, 1.35, 4.7]) {
    into.box([0.18, 0.012, 14.9], { at: [x, y, 0], colour: EBONY })
  }
  for (const z of [-6.2, -3.4, -0.6, 2.2, 5]) {
    into.box([9.58, 0.012, 0.18], { at: [0, y + 0.001, z], colour: EBONY })
  }

  axialFields(options, y)
  sideFields(options, y)
}

function axialFields(options: RoyalSalonFloorOptions, y: number): void {
  const { into } = options
  for (const [row, z] of [-6.2, -3.4, -0.6, 2.2, 5].entries()) {
    into.box([2.5, 0.01, 2.55], { at: [0, y, z + 1.4], colour: row % 2 ? WALNUT : IVORY })
    for (const side of [-1, 1]) {
      triangle(options, {
        points: [
          [side * 1.45, z + 0.12],
          [side * 4.6, z + 0.12],
          [side * 1.45, z + 2.68],
        ],
        colour: row % 2 ? IVORY : WALNUT,
      })
      triangle(options, {
        points: [
          [side * 4.6, z + 0.12],
          [side * 4.6, z + 2.68],
          [side * 1.45, z + 2.68],
        ],
        colour: row % 2 ? WALNUT : IVORY,
      })
      const dx = side * 3.15,
        dz = -2.56
      into.box([Math.hypot(dx, dz), 0.014, 0.15], {
        at: [side * 3.025, y + 0.012, z + 1.4],
        rotation: [0, -Math.atan2(dz, dx), 0],
        colour: EBONY,
      })
    }
  }
}

function sideFields(options: RoyalSalonFloorOptions, y: number): void {
  const { into } = options
  for (const side of [-1, 1]) {
    for (const z of [-5, -1.5, 2, 5.5]) {
      into.box([1.55, 0.01, 1.55], {
        at: [side * 7.6, y, z],
        rotation: [0, Math.PI / 4, 0],
        colour: Math.abs(z) < 2 ? IVORY : WALNUT,
      })
      into.box([0.92, 0.011, 0.92], {
        at: [side * 7.6, y + 0.001, z],
        rotation: [0, Math.PI / 4, 0],
        colour: z > 0 ? 0x8b6b50 : 0xb8aa94,
      })
    }
  }
}

function triangle(
  options: RoyalSalonFloorOptions,
  patch: { points: Vec2[]; colour: number },
): void {
  const { THREE, into, plan, space } = options,
    y = floorOf(space, plan.tier) + 0.026
  const vertices = patch.points.map(([x, z]) => [x, y, z])
  const geometry = new THREE.BufferGeometry()
  // Both winding orders keep the thin horizontal inlay visible from above.
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [
        ...vertices[0],
        ...vertices[1],
        ...vertices[2],
        ...vertices[2],
        ...vertices[1],
        ...vertices[0],
      ],
      3,
    ),
  )
  geometry.computeVertexNormals()
  into.add(geometry, { at: [0, 0, 0], colour: patch.colour })
}
