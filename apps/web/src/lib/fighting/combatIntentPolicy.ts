import type { ArcadeFighter } from './types'

/** Recovery is an action priority, not merely a suggested spacing label. */
export function reservingAura(fighter: ArcadeFighter): boolean {
  return fighter.nenTactics?.goal === 'recover'
}
