import { attackPhase, isAntiAir } from './frameData'
import { sleepingBody } from './hanzoProjection'
import { followUpLaunchVelocity } from './moveFollowUpPhysics'
import type { ArcadeFighter } from './types'

/** Extracted from combatImpact.ts (CLAUDE.md § 3): unchanged predicates of a strike's resolution. */
export function launchesTarget(attacker: ArcadeFighter, defender: ArcadeFighter): boolean {
  return (
    Boolean(followUpLaunchVelocity(attacker)) ||
    (isAntiAir(attacker) && sleepingBody(defender).y > 0)
  )
}

export function attackCanResolve(
  fighter: ArcadeFighter,
): fighter is ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> } {
  return Boolean(fighter.attack && !fighter.attack.impacted && attackPhase(fighter) === 'active')
}
