import {
  SimulationEngine,
  generateAIOperations,
  resolveControlledEntity,
} from '@black-whale/simulation-engine'
import type {
  ProposedWorldEvent,
  SpatialEstimate,
  WorldBranch,
  WorldEntity,
  WorldState,
} from '@black-whale/world-engine'
import { hatsuById } from '$lib/nen/hatsuRegistry'
import {
  COMMAND_POINTS_PER_TURN,
  VICTORY_POINTS_TARGET,
  chooseStrategicDestination,
  doctrineForFaction,
  evaluateObjective,
  intelCertainty,
  planCost,
  strategicRoleForHatsu,
  type StrategyOrder,
  type StrategyObjective,
} from './rules'

export type { StrategyOrder, StrategyOrderType } from './rules'

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

export type StrategyMoveOrder = StrategyOrder

export interface StrategyIntel {
  entityId: string
  locationId: string
  observedTurn: number
  certainty: 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN'
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
  let selectedFactionId = $state<string | null>(null)
  let intel = $state<Record<string, StrategyIntel>>({})
  let victoryPoints = $state(0)
  let gameWon = $state(false)
  let hatsuCooldowns = $state<Record<string, number>>({})

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
    selectedFactionId = null
    intel = {}
    victoryPoints = 0
    gameWon = false
    hatsuCooldowns = {}
    turnReports = ['Simulation initialisée.']
  }

  function selectFaction(factionId: string) {
    if (!currentState || !factions.some((faction) => faction.id === factionId)) {
      throw new StrategyInputError('Faction inconnue.')
    }
    selectedFactionId = factionId
    intel = {}
    refreshIntel([], [])
    turnReports = [
      `Briefing reçu. Doctrine : ${doctrineForFaction(factionId).toLocaleLowerCase('fr')}.`,
      'Les positions adverses restent inconnues tant qu’elles ne sont pas observées.',
    ]
  }

  function factionEntityIds(factionId: string): string[] {
    const faction = factions.find((candidate) => candidate.id === factionId)
    if (!faction || !currentState) return []
    return faction.members
      .map((member) => resolveControlledEntity(currentState!, member.character.id)?.id)
      .filter((id): id is string => Boolean(id))
  }

  function abilityIdsForCharacter(characterId: string): string[] {
    if (!currentState) return []
    const entity = resolveControlledEntity(currentState, characterId)
    return [
      ...new Set([
        ...(currentState.abilitiesByOwner[characterId] ?? []),
        ...(entity ? (currentState.abilitiesByOwner[entity.id] ?? []) : []),
      ]),
    ].filter((abilityId) => Boolean(hatsuById(abilityId)))
  }

  function refreshIntel(scoutedLocations: readonly string[], guardedLocations: readonly string[]) {
    if (!currentState || !selectedFactionId) return
    const friendlyIds = new Set(factionEntityIds(selectedFactionId))
    const friendlyLocations = new Set(
      [...friendlyIds]
        .map((entityId) => currentState!.presences[entityId]?.locationId)
        .filter((id): id is string => Boolean(id)),
    )
    const observedLocations = new Set([
      ...scoutedLocations,
      ...guardedLocations,
      ...friendlyLocations,
    ])
    const next: Record<string, StrategyIntel> = {}

    for (const [entityId, sighting] of Object.entries(intel)) {
      const age = currentTurn - sighting.observedTurn
      next[entityId] = { ...sighting, certainty: intelCertainty(age) }
    }
    for (const [entityId, presence] of Object.entries(currentState.presences) as Array<
      [string, SpatialEstimate]
    >) {
      if (!presence.locationId) continue
      if (friendlyIds.has(entityId) || observedLocations.has(presence.locationId)) {
        next[entityId] = {
          entityId,
          locationId: presence.locationId,
          observedTurn: currentTurn,
          certainty: 'CONFIRMED',
        }
      }
    }
    intel = next
  }

  function currentObjective(): StrategyObjective | null {
    if (!currentState || !selectedFactionId) return null
    const friendlyIds = new Set(factionEntityIds(selectedFactionId))
    const friendlyLocations = [...friendlyIds].map(
      (entityId) => currentState!.presences[entityId]?.locationId,
    )
    const confirmedHostiles = Object.values(intel).filter(
      (sighting) => sighting.certainty === 'CONFIRMED' && !friendlyIds.has(sighting.entityId),
    ).length
    return evaluateObjective(
      doctrineForFaction(selectedFactionId),
      friendlyLocations,
      confirmedHostiles,
    )
  }

  function endTurn(
    playerFactionId: string,
    playerOrders: readonly StrategyMoveOrder[],
  ): StrategyTurnResult {
    if (!branch || !currentState) throw new StrategyInputError('La simulation n’est pas prête.')
    if (playerFactionId !== selectedFactionId) {
      throw new StrategyInputError('La faction active ne correspond pas au plan.')
    }

    const playerFaction = factions.find((faction) => faction.id === playerFactionId)
    if (!playerFaction) throw new StrategyInputError('Faction inconnue.')
    if (planCost(playerOrders) > COMMAND_POINTS_PER_TURN) {
      throw new StrategyInputError(
        `Le plan dépasse les ${COMMAND_POINTS_PER_TURN} points de commandement.`,
      )
    }

    const allowedCharacters = new Set(playerFaction.members.map((member) => member.character.id))
    const destinations = new Map(locations.map((location) => [location.id, location]))
    const orderedCharacters = new Set<string>()
    const playerEvents: ProposedWorldEvent[] = []
    const playerEntityIds = new Set<string>()
    const scoutedLocations: string[] = []
    const guardedLocations: string[] = []
    const deniedLocations: string[] = []
    const activatedHatsu: string[] = []
    const activatedAbilityIds: string[] = []

    // Validate the complete player batch before producing any event.
    for (const order of playerOrders) {
      if (
        order.type !== 'MOVE' &&
        order.type !== 'SCOUT' &&
        order.type !== 'GUARD' &&
        order.type !== 'HATSU'
      ) {
        throw new StrategyInputError('Un ordre utilise une action inconnue.')
      }
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
      if (order.type === 'HATSU') {
        if (
          !order.abilityId ||
          !abilityIdsForCharacter(order.characterId).includes(order.abilityId)
        ) {
          throw new StrategyInputError('Cette unité ne maîtrise pas le Hatsu sélectionné.')
        }
        if ((hatsuCooldowns[order.abilityId] ?? 0) > currentTurn) {
          throw new StrategyInputError('Ce Hatsu est encore en récupération.')
        }
        const profile = hatsuById(order.abilityId)
        if (!profile) throw new StrategyInputError('Hatsu inconnu du registre tactique.')
        const role = strategicRoleForHatsu(profile.kind)
        if (role === 'RECON') scoutedLocations.push(destination.id)
        if (role === 'DENIAL') deniedLocations.push(destination.id)
        if (
          role === 'MOBILITY' &&
          currentState.presences[entity.id]?.locationId !== destination.id
        ) {
          playerEvents.push({
            type: 'ENTITY_MOVED',
            payload: {
              presence: {
                entity: { id: entity.id, kind: entity.kind },
                locationId: destination.id,
                precision: destination.type === 'TIER' ? 'TIER' : 'EXACT_ROOM',
                certainty: 'CONFIRMED',
              },
            },
          })
        }
        activatedAbilityIds.push(order.abilityId)
        activatedHatsu.push(`${profile.name} · ${destination.name}`)
        continue
      }
      if (order.type === 'SCOUT') {
        scoutedLocations.push(destination.id)
        continue
      }
      if (order.type === 'GUARD') {
        const guarded = currentState.presences[entity.id]?.locationId
        if (guarded) guardedLocations.push(guarded)
        continue
      }
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

      const random = seededRandom(`${branch.id}:${currentTurn}:${faction.id}`)
      const memberEntities = members
        .map((characterId) => resolveControlledEntity(currentState!, characterId))
        .filter((entity): entity is WorldEntity => Boolean(entity))
      const occupiedLocations = memberEntities
        .map((entity) => currentState!.presences[entity.id]?.locationId)
        .filter((id): id is string => Boolean(id))
      const playerLocations = factionEntityIds(playerFactionId)
        .map((entityId) => currentState!.presences[entityId]?.locationId)
        .filter((id): id is string => Boolean(id))
      const doctrine = doctrineForFaction(faction.id)

      for (const entity of memberEntities) {
        if (random() >= 0.72) continue
        const destination = chooseStrategicDestination(doctrine, {
          currentLocationId: currentState.presences[entity.id]?.locationId,
          availableLocationIds: destinationIds,
          occupiedLocationIds: occupiedLocations,
          opposingLocationIds: playerLocations,
          roll: random(),
        })
        if (!destination) continue
        aiEvents.push(
          ...generateAIOperations(currentState, [entity.originalCharacterId ?? entity.id], {
            destinationIds: [destination],
            destinationTypes,
            moveChance: 1,
            random: () => 0,
          }),
        )
      }
    }

    const interceptedEvents = aiEvents.filter(
      (event) =>
        event.type === 'ENTITY_MOVED' &&
        Boolean(event.payload.presence.locationId) &&
        [...guardedLocations, ...deniedLocations].includes(event.payload.presence.locationId!),
    )
    const resolvedAIEvents = aiEvents.filter((event) => !interceptedEvents.includes(event))
    const result = engine.applyEvents(branch.id, [...playerEvents, ...resolvedAIEvents])
    currentState = result.snapshot
    const completedTurn = currentTurn
    for (const abilityId of activatedAbilityIds) hatsuCooldowns[abilityId] = currentTurn + 2
    currentTurn += 1
    refreshIntel(scoutedLocations, guardedLocations)
    const friendlyIds = new Set(factionEntityIds(playerFactionId))
    const discoveries = Object.values(intel).filter(
      (sighting) => sighting.observedTurn === currentTurn && !friendlyIds.has(sighting.entityId),
    ).length
    const hostileContacts = new Set(
      Object.values(intel)
        .filter(
          (sighting) =>
            sighting.observedTurn === currentTurn &&
            !friendlyIds.has(sighting.entityId) &&
            factionEntityIds(playerFactionId).some(
              (entityId) => currentState!.presences[entityId]?.locationId === sighting.locationId,
            ),
        )
        .map((sighting) => sighting.locationId),
    ).size
    const objective = currentObjective()
    if (objective?.complete && !gameWon) {
      victoryPoints += 1
      if (victoryPoints >= VICTORY_POINTS_TARGET) gameWon = true
    }
    turnReports = [
      ...turnReports,
      `Tour ${completedTurn} · ${playerOrders.length} ordre(s) résolu(s), ${discoveries} renseignement(s) actualisé(s).`,
      ...(interceptedEvents.length
        ? [`Interception réussie : ${interceptedEvents.length} mouvement(s) adverse(s) bloqué(s).`]
        : []),
      ...activatedHatsu.map((activation) => `Hatsu activé · ${activation}.`),
      ...(hostileContacts
        ? [`Contact hostile dans ${hostileContacts} zone(s). La position ennemie est confirmée.`]
        : []),
      ...(objective?.complete
        ? [`Objectif rempli · ${victoryPoints}/${VICTORY_POINTS_TARGET} points de victoire.`]
        : []),
      ...(gameWon ? ['Victoire stratégique acquise. La simulation peut être poursuivie.'] : []),
      ...(scoutedLocations.length
        ? [`Enquête terminée dans ${scoutedLocations.length} zone(s).`]
        : []),
      ...(guardedLocations.length
        ? [`Protection maintenue dans ${guardedLocations.length} zone(s).`]
        : []),
    ].slice(-100)

    return {
      playerEvents: playerEvents.length,
      aiEvents: resolvedAIEvents.length,
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
    get intel() {
      return intel
    },
    get objective() {
      return currentObjective()
    },
    get victoryPoints() {
      return victoryPoints
    },
    get gameWon() {
      return gameWon
    },
    get hatsuCooldowns() {
      return hatsuCooldowns
    },
    abilityIdsForCharacter,
    init,
    selectFaction,
    endTurn,
  }
}
