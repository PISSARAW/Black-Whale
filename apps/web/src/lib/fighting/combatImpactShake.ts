import type { ImpactPresentation } from './fightImpactPresentation'
import type { FightImpact, FightState } from './types'

/** A short impulse on the simulation clock; weak contacts cannot restart a stronger shake. */
export function createCombatImpactShake() {
  let key = '',
    frame = 0,
    active = true
  let pulse = { start: -Infinity, duration: 1, rank: 0, x: 0, y: 0, facing: 1 }
  return {
    observe(state: FightState) {
      const identity = `${state.player.id}:${state.opponent.id}:${state.roundNumber}`
      if (identity !== key || state.frame < frame) pulse.start = -Infinity
      key = identity
      frame = state.frame
      active = state.phase === 'fighting'
    },
    hit(impact: FightImpact, options: { profile: ImpactPresentation; facing: number }) {
      if (impact.avoided || impact.invulnerable) return
      const rank = impactRank(impact)
      if (frame - pulse.start < pulse.duration && rank <= pulse.rank) return
      const weight = impact.blocked && !impact.parried ? 0.25 : rank === 1 ? 0.3 : 0.8
      pulse = {
        start: frame,
        rank,
        facing: options.facing,
        duration: Math.max(1, Math.min(10, options.profile.shakeMs * 0.06)),
        x: Math.min(0.065, options.profile.shakeX * weight),
        y: Math.min(0.044, options.profile.shakeY * weight),
      }
    },
    offset() {
      const age = frame - pulse.start
      if (!active || age >= pulse.duration) return { x: 0, y: 0 }
      const fade = (1 - age / pulse.duration) ** 2
      return {
        x: Math.sin(age * 1.7) * pulse.x * fade * pulse.facing,
        y: Math.cos(age * 1.4) * pulse.y * fade,
      }
    },
  }
}

function impactRank(impact: FightImpact): number {
  if (impact.critical || impact.knockdown || impact.wallSplat || impact.parried) return 3
  return impact.kind === 'light' ? 1 : 2
}
