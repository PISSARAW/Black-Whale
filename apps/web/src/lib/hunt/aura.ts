/**
 * One reservoir, three concurrent uses — invariant I2.
 *
 * Knowing (En), preparing (aura left behind), and surviving (Ryu, Ken) all draw
 * on the same hundred points, and that is the whole of the game's economy.
 * Three separate gauges would delete the decision the prototype exists to
 * measure, so there is exactly one number here and one place it is spent.
 *
 * The second field is what makes preparation cost something. Aura left in an
 * entrave has *left the body*: it is not spendable, and — this is the part a
 * single number cannot express — it lowers the ceiling regeneration climbs back
 * to. A player holding two entraves is walking around with a reservoir of
 * fifty, not a full one they happen to have spent from.
 */

export const MAX_AURA = 100

/** Only at a standstill: walking, the body is spending what it makes. */
export const REGEN_PER_SECOND = 4

export interface AuraPool {
  /** In the body, spendable now. */
  available: number
  /** Out of the body and waiting somewhere — an entrave, until it is taken back. */
  committed: number
}

export function fullPool(): AuraPool {
  return { available: MAX_AURA, committed: 0 }
}

export function poolOf(available: number, committed = 0): AuraPool {
  return { available, committed }
}

/**
 * The ceiling regeneration climbs to. Committed aura is not merely absent from
 * `available`; it is absent from the body, so it cannot be regrown around.
 */
export function ceilingOf(pool: AuraPool): number {
  return Math.max(0, MAX_AURA - pool.committed)
}

export function canAfford(pool: AuraPool, cost: number): boolean {
  return pool.available >= cost
}

/** Spends from the body. Never goes below zero; the caller checks affordability. */
export function spend(pool: AuraPool, cost: number): AuraPool {
  return { ...pool, available: Math.max(0, pool.available - cost) }
}

/** Puts aura outside the body — where it stays until taken back or spent. */
export function commit(pool: AuraPool, cost: number): AuraPool {
  const moved = Math.min(cost, pool.available)
  return { available: pool.available - moved, committed: pool.committed + moved }
}

/**
 * Taking placed aura back by touching it: it returns to the body at once. That
 * immediacy is the point of T4.3 — backing into your own traps mid-duel is a
 * manoeuvre because it pays now, where regeneration pays over half a minute.
 */
export function release(pool: AuraPool, amount: number): AuraPool {
  const moved = Math.min(amount, pool.committed)
  return {
    available: Math.min(MAX_AURA, pool.available + moved),
    committed: pool.committed - moved,
  }
}

/**
 * An entrave that fires is spent: the aura does not come home, but it stops
 * weighing on the ceiling, so the body can grow it back.
 */
export function forfeit(pool: AuraPool, amount: number): AuraPool {
  return { ...pool, committed: Math.max(0, pool.committed - amount) }
}

/** Regeneration, at a standstill only, up to the ceiling the placements leave. */
export function regenerate(pool: AuraPool, dt: number, atRest: boolean): AuraPool {
  const ceiling = ceilingOf(pool)
  if (!atRest) return { ...pool, available: Math.min(pool.available, ceiling) }
  return { ...pool, available: Math.min(ceiling, pool.available + REGEN_PER_SECOND * dt) }
}

/** Zero available aura: the Ten no longer holds. Used by the duel's resolution. */
export function isSpent(pool: AuraPool): boolean {
  return pool.available <= 0
}
