import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'

interface RoyalSalonFloorOptions {
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

  for (const z of [-4.8, -2, 0.8, 3.6]) {
    into.box([2.35, 0.01, 2.45], { at: [0, y, z], colour: z === 0.8 ? IVORY : WALNUT })
  }
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
