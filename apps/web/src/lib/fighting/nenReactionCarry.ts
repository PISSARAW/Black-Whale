import { scalePose, type FightPose } from './fightPose'
import { physicalHitPose, type PhysicalHit } from './fightHitResponse'
import { nenImpactBodyPlan, type NenImpactResponse } from './nenImpactResponse'
import type { ArcadeFighter } from './types'

export interface PreviousReaction {
  reacting: boolean
  progress: number
  contact: { physicalHit?: PhysicalHit; nenResponse?: NenImpactResponse; nenCarry?: FightPose }
}
/** Carry the last displayed imbalance across physical/projectile boundaries, without moving the simulated body. */
export function residualNenReaction(
  fighter: ArcadeFighter,
  previous?: PreviousReaction,
): FightPose | undefined {
  if (!previous?.reacting) return
  const contact = previous.contact
  const pose = contact.physicalHit
    ? physicalHitPose(contact.physicalHit, previous.progress)
    : nenImpactBodyPlan(
        fighter,
        { response: contact.nenResponse, progress: previous.progress, carry: contact.nenCarry },
        {},
      )?.pose
  if (!pose) return
  const result = scalePose(pose, 0.55)
  for (const joint of Object.keys(result) as (keyof FightPose)[]) {
    const bound = joint === 'root' ? 0.02 : 0.24
    result[joint] = result[joint]!.map((value) => Math.max(-bound, Math.min(bound, value))) as [
      number,
      number,
      number,
    ]
  }
  return result
}
