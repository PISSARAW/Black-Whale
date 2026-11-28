import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { crouchToVictoryTarget, localToHead, reachVictoryHand } from './pose'
import { ease } from './resources'
import { poseIllumiVictim } from './illumiVictim'

/** Native local skull coordinates keep each needle attached through kneeling and falling. */
export function illumiNeedleAnchor(context: VictoryContext, index: number) {
  const { victim } = context
  const local =
    index === 0
      ? new Vector3(0, 0.07, -0.15)
      : new Vector3(index === 1 ? -0.055 : 0.055, 0.09, 0.16)
  const point = victim.head.localToWorld(local)
  const outward = new Vector3(
    index === 0 ? 0 : index === 1 ? -0.15 : 0.15,
    0.08,
    index === 0 ? -1 : 1,
  )
  outward.transformDirection(victim.head.matrixWorld)
  return { point, outward, scale: victim.head.getWorldScale(new Vector3()).x }
}
export function illumiVictoryPose(context: VictoryContext) {
  const { age, hero, victim } = context
  const puppet = poseIllumiVictim(context)
  const approach = ease((age - 48) / 72)
  const circle = ease((age - 216) / 54)
  const retreat = ease((age - 312) / 36)
  const victimX = victim.root.position.x
  hero.root.position.x =
    hero.root.position.x * (1 - approach) +
    (victimX - 0.12 - circle * 0.2 - retreat * 0.55) * approach
  hero.root.position.z = approach * (-0.5 + circle * 0.85)
  hero.root.rotation.y = 1.15 * (1 - approach)
  crouchToVictoryTarget(context, approach * (1 - retreat))
  const rear = illumiNeedleAnchor(context, 0)
  const front = illumiNeedleAnchor(context, age < 291 ? 1 : 2)
  const insert = ease((age - 102) / 30) * (1 - ease((age - 144) / 24))
  const finish = ease((age - 258) / 24) * (1 - ease((age - 300) / 24))
  const rest = localToHead(hero, new Vector3(0.22, -0.85, 0.12))
  const hand = rest.clone().lerp(rear.point.clone().addScaledVector(rear.outward, 0.08), insert)
  hand.lerp(front.point.clone().addScaledVector(front.outward, 0.08), finish)
  const rightError = reachNeedleGrip(context, hand, Math.max(insert, finish))
  const leftError = reachVictoryHand(context, {
    side: 'left',
    target: localToHead(hero, new Vector3(-0.22, -0.9, 0.02)),
  })
  hero.root.updateWorldMatrix(true, true)
  const grip = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  return { ...puppet, grip, rightError, leftError, rear, front, insert, finish }
}

function reachNeedleGrip(context: VictoryContext, target: Vector3, insertion: number): number {
  const error = reachVictoryHand(context, { side: 'right', target })
  if (insertion <= 0 || error <= 0.12) return error
  const wrist = context.hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const step = target.clone().sub(wrist)
  step.y = 0
  step.clampLength(0, Math.min(0.22 * insertion, error - 0.12))
  context.hero.root.position.add(step)
  return reachVictoryHand(context, { side: 'right', target })
}

export type IllumiVictoryPose = ReturnType<typeof illumiVictoryPose>
