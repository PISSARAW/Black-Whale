import { FIGHTING_ROSTER } from './roster'
import type { FighterId } from './types'

const PHYSICAL_ROSTER: ReadonlySet<FighterId> = new Set(
  FIGHTING_ROSTER.map((fighter) => fighter.id),
)

/** Shared physical presentation for every playable matchup, including mirror matches. */
export function physicalRosterPair(a: FighterId, b: FighterId): boolean {
  return PHYSICAL_ROSTER.has(a) && PHYSICAL_ROSTER.has(b)
}
