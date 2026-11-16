import type { ArcadeFighter } from './types'

/** The copied Hatsu supplies neither the original user's blood nor their infusion kit. */
export function maryHasInfusion(fighter: ArcadeFighter): boolean {
  return fighter.equipment?.includes('blood-infusion') ?? (fighter.nenOwner ?? fighter.id) === 'zakuro'
}
