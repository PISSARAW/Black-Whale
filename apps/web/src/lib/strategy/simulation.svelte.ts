import {
  SimulationEngine,
  generateAIOperations,
  resolveControlledEntity,
} from '@black-whale/simulation-engine'
import type { ProposedWorldEvent, WorldBranch, WorldState } from '@black-whale/world-engine'

export interface StrategyMember {
  character: { id: string; canonicalName: string }
  role: string
}

export interface StrategyFaction {
  id: string
  name: string
  members: StrategyMember[]
}

export interface StrategyLocation {
  id: string
  name: string
  type: 'SHIP' | 'TIER' | 'ZONE' | 'ROOM' | 'CORRIDOR' | 'UNKNOWN'
}

export interface StrategyMoveOrder {
  characterId: string
  locationId: string
}

export interface StrategyTurnResult {
  playerEvents: number
  aiEvents: number
  totalEvents: number
  warnings: string[]
}

export class StrategyInputError extends Error {}

function seededRandom(seed: string): () => number {
  let value = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return () => {
    value += 0x6d2b79f5
    let mixed = value
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

/** A self-contained, client-side strategy sandbox. Nothing here mutates canon. */
export function createSimulationStore() {
  let engine = new SimulationEngine()
  let branch = $state<WorldBranch | null>(null)
  let currentState = $state<WorldState | null>(null)
  let currentTurn = $state(1)
  let turnReports = $state<string[]>([])
  let factions = $state<StrategyFaction[]>([])
  let locations = $state<StrategyLocation[]>([])

  function init(
    baseState: WorldState,
    loadedFactions: StrategyFaction[],
    loadedLocations: StrategyLocation[],
  ) {
    // Reinitialisation can happen during hot reload. A fresh engine avoids a
    // duplicate fixed branch id and guarantees that the UI and engine agree.
    engine = new SimulationEngine()
    const newBranch = engine.createBranch(
      {
        id: 'strategy-sandbox',
        parentEventId: baseState.cursor.eventId,
        mode: 'sandbox',
        name: 'Strategy Sandbox',
      },
      baseState,
    )

    branch = newBranch
    currentState = engine.getBranchState(newBranch.id)
    currentTurn = 1
    factions = loadedFactions
    locations = loadedLocations
    turnReports = ['Simulation initialisée.']
  }

  function endTurn(
    playerFactionId: string,
    playerOrders: readonly StrategyMoveOrder[],
  ): StrategyTurnResult {
    if (!branch || !currentState) throw new StrategyInputError('La simulation n’est pas prête.')

    const playerFaction = factions.find((faction) => faction.id === playerFactionId)
    if (!playerFaction) throw new StrategyInputError('Faction inconnue.')

    const allowedCharacters = new Set(playerFaction.members.map((member) => member.character.id))
    const destinations = new Map(locations.map((location) => [location.id, location]))
    const orderedCharacters = new Set<string>()
    const playerEvents: ProposedWorldEvent[] = []
    const playerEntityIds = new Set<string>()

    // Validate the complete player batch before producing any event.
    for (const order of playerOrders) {
      if (!allowedCharacters.has(order.characterId)) {
        throw new StrategyInputError('Un ordre vise une unité qui ne vous appartient pas.')
      }
      if (orderedCharacters.has(order.characterId)) {
        throw new StrategyInputError('Une unité ne peut recevoir qu’un ordre par tour.')
      }
      const destination = destinations.get(order.locationId)
      if (!destination || !currentState.entities[destination.id]) {
        throw new StrategyInputError('Destination inconnue dans cet état du monde.')
      }
      const entity = resolveControlledEntity(currentState, order.characterId)
      if (!entity) throw new StrategyInputError('Cette unité n’existe pas dans cet état du monde.')

      orderedCharacters.add(order.characterId)
      playerEntityIds.add(entity.id)
      if (currentState.presences[entity.id]?.locationId === destination.id) continue
      playerEvents.push({
        type: 'ENTITY_MOVED',
        payload: {
          presence: {
            entity: { id: entity.id, kind: entity.kind },
            locationId: destination.id,
            precision:
              destination.type === 'TIER'
                ? 'TIER'
                : destination.type === 'ZONE'
                  ? 'ZONE'
                  : 'EXACT_ROOM',
            certainty: 'CONFIRMED',
          },
        },
      })
    }

    const aiEvents: ProposedWorldEvent[] = []
    const claimedCharacters = new Set(allowedCharacters)
    const claimedEntities = new Set(playerEntityIds)
    const destinationIds = locations.map((location) => location.id)
    const destinationTypes = Object.fromEntries(
      locations.map((location) => [
        location.id,
        location.type === 'SHIP' ? 'UNKNOWN' : location.type,
      ]),
    ) as Record<string, 'TIER' | 'ZONE' | 'ROOM' | 'CORRIDOR' | 'UNKNOWN'>
    for (const faction of factions) {
      if (faction.id === playerFactionId) continue
      // Overlapping affiliations must not grant two factions control of the
      // same character in a single turn. The first catalogue faction owns it.
      const members = faction.members
        .map((member) => member.character.id)
        .filter((characterId) => {
          if (claimedCharacters.has(characterId)) return false
          const entity = resolveControlledEntity(currentState!, characterId)
          if (!entity || claimedEntities.has(entity.id)) return false
          claimedCharacters.add(characterId)
          claimedEntities.add(entity.id)
          return true
        })

      aiEvents.push(
        ...generateAIOperations(currentState, members, {
          destinationIds,
          destinationTypes,
          random: seededRandom(`${branch.id}:${currentTurn}:${faction.id}`),
        }),
      )
    }

    const result = engine.applyEvents(branch.id, [...playerEvents, ...aiEvents])
    currentState = result.snapshot
    const completedTurn = currentTurn
    currentTurn += 1
    turnReports = [
      ...turnReports,
      `Tour ${completedTurn} terminé · ${playerEvents.length} ordre(s) · ${aiEvents.length} action(s) adverse(s).`,
    ].slice(-100)

    return {
      playerEvents: playerEvents.length,
      aiEvents: aiEvents.length,
      totalEvents: result.appliedEvents.length,
      warnings: result.warnings,
    }
  }

  return {
    get branch() {
      return branch
    },
    get currentState() {
      return currentState
    },
    get currentTurn() {
      return currentTurn
    },
    get turnReports() {
      return turnReports
    },
    get factions() {
      return factions
    },
    get locations() {
      return locations
    },
    init,
    endTurn,
  }
}
