import { generateAIOperations, resolveControlledEntity } from '@black-whale/simulation-engine'
import type { ProposedWorldEvent, WorldEntity, WorldState } from '@black-whale/world-engine'
import type { UnitCondition } from './conflict'
import { chooseStrategicDestination, type StrategyDoctrine } from './rules'
import { scenarioMoveChance, seededScenarioRandom } from './scenario'
import type { StrategyFaction } from './types'
import type { StrategyScenarioV2 } from './scenario/types'
import { hatsuById } from '$lib/nen/hatsuRegistry'
import { strategicRoleForHatsu } from './rules'
import { strategyHatsuResolution } from './hatsu'

export type AIPersonality = 'CAUTIOUS' | 'AGGRESSIVE' | 'OPPORTUNIST'

export function partitionBlockedMoves(
  events: readonly ProposedWorldEvent[],
  blockedLocationIds: readonly string[],
): { blocked: ProposedWorldEvent[]; resolved: ProposedWorldEvent[] } {
  const blocked = events.filter(
    (event) =>
      event.type === 'ENTITY_MOVED' &&
      Boolean(event.payload.presence.locationId) &&
      blockedLocationIds.includes(event.payload.presence.locationId!),
  )
  return { blocked, resolved: events.filter((event) => !blocked.includes(event)) }
}

export function personalityForFaction(factionId: string): AIPersonality {
  let score = 0
  for (const character of factionId) score = (score + character.charCodeAt(0)) % 3
  return (['CAUTIOUS', 'AGGRESSIVE', 'OPPORTUNIST'] as const)[score]
}

export function generateFactionAIOperations(input: {
  state: WorldState
  faction: StrategyFaction
  doctrine: StrategyDoctrine
  memberCharacterIds: string[]
  unitConditions: Record<string, UnitCondition>
  destinationIds: string[]
  destinationTypes: Record<string, 'TIER' | 'ZONE' | 'ROOM' | 'CORRIDOR' | 'UNKNOWN'>
  playerLocations: string[]
  pact: boolean
  turn: number
  seed: string
  scenario?: StrategyScenarioV2
}): { events: ProposedWorldEvent[]; deniedLocations: string[]; hatsuActivations: number } {
  const random = seededScenarioRandom(input.seed)
  const entities = input.memberCharacterIds
    .map((id) => resolveControlledEntity(input.state, id))
    .filter(
      (entity): entity is WorldEntity =>
        Boolean(entity) && input.unitConditions[entity!.id] !== 'ELIMINATED',
    )
  const occupied = entities
    .map((entity) => input.state.presences[entity.id]?.locationId)
    .filter((id): id is string => Boolean(id))
  const destinations = input.pact
    ? input.destinationIds.filter((id) => !input.playerLocations.includes(id))
    : input.destinationIds
  const events: ProposedWorldEvent[] = []
  const deniedLocations: string[] = []
  let hatsuActivations = 0
  const personality = personalityForFaction(input.faction.id)
  const moveChance =
    scenarioMoveChance(input.turn, input.scenario) *
    (personality === 'AGGRESSIVE' ? 1.2 : personality === 'CAUTIOUS' ? 0.72 : 1)
  for (const entity of entities) {
    const abilityId = (
      input.state.abilitiesByOwner[entity.originalCharacterId ?? entity.id] ?? []
    ).find((id) => Boolean(hatsuById(id)))
    const profile = hatsuById(abilityId)
    const sourceLocationId = input.state.presences[entity.id]?.locationId
    const adapted = abilityId
      ? strategyHatsuResolution({
          abilityId,
          sourceLocationId,
          targetLocationId: sourceLocationId ?? input.destinationIds[0] ?? '',
          confirmedHostilesAtTarget:
            sourceLocationId && input.playerLocations.includes(sourceLocationId) ? 1 : 0,
          eliminatedAllies: input.memberCharacterIds.filter((id) => {
            const ally = resolveControlledEntity(input.state, id)
            return ally && input.unitConditions[ally.id] === 'ELIMINATED'
          }).length,
          targetHasSpider: false,
        })
      : null
    const usesHatsu =
      profile && (adapted?.accepted ?? true) && (input.turn + entity.id.length) % 3 === 0
    if (usesHatsu) {
      hatsuActivations += 1
      const effects = adapted?.effects ?? [strategicRoleForHatsu(profile.kind)]
      if (
        (effects.includes('DENIAL') || effects.includes('GUARD')) &&
        input.state.presences[entity.id]?.locationId
      )
        deniedLocations.push(input.state.presences[entity.id].locationId!)
      if (effects.includes('MOBILITY') && input.playerLocations.length) {
        events.push(
          ...generateAIOperations(input.state, [entity.originalCharacterId ?? entity.id], {
            destinationIds: [input.playerLocations[0]],
            destinationTypes: input.destinationTypes,
            moveChance: 1,
            random: () => 0,
          }),
        )
        continue
      }
    }
    if (random() >= moveChance) continue
    const destination = chooseStrategicDestination(input.doctrine, {
      currentLocationId: input.state.presences[entity.id]?.locationId,
      availableLocationIds: destinations,
      occupiedLocationIds: occupied,
      opposingLocationIds: input.playerLocations,
      roll: random(),
    })
    if (!destination) continue
    events.push(
      ...generateAIOperations(input.state, [entity.originalCharacterId ?? entity.id], {
        destinationIds: [destination],
        destinationTypes: input.destinationTypes,
        moveChance: 1,
        random: () => 0,
      }),
    )
  }
  return { events, deniedLocations, hatsuActivations }
}
