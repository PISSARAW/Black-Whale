import { doctrineForFaction, type StrategyDoctrine } from './rules'

export const SCENARIO_MAX_TURNS = 8
export const SCENARIO_FACTION_COUNT = 3
export const SCENARIO_LOCATION_COUNT = 12

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

export const SCENARIO_EVENTS: readonly ScenarioEvent[] = [
  {
    turn: 2,
    kind: 'ALERT',
    title: 'Alerte de sécurité',
    description: 'Les factions adverses accélèrent leurs opérations.',
  },
  {
    turn: 4,
    kind: 'BLACKOUT',
    title: 'Coupure des communications',
    description: 'Les enquêtes à distance ne révèlent aucune nouvelle position ce tour.',
  },
  {
    turn: 6,
    kind: 'LOCKDOWN',
    title: 'Confinement des ponts',
    description: 'Les déplacements adverses deviennent plus rares.',
  },
]

export function scenarioEventForTurn(turn: number): ScenarioEvent | null {
  return SCENARIO_EVENTS.find((event) => event.turn === turn) ?? null
}

export function scenarioMoveChance(turn: number): number {
  const event = scenarioEventForTurn(turn)
  if (event?.kind === 'ALERT') return 0.9
  if (event?.kind === 'LOCKDOWN') return 0.35
  return 0.72
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

/** Pick two opponents while favouring doctrines unlike the player's. */
export function buildScenarioRoster<T extends ScenarioFactionCandidate>(
  factions: readonly T[],
  playerFactionId: string,
): T[] {
  const player = factions.find((faction) => faction.id === playerFactionId)
  if (!player) return []
  const playerDoctrine = doctrineForFaction(playerFactionId)
  const opponents = factions
    .filter((faction) => faction.id !== playerFactionId)
    .sort((left, right) => {
      const leftDifferent = doctrineForFaction(left.id) !== playerDoctrine ? 1 : 0
      const rightDifferent = doctrineForFaction(right.id) !== playerDoctrine ? 1 : 0
      return rightDifferent - leftDifferent || left.id.localeCompare(right.id)
    })
    .slice(0, SCENARIO_FACTION_COUNT - 1)
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
  const remaining = [...new Set(allLocationIds)]
    .filter((id) => !occupied.includes(id))
    .sort((left, right) => left.localeCompare(right))
  return [...occupied, ...remaining].slice(0, Math.max(SCENARIO_LOCATION_COUNT, occupied.length))
}
