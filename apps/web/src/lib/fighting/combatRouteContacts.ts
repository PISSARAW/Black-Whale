import type { CombatRoute } from './combatRoutes'
import { moveById } from './movesets'

/** A contextual variation fulfills the authored slot only for its own fighter. */
export function combatRouteContactId(moveId: string | undefined): string | undefined {
  const move = moveById(moveId)
  return move ? `${move.id.split(':')[0]}:${move.slot}` : moveId
}

export const routeStepHits = (route: CombatRoute, step: number): number => route.hits?.[step] ?? 1
export const routeHitsBefore = (route: CombatRoute, step: number): number =>
  route.moves.slice(0, step).reduce((total, _, index) => total + routeStepHits(route, index), 0)
export const combatRouteContacts = (route: CombatRoute) =>
  route.moves.flatMap((slot, step) =>
    Array.from({ length: routeStepHits(route, step) }, () => `${route.fighter}:${slot}`),
  )
