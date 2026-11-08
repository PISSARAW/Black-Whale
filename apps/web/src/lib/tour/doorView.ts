import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { RoomDetailOptions } from './TierView'
import type { Doorway } from './types'
import { computeDoorPlacement, type DoorDressContext } from './doorDetailSurface'
import {
  dressTier1Door,
  dressTier2Door,
  dressTier3Door,
  dressTier4Door,
  dressTier5Door,
} from './doorTierBuilders'

/** Resolves ship tier (1 to 5) from space ID or deck tier fallback. */
export function resolveTier(spaceId: string, tierIdFallback = 'tier-1'): 1 | 2 | 3 | 4 | 5 {
  const match = spaceId.match(/^tier-([1-5])/)
  if (match) return Number(match[1]) as 1 | 2 | 3 | 4 | 5
  const fallbackMatch = tierIdFallback.match(/^tier-([1-5])/)
  if (fallbackMatch) return Number(fallbackMatch[1]) as 1 | 2 | 3 | 4 | 5
  return 1
}

function dressDoorByTier(context: DoorDressContext, tier: 1 | 2 | 3 | 4 | 5): void {
  switch (tier) {
    case 1:
      dressTier1Door(context)
      break
    case 2:
      dressTier2Door(context)
      break
    case 3:
      dressTier3Door(context)
      break
    case 4:
      dressTier4Door(context)
      break
    case 5:
      dressTier5Door(context)
      break
  }
}

/** Builds faithful 3D doors for any room based on its actual doorways and tier. */
export function buildDoorDetails(options: RoomDetailOptions): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null

  // Collect doorways associated with this space
  const doors = plan.doorways.filter((door: Doorway) => door.a === spaceId)
  if (doors.length === 0) return null

  const tier = resolveTier(spaceId, plan.tier.id)
  const into = new BanquetDetailBuilder(THREE)

  for (const door of doors) {
    const placement = computeDoorPlacement(plan, door)
    dressDoorByTier({ into, door, placement }, tier)
  }

  return into.finish(`doors-${spaceId}`)
}
