import { SimulationEngine, resolveControlledEntity } from '@black-whale/simulation-engine'
import type {
  ProposedWorldEvent,
  SpatialEstimate,
  WorldBranch,
  WorldState,
} from '@black-whale/world-engine'
import { hatsuById } from '$lib/nen/hatsuRegistry'
import {
  diplomacyCost,
  initialRelationship,
  resolveDiplomacyPlan,
  type DiplomacyOrder,
  type FactionRelationship,
} from './diplomacy'
import { factionEliminated, resolveLocationConflicts, type UnitCondition } from './conflict'
import { buildTurnReports } from './reports'
import { strategyHatsuResolution } from './hatsu'
import { characterAbilityIds, factionEntityIds as selectFactionEntityIds } from './selectors'
import { generateFactionAIOperations, partitionBlockedMoves } from './tacticalAI'
import {
  ACTIVE_SCENARIO,
  buildScenarioRoster,
  doctrineBriefing,
  evaluateScenarioObjective,
  scenarioEventForTurn,
  scenarioDoctrineForFaction,
  seededScenarioRandom,
  selectScenarioLocationIds,
} from './scenario'
import type { StrategyScenarioV2 } from './scenario/types'
import {
  COMMAND_POINTS_PER_TURN,
  VICTORY_POINTS_TARGET,
  intelCertainty,
  planCost,
  strategicRoleForHatsu,
  type StrategyObjective,
} from './rules'
import type {
  StrategyFaction,
  StrategyIntel,
  StrategyLocation,
  StrategyMoveOrder,
  StrategyTurnResult,
} from './types'
export type { StrategyOrder, StrategyOrderType } from './rules'
export type {
  StrategyFaction,
  StrategyIntel,
  StrategyLocation,
  StrategyMoveOrder,
  StrategyTurnResult,
} from './types'
export class StrategyInputError extends Error {}
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
  let activeFactionIds = $state<string[]>([])
  let scenarioLocationIds = $state<string[]>([])
  let gameLost = $state(false)
  let relationships = $state<Record<string, FactionRelationship>>({})
  let unitConditions = $state<Record<string, UnitCondition>>({})
  let turnHistory = $state<Array<{ orders: StrategyMoveOrder[]; diplomacy: DiplomacyOrder[] }>>([])
  let activeScenario = ACTIVE_SCENARIO

  function init(
    baseState: WorldState,
    loadedFactions: StrategyFaction[],
    loadedLocations: StrategyLocation[],
    scenario: StrategyScenarioV2 = ACTIVE_SCENARIO,
  ) {
    activeScenario = scenario
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
    activeFactionIds = []
    scenarioLocationIds = []
    gameLost = false
    relationships = {}
    unitConditions = {}
    turnHistory = []
    turnReports = ['Simulation initialisée.']
  }
  function selectFaction(factionId: string) {
    if (!currentState || !factions.some((faction) => faction.id === factionId)) {
      throw new StrategyInputError('Faction inconnue.')
    }
    selectedFactionId = factionId
    const roster = buildScenarioRoster(factions, factionId, activeScenario)
    activeFactionIds = roster.map((faction) => faction.id)
    relationships = Object.fromEntries(
      roster
        .filter((faction) => faction.id !== factionId)
        .map((faction) => [faction.id, initialRelationship()]),
    )
    unitConditions = Object.fromEntries(
      roster.flatMap((faction) =>
        selectFactionEntityIds(currentState, factions, faction.id).map((id) => [id, 'READY']),
      ),
    )
    const occupied = roster.flatMap((faction) =>
      factionEntityIds(faction.id)
        .map((entityId) => currentState!.presences[entityId]?.locationId)
        .filter((id): id is string => Boolean(id)),
    )
    scenarioLocationIds = selectScenarioLocationIds(
      locations.map((location) => location.id),
      occupied,
      activeScenario,
    )
    intel = {}
    refreshIntel([], [])
    turnReports = [
      `Briefing reçu · ${doctrineBriefing(scenarioDoctrineForFaction(factionId, activeScenario))}`,
      `Opposition identifiée : ${
        roster
          .filter((faction) => faction.id !== factionId)
          .map((faction) => faction.name)
          .join(', ') || 'aucune'
      }.`,
      'Les positions adverses restent inconnues tant qu’elles ne sont pas observées.',
    ]
    turnHistory = []
  }
  function factionEntityIds(factionId: string): string[] {
    return currentState
      ? selectFactionEntityIds(currentState, factions, factionId).filter(
          (id) => unitConditions[id] !== 'ELIMINATED',
        )
      : []
  }

  function restoreCampaignState(
    savedRelationships: Record<string, FactionRelationship>,
    savedConditions: Record<string, UnitCondition>,
  ) {
    relationships = Object.fromEntries(
      Object.entries(relationships).map(([id, relationship]) => [
        id,
        savedRelationships[id] ?? relationship,
      ]),
    )
    unitConditions = Object.fromEntries(
      Object.entries(unitConditions).map(([id, condition]) => [
        id,
        savedConditions[id] ?? condition,
      ]),
    )
    refreshIntel([], [])
  }

  function abilityIdsForCharacter(characterId: string): string[] {
    return currentState ? characterAbilityIds(currentState, characterId) : []
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
    return evaluateScenarioObjective(selectedFactionId, friendlyLocations, confirmedHostiles, activeScenario)
  }

  function endTurn(
    playerFactionId: string,
    playerOrders: readonly StrategyMoveOrder[],
    diplomacyOrders: readonly DiplomacyOrder[] = [],
  ): StrategyTurnResult {
    if (!branch || !currentState) throw new StrategyInputError('La simulation n’est pas prête.')
    if (gameWon || gameLost) throw new StrategyInputError('Le scénario est terminé.')
    if (playerFactionId !== selectedFactionId) {
      throw new StrategyInputError('La faction active ne correspond pas au plan.')
    }

    const playerFaction = factions.find((faction) => faction.id === playerFactionId)
    if (!playerFaction) throw new StrategyInputError('Faction inconnue.')
    if (planCost(playerOrders) + diplomacyCost(diplomacyOrders) > COMMAND_POINTS_PER_TURN) {
      throw new StrategyInputError(
        `Le plan dépasse les ${COMMAND_POINTS_PER_TURN} points de commandement.`,
      )
    }

    const allowedCharacters = new Set(playerFaction.members.map((member) => member.character.id))
    const destinations = new Map(
      locations
        .filter((location) => scenarioLocationIds.includes(location.id))
        .map((location) => [location.id, location]),
    )
    const orderedCharacters = new Set<string>()
    const playerEvents: ProposedWorldEvent[] = []
    const playerEntityIds = new Set<string>()
    const scoutedLocations: string[] = []
    const guardedLocations: string[] = []
    const deniedLocations: string[] = []
    const activatedHatsu: string[] = []
    const activatedAbilityIds: string[] = []
    const abilityCooldownTurns: Record<string, number> = {}
    let hatsuInfluence = 0
    const diplomacy = resolveDiplomacyPlan({
      relationships,
      orders: diplomacyOrders,
      activeFactionIds,
      playerFactionId,
      factionNames: Object.fromEntries(factions.map((faction) => [faction.id, faction.name])),
    })
    if (diplomacy.error) throw new StrategyInputError(diplomacy.error)
    const nextRelationships = diplomacy.relationships
    const diplomacyReports = diplomacy.reports

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
      if (unitConditions[entity.id] === 'ELIMINATED') {
        throw new StrategyInputError('Une unité éliminée ne peut plus recevoir d’ordre.')
      }

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
        const confirmedHostilesAtTarget = Object.values(intel).filter(
          (sighting) =>
            sighting.locationId === destination.id &&
            sighting.certainty === 'CONFIRMED' &&
            !allowedCharacters.has(sighting.entityId),
        ).length
        const spiderIds = new Set(
          factions
            .find((faction) => faction.id === 'phantom-troupe')
            ?.members.map((member) => member.character.id) ?? [],
        )
        const adapted = strategyHatsuResolution({
          abilityId: order.abilityId,
          sourceLocationId: currentState.presences[entity.id]?.locationId,
          targetLocationId: destination.id,
          confirmedHostilesAtTarget,
          eliminatedAllies: playerFaction.members.filter((member) => {
            const ally = resolveControlledEntity(currentState!, member.character.id)
            return ally && unitConditions[ally.id] === 'ELIMINATED'
          }).length,
          targetHasSpider: Object.values(intel).some(
            (sighting) =>
              sighting.locationId === destination.id &&
              sighting.certainty === 'CONFIRMED' &&
              spiderIds.has(sighting.entityId),
          ),
        })
        if (adapted && !adapted.accepted)
          throw new StrategyInputError(adapted.error ?? 'Ce Hatsu ne peut pas être activé.')
        const effects = adapted?.effects ?? [strategicRoleForHatsu(profile.kind)]
        if (effects.includes('RECON')) scoutedLocations.push(destination.id)
        if (effects.includes('DENIAL')) deniedLocations.push(destination.id)
        if (effects.includes('GUARD')) guardedLocations.push(destination.id)
        if (effects.includes('INFLUENCE')) hatsuInfluence += 1
        if (
          effects.includes('MOBILITY') &&
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
        abilityCooldownTurns[order.abilityId] = adapted?.cooldownTurns ?? 2
        activatedHatsu.push(`${profile.name} · ${adapted?.report ?? destination.name}`)
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
    const aiDeniedLocations: string[] = []
    let aiHatsuActivations = 0
    const claimedCharacters = new Set(allowedCharacters)
    const claimedEntities = new Set(playerEntityIds)
    const destinationIds = scenarioLocationIds
    const destinationTypes = Object.fromEntries(
      locations.map((location) => [
        location.id,
        location.type === 'SHIP' ? 'UNKNOWN' : location.type,
      ]),
    ) as Record<string, 'TIER' | 'ZONE' | 'ROOM' | 'CORRIDOR' | 'UNKNOWN'>
    for (const faction of factions.filter((candidate) => activeFactionIds.includes(candidate.id))) {
      if (faction.id === playerFactionId) continue
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

      const playerLocations = factionEntityIds(playerFactionId)
        .map((entityId) => currentState!.presences[entityId]?.locationId)
        .filter((id): id is string => Boolean(id))
      const aiPlan = generateFactionAIOperations({
        state: currentState,
        faction,
        doctrine: scenarioDoctrineForFaction(faction.id, activeScenario),
        memberCharacterIds: members,
        unitConditions,
        destinationIds,
        destinationTypes,
        playerLocations,
        pact: nextRelationships[faction.id]?.pact ?? false,
        turn: currentTurn,
        seed: `${branch.id}:${currentTurn}:${faction.id}`,
        scenario: activeScenario,
      })
      aiEvents.push(...aiPlan.events)
      aiDeniedLocations.push(...aiPlan.deniedLocations)
      aiHatsuActivations += aiPlan.hatsuActivations
    }

    const aiResolution = partitionBlockedMoves(aiEvents, [...guardedLocations, ...deniedLocations])
    const playerResolution = partitionBlockedMoves(playerEvents, aiDeniedLocations)
    const interceptedEvents = aiResolution.blocked
    const resolvedAIEvents = aiResolution.resolved
    const blockedPlayerEvents = playerResolution.blocked
    const resolvedPlayerEvents = playerResolution.resolved
    const result = engine.applyEvents(branch.id, [...resolvedPlayerEvents, ...resolvedAIEvents])
    currentState = result.snapshot
    relationships = nextRelationships
    const playerIds = factionEntityIds(playerFactionId)
    const conflict = resolveLocationConflicts({
      conditions: unitConditions,
      playerIds,
      opponents: activeFactionIds
        .filter((id) => id !== playerFactionId)
        .map((id) => ({
          factionId: id,
          entityIds: factionEntityIds(id),
          pact: nextRelationships[id]?.pact ?? false,
        })),
      locationByEntity: Object.fromEntries(
        Object.entries(currentState.presences).map(([id, presence]) => [id, presence.locationId]),
      ),
      guardedLocations,
      random: seededScenarioRandom(`${branch.id}:${currentTurn}:conflicts`),
    })
    const camilla = resolveControlledEntity(currentState, 'prince-camilla')
    if (
      camilla &&
      abilityIdsForCharacter('prince-camilla').includes('cats-name') &&
      unitConditions[camilla.id] !== 'ELIMINATED' &&
      conflict.conditions[camilla.id] === 'ELIMINATED'
    ) {
      const locationId = currentState.presences[camilla.id]?.locationId
      const killer = activeFactionIds
        .filter((id) => id !== 'prince-camilla')
        .flatMap((id) => factionEntityIds(id))
        .filter((id) => currentState!.presences[id]?.locationId === locationId)
        .sort()[0]
      if (killer) {
        conflict.conditions[camilla.id] = 'READY'
        conflict.conditions[killer] = 'ELIMINATED'
        conflict.reports.push('Cat’s Name se déclenche : Camilla revient à la vie et son meurtrier est consumé.')
      }
    }
    unitConditions = conflict.conditions
    const completedTurn = currentTurn
    for (const abilityId of activatedAbilityIds)
      hatsuCooldowns[abilityId] = currentTurn + (abilityCooldownTurns[abilityId] ?? 2)
    currentTurn += 1
    const scenarioEvent = scenarioEventForTurn(completedTurn, activeScenario)
    refreshIntel(scenarioEvent?.kind === 'BLACKOUT' ? [] : scoutedLocations, guardedLocations)
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
    victoryPoints = Math.min(VICTORY_POINTS_TARGET, victoryPoints + hatsuInfluence)
    if (victoryPoints >= VICTORY_POINTS_TARGET) gameWon = true
    if (objective?.complete && !gameWon) {
      victoryPoints += 1
      if (victoryPoints >= VICTORY_POINTS_TARGET) gameWon = true
    }
    if (!gameWon && completedTurn >= activeScenario.maxTurns) gameLost = true
    if (factionEliminated(playerIds, unitConditions)) gameLost = true
    turnHistory = [
      ...turnHistory,
      {
        orders: structuredClone([...playerOrders]),
        diplomacy: structuredClone([...diplomacyOrders]),
      },
    ]
    turnReports = [
      ...turnReports,
      ...buildTurnReports({
        completedTurn,
        playerOrderCount: playerOrders.length,
        discoveries,
        interceptions: interceptedEvents.length,
        hostileContacts,
        victoryPoints,
        objectiveComplete: objective?.complete ?? false,
        gameWon,
        gameLost,
        scoutedLocations: scoutedLocations.length,
        guardedLocations: guardedLocations.length,
        scenarioEvent,
        diplomacyReports,
        activatedHatsu,
        conflictReports: conflict.reports,
        aiHatsuActivations,
        playerMovesBlocked: blockedPlayerEvents.length,
      }),
    ].slice(-100)

    return {
      playerEvents: resolvedPlayerEvents.length,
      aiEvents: resolvedAIEvents.length,
      totalEvents: result.appliedEvents.length,
      warnings: result.warnings,
    }
  }

  return {
    get currentState() { return currentState },
    get currentTurn() { return currentTurn },
    get turnReports() { return turnReports },
    get intel() { return intel },
    get objective() { return currentObjective() },
    get victoryPoints() { return victoryPoints },
    get gameWon() { return gameWon },
    get gameLost() { return gameLost },
    get gameOver() { return gameWon || gameLost },
    get activeFactions() {
      return factions.filter((faction) => activeFactionIds.includes(faction.id))
    },
    get scenarioLocations() {
      return locations.filter((location) => scenarioLocationIds.includes(location.id))
    },
    get scenarioEvent() {
      return scenarioEventForTurn(currentTurn, activeScenario)
    },
    get relationships() { return relationships },
    get unitConditions() { return unitConditions },
    get turnHistory() {
      return turnHistory
    },
    get hatsuCooldowns() {
      return hatsuCooldowns
    },
    abilityIdsForCharacter,
    init,
    selectFaction,
    restoreCampaignState,
    endTurn,
  }
}
