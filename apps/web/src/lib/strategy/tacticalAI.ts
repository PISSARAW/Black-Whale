import { generateAIOperations, resolveControlledEntity } from '@black-whale/simulation-engine'
import type { ProposedWorldEvent, WorldEntity, WorldState } from '@black-whale/world-engine'
import type { UnitCondition } from './conflict'
import { chooseStrategicDestination, doctrineForFaction } from './rules'
import { scenarioMoveChance, seededScenarioRandom } from './scenario'
import type { StrategyFaction } from './types'

export function generateFactionAIOperations(input: {
  state: WorldState
  faction: StrategyFaction
  memberCharacterIds: string[]
  unitConditions: Record<string, UnitCondition>
  destinationIds: string[]
  destinationTypes: Record<string, 'TIER' | 'ZONE' | 'ROOM' | 'CORRIDOR' | 'UNKNOWN'>
  playerLocations: string[]
  pact: boolean
  turn: number
  seed: string
}): ProposedWorldEvent[] {
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
  for (const entity of entities) {
    if (random() >= scenarioMoveChance(input.turn)) continue
    const destination = chooseStrategicDestination(doctrineForFaction(input.faction.id), {
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
  return events
}
