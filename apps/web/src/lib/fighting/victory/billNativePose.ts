import { Vector3 } from 'three'
import { humanAnimationRig } from '../../tour/humanAnimation'
import { bodyPlan } from '../fightBodyMotion'
import {
  applyFightPose,
  borrowFightRig,
  captureFootPlant,
  plantFeet,
  resetFightRig,
} from '../fightRig'
import { fightGroundContact, lowestBodyHeight } from '../fightGroundContact'
import { poseProgress } from '../sceneMotion'
import type { ArcadeFighter } from '../types'
import type { VictoryActor, VictoryContext } from './types'
import { fitBillNativeContact } from './billNativeContact'
import { groundVictoryActor } from './actors'
import { billComboTrack } from './billComboTrack'
import { BILL_IMPACT } from './billFinalePose'

/** The exact body plan, frame data, root travel, hitstop and reaction used in live combat. */
function drawNativeBody(context: VictoryContext, actor: VictoryActor, fighter: ArcadeFighter) {
  const human = humanAnimationRig(actor.root.children[0])
  if (!human) throw new Error('Bill combos require the native fighting anatomy')
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
  if (!plan) throw new Error('Bill combo has no native body plan')
  const anchor = captureFootPlant(rig)
  applyFightPose(rig, plan.pose, fighter.facing)
  if (plan.plant) plantFeet(rig, { anchor, root: plan.pose.root, facing: fighter.facing })
  if (plan.plant) groundVictoryActor(actor)
  fightGroundContact(fighter)(human)
  return plan
}
export function billNativeComboPose(context: VictoryContext) {
  const track = billComboTrack(context.state[context.frame.loser].id)
  const index = Math.min(track.last, Math.round((context.age * track.last) / BILL_IMPACT))
  const state = track.states[index],
    end = track.states[track.last - 1]
  const positions = {
    hero: context.hero.root.position.clone(),
    victim: context.victim.root.position.clone(),
  }
  context.hero.root.position.x += (state.player.x - end.player.x) * 0.12
  context.victim.root.position.x +=
    ((index === track.last ? end.opponent.x : state.opponent.x) - end.opponent.x) * 0.12
  context.hero.root.position.y = state.player.y * 0.12
  context.victim.root.position.y = state.opponent.y * 0.12
  const nativeContext = { ...context, age: state.frame }
  const heroPlan = drawNativeBody(nativeContext, context.hero, state.player)
  drawNativeBody(nativeContext, context.victim, state.opponent)
  const fitted = fitBillNativeContact(context, state.player)
  const hand = context.hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  return {
    ...fitted,
    nativeFloor: lowestBodyHeight(humanAnimationRig(context.victim.root.children[0])!),
    nativeMove: state.player.attack?.moveId ?? null,
    nativeAttackFrame: state.player.attack?.frame ?? null,
    nativeCombo: state.opponent.comboHits,
    nativeIndex: index,
    nativeHitstop: state.hitstop,
    nativePose: heroPlan.pose,
    nativeAnchors: positions,
    hand,
  }
}
