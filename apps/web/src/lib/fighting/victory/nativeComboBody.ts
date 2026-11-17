import { humanAnimationRig } from '../../tour/humanAnimation'
import { bodyPlan } from '../fightBodyMotion'
import {
  applyFightPose,
  borrowFightRig,
  captureFootPlant,
  plantFeet,
  resetFightRig,
} from '../fightRig'
import { fightGroundContact } from '../fightGroundContact'
import { poseProgress } from '../sceneMotion'
import type { ArcadeFighter } from '../types'
import type { VictoryActor, VictoryContext } from './types'
import { groundVictoryActor } from './actors'

/** The exact body plan, frame data, root travel, hitstop and reaction used in live combat. */
export function drawNativeVictoryBody(
  context: VictoryContext,
  actor: VictoryActor,
  fighter: ArcadeFighter,
) {
  const human = humanAnimationRig(actor.root.children[0])
  if (!human) throw new Error('Native combos require the native fighting anatomy')
  context.save(human.figure)
  const borrowed = borrowFightRig(human)
  context.defer(borrowed.restore)
  const { rig } = borrowed
  context.save(rig.chest)
  const joints = [
    human.figure,
    human.head,
    ...human.arms,
    ...human.legs,
    ...human.knees,
    ...rig.elbows,
  ]
  ;[...joints, ...rig.wrists, ...rig.ankles].forEach(context.save)
  joints.forEach((node) => node.rotation.set(0, 0, 0))
  human.figure.position.set(0, 0, 0)
  resetFightRig(rig)
  const seconds = context.age / 60
  const plan = bodyPlan(fighter, {
    seconds,
    progress: poseProgress(fighter, { seconds, started: 0 }),
  })
  if (!plan) throw new Error('Native combo has no native body plan')
  const anchor = captureFootPlant(rig)
  applyFightPose(rig, plan.pose, fighter.facing)
  if (plan.plant) plantFeet(rig, { anchor, root: plan.pose.root, facing: fighter.facing })
  if (plan.plant) groundVictoryActor(actor)
  fightGroundContact(fighter)(human)
  return plan
}
