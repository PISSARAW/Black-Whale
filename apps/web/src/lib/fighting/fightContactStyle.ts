import type { FightImpact } from './types'

/** Only the public result of contact; no ability, aura reserve or hidden condition is read. */
export function fightContactStyle(
  impact: Pick<FightImpact, 'blocked'> &
    Partial<Pick<FightImpact, 'parried' | 'avoided' | 'invulnerable'>>,
) {
  if (impact.avoided || impact.invulnerable) return 'evaded'
  if (impact.parried) return 'parry'
  return impact.blocked ? 'guard' : 'hit'
}
