export type UnitCondition = 'READY' | 'WOUNDED' | 'ELIMINATED'

export interface EncounterResolution {
  conditions: Record<string, UnitCondition>
  playerCasualtyId?: string
  hostileCasualtyId?: string
}

export function worsenCondition(condition: UnitCondition): UnitCondition {
  if (condition === 'READY') return 'WOUNDED'
  return 'ELIMINATED'
}

export function resolveEncounter(input: {
  conditions: Readonly<Record<string, UnitCondition>>
  playerIds: readonly string[]
  hostileIds: readonly string[]
  defended: boolean
  roll: number
}): EncounterResolution {
  const activePlayers = input.playerIds.filter((id) => input.conditions[id] !== 'ELIMINATED')
  const activeHostiles = input.hostileIds.filter((id) => input.conditions[id] !== 'ELIMINATED')
  if (!activePlayers.length || !activeHostiles.length)
    return { conditions: { ...input.conditions } }
  const next = { ...input.conditions }
  const playerId =
    activePlayers[Math.floor(input.roll * activePlayers.length) % activePlayers.length]
  const hostileId =
    activeHostiles[Math.floor(input.roll * activeHostiles.length) % activeHostiles.length]
  if (input.defended || input.roll >= 0.5) {
    next[hostileId] = worsenCondition(next[hostileId] ?? 'READY')
    return { conditions: next, hostileCasualtyId: hostileId }
  }
  next[playerId] = worsenCondition(next[playerId] ?? 'READY')
  return { conditions: next, playerCasualtyId: playerId }
}

export function factionEliminated(
  ids: readonly string[],
  conditions: Record<string, UnitCondition>,
) {
  return ids.length > 0 && ids.every((id) => conditions[id] === 'ELIMINATED')
}

export interface ConflictFaction {
  factionId: string
  entityIds: string[]
  pact: boolean
}

export function resolveLocationConflicts(input: {
  conditions: Record<string, UnitCondition>
  playerIds: string[]
  opponents: ConflictFaction[]
  locationByEntity: Record<string, string | undefined>
  guardedLocations: string[]
  random: () => number
  locale?: Locale
}): { conditions: Record<string, UnitCondition>; reports: string[] } {
  const copy = messagesFor(input.locale ?? 'en').strategy.reports
  let conditions = { ...input.conditions }
  const reports: string[] = []
  for (const opponent of input.opponents) {
    if (opponent.pact) continue
    const sharedLocations = new Set(
      input.playerIds
        .map((id) => input.locationByEntity[id])
        .filter(
          (location): location is string =>
            Boolean(location) &&
            opponent.entityIds.some((id) => input.locationByEntity[id] === location),
        ),
    )
    for (const location of sharedLocations) {
      const resolution = resolveEncounter({
        conditions,
        playerIds: input.playerIds.filter((id) => input.locationByEntity[id] === location),
        hostileIds: opponent.entityIds.filter((id) => input.locationByEntity[id] === location),
        defended: input.guardedLocations.includes(location),
        roll: input.random(),
      })
      conditions = resolution.conditions
      if (resolution.playerCasualtyId) reports.push(copy.alliedHit(location))
      if (resolution.hostileCasualtyId)
        reports.push(copy.hostileHit(location))
    }
  }
  return { conditions, reports }
}
import { messagesFor } from '$lib/i18n'
import type { Locale } from '$lib/i18n/config'
