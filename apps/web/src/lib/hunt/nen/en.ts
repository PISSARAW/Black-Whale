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
import { detectWithEn } from '@black-whale/nen-engine'
import type { Vec2 } from '../../tour/types'
import { canAfford, spend, type AuraPool } from '../aura'
import { engineStateOf, rulesOf, type NenState } from './states'

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

  // Who the sweep touches and whose signature it reads is the engine's
  // `detectWithEn`, not a second radius loop written here: the hunt sets the
  // radius and the price, the engine decides what twenty metres of En finds.
  const detections = detectWithEn(
    { at: request.origin, nen: { ...engineStateOf(request.caster), en: { radius: EN_RADIUS } } },
    request.bodies.map((body) => ({
      id: body.id,
      at: body.position,
      nen: engineStateOf(body.nen),
    })),
  )

  // The engine returns them nearest first; the sweep reports them in the order
  // the caller listed its bodies, which is the order the debrief reads them in.
  const touched = new Set(detections.map((detection) => detection.id))
  const sweep: EnSweep = { origin: request.origin, found: [], auraRead: [], felt: [] }
  for (const body of request.bodies) {
    if (!touched.has(body.id)) continue
    const rules = rulesOf(body.nen)
    sweep.found.push(body.id)
    if (rules.auraVisible) sweep.auraRead.push(body.id)
    // Feeling the sweep is the same fact as being read by it: a body with no
    // aura out has nothing for the sweep to disturb.
    if (rules.feelsEn) sweep.felt.push(body.id)
  }

  return { pool: spend(pool, EN_COST), sweep }
}
