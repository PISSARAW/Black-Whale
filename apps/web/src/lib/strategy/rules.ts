export type StrategyOrderType = 'MOVE' | 'SCOUT' | 'GUARD' | 'HATSU'
export type StrategyHatsuRole = 'RECON' | 'MOBILITY' | 'DENIAL'

export const HATSU_ROLE_LABELS: Record<StrategyHatsuRole, string> = {
  RECON: 'Reveals hostile presences in the targeted zone.',
  MOBILITY: 'Instantly moves the unit to the targeted zone.',
  DENIAL: 'Prevents hostile movements to the zone for this turn.',
}

export interface StrategyOrder {
  characterId: string
  locationId: string
  type: StrategyOrderType
  abilityId?: string
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
  HATSU: 3,
}

export const ORDER_LABELS: Record<StrategyOrderType, string> = {
  MOVE: 'Move',
  SCOUT: 'Investigate',
  GUARD: 'Guard',
  HATSU: 'Activate Hatsu',
}

const RECON_HATSU_KINDS = new Set([
  'scout',
  'surveillance',
  'future',
  'divination',
  'prophecy',
  'dowsing',
  'paper-spy',
  'blood-search',
  'truth-punch',
  'senses',
])

const MOBILITY_HATSU_KINDS = new Set([
  'teleport',
  'portal',
  'door-network',
  'projection',
  'vehicle',
  'arrow',
  'flock',
  'identity-swap',
])

export function strategicRoleForHatsu(kind: string): StrategyHatsuRole {
  if (RECON_HATSU_KINDS.has(kind)) return 'RECON'
  if (MOBILITY_HATSU_KINDS.has(kind)) return 'MOBILITY'
  return 'DENIAL'
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
      title: 'Form a Bastion',
      description: `Gather ${target} units in the same location by the end of the turn.`,
      current,
      target,
      complete: current >= target,
    }
  }
  if (doctrine === 'INTELLIGENCE') {
    const target = 2
    return {
      doctrine,
      title: 'Clear the Fog',
      description: `Confirm the position of ${target} hostile units.`,
      current: confirmedHostiles,
      target,
      complete: confirmedHostiles >= target,
    }
  }
  const progress = objectiveProgress(characterLocations, occupied.length)
  return {
    doctrine,
    title: 'Extend Your Presence',
    description: `Occupy ${progress.target} distinct locations with your units.`,
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
