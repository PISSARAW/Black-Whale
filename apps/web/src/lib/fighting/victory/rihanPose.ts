import { Box3, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { guardHand, lowerGuardForProp } from './personalGuardStaging'
import { localToHead } from './pose'
import { groundVictoryActor } from './actors'
import { ease } from './resources'
import { nativeVictoryFall } from './nativeFall'
import { RIHAN_TIMING } from './rihanPlan'

export function rihanPose(context: VictoryContext) {
  const { hero, victim, age, centre } = context
  const step = ease((age - 216) / 108)
  hero.root.position.x += (centre - 0.35 - hero.root.position.x) * step
  hero.root.position.z = -0.6 * step
  hero.root.rotation.y = Math.atan2(
    victim.root.position.x - hero.root.position.x,
    -hero.root.position.z,
  )
  victim.root.rotation.y = -1.15
  for (const side of ['left', 'right'])
    hero.root.getObjectByName(`hip-${side}`)!.rotation.x =
      Math.sin(age * 0.14) * Math.sin(Math.PI * step) * (side === 'left' ? 0.16 : -0.16)
  groundVictoryActor(hero)
  victim.root.updateWorldMatrix(true, true)
  const target = new Box3()
    .setFromObject(victim.root.getObjectByName('torso')!)
    .getCenter(new Vector3())
  if (hero.height > victim.height + 0.35)
    lowerGuardForProp(hero, hero.height + (target.y - hero.height) * ease((age - 288) / 42))
  hero.head.rotation.x = 0.045
  hero.root.updateWorldMatrix(true, true)
  const preyAnchor = localToHead(victim, new Vector3(0.16, -0.42, 0.28))
  const grip = preyAnchor
    .clone()
    .lerp(localToHead(victim, new Vector3(0.18, -0.3, 0.08)), ease((age - 282) / 36))
  guardHand(victim, 'right', grip)
  guardHand(victim, 'left', localToHead(victim, new Vector3(-0.15, -0.46, 0.23)))
  const palm = localToHead(hero, new Vector3(-0.18, -0.55, 0.26))
  const leftError = guardHand(hero, 'left', palm)
  const shoulder = hero.root.getObjectByName('shoulder-right')!.getWorldPosition(new Vector3())
  const direction = target.clone().sub(shoulder).normalize()
  const aim = shoulder
    .clone()
    .addScaledVector(direction, Math.min(hero.height * 0.23, target.distanceTo(shoulder) - 0.3))
  const right = localToHead(hero, new Vector3(0.18, -0.65, 0.16)).lerp(
    aim,
    ease((age - 330) / 42) * (1 - ease((age - 444) / 36)),
  )
  const recoil =
    age >= RIHAN_TIMING.shot ? Math.max(0, 1 - (age - RIHAN_TIMING.shot) / 10) * 0.035 : 0
  right.addScaledVector(direction, -recoil)
  const rightError = guardHand(hero, 'right', right)
  const hand = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const victimHand = victim.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const shock = ease((age - RIHAN_TIMING.shot) / 5)
  victim.head.rotation.x = -0.2 * shock
  const fall =
    age >= RIHAN_TIMING.fall
      ? nativeVictoryFall(context, { start: RIHAN_TIMING.fall, velocityY: 3, velocityX: 7 })
      : undefined
  return {
    hand,
    palm,
    target,
    preyAnchor,
    victimHand,
    aim,
    fall,
    handErrors: [leftError, rightError],
  }
}
export type RihanPose = ReturnType<typeof rihanPose>
