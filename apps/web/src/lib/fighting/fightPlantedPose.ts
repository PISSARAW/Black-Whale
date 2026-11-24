import { plantFeet, type FightRig, type FootPlantAnchor } from './fightRig'
import { supportCycle } from './fightSupportCycle'
import type { BodyPlan, FightPose } from './fightPose'
import type { ArcadeFighter } from './types'

/** Preserve settled contact after the final equipment and joint corrections. */
export function plantBodyFrame(
  rig: FightRig,
  frame: {
    anchor: FootPlantAnchor | null
    pose: FightPose
    plan: BodyPlan
    fighter: ArcadeFighter
    pursuitSupport?: { foot: 0 | 1 | 'both'; weight: number }
  },
): void {
  if (!frame.anchor) return
  const fighter = frame.fighter
  plantFeet(rig, {
    anchor: frame.anchor,
    root: frame.pose.root,
    facing: fighter.facing,
    transfer: Boolean(frame.plan.attackFlow?.transfer),
    // Authored one-leg balances choose their support from the lower sole. A
    // fixed idle support would pin the raised leg when the dance alternates.
    support: frame.plan.supportFoot
      ? footIndex(frame.plan.supportFoot, fighter.facing)
      : fighter.attack || frame.plan.key === 'battle-cantabile-dance'
        ? undefined
        : supportCycle(fighter).support,
    pivot:
      frame.plan.pivotFoot && frame.plan.pivotAngle
        ? {
            index: footIndex(frame.plan.pivotFoot, fighter.facing),
            angle: frame.plan.pivotAngle,
          }
        : undefined,
    anchorLowest:
      fighter.crouching || (!fighter.attack && ['idle', 'guard'].includes(fighter.pose)),
    horizontal: fighter.pose !== 'walk',
    pursuitSupport: frame.pursuitSupport,
  })
}

export function footIndex(foot: 'lead' | 'rear', facing: 1 | -1): number {
  const lead = facing === 1 ? 1 : 0
  return foot === 'lead' ? lead : 1 - lead
}
