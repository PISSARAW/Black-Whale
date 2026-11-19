import { keepHumanJoint } from '$lib/tour/humanJointLimits'
import { Matrix4, Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { VictoryContext } from './types'
import {
  crouchToVictoryTarget,
  localToHead,
  reachVictoryHand,
  turnVictoryHero,
  victimTorso,
} from './pose'
import { groundVictoryActor } from './actors'
import { ease } from './resources'
import { victoryActorShot, victoryPortrait, victoryShot } from './camera'

/** The striking surface is the anatomical LEFT palm, including when P2 wins. */
function openPalm(hand: Object3D, target: Vector3) {
  hand.updateWorldMatrix(true, false)
  const normal = target.clone().sub(hand.getWorldPosition(new Vector3())).normalize()
  const right = new Vector3(0, 1, 0).cross(normal).normalize()
  const up = normal.clone().cross(right).normalize()
  const world = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, normal))
  hand.quaternion.copy(hand.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(world))
  keepHumanJoint(hand, 'wrist')
  hand.updateWorldMatrix(true, true)
}
function march(context: VictoryContext) {
  const progress = ease((context.age - 190) / 64)
  const step = Math.sin(progress * Math.PI * 2)
  context.hero.root.position.x += Math.max(0, context.gap - 0.65) * progress
  for (const [side, sign] of [
    ['left', 1],
    ['right', -1],
  ] as const) {
    context.hero.root.getObjectByName(`hip-${side}`)!.rotation.x = step * sign * 0.27
    context.hero.root.getObjectByName(`knee-${side}`)!.rotation.x = Math.max(0, -step * sign) * 0.4
  }
  groundVictoryActor(context.hero)
}
function saluteHand(context: VictoryContext, amount: number) {
  const hand = context.hero.root.getObjectByName('hand-right')!
  const local = new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(new Vector3(0, 0, -1), new Vector3(1, 0, 0), new Vector3(0, -1, 0)),
  )
  const world = context.hero.head.getWorldQuaternion(new Quaternion()).multiply(local)
  const orientation = hand.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(world)
  hand.quaternion.slerp(orientation, amount)
  keepHumanJoint(hand, 'wrist')
}
function followPressureImpact(context: VictoryContext) {
  const heads = [context.hero, context.victim].map((actor) =>
    actor.head.getWorldPosition(new Vector3()),
  )
  const points = [context.hero.root.position, context.victim.root.position, ...heads]
  const margin = Math.max(context.hero.width, context.victim.width) * 0.5 + 0.35
  const left = Math.min(...points.map((point) => point.x)) - margin
  const right = Math.max(...points.map((point) => point.x)) + margin
  const height = Math.max(
    context.hero.height,
    context.victim.height,
    ...heads.map((point) => point.y + 0.2),
  )
  victoryShot(context, {
    target: new Vector3((left + right) / 2, height * 0.5, 0),
    offset: new Vector3(0.15, 0.18, 6),
    width: right - left,
    height: height + 0.5,
  })
}
export function benjaminVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const target = victimTorso(context)
  const impact = 270
  march(context)
  crouchToVictoryTarget(context, ease((age - 222) / 40) * (1 - ease((age - 350) / 40)))
  turnVictoryHero(context, 350)
  const thrust = ease((age - 230) / 36),
    release = ease((age - 304) / 55)
  const palm = localToHead(hero, new Vector3(-0.25, -0.4, 0.25))
    .lerp(target.clone().add(new Vector3(-0.12, 0, 0)), thrust)
    .lerp(localToHead(hero, new Vector3(-0.23, -0.8, 0.06)), release)
  reachVictoryHand(context, { side: 'left', target: palm })
  const hand = hero.root.getObjectByName('hand-left')!
  openPalm(hand, target)
  const salute = ease((age - 387) / 40)
  reachVictoryHand(context, {
    side: 'right',
    target: localToHead(
      hero,
      new Vector3(0.2, -0.65, 0.1).lerp(new Vector3(0.235, 0.055, 0.18), salute),
    ),
  })
  saluteHand(context, salute)
  const throwBack = ease((age - impact - 10) / 55)
  victim.root.position.x += throwBack * 1.15
  victim.root.position.y += Math.sin(throwBack * Math.PI) * victim.height * 0.35
  victim.root.rotation.z = -throwBack * 1.25
  victim.head.rotation.x = ease((age - impact) / 10) * 0.15
  victim.root.visible = age < 336
  hero.root.updateWorldMatrix(true, true)
  victim.root.updateWorldMatrix(true, true)
  return { palm: hand.getWorldPosition(new Vector3()), target, salute, impact }
}
export function benjaminVictoryCamera(
  context: VictoryContext,
  pose: ReturnType<typeof benjaminVictoryPose>,
) {
  const { age, hero } = context
  if (age >= 420) {
    victoryPortrait(context)
    return
  }
  if (age < 76) {
    victoryShot(context, {
      target: localToHead(hero, new Vector3(0, -0.36, 0.12)),
      offset: localToHead(hero, new Vector3(0.12, -0.04, 1)).sub(
        hero.head.getWorldPosition(new Vector3()),
      ),
      width: 0.7,
      height: 0.6,
    })
    return
  }
  if (age < 132) {
    victoryPortrait(context)
    return
  }
  if (age < 210) {
    victoryActorShot(context, hero)
    return
  }
  if (age < 266) {
    victoryShot(context, {
      target: pose.palm.clone().lerp(pose.target, 0.5),
      offset: new Vector3(0.2, 0.12, 1.8),
      width: 1.1,
      height: Math.max(0.7, context.victim.height * 0.5),
    })
    return
  }
  followPressureImpact(context)
}
