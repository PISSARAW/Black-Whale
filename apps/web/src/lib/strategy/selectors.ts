import { resolveControlledEntity } from '@black-whale/simulation-engine'
import type { WorldState } from '@black-whale/world-engine'
import { hatsuById } from '$lib/nen/hatsuRegistry'
import type { StrategyFaction } from './types'

export function factionEntityIds(
  state: WorldState,
  factions: readonly StrategyFaction[],
  factionId: string,
): string[] {
  const faction = factions.find((candidate) => candidate.id === factionId)
  if (!faction) return []
  return faction.members
    .map((member) => resolveControlledEntity(state, member.character.id)?.id)
    .filter((id): id is string => Boolean(id))
}

export function characterAbilityIds(state: WorldState, characterId: string): string[] {
  const entity = resolveControlledEntity(state, characterId)
  return [
    ...new Set([
      ...(state.abilitiesByOwner[characterId] ?? []),
      ...(entity ? (state.abilitiesByOwner[entity.id] ?? []) : []),
    ]),
  ].filter((abilityId) => Boolean(hatsuById(abilityId)))
}
