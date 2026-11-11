import { generateAIOperations, resolveControlledEntity } from '@black-whale/simulation-engine'
import type { ProposedWorldEvent, WorldEntity, WorldState } from '@black-whale/canon-engine'
import type { UnitCondition } from './conflict'
import { chooseStrategicDestination, type StrategyDoctrine } from './rules'
import { scenarioMoveChance, seededScenarioRandom } from './scenario'
import type { StrategyFaction } from './types'
import type { StrategyScenarioV2 } from './scenario/types'
import { hatsuById } from '$lib/nen/hatsuRegistry'
import { strategyHatsuResolution } from './hatsu'
import { findStrategyRoute, type StrategyMovementGraph } from './movement'

export type AIPersonality = 'CAUTIOUS' | 'AGGRESSIVE' | 'OPPORTUNIST'

export interface StrategyAIPerspective {
  /** A redacted world: locations, the faction's own units, and observed opponents only. */
  state: WorldState
  knownOpponentLocations: string[]
}

/**
 * Build the sole world view accepted by the tactical AI. An opposing unit is
 * observed only when it currently shares a location with one of the faction's
 * living units; hidden entities, abilities and effects are removed entirely.
 */
export function projectFactionAIPerspective(input: {
  state: WorldState
  memberCharacterIds: readonly string[]
  opposingEntityIds: readonly string[]
  unitConditions: Readonly<Record<string, UnitCondition>>
}): StrategyAIPerspective {
  const ownEntities = input.memberCharacterIds
    .map((id) => resolveControlledEntity(input.state, id))
    .filter(
      (entity): entity is WorldEntity =>
        Boolean(entity) && input.unitConditions[entity!.id] !== 'ELIMINATED',
    )
  const ownIds = new Set(ownEntities.map((entity) => entity.id))
  const ownLocations = new Set(
    ownEntities
      .map((entity) => input.state.presences[entity.id]?.locationId)
      .filter((id): id is string => Boolean(id)),
  )
  const visibleOpponentIds = new Set(
    input.opposingEntityIds.filter((id) => {
      const locationId = input.state.presences[id]?.locationId
      return (
        input.unitConditions[id] !== 'ELIMINATED' &&
        Boolean(locationId) &&
        ownLocations.has(locationId!)
      )
    }),
  )
  const visibleIds = new Set([...ownIds, ...visibleOpponentIds])
  const keepEntity = ([id, entity]: [string, WorldEntity]) =>
    entity.kind === 'LOCATION' || visibleIds.has(id)
  const entities = Object.fromEntries(Object.entries(input.state.entities).filter(keepEntity))
  const presences = Object.fromEntries(
    Object.entries(input.state.presences).filter(([id]) => visibleIds.has(id)),
  )
  const ownOwnerIds = new Set([
    ...input.memberCharacterIds,
    ...ownEntities.map((entity) => entity.id),
  ])

  return {
    state: {
      ...input.state,
      entities,
      presences,
      bodyStates: Object.fromEntries(
        Object.entries(input.state.bodyStates).filter(([id]) => visibleIds.has(id)),
      ),
      consciousnessByBody: Object.fromEntries(
        Object.entries(input.state.consciousnessByBody).filter(([id]) => visibleIds.has(id)),
      ),
      abilitiesByOwner: Object.fromEntries(
        Object.entries(input.state.abilitiesByOwner).filter(([id]) => ownOwnerIds.has(id)),
      ),
      effects: Object.fromEntries(
        Object.entries(input.state.effects).filter(([, effect]) =>
          visibleIds.has(effect.source.id),
        ),
      ),
      knowledgeByObserver: Object.fromEntries(
        Object.entries(input.state.knowledgeByObserver).filter(([id]) => ownOwnerIds.has(id)),
      ),
      vestiges: Object.fromEntries(
        Object.entries(input.state.vestiges).filter(([id]) => ownOwnerIds.has(id)),
      ),
    },
    knownOpponentLocations: [...visibleOpponentIds]
      .map((id) => input.state.presences[id]?.locationId)
      .filter((id): id is string => Boolean(id)),
  }
}

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
  knownOpponentLocations: string[]
  pact: boolean
  turn: number
  seed: string
  scenario?: StrategyScenarioV2
  movementGraph: StrategyMovementGraph
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
    ? input.destinationIds.filter((id) => !input.knownOpponentLocations.includes(id))
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
            sourceLocationId && input.knownOpponentLocations.includes(sourceLocationId) ? 1 : 0,
          eliminatedAllies: input.memberCharacterIds.filter((id) => {
            const ally = resolveControlledEntity(input.state, id)
            return ally && input.unitConditions[ally.id] === 'ELIMINATED'
          }).length,
          targetHasSpider: false,
        })
      : null
    const usesHatsu =
      profile && adapted?.accepted === true && (input.turn + entity.id.length) % 3 === 0
    if (usesHatsu) {
      hatsuActivations += 1
      const effects = adapted.effects
      if (
        (effects.includes('DENIAL') || effects.includes('GUARD')) &&
        input.state.presences[entity.id]?.locationId
      )
        deniedLocations.push(input.state.presences[entity.id].locationId!)
      if (effects.includes('MOBILITY') && input.knownOpponentLocations.length) {
        events.push(
          ...generateAIOperations(input.state, [entity.originalCharacterId ?? entity.id], {
            destinationIds: [input.knownOpponentLocations[0]],
            destinationTypes: input.destinationTypes,
            moveChance: 1,
            random: () => 0,
          }),
        )
        continue
      }
    }
    if (random() >= moveChance) continue
    const currentLocationId = input.state.presences[entity.id]?.locationId
    const reachableDestinations = currentLocationId
      ? destinations.filter((id) =>
          Boolean(findStrategyRoute(input.movementGraph, currentLocationId, id)),
        )
      : []
    const destination = chooseStrategicDestination(input.doctrine, {
      currentLocationId: input.state.presences[entity.id]?.locationId,
      availableLocationIds: reachableDestinations,
      occupiedLocationIds: occupied,
      opposingLocationIds: input.knownOpponentLocations,
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
