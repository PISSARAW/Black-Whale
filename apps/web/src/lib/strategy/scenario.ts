import type { StrategyDoctrine, StrategyObjective } from './rules'
import { requireStrategyScenario } from './scenario/registry'
import type { StrategyScenarioFaction } from './scenario/types'

export const ACTIVE_SCENARIO = requireStrategyScenario()
export const SCENARIO_MAX_TURNS = ACTIVE_SCENARIO.maxTurns
export const SCENARIO_FACTION_COUNT = ACTIVE_SCENARIO.playableFactions.length
export const SCENARIO_LOCATION_COUNT = ACTIVE_SCENARIO.locationIds.length

export type ScenarioEventKind = 'ALERT' | 'BLACKOUT' | 'LOCKDOWN'

export interface ScenarioEvent {
  turn: number
  kind: ScenarioEventKind
  title: string
  description: string
}

export interface ScenarioFactionCandidate {
  id: string
}

export const SCENARIO_EVENTS: readonly ScenarioEvent[] = ACTIVE_SCENARIO.events

export function scenarioEventForTurn(turn: number): ScenarioEvent | null {
  return SCENARIO_EVENTS.find((event) => event.turn === turn) ?? null
}

export function scenarioMoveChance(turn: number): number {
  const event = ACTIVE_SCENARIO.events.find((candidate) => candidate.turn === turn)
  return Math.min(1, 0.72 * (event?.aiMoveMultiplier ?? 1))
}

export function scenarioFactionConfig(factionId: string): StrategyScenarioFaction | null {
  return ACTIVE_SCENARIO.playableFactions.find((entry) => entry.factionId === factionId) ?? null
}

export function isPlayableScenarioFaction(factionId: string): boolean {
  return Boolean(scenarioFactionConfig(factionId))
}

export function scenarioDoctrineForFaction(factionId: string): StrategyDoctrine {
  const config = scenarioFactionConfig(factionId)
  if (!config) throw new Error(`Faction absente du scénario : ${factionId}`)
  return config.doctrine
}

export function evaluateScenarioObjective(
  factionId: string,
  characterLocations: readonly (string | undefined)[],
  confirmedHostiles: number,
): StrategyObjective {
  const config = scenarioFactionConfig(factionId)
  if (!config) throw new Error(`Faction absente du scénario : ${factionId}`)
  const objective = config.publicObjective
  const occupied = characterLocations.filter((id): id is string => Boolean(id))
  let current = new Set(occupied).size
  if (objective.kind === 'CONFIRM_HOSTILES') current = confirmedHostiles
  if (objective.kind === 'FORM_BASTION') {
    const groups = new Map<string, number>()
    for (const id of occupied) groups.set(id, (groups.get(id) ?? 0) + 1)
    current = Math.max(0, ...groups.values())
  }
  return {
    doctrine: config.doctrine,
    title: objective.title,
    description: objective.description,
    current,
    target: objective.target,
    complete: current >= objective.target,
  }
}

export function seededScenarioRandom(seed: string): () => number {
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

/** Build the closed scenario roster while keeping the chosen faction first. */
export function buildScenarioRoster<T extends ScenarioFactionCandidate>(
  factions: readonly T[],
  playerFactionId: string,
): T[] {
  const player = factions.find((faction) => faction.id === playerFactionId)
  if (!player || !isPlayableScenarioFaction(playerFactionId)) return []
  const opponents = ACTIVE_SCENARIO.playableFactions
    .filter((entry) => entry.factionId !== playerFactionId)
    .flatMap((entry) => factions.filter((faction) => faction.id === entry.factionId))
  return [player, ...opponents]
}

export function doctrineBriefing(doctrine: StrategyDoctrine): string {
  if (doctrine === 'CONSOLIDATION')
    return 'Rassemblez vos forces, verrouillez un point d’appui et résistez aux incursions.'
  if (doctrine === 'INTELLIGENCE')
    return 'Identifiez les mouvements adverses avant que leurs intentions ne deviennent irréversibles.'
  return 'Dispersez vos unités et imposez votre présence dans les secteurs disputés.'
}

export function selectScenarioLocationIds(
  allLocationIds: readonly string[],
  occupiedLocationIds: readonly string[],
): string[] {
  const occupied = [...new Set(occupiedLocationIds)].filter((id) => allLocationIds.includes(id))
  const configured = ACTIVE_SCENARIO.locationIds.filter(
    (id) => allLocationIds.includes(id) && !occupied.includes(id),
  )
  const remaining = [...new Set([...configured, ...allLocationIds])]
    .filter((id) => !occupied.includes(id))
    .sort((left, right) => {
      const leftIndex = configured.indexOf(left)
      const rightIndex = configured.indexOf(right)
      if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex
      if (leftIndex >= 0) return -1
      if (rightIndex >= 0) return 1
      return left.localeCompare(right)
    })
  return [...occupied, ...remaining].slice(0, Math.max(SCENARIO_LOCATION_COUNT, occupied.length))
}
