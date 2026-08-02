/**
 * The ledger of aura left behind — the central accounting of the prototype.
 *
 * Everything the player prepares is a `Placement`: a point in a room holding a
 * named number of aura that has left the body. This file owns the three moves a
 * placement can make and nothing else, because those three moves are what the
 * step-2 question ("knowing or preparing?") is actually made of:
 *
 *   commit  — the aura leaves the body and lowers the ceiling it regrows to
 *   recover — touching it takes it straight back, at once
 *   consume — it fires, so it is gone, but it stops weighing on the ceiling
 *
 * The invariant this file exists to hold: at every instant, the sum of the live
 * placements equals `pool.committed`. `ledgerBalances` states it, and the tests
 * check it after every sequence rather than at the end of a happy path.
 */
import type { Vec2 } from '../../tour/types'
import { commit, forfeit, release, type AuraPool } from '../aura'

export type PlacementState = 'set' | 'sprung' | 'recovered'

export interface Placement {
  id: string
  cost: number
  position: Vec2
  spaceId: string
  state: PlacementState
  /** Game clock at which it was laid, for the debrief. */
  placedAt: number
  /** Whether the hunter has spotted it. Seen placements are walked around. */
  seen: boolean
}

export interface Ledger {
  pool: AuraPool
  placements: Placement[]
}

export interface PlacementRequest {
  id: string
  cost: number
  at: { position: Vec2; spaceId: string; clock: number }
}

/** Only placements still holding aura count against the pool. */
export function liveOf(placements: readonly Placement[]): Placement[] {
  return placements.filter((placement) => placement.state === 'set')
}

export function committedIn(placements: readonly Placement[]): number {
  return liveOf(placements).reduce((total, placement) => total + placement.cost, 0)
}

/** The invariant, as a function, so a test can assert it after any sequence. */
export function ledgerBalances(ledger: Ledger): boolean {
  return Math.abs(committedIn(ledger.placements) - ledger.pool.committed) < 1e-9
}

/**
 * Lays aura down. Refuses — returning the ledger untouched — when the body does
 * not hold enough, which is the only way the caller learns it cannot afford it.
 */
export function placeAura(ledger: Ledger, request: PlacementRequest): { ledger: Ledger; placed: Placement | null } {
  if (ledger.pool.available < request.cost) return { ledger, placed: null }

  const placed: Placement = {
    id: request.id,
    cost: request.cost,
    position: request.at.position,
    spaceId: request.at.spaceId,
    state: 'set',
    placedAt: request.at.clock,
    seen: false,
  }

  return {
    ledger: { pool: commit(ledger.pool, request.cost), placements: [...ledger.placements, placed] },
    placed,
  }
}

/** Takes a placement back into the body. Only a `set` placement can be recovered. */
export function recoverAura(ledger: Ledger, id: string): { ledger: Ledger; recovered: Placement | null } {
  const found = ledger.placements.find((placement) => placement.id === id && placement.state === 'set')
  if (!found) return { ledger, recovered: null }

  return {
    ledger: {
      pool: release(ledger.pool, found.cost),
      placements: ledger.placements.map((placement) =>
        placement.id === id ? { ...placement, state: 'recovered' as const } : placement,
      ),
    },
    recovered: found,
  }
}

/** Marks placements as fired. The aura is gone, but the ceiling comes back up. */
export function consumeAura(ledger: Ledger, ids: readonly string[]): Ledger {
  const firing = new Set(ids)
  let pool = ledger.pool
  const placements = ledger.placements.map((placement) => {
    if (!firing.has(placement.id) || placement.state !== 'set') return placement
    pool = forfeit(pool, placement.cost)
    return { ...placement, state: 'sprung' as const }
  })
  return { pool, placements }
}

/** The hunter has found one: it still holds its aura, he simply knows it is there. */
export function markSeen(placements: readonly Placement[], ids: readonly string[]): Placement[] {
  const spotted = new Set(ids)
  return placements.map((placement) =>
    spotted.has(placement.id) ? { ...placement, seen: true } : placement,
  )
}
