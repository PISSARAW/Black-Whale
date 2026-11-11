import type { WorldState } from '@black-whale/canon-engine'
import type { Locale } from '$lib/i18n/config'
import type { FactionAIMemory } from './aiIntent'
import type { UnitCondition } from './conflict'
import type { DiplomacyOrder, FactionRelationship } from './diplomacy'
import type { StrategyHatsuCue } from './hatsuPresentation'
import type { PoliticalMemory } from './intrigue'
import type { ShipLogistics } from './logistics'
import type { StrategyObjective } from './rules'
import type { scenarioEventForTurn } from './scenario'
import type { StrategyScenarioV2 } from './scenario/types'
import type {
  StrategyFaction,
  StrategyIntel,
  StrategyLocation,
  StrategyMoveOrder,
  StrategyTurnResult,
} from './types'

export interface StrategySetup {
  baseState: WorldState
  factions: StrategyFaction[]
  locations: StrategyLocation[]
  scenario?: StrategyScenarioV2
  locale?: Locale
}

export interface StrategyStoreSnapshot {
  currentState: WorldState | null
  currentTurn: number
  turnReports: string[]
  intel: Record<string, StrategyIntel>
  objective: StrategyObjective | null
  secretObjective: StrategyObjective | null
  victoryPoints: number
  gameWon: boolean
  gameLost: boolean
  activeFactions: StrategyFaction[]
  scenarioLocations: StrategyLocation[]
  scenarioEvent: ReturnType<typeof scenarioEventForTurn>
  relationships: Record<string, FactionRelationship>
  politicalMemory: PoliticalMemory
  logistics: ShipLogistics
  aiMemory: Record<string, FactionAIMemory>
  unitConditions: Record<string, UnitCondition>
  turnHistory: Array<{ orders: StrategyMoveOrder[]; diplomacy: DiplomacyOrder[] }>
  hatsuCooldowns: Record<string, number>
  hatsuCues: StrategyHatsuCue[]
}

export interface StrategyStoreActions {
  abilityIdsForCharacter(characterId: string): string[]
  init(setup: StrategySetup): void
  selectFaction(factionId: string): void
  restoreCampaignState(
    relationships: Record<string, FactionRelationship>,
    conditions: Record<string, UnitCondition>,
  ): void
  endTurn(
    playerFactionId: string,
    playerOrders: readonly StrategyMoveOrder[],
    diplomacyOrders?: readonly DiplomacyOrder[],
  ): StrategyTurnResult
}

export function createStrategyStoreApi(
  snapshot: () => StrategyStoreSnapshot,
  actions: StrategyStoreActions,
) {
  return {
    get currentState() {
      return snapshot().currentState
    },
    get currentTurn() {
      return snapshot().currentTurn
    },
    get turnReports() {
      return snapshot().turnReports
    },
    get intel() {
      return snapshot().intel
    },
    get objective() {
      return snapshot().objective
    },
    get secretObjective() {
      return snapshot().secretObjective
    },
    get victoryPoints() {
      return snapshot().victoryPoints
    },
    get gameWon() {
      return snapshot().gameWon
    },
    get gameLost() {
      return snapshot().gameLost
    },
    get gameOver() {
      const state = snapshot()
      return state.gameWon || state.gameLost
    },
    get activeFactions() {
      return snapshot().activeFactions
    },
    get scenarioLocations() {
      return snapshot().scenarioLocations
    },
    get scenarioEvent() {
      return snapshot().scenarioEvent
    },
    get relationships() {
      return snapshot().relationships
    },
    get politicalMemory() {
      return snapshot().politicalMemory
    },
    get logistics() {
      return snapshot().logistics
    },
    get aiMemory() {
      return snapshot().aiMemory
    },
    get unitConditions() {
      return snapshot().unitConditions
    },
    get turnHistory() {
      return snapshot().turnHistory
    },
    get hatsuCooldowns() {
      return snapshot().hatsuCooldowns
    },
    get hatsuCues() {
      return snapshot().hatsuCues
    },
    ...actions,
  }
}
