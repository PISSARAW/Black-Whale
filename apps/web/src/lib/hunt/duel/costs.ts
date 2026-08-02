/**
 * The one place a per-second principle is charged.
 *
 * Gyo, In and Ken differ in what they buy and not in how they are paid for:
 * a rate, taken every tick, and when the reservoir cannot cover it the
 * principle drops rather than the number going negative. Written once so the
 * three verb files stay about what they mean, and so a fourth continuous
 * principle cannot arrive with a subtly different rule for running out.
 */
import { spend as spendAura } from '../aura'
import type { DuelistState } from './state'

export type { DuelistState }

export interface Charge {
  active: boolean
  rate: number
  dt: number
  /** The flag to clear when the reservoir cannot cover the tick. */
  drop: 'gyo' | 'in' | 'ken'
}

export function spend(duelist: DuelistState, charge: Charge): DuelistState {
  if (!charge.active) return duelist
  const cost = charge.rate * charge.dt
  // A tick that cannot be covered takes whatever is left rather than being
  // refused: holding Ken to the last point is how a duel is lost by attrition,
  // and stopping just short of zero would leave a residue nothing can ever
  // spend — a duelist who can never be exhausted, which is invariant I3 gone.
  if (duelist.pool.available < cost) {
    return { ...duelist, [charge.drop]: false, pool: spendAura(duelist.pool, cost) }
  }
  return { ...duelist, pool: spendAura(duelist.pool, cost) }
}
