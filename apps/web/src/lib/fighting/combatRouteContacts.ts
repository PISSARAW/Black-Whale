import type { CombatRoute } from './combatRoutes'
import { canGuard } from './fightActorState'
import { moveById } from './movesets'
import type { FightState } from './types'

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

export function recoveryFinishStep(route: CombatRoute, step: number): boolean {
  return route.recoveryFinish === true && step === route.moves.length - 1
}

export function recoveryFinishReady(state: FightState): boolean {
  return (
    !state.hitstop &&
    !state.player.attack &&
    !state.opponent.wakeupInvulnerableFrames &&
    !state.opponent.blockStun &&
    canGuard(state.opponent)
  )
}
