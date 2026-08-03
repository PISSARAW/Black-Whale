import type { StrategyDoctrine, StrategyObjective } from './rules'
import { requireStrategyScenario } from './scenario/registry'
import type { StrategyScenarioFaction, StrategyScenarioV2 } from './scenario/types'

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

export function scenarioEventForTurn(
  turn: number,
  scenario = ACTIVE_SCENARIO,
): ScenarioEvent | null {
  return scenario.events.find((event) => event.turn === turn) ?? null
}

export function scenarioMoveChance(turn: number, scenario = ACTIVE_SCENARIO): number {
  const event = scenario.events.find((candidate) => candidate.turn === turn)
  return Math.min(1, 0.72 * (event?.aiMoveMultiplier ?? 1))
}

export function scenarioFactionConfig(
  factionId: string,
  scenario = ACTIVE_SCENARIO,
): StrategyScenarioFaction | null {
  return scenario.playableFactions.find((entry) => entry.factionId === factionId) ?? null
}

export function isPlayableScenarioFaction(factionId: string, scenario = ACTIVE_SCENARIO): boolean {
  return Boolean(scenarioFactionConfig(factionId, scenario))
}

export function scenarioDoctrineForFaction(
  factionId: string,
  scenario = ACTIVE_SCENARIO,
): StrategyDoctrine {
  const config = scenarioFactionConfig(factionId, scenario)
  if (!config) throw new Error(`Faction missing from scenario: ${factionId}`)
  return config.doctrine
}

/** What the faction can see of the board when its objective is scored. */
export interface ScenarioStanding {
  characterLocations: readonly (string | undefined)[]
  confirmedHostiles: number
  scenario?: StrategyScenarioV2
}

export function evaluateScenarioObjective(
  factionId: string,
  { characterLocations, confirmedHostiles, scenario = ACTIVE_SCENARIO }: ScenarioStanding,
): StrategyObjective {
  const config = scenarioFactionConfig(factionId, scenario)
  if (!config) throw new Error(`Faction missing from scenario: ${factionId}`)
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
  scenario = ACTIVE_SCENARIO,
): T[] {
  const player = factions.find((faction) => faction.id === playerFactionId)
  if (!player || !isPlayableScenarioFaction(playerFactionId, scenario)) return []
  const opponents = scenario.playableFactions
    .filter((entry) => entry.factionId !== playerFactionId)
    .flatMap((entry) => factions.filter((faction) => faction.id === entry.factionId))
  return [player, ...opponents]
}

export function doctrineBriefing(doctrine: StrategyDoctrine): string {
  if (doctrine === 'CONSOLIDATION')
    return 'Gather your forces, secure a stronghold and resist incursions.'
  if (doctrine === 'INTELLIGENCE')
    return 'Identify hostile movements before their intentions become irreversible.'
  return 'Disperse your units and impose your presence in contested sectors.'
}

export function selectScenarioLocationIds(
  allLocationIds: readonly string[],
  occupiedLocationIds: readonly string[],
  scenario: StrategyScenarioV2 = ACTIVE_SCENARIO,
): string[] {
  const occupied = [...new Set(occupiedLocationIds)].filter((id) => allLocationIds.includes(id))
  const configured = scenario.locationIds.filter(
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
  return [...occupied, ...remaining].slice(
    0,
    Math.max(scenario.locationIds.length, occupied.length),
  )
}
