import type * as Three from 'three'
import { floorOf, ceilingOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { corridorWallRuns, tierOfSpace, type WallSurface } from './corridorWallLayout'
import { dressTier1CorridorWall } from './corridorWallTier1'
import { dressTier2CorridorWall } from './corridorWallTier2'
import { dressTier3CorridorWall } from './corridorWallTier3'
import { dressTier4CorridorWall } from './corridorWallTier4'
import { dressTier5CorridorWall } from './corridorWallTier5'
import { SOLDIERS_QUARTERS } from './royalArmyRoomsStyle'

interface CorridorDetailOptions {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal?: boolean
}

interface WallDressContext {
  floor: number
  ceiling: number
}

const CORRIDOR_KEYWORDS = [
  'corridor',
  'passage',
  'promenade',
  'hallway',
  'central-spine',
  'cross-gap',
  'back-passage',
  'walkway',
  'vestibule',
] as const

/** Identifies whether a space is a circulation corridor or passage requiring wall dressing. */
export function isCorridorSpace(spaceId: string, category?: string): boolean {
  // Exclude princes quarters gate and individual approaches (handled by bespoke entrance builder)
  if (spaceId === 'tier-1-princes-quarters-gate') return false
  if (/^tier-1-royal-residential-approach-10(0[1-9]|1[0-4])$/.test(spaceId)) return false

  if (category === 'corridor') return true
  return CORRIDOR_KEYWORDS.some((keyword) => spaceId.includes(keyword))
}

function dressCorridorWallByTier(
  wall: WallSurface,
  tier: 1 | 2 | 3 | 4 | 5,
  context: WallDressContext,
): void {
  switch (tier) {
    case 1:
      dressTier1CorridorWall(wall, context)
      break
    case 2:
      dressTier2CorridorWall(wall, context)
      break
    case 3:
      dressTier3CorridorWall(wall, context)
      break
    case 4:
      dressTier4CorridorWall(wall, context)
      break
    case 5:
      dressTier5CorridorWall(wall, context)
      break
  }
}

/** Builds faithful 3D manga corridor wall architecture for the specified space according to its tier. */
export function buildCorridorWallDetails(options: CorridorDetailOptions): Three.Group | null {
  const { THREE, plan, spaceId } = options
  const space = plan.spaces.find((s) => s.id === spaceId)
  if (!space || space.locationId === SOLDIERS_QUARTERS) return null
  if (!isCorridorSpace(space.id, space.category)) return null

  const runs = corridorWallRuns(plan, space)
  if (runs.length === 0) return null

  const tier = tierOfSpace(space.id, plan.tier.id)
  const floor = floorOf(space, plan.tier)
  const ceilingHeight = ceilingOf(space, plan.tier)
  const context: WallDressContext = { floor, ceiling: floor + ceilingHeight }

  const into = new BanquetDetailBuilder(THREE)
  for (const run of runs) {
    dressCorridorWallByTier({ into, run }, tier, context)
  }

  return into.finish(`corridor-walls-${space.id}`)
}
