export type StrategyOrderType = 'MOVE' | 'SCOUT' | 'GUARD'

export interface StrategyOrder {
  characterId: string
  locationId: string
  type: StrategyOrderType
}

export const COMMAND_POINTS_PER_TURN = 5
export const VICTORY_POINTS_TARGET = 3

export type StrategyDoctrine = 'EXPANSION' | 'CONSOLIDATION' | 'INTELLIGENCE'

export interface StrategyObjective {
  doctrine: StrategyDoctrine
  title: string
  description: string
  current: number
  target: number
  complete: boolean
}

export const ORDER_COSTS: Record<StrategyOrderType, number> = {
  MOVE: 1,
  SCOUT: 2,
  GUARD: 1,
}

export const ORDER_LABELS: Record<StrategyOrderType, string> = {
  MOVE: 'Se déplacer',
  SCOUT: 'Enquêter',
  GUARD: 'Protéger',
}

export function orderCost(order: Pick<StrategyOrder, 'type'>): number {
  return ORDER_COSTS[order.type]
}

export function planCost(orders: readonly StrategyOrder[]): number {
  return orders.reduce((total, order) => total + orderCost(order), 0)
}

export function objectiveTarget(memberCount: number): number {
  return Math.max(1, Math.min(3, memberCount))
}

export function objectiveProgress(
  characterLocations: readonly (string | undefined)[],
  memberCount: number,
): { current: number; target: number; complete: boolean } {
  const current = new Set(
    characterLocations.filter((location): location is string => Boolean(location)),
  ).size
  const target = objectiveTarget(memberCount)
  return { current, target, complete: current >= target }
}

function stableHash(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function doctrineForFaction(factionId: string): StrategyDoctrine {
  const doctrines: StrategyDoctrine[] = ['EXPANSION', 'CONSOLIDATION', 'INTELLIGENCE']
  return doctrines[stableHash(factionId) % doctrines.length]
}

export function evaluateObjective(
  doctrine: StrategyDoctrine,
  characterLocations: readonly (string | undefined)[],
  confirmedHostiles: number,
): StrategyObjective {
  const occupied = characterLocations.filter((location): location is string => Boolean(location))
  if (doctrine === 'CONSOLIDATION') {
    const groups = new Map<string, number>()
    for (const location of occupied) groups.set(location, (groups.get(location) ?? 0) + 1)
    const current = Math.max(0, ...groups.values())
    const target = Math.min(2, Math.max(1, occupied.length))
    return {
      doctrine,
      title: 'Former un bastion',
      description: `Rassemblez ${target} unités dans un même lieu à la fin du tour.`,
      current,
      target,
      complete: current >= target,
    }
  }
  if (doctrine === 'INTELLIGENCE') {
    const target = 2
    return {
      doctrine,
      title: 'Lever le brouillard',
      description: `Confirmez la position de ${target} unités adverses.`,
      current: confirmedHostiles,
      target,
      complete: confirmedHostiles >= target,
    }
  }
  const progress = objectiveProgress(characterLocations, occupied.length)
  return {
    doctrine,
    title: 'Étendre votre présence',
    description: `Occupez ${progress.target} lieux distincts avec vos unités.`,
    ...progress,
  }
}

export interface StrategicDestinationOptions {
  currentLocationId?: string
  availableLocationIds: readonly string[]
  occupiedLocationIds: readonly string[]
  opposingLocationIds: readonly string[]
  roll: number
}

export function chooseStrategicDestination(
  doctrine: StrategyDoctrine,
  options: StrategicDestinationOptions,
): string | undefined {
  const {
    currentLocationId,
    availableLocationIds,
    occupiedLocationIds,
    opposingLocationIds,
    roll,
  } = options
  const available = [...new Set(availableLocationIds)].filter((id) => id !== currentLocationId)
  if (!available.length) return undefined
  const preferred =
    doctrine === 'CONSOLIDATION'
      ? occupiedLocationIds.filter((id) => id !== currentLocationId && available.includes(id))
      : doctrine === 'INTELLIGENCE'
        ? opposingLocationIds.filter((id) => id !== currentLocationId && available.includes(id))
        : available.filter((id) => !occupiedLocationIds.includes(id))
  const choices = preferred.length ? [...new Set(preferred)] : available
  const index = Math.floor(Math.max(0, Math.min(0.999, roll)) * choices.length)
  return choices[Math.min(choices.length - 1, index)]
}

export function intelCertainty(age: number): 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN' {
  if (age <= 0) return 'CONFIRMED'
  if (age === 1) return 'PROBABLE'
  return 'LAST_KNOWN'
}
