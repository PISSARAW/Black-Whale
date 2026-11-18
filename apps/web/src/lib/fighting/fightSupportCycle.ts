import { attackData } from './frameData'
import { fightStrikeLimb } from './fightStrikeLimb'
import { rosterMoveShape } from './rosterStrikeMotion'
import type { ArcadeFighter } from './types'

const KICKS = new Set(['kick', 'lowKick', 'sweep', 'spin', 'dive'])

/** Commit the support leg before the drive; a kicking leg can never also be the planted support. */
export function supportCycle(fighter: ArcadeFighter): {
  support: number
  free?: number
  pivot: number
} {
  const lead = fighter.facing === 1 ? 1 : 0
  const attack = fighter.attack
  if (!attack) return { support: lead, pivot: 0 }
  const data = attackData(attack.kind, fighter)
  const progress = Math.min(1, attack.frame / Math.max(1, data.startup))
  if (KICKS.has(rosterMoveShape(attack.moveId) ?? '')) {
    const limb = fightStrikeLimb(fighter, 'feet')
    const free = limb === 'left' ? 0 : lead
    return { support: 1 - free, free, pivot: Math.sin(Math.PI * progress * 0.8) * 0.18 }
  }
  return {
    support: progress < 0.55 ? 1 - lead : lead,
    pivot: Math.sin(Math.PI * progress * 0.85) * 0.1,
  }
}
