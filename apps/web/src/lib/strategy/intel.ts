import type { SpatialEstimate, WorldState } from '@black-whale/world-engine'
import { intelCertainty } from './rules'
import type { StrategyIntel } from './types'

/**
 * What the player's faction can claim to know after a turn.
 *
 * Sightings decay: a position observed three turns ago is reported with less
 * certainty than one seen this turn, and only what is currently observed —
 * scouted, guarded, or stood in — is confirmed. That is the whole of the fog
 * of war on this board, and it is small enough to read at once here.
 */
export interface IntelSweep {
  state: WorldState
  friendlyIds: Set<string>
  /** Locations the faction has eyes on this turn, however it got them. */
  observedLocations: readonly string[]
  turn: number
}

export function advanceIntel(
  previous: Record<string, StrategyIntel>,
  { state, friendlyIds, observedLocations, turn }: IntelSweep,
): Record<string, StrategyIntel> {
  const friendlyLocations = [...friendlyIds]
    .map((entityId) => state.presences[entityId]?.locationId)
    .filter((id): id is string => Boolean(id))
  const observed = new Set([...observedLocations, ...friendlyLocations])
  const next: Record<string, StrategyIntel> = {}

  for (const [entityId, sighting] of Object.entries(previous)) {
    next[entityId] = { ...sighting, certainty: intelCertainty(turn - sighting.observedTurn) }
  }
  for (const [entityId, presence] of Object.entries(state.presences) as Array<
    [string, SpatialEstimate]
  >) {
    if (!presence.locationId) continue
    if (friendlyIds.has(entityId) || observed.has(presence.locationId)) {
      next[entityId] = {
        entityId,
        locationId: presence.locationId,
        observedTurn: turn,
        certainty: 'CONFIRMED',
      }
    }
  }
  return next
}
