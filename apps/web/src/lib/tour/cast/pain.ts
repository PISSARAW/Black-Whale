import type { TourCastResult } from './types'
import type { TourBody } from './worldPieces'
import { RESTING_BODY } from './worldPieces'
import type { TourWorld } from './world'

export type TourInjurySeverity = 'light' | 'medium' | 'severe'

export const MAX_TOUR_INJURY = 6

export const TOUR_INJURY_DAMAGE: Record<TourInjurySeverity, number> = {
  light: 1,
  medium: 2,
  severe: 3,
}

/** A hurt body walks more slowly, without ever making the tour impassable. */
export const injuryPace = (body: TourBody): number => Math.max(0.55, 1 - body.injuries * 0.08)

/** The ordinary walk pace, including aura, transport and physical injuries. */
export function paceOf(body: TourBody): number {
  const committed = 1 + body.enhance * 0.35
  const carried = body.riding ? 1.6 + body.passengers.length * 0.35 : 1
  return committed * carried * injuryPace(body)
}

/**
 * A physical injury, separate from Nen. Before the armour it becomes pain that
 * can be committed once; while the armour is worn, the new blow joins it.
 */
export function selfInflictTourInjury(
  world: TourWorld,
  severity: TourInjurySeverity,
): TourCastResult {
  const requested = TOUR_INJURY_DAMAGE[severity]
  const damage = Math.min(requested, MAX_TOUR_INJURY - world.body.injuries)
  const packed = world.body.packed === null ? null : world.body.packed + damage
  const availablePain =
    world.body.packed === null ? world.body.availablePain + damage : world.body.availablePain
  const body = {
    ...world.body,
    injuries: world.body.injuries + damage,
    availablePain,
    packed,
  }
  return {
    world: { ...world, body },
    report: {
      kind: 'self-injured',
      severity,
      damage,
      total: body.injuries,
      packed: packed !== null,
    },
  }
}

/** Zetsu removes aura state, but cannot undo an injury already in the body. */
export const bodyAfterAuraEnds = (body: TourBody): TourBody => ({
  ...RESTING_BODY,
  injuries: body.injuries,
  availablePain: body.availablePain,
})
