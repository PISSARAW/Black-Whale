import { resolveControlledEntity } from '@black-whale/simulation-engine'
import type { ProposedWorldEvent, WorldState } from '@black-whale/world-engine'
import type { FactionRelationship } from './diplomacy'
import type { UnitCondition } from './conflict'
import { scenarioDoctrineForFaction } from './scenario'
import type { StrategyScenarioV2 } from './scenario/types'
import { generateFactionAIOperations } from './tacticalAI'
import type { StrategyFaction, StrategyLocation } from './types'

/**
 * What every faction that is not the player does this turn.
 *
 * Separated from the store because it is the one part of a turn that answers
 * to nobody's input: given the board, it produces the opposition's events. The
 * store's `endTurn` held it next to order validation and report writing, three
 * subjects that share only the moment they happen at.
 */
export interface OppositionPlan {
  state: WorldState
  branchId: string
  /** Already narrowed to the factions in play. */
  factions: StrategyFaction[]
  playerFactionId: string
  /** Units the player has already committed; the opposition may not claim them. */
  claimedCharacters: Set<string>
  claimedEntities: Set<string>
  playerLocations: string[]
  destinationIds: string[]
  locations: StrategyLocation[]
  unitConditions: Record<string, UnitCondition>
  relationships: Record<string, FactionRelationship>
  turn: number
  scenario: StrategyScenarioV2
}

export interface OppositionOperations {
  events: ProposedWorldEvent[]
  deniedLocations: string[]
  hatsuActivations: number
}

export function planOpposition(plan: OppositionPlan): OppositionOperations {
  const aiEvents: ProposedWorldEvent[] = []
  const aiDeniedLocations: string[] = []
  let aiHatsuActivations = 0
  const claimed = new Set(plan.claimedCharacters)
  const claimedEntities = new Set(plan.claimedEntities)
  const { destinationIds } = plan
  const destinationTypes = Object.fromEntries(
    plan.locations.map((location) => [
      location.id,
      location.type === 'SHIP' ? 'UNKNOWN' : location.type,
    ]),
  ) as Record<string, 'TIER' | 'ZONE' | 'ROOM' | 'CORRIDOR' | 'UNKNOWN'>
  for (const faction of plan.factions) {
    if (faction.id === plan.playerFactionId) continue
    const members = faction.members
      .map((member) => member.character.id)
      .filter((characterId) => {
        if (claimed.has(characterId)) return false
        const entity = resolveControlledEntity(plan.state, characterId)
        if (!entity || claimedEntities.has(entity.id)) return false
        claimed.add(characterId)
        claimedEntities.add(entity.id)
        return true
      })

    const aiPlan = generateFactionAIOperations({
      state: plan.state,
      faction,
      doctrine: scenarioDoctrineForFaction(faction.id, plan.scenario),
      memberCharacterIds: members,
      unitConditions: plan.unitConditions,
      destinationIds,
      destinationTypes,
      playerLocations: plan.playerLocations,
      pact: plan.relationships[faction.id]?.pact ?? false,
      turn: plan.turn,
      seed: `${plan.branchId}:${plan.turn}:${faction.id}`,
      scenario: plan.scenario,
    })
    aiEvents.push(...aiPlan.events)
    aiDeniedLocations.push(...aiPlan.deniedLocations)
    aiHatsuActivations += aiPlan.hatsuActivations
  }
  return {
    events: aiEvents,
    deniedLocations: aiDeniedLocations,
    hatsuActivations: aiHatsuActivations,
  }
}
