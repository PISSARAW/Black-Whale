/**
 * En: twenty metres of knowing, for fifteen of the hundred.
 *
 * The sweep is symmetric, and that symmetry is the whole design. It finds every
 * physical intrusion inside the radius. A body holding aura also exposes its
 * aura signature and feels where the sweep came from. Looking is not free and it
 * is not quiet: a hunter who sweeps has announced himself to whoever he did not
 * find, and a player who sweeps has told the hunter exactly which room to walk
 * into.
 *
 * A body in Zetsu still displaces the field, but exposes no aura signature and
 * does not feel the sweep pass over it.
 */
import type { Vec2 } from '../../tour/types'
import { canAfford, spend, type AuraPool } from '../aura'
import { rulesOf, type NenState } from './states'

export const EN_RADIUS = 20
export const EN_COST = 15

export interface EnBody {
  id: string
  position: Vec2
  nen: NenState
}

export interface EnSweep {
  /** Where the sweep was cast from, so the bodies it touched know which way to look. */
  origin: Vec2
  /** Physical intrusions inside the radius. */
  found: string[]
  /** Bodies whose aura signature can be read. */
  auraRead: string[]
  /** Bodies that felt the sweep. */
  felt: string[]
}

export interface SweepRequest {
  origin: Vec2
  caster: NenState
  bodies: readonly EnBody[]
}

/**
 * Casts a sweep if the caster can hold aura and afford it. Returns the pool
 * unchanged and a null sweep when they cannot, so the caller never has to
 * check the price twice.
 */
export function sweepEn(
  pool: AuraPool,
  request: SweepRequest,
): { pool: AuraPool; sweep: EnSweep | null } {
  if (!rulesOf(request.caster).canSweep || !canAfford(pool, EN_COST)) {
    return { pool, sweep: null }
  }

  const sweep: EnSweep = { origin: request.origin, found: [], auraRead: [], felt: [] }
  for (const body of request.bodies) {
    const rules = rulesOf(body.nen)
    if (
      Math.hypot(body.position[0] - request.origin[0], body.position[1] - request.origin[1]) >
      EN_RADIUS
    ) {
      continue
    }
    sweep.found.push(body.id)
    if (rules.auraVisible) sweep.auraRead.push(body.id)
    if (rules.feelsEn) sweep.felt.push(body.id)
  }

  return { pool: spend(pool, EN_COST), sweep }
}
