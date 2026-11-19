import type { FightState } from './types'

/** Choosing the existing roster experiment never changes the ordinary arrow's manga contract. */
export function halkenburgRosterVariant(state: Pick<FightState, 'environment'>): boolean {
  return state.environment.halkenburgRosterVariant === true
}
