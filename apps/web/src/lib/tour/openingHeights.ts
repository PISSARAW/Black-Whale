import { ceilingOf, floorOf } from './blueprint'
import { DOOR_HEIGHT } from './geometry'
import type { Space, Tier, Provenance } from './types'

const banquetZones = new Set(['tier-1-banquet-hall', 'tier-1-banquet-hall-service-end'])

/** Two levels of the continuous banquet room are not divided by a low lintel. */
export function openingHeights(options: { space: Space; other: Space; tier: Tier }): {
  top: number
  bottom: number
  provenance: Provenance
} {
  const { space, other, tier } = options
  const base = floorOf(space, tier)
  const top = Math.max(base + ceilingOf(space, tier), floorOf(other, tier) + ceilingOf(other, tier))
  const continuous = banquetZones.has(space.id) && banquetZones.has(other.id)
  const provenance =
    space.provenance === 'inferred' || other.provenance === 'inferred'
      ? 'inferred'
      : space.provenance
  return { top, bottom: continuous ? top : base + DOOR_HEIGHT, provenance }
}
