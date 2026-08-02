export type StrategyOrderType = 'MOVE' | 'SCOUT' | 'GUARD'

export interface StrategyOrder {
  characterId: string
  locationId: string
  type: StrategyOrderType
}

export const COMMAND_POINTS_PER_TURN = 5

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

export function intelCertainty(age: number): 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN' {
  if (age <= 0) return 'CONFIRMED'
  if (age === 1) return 'PROBABLE'
  return 'LAST_KNOWN'
}
