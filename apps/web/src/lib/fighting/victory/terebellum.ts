import { Quaternion, Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { terebellumVictoryPose } from './terebellumPose'
import { createTerebellumProps } from './terebellumProps'
import { visibleVictoryBounds } from './bodyBounds'
import { victoryShot } from './camera'

function wide(context: VictoryContext) {
  const { hero, victim } = context
  const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
  victoryShot(context, {
    target:
      context.comfort.camera === 0
        ? new Vector3(context.centre, hero.height * 0.48, 0)
        : bounds.getCenter(new Vector3()),
    offset: new Vector3(0.2, 0.3, 6),
    width: context.gap + hero.width + victim.width + 1.5,
    height: Math.max(hero.height, victim.height) + 0.6,
  })
}
function detail(context: VictoryContext, pose: ReturnType<typeof terebellumVictoryPose>) {
  const { age, hero, victim } = context
  if (age >= 120 && age < 180) {
    victoryShot(context, {
      target: pose.can.clone().add(new Vector3(0, 0.08, 0)),
      offset: new Vector3(0.08, 0.05, 0.65),
      width: 0.42,
      height: 0.46,
    })
    return true
  }
  if (age >= 360 && age < 384) {
    const q = victim.head.getWorldQuaternion(new Quaternion())
    victoryShot(context, {
      target: pose.victimHead,
      offset: new Vector3(0.45, 0.08, 0.9).applyQuaternion(q),
      width: 0.8,
      height: 0.8,
    })
    return true
  }
  if (age >= 438) {
    const q = hero.head.getWorldQuaternion(new Quaternion())
    victoryShot(context, {
      target: hero.head.getWorldPosition(new Vector3()).add(new Vector3(0, -0.15, 0)),
      offset: new Vector3(0, 0.02, 3).applyQuaternion(q),
      width: 1.4,
      height: 1.6,
    })
    return true
  }
  return false
}
function camera(context: VictoryContext, pose: ReturnType<typeof terebellumVictoryPose>) {
  const { age, victim } = context
  if (context.comfort.camera === 0 || (age >= 384 && age < 438)) return wide(context)
  if (detail(context, pose)) return
  const close = age >= 300
  const target = close
    ? victim.head.getWorldPosition(new Vector3()).lerp(pose.heroHead, 0.5)
    : pose.heroHead.clone().lerp(pose.recipient, 0.4)
  victoryShot(context, {
    target,
    offset: new Vector3(0.2, 0.18, 3.5),
    width: close ? context.gap + 1.2 : context.gap + 1.6,
    height: close ? 1.5 : 2.1,
  })
}
export function createTerebellumVictory(): VictoryDriver {
  const props = createTerebellumProps()
  return {
    update(context) {
      const pose = terebellumVictoryPose(context)
      const audit = props.sync(context, pose)
      camera(context, pose)
      context.scene.userData.terebellumVictory = {
        ...audit,
        leftError: pose.leftHand.distanceTo(pose.recipient),
        attackError: pose.attackerTip.distanceTo(pose.heroHead),
        punchError: pose.punchError,
        retrievalError: pose.retrievalError,
        floor: pose.fall?.floor,
        sourceIntact: true,
      }
      context.defer(() => {
        delete context.scene.userData.terebellumVictory
      })
    },
    dispose: props.dispose,
  }
}
