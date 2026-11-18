import { aimCinematicWrist } from './wrist'
import { Quaternion, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'
import { groundVictoryActor } from './actors'
import { crouchToVictoryTarget, fallVictoryVictim, localToHead } from './pose'
import { victoryPortrait, victoryShot } from './camera'
import { guideFutureHand, relaxedFutureHand } from './tserriednichArms'

export const FUTURE_EXECUTION_SHOTS = [364, 438] as const
export function futureVictoryPhase(age: number) {
  if (age < 66) return 'zetsu'
  if (age < 286) return 'vision'
  if (age < 318) return 'open-eyes'
  if (age < 432) return 'divergence'
  if (age < 480) return 'execution'
  return 'verdict'
}
function kneelPrince(context: VictoryContext, kneel: number) {
  for (const side of ['left', 'right']) {
    context.hero.root.getObjectByName(`hip-${side}`)!.rotation.x = -kneel * 0.95
    context.hero.root.getObjectByName(`knee-${side}`)!.rotation.x = kneel * 1.9
  }
  context.hero.head.rotation.x = kneel * 0.2
  groundVictoryActor(context.hero)
}
function approachNape(context: VictoryContext, origin: Vector3) {
  const { victim, age } = context
  const step = ease((age - 72) / 78)
  victim.root.position.x += (origin.x - 0.36 - victim.root.position.x) * step
  victim.root.position.z = -Math.sin(step * Math.PI) * 0.65
  victim.root.rotation.y = -1.15 + step * 2.3
  if (age >= 232 && age < 286) victim.root.rotation.y *= 1 - ease((age - 232) / 16)
  victim.root.updateWorldMatrix(true, true)
  const touch = ease((age - 134) / 20) * (1 - ease((age - 206) / 22))
  const nape = localToHead(context.hero, new Vector3(0, -0.06, -0.09))
  guideFutureHand(victim, 'right', { target: nape, amount: touch })
  const uncover = ease((age - 178) / 28) * (1 - ease((age - 220) / 20))
  guideFutureHand(victim, 'left', {
    target: localToHead(context.hero, new Vector3(-0.05, 0.12, -0.02)),
    amount: uncover,
  })
}
function realCounter(context: VictoryContext, origin: Vector3) {
  const { hero, victim, age } = context
  victim.root.position.set(origin.x - 0.36, victim.root.position.y, -0.04)
  victim.root.rotation.y = 1.15
  const counter = ease((age - 382) / 50)
  hero.root.position.x = origin.x - counter * 0.92
  hero.root.position.z = Math.sin(counter * Math.PI) * 0.65
  hero.root.rotation.y = 1.15
  kneelPrince(context, Math.sin(counter * Math.PI) * 0.75)
  victim.root.updateWorldMatrix(true, true)
  victim.root.position.x += ease((age - 318) / 26) * 0.26
  victim.root.position.z = -0.04
  victim.root.updateWorldMatrix(true, true)
  const shoulder = hero.root.getObjectByName('shoulder-right')!.getWorldPosition(new Vector3())
  const grippedWrist = new Vector3(origin.x + 0.55, shoulder.y - 0.12, -0.05)

  return { counter, grippedWrist }
}
function guideCaptorArms(
  context: VictoryContext,
  points: { origin: Vector3; grippedWrist: Vector3 },
) {
  const { age, hero, victim } = context
  const { origin, grippedWrist } = points
  if (age < 286 || age >= 450) return
  const hand = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  if (age < 382) grippedWrist.copy(hand)
  else grippedWrist.y = origin.y + hero.height * 0.68
  guideFutureHand(victim, 'right', {
    target: grippedWrist,
    amount: ease((age - 318) / 24),
  })
  guideFutureHand(victim, 'left', {
    target: new Vector3(origin.x, origin.y + hero.height * 0.72, -0.08),
    amount: ease((age - 318) / 24) * (1 - ease((age - 382) / 40)),
  })
}
export function tserriednichVictoryPose(context: VictoryContext) {
  const { age, hero, victim } = context
  const origin = hero.root.position.clone(),
    targetOrigin = victim.root.position.clone()
  hero.root.rotation.y = age < 66 ? 0 : 1.15
  let grippedWrist = localToHead(hero, new Vector3(0.19, -0.45, 0.12))
  if (age < 286) {
    kneelPrince(context, ease((age - 154) / 34))
    approachNape(context, origin)
  } else {
    const counter = realCounter(context, origin)
    grippedWrist = counter.grippedWrist
  }
  const aim =
    age < 410
      ? new Vector3(origin.x + 1.1, origin.y + hero.height * 0.7, 0.08)
      : victim.head.getWorldPosition(new Vector3()).add(new Vector3(0, -0.075, 0.01))
  const gunSide = age < 396 ? 'right' : 'left'
  const raise = ease((age - 318) / 25),
    strike = ease((age - 407) / 25)
  if (age >= 410) crouchToVictoryTarget(context, strike * (1 - ease((age - 450) / 28)))
  const lower = 1 - ease((age - 450) / 28)
  guideFutureHand(hero, 'right', {
    target: grippedWrist,
    amount: raise * (1 - ease((age - 396) / 22)),
  })
  const leftTarget = relaxedFutureHand(hero, 'left')
    .lerp(
      localToHead(hero, new Vector3(-0.06, -0.12, -0.09)),
      ease((age - 158) / 25) * (1 - ease((age - 262) / 24)),
    )
    .lerp(grippedWrist, ease((age - 370) / 22) * (1 - strike))
    .lerp(aim.clone().add(new Vector3(-0.2, -0.05, 0.03)), strike * lower)
  guideFutureHand(hero, 'left', { target: leftTarget, amount: lower })
  guideCaptorArms(context, { origin, grippedWrist })
  const wrist = hero.root.getObjectByName(`hand-${gunSide}`)!
  if (age < 318 || age >= 450)
    aim.copy(wrist.getWorldPosition(new Vector3())).add(new Vector3(0, -1, 0.1))
  const direction = aim.clone().sub(wrist.getWorldPosition(new Vector3())).normalize()
  const world = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction)
  aimCinematicWrist(
    wrist,
    world.multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2)),
  )
  if (age >= 450) {
    fallVictoryVictim(context, { start: 450, duration: 30 })
    victim.root.rotation.z *= -1
  }
  hero.root.rotation.y *= 1 - ease((age - 476) / 20)
  hero.root.visible = true
  victim.root.visible = true
  hero.root.updateWorldMatrix(true, true)
  victim.root.updateWorldMatrix(true, true)
  return {
    origin,
    targetOrigin,
    aim,
    wrist,
    direction,
    gunSide,
    grippedWrist,
    phase: futureVictoryPhase(age),
  }
}
function referenceWide(context: VictoryContext) {
  const points = [context.hero, context.victim].flatMap((actor) => [
    actor.root.position,
    actor.head.getWorldPosition(new Vector3()),
  ])
  const margin = Math.max(context.hero.width, context.victim.width) * 0.5 + 0.5
  const left = Math.min(...points.map((point) => point.x)) - margin
  const right = Math.max(...points.map((point) => point.x)) + margin
  const height = Math.max(context.hero.height, context.victim.height)
  victoryShot(context, {
    target: new Vector3(
      (left + right) / 2 + (context.age >= 318 && context.age < 410 ? 0.25 : 0),
      height * 0.5,
      0,
    ),
    offset: new Vector3(0.1, 0.45, 5.2),
    width: Math.max(2.6, right - left),
    height: height + 0.35,
  })
}
export function tserriednichVictoryCamera(context: VictoryContext) {
  const { age } = context
  if (age < 66 || (age >= 286 && age < 318) || age >= 480) {
    victoryPortrait(context)
    return
  }
  if (age >= 232 && age < 286) {
    victoryPortrait(context, context.victim)
    return
  }
  if (age >= 350 && age < 382) {
    const hand = context.hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
    victoryShot(context, {
      target: hand,
      offset: new Vector3(0.1, 0.25, 2.8),
      width: 1.5,
      height: 1.45,
    })
    return
  }
  referenceWide(context)
}
