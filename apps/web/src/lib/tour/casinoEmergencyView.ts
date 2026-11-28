import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import { CASINO_LOWER_HALL } from './casinoLayout'
import type { Space, Structure } from './types'

const STONE = 0xb3a38e
const CREAM = 0xd9ceb8
const BRASS = 0x947852
export function dressCasinoTread(into: BanquetDetailBuilder, step: Structure, floor: number): void {
  const [x, z] = step.at
  const [width, length] = step.size
  into.box([width - 0.012, 0.018, 0.046], {
    at: [
      x,
      floor + step.height - 0.002,
      z + (step.id.includes('-gaming-stair-') ? -1 : 1) * (length / 2 - 0.025),
    ],
    colour: BRASS,
  })
}

function hallFloor(into: BanquetDetailBuilder, floor: number): void {
  for (const x of [-53.25, -48.75]) {
    into.box([0.08, 0.008, 6.4], { at: [x, floor + 0.007, 59.4], colour: BRASS })
  }
  for (const z of [57.1, 59.05, 61]) {
    into.box([3.6, 0.01, 0.96], { at: [-51, floor + 0.01, z], colour: STONE })
    into.box([3.17, 0.01, 0.67], { at: [-51, floor + 0.018, z], colour: CREAM })
  }
}

function hallArchitecture(into: BanquetDetailBuilder, floor: number, solids: Structure[]): void {
  hallFloor(into, floor)
  for (const solid of solids) {
    if (solid.kind === 'platform') dressCasinoTread(into, solid, floor)
    if (solid.kind !== 'pillar') continue
    const [x, z] = solid.at
    for (const y of [0.13, 0.73, 5.55, 6.02]) {
      into.box([1.03, 0.14, 1.03], { at: [x, floor + y, z], colour: CREAM })
    }
  }
  for (const x of [-53.52, -48.48]) {
    into.box([0.1, 0.11, 3.21], {
      at: [x, floor + 1.63, 54.57],
      rotation: [0.38, 0, 0],
      colour: BRASS,
    })
    for (const [z, y] of [
      [53.28, 2.08],
      [54.56, 1.62],
      [55.86, 1.12],
    ]) {
      into.box([0.07, y, 0.07], { at: [x, floor + y / 2, z], colour: BRASS })
    }
  }
  into.box([10, 0.48, 0.85], { at: [-51, floor + 4.8, 54.15], colour: CREAM })
}

export function buildCasinoEmergencyDetails(
  THREE: typeof Three,
  plan: TierPlan,
  space: Space,
): Three.Group | null {
  if (space.id !== CASINO_LOWER_HALL) return null
  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const solids = plan.structures.filter(({ spaceId }) => spaceId === space.id)
  hallArchitecture(into, floor, solids)
  return into.finish(space.id + '-details')
}
