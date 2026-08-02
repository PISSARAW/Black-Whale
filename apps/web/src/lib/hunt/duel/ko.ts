/**
 * Ko: twenty points, all of them in one place, and nothing left anywhere else.
 *
 * The exposure is not a side effect, it is the whole of the risk: from the
 * instant it is gathered the only zone covered is the one it is gathered into,
 * and a Gyo across the room can see that. Charging a Ko against someone who is
 * looking is offering them three targets in exchange for one.
 *
 * And it takes a moment to gather. That moment is load-bearing: it is the only
 * window either side has to answer the other, and without it the duel collapses
 * into whoever presses the key first — Gyo would have nothing to see in time,
 * In would have nothing to spoil, and an intact hunter would lose to a player
 * mashing a button, which is invariant I4 gone.
 *
 * It needs Ryu pushed forward past halfway to be possible at all, and holding
 * Ken forbids it. Those two conditions are what stop it from being the only
 * verb anyone ever uses.
 */
import { spend as spendAura } from '../aura'
import { canStrike } from './ryu'
import type { BodyZone, DuelistState } from './state'

export const KO_COST = 20
/** How long it takes to gather — and how long the other one has to answer it. */
export const KO_WINDUP = 0.8

export function canCharge(duelist: DuelistState): boolean {
  return (
    !duelist.ken &&
    !duelist.zetsu &&
    duelist.ko === null &&
    canStrike(duelist) &&
    duelist.pool.available >= KO_COST
  )
}

/** Gathers a Ko into a zone. Refuses silently — the caller checks `canCharge`. */
export function chargeKo(duelist: DuelistState, zone: BodyZone): DuelistState {
  if (!canCharge(duelist)) return duelist
  return { ...duelist, ko: zone, gathering: 0, pool: spendAura(duelist.pool, KO_COST) }
}

/** Whether the gathered blow is ready to land. */
export function isReady(duelist: DuelistState): boolean {
  return duelist.ko !== null && duelist.gathering >= KO_WINDUP
}

export function gather(duelist: DuelistState, dt: number): DuelistState {
  return duelist.ko ? { ...duelist, gathering: duelist.gathering + dt } : duelist
}

/** After the blow, gathered or not, the aura is no longer in one point. */
export function releaseKo(duelist: DuelistState): DuelistState {
  return { ...duelist, ko: null, gathering: 0 }
}
