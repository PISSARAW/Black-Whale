import type { AttackKind, FightImpact } from './types'

/** Visual weight of an impact. This never changes damage, stun or hitstop. */
export interface ImpactPresentation {
  sparks: number
  sparkSpeed: number
  sparkSize: number
  shakeMs: number
  shakeX: number
  shakeY: number
}

const PROFILES: Record<AttackKind, ImpactPresentation> = {
  light: {
    sparks: 8,
    sparkSpeed: 0.014,
    sparkSize: 0.72,
    shakeMs: 80,
    shakeX: 0.012,
    shakeY: 0.008,
  },
  heavy: {
    sparks: 14,
    sparkSpeed: 0.022,
    sparkSize: 1.05,
    shakeMs: 155,
    shakeX: 0.04,
    shakeY: 0.028,
  },
  special: {
    sparks: 20,
    sparkSpeed: 0.029,
    sparkSize: 1.28,
    shakeMs: 220,
    shakeX: 0.065,
    shakeY: 0.044,
  },
  ranged: {
    sparks: 11,
    sparkSpeed: 0.018,
    sparkSize: 0.9,
    shakeMs: 110,
    shakeX: 0.024,
    shakeY: 0.016,
  },
}

export function impactPresentation(
  impact: Pick<FightImpact, 'kind' | 'blocked' | 'critical' | 'knockdown' | 'wallSplat'>,
): ImpactPresentation {
  const base = PROFILES[impact.kind]
  const force = impact.critical || impact.knockdown || impact.wallSplat ? 1.25 : 1
  const guard = impact.blocked ? 0.72 : 1
  return {
    sparks: Math.round(base.sparks * force),
    sparkSpeed: base.sparkSpeed * force,
    sparkSize: base.sparkSize * guard,
    shakeMs: base.shakeMs * force * guard,
    shakeX: base.shakeX * force * guard,
    shakeY: base.shakeY * force * guard,
  }
}
