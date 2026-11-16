import type { TierPlan } from '../tour/blueprint'
import type { Structure, Vec2 } from '../tour/types'

const weighted = (items: readonly Structure[], weight: number): Vec2[] =>
  items.flatMap(({ at }) => Array.from({ length: weight }, () => at))

/** Defining furniture is read from the visit; no second set of metric placements. */
export function roomFocus(spaceId: string, plan: TierPlan): readonly Vec2[] | undefined {
  const structures = plan.structures.filter((item) => item.spaceId === spaceId)
  if (spaceId === 'tier-1-queens-living-quarters-room-01')
    return weighted(
      structures.filter((item) => /-(armchair|side-table-port|coffee-table)$/.test(item.id)),
      3,
    )
  if (spaceId === 'tier-3-cineplex-entrance-concourse')
    return weighted(
      structures.filter((item) => item.kind === 'pillar'),
      8,
    )
  if (spaceId === 'tier-3-cineplex-screen-corridor')
    return weighted(
      structures.filter((item) => item.kind === 'painting'),
      8,
    )
  if (/-royal-residential-sector-room-10\d\d-living$/.test(spaceId)) {
    const main =
      structures.find((item) => item.kind === 'table') ??
      structures.find((item) => item.kind === 'seat')
    return main ? weighted([main], 8) : undefined
  }
  if (spaceId === 'tier-2-heilly-secret-hideout-corridor')
    return plan.doorways.map(
      ({ start, end }) => [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2] as const,
    )
  return undefined
}
