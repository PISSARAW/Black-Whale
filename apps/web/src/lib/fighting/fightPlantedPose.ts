import { plantFeet, type FightRig, type FootPlantAnchor } from './fightRig'
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
  },
): void {
  if (!frame.anchor) return
  const fighter = frame.fighter
  plantFeet(rig, {
    anchor: frame.anchor,
    root: frame.pose.root,
    facing: fighter.facing,
    transfer: Boolean(frame.plan.attackFlow?.transfer),
  })
}
