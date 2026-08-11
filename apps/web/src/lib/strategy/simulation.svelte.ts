import { SimulationEngine, resolveControlledEntity } from '@black-whale/simulation-engine'
import type { ProposedWorldEvent, WorldBranch, WorldState } from '@black-whale/canon-engine'
import { messagesFor } from '$lib/i18n'
import type { Locale } from '$lib/i18n/config'
import {
  diplomacyCost,
  initialRelationship,
  resolveDiplomacyPlan,
  type DiplomacyOrder,
  type FactionRelationship,
} from './diplomacy'
import { factionEliminated, resolveLocationConflicts, type UnitCondition } from './conflict'
import { buildTurnReports } from './reports'
import { advanceIntel } from './intel'
import { resolvePlayerOrders, StrategyInputError } from './playerOrders'
import type { StrategyHatsuCue } from './hatsuPresentation'
import { characterAbilityIds, factionEntityIds as selectFactionEntityIds } from './selectors'
import { partitionBlockedMoves } from './tacticalAI'
import { planOpposition } from './opposition'
import {
  ACTIVE_SCENARIO,
  buildScenarioRoster,
  evaluateScenarioObjective,
  scenarioEventForTurn,
  scenarioDoctrineForFaction,
  seededScenarioRandom,
  selectScenarioLocationIds,
} from './scenario'
import { doctrineLabel } from './localization'
import type { StrategyScenarioV2 } from './scenario/types'
import {
  COMMAND_POINTS_PER_TURN,
  VICTORY_POINTS_TARGET,
  planCost,
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

export { StrategyInputError } from './playerOrders'

/** Everything `init` needs to start a campaign. */
export interface StrategySetup {
  baseState: WorldState
  factions: StrategyFaction[]
  locations: StrategyLocation[]
  scenario?: StrategyScenarioV2
  locale?: Locale
}
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
  let activeLocale: Locale = 'en'
  let hatsuCues = $state<StrategyHatsuCue[]>([])
  let hatsuCueSequence = 0

  /** Everything a fresh campaign needs, in one argument. */
  function init({
    baseState,
    factions: loadedFactions,
    locations: loadedLocations,
    scenario = ACTIVE_SCENARIO,
    locale = 'en',
  }: StrategySetup) {
    activeScenario = scenario
    activeLocale = locale
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
    hatsuCues = []
    hatsuCueSequence = 0
    turnReports = [messagesFor(activeLocale).strategy.reports.initialized]
  }
  function selectFaction(factionId: string) {
    if (!currentState || !factions.some((faction) => faction.id === factionId)) {
      throw new StrategyInputError(messagesFor(activeLocale).strategy.errors.factionUnknown)
    }
    // Bound once: `currentState` is reactive state, so the guard above does not
    // narrow it inside the closures below.
    const state = currentState
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
        selectFactionEntityIds(state, factions, faction.id).map((id) => [id, 'READY']),
      ),
    )
    const occupied = roster.flatMap((faction) =>
      factionEntityIds(faction.id)
        .map((entityId) => state.presences[entityId]?.locationId)
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
      messagesFor(activeLocale).strategy.reports.briefing(
        doctrineLabel(scenarioDoctrineForFaction(factionId, activeScenario), activeLocale),
      ),
      messagesFor(activeLocale).strategy.reports.opposition(
        roster
          .filter((faction) => faction.id !== factionId)
          .map((faction) => faction.name)
          .join(', '),
      ),
      messagesFor(activeLocale).strategy.reports.hiddenPositions,
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
    intel = advanceIntel(intel, {
      state: currentState,
      friendlyIds: new Set(factionEntityIds(selectedFactionId)),
      observedLocations: [...scoutedLocations, ...guardedLocations],
      turn: currentTurn,
    })
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
    return evaluateScenarioObjective(selectedFactionId, {
      characterLocations: friendlyLocations,
      confirmedHostiles,
      scenario: activeScenario,
    })
  }

  function endTurn(
    playerFactionId: string,
    playerOrders: readonly StrategyMoveOrder[],
    diplomacyOrders: readonly DiplomacyOrder[] = [],
  ): StrategyTurnResult {
    const copy = messagesFor(activeLocale).strategy
    if (!branch || !currentState) throw new StrategyInputError(copy.errors.simulationNotReady)
    if (gameWon || gameLost) throw new StrategyInputError(copy.errors.scenarioEnded)
    if (playerFactionId !== selectedFactionId) {
      throw new StrategyInputError(copy.errors.activeFactionMismatch)
    }

    const playerFaction = factions.find((faction) => faction.id === playerFactionId)
    if (!playerFaction) throw new StrategyInputError(copy.errors.factionUnknown)
    if (planCost(playerOrders) + diplomacyCost(diplomacyOrders) > COMMAND_POINTS_PER_TURN) {
      throw new StrategyInputError(copy.errors.commandPointsExceeded(COMMAND_POINTS_PER_TURN))
    }

    const allowedCharacters = new Set(playerFaction.members.map((member) => member.character.id))
    const destinations = new Map(
      locations
        .filter((location) => scenarioLocationIds.includes(location.id))
        .map((location) => [location.id, location]),
    )
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
      locale: activeLocale,
    })
    if (diplomacy.error) throw new StrategyInputError(diplomacy.error)
    const nextRelationships = diplomacy.relationships
    const diplomacyReports = diplomacy.reports

    const plan = resolvePlayerOrders(playerOrders, {
      state: currentState,
      factions,
      playerFaction,
      allowedCharacters,
      destinations,
      intel,
      unitConditions,
      hatsuCooldowns,
      turn: currentTurn,
      locale: activeLocale,
      abilityIdsForCharacter,
    })
    playerEvents.push(...plan.events)
    for (const id of plan.entityIds) playerEntityIds.add(id)
    scoutedLocations.push(...plan.scouted)
    guardedLocations.push(...plan.guarded)
    deniedLocations.push(...plan.denied)
    activatedHatsu.push(...plan.activatedHatsu)
    activatedAbilityIds.push(...plan.activatedAbilityIds)
    Object.assign(abilityCooldownTurns, plan.cooldownTurns)
    hatsuInfluence += plan.influence
    // Numbered from the store so the sequence stays unique across turns; the
    // rules only know their own order within one plan.
    hatsuCues = [
      ...hatsuCues,
      ...plan.cues.map((cue) => ({ ...cue, seq: ++hatsuCueSequence })),
    ].slice(-20)

    const opposition = planOpposition({
      state: currentState,
      branchId: branch.id,
      factions: factions.filter((candidate) => activeFactionIds.includes(candidate.id)),
      playerFactionId,
      claimedCharacters: allowedCharacters,
      claimedEntities: playerEntityIds,
      playerLocations: factionEntityIds(playerFactionId)
        .map((entityId) => currentState!.presences[entityId]?.locationId)
        .filter((id): id is string => Boolean(id)),
      destinationIds: scenarioLocationIds,
      locations,
      unitConditions,
      relationships: nextRelationships,
      turn: currentTurn,
      scenario: activeScenario,
    })
    const aiEvents = opposition.events
    const aiDeniedLocations = opposition.deniedLocations
    const aiHatsuActivations = opposition.hatsuActivations

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
      locale: activeLocale,
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
        conflict.reports.push(copy.reports.catsName)
        hatsuCues = [
          ...hatsuCues,
          {
            seq: ++hatsuCueSequence,
            abilityId: 'cats-name',
            sourceCharacterId: 'prince-camilla',
            sourceLocationId: locationId ?? '',
            targetLocationId: locationId ?? '',
            report: copy.reports.catsNameShort,
          },
        ].slice(-20)
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
        locale: activeLocale,
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
    get currentState() {
      return currentState
    },
    get currentTurn() {
      return currentTurn
    },
    get turnReports() {
      return turnReports
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
    get gameLost() {
      return gameLost
    },
    get gameOver() {
      return gameWon || gameLost
    },
    get activeFactions() {
      return factions.filter((faction) => activeFactionIds.includes(faction.id))
    },
    get scenarioLocations() {
      return locations.filter((location) => scenarioLocationIds.includes(location.id))
    },
    get scenarioEvent() {
      return scenarioEventForTurn(currentTurn, activeScenario)
    },
    get relationships() {
      return relationships
    },
    get unitConditions() {
      return unitConditions
    },
    get turnHistory() {
      return turnHistory
    },
    get hatsuCooldowns() {
      return hatsuCooldowns
    },
    get hatsuCues() {
      return hatsuCues
    },
    abilityIdsForCharacter,
    init,
    selectFaction,
    restoreCampaignState,
    endTurn,
  }
}
