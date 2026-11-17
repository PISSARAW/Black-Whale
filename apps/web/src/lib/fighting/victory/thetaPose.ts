import { Vector3 } from 'three'
import type { VictoryActor, VictoryContext } from './types'
import { groundVictoryActor } from './actors'
import { guardHand, lowerGuardForProp } from './personalGuardStaging'
import { localToHead } from './pose'
import { ease } from './resources'
import { nativeVictoryFall } from './nativeFall'

export const THETA_TIMING = { magazine: 84, parry: 180, stock: 252, shot: 372, fall: 408 }

function bend(actor: VictoryActor, amount: number) {
  for (const side of ['left', 'right']) {
    actor.root.getObjectByName(`hip-${side}`)!.rotation.x = -amount * 0.5
    actor.root.getObjectByName(`knee-${side}`)!.rotation.x = amount
    actor.root.getObjectByName(`knee-${side}`)!.children[1].rotation.x = -amount * 0.5
  }
  groundVictoryActor(actor)
}
function stageTheta(context: VictoryContext) {
  const { hero, victim, age, centre } = context
  const rush = ease((age - 108) / 66),
    dodge = ease((age - 132) / 48)
  victim.root.position.x += (centre + 0.2 - victim.root.position.x) * rush
  const compact = victim.height < hero.height * 0.75
  hero.root.position.x +=
    (centre - (compact ? 0.28 : 0.38) - hero.root.position.x) * ease((age - 150) / 84)
  hero.root.position.z = (compact ? 0.4 : 0.48) * dodge
  const walk = Math.sin((age - 108) * 0.13) * Math.sin(Math.PI * rush) * 0.28
  hero.root.rotation.y = Math.atan2(
    victim.root.position.x - hero.root.position.x,
    -hero.root.position.z,
  )
  victim.root.rotation.y = Math.atan2(
    hero.root.position.x - victim.root.position.x,
    hero.root.position.z,
  )
  const kneel = ease((age - 216) / 72)
  bend(victim, Math.min(2.35, 1.1 + Math.max(0, victim.height - hero.height) * 0.8) * kneel)
  for (const side of ['left', 'right']) {
    const sign = side === 'left' ? 1 : -1
    victim.root.getObjectByName(`hip-${side}`)!.rotation.x += walk * sign * (1 - kneel)
    hero.root.getObjectByName(`hip-${side}`)!.rotation.z = sign * 0.14 * Math.sin(Math.PI * dodge)
  }
  groundVictoryActor(victim)
  groundVictoryActor(hero)
  const head = victim.head.getWorldPosition(new Vector3())
  if (hero.height > victim.height + 0.25)
    lowerGuardForProp(hero, hero.height + (head.y - hero.height) * ease((age - 168) / 48))
  hero.head.rotation.x = 0.03 + 0.1 * ease((age - 510) / 36)
  victim.head.rotation.z = 0.1 * (1 - rush) - 0.18 * ease((age - 252) / 18)
  hero.root.updateWorldMatrix(true, true)
  victim.root.updateWorldMatrix(true, true)
}
export function thetaVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  hero.root.rotation.y = Math.PI / 2
  hero.root.updateWorldMatrix(true, true)
  const magazineOrigin = localToHead(hero, new Vector3(0.16, -0.69, 0.24))
  stageTheta(context)
  const target = victim.head.getWorldPosition(new Vector3()).add(new Vector3(0, -0.13, 0))
  const rest = localToHead(hero, new Vector3(0.16, -0.5, 0.24))
  const shoulder = hero.root.getObjectByName('shoulder-right')!.getWorldPosition(new Vector3())
  const direction = target.clone().sub(shoulder).normalize()
  const aim = shoulder
    .clone()
    .addScaledVector(direction, Math.min(hero.height * 0.24, target.distanceTo(shoulder) - 0.34))
  const stock = ease((age - 228) / 24) * (1 - ease((age - 252) / 24))
  const firing = ease((age - 288) / 54) * (1 - ease((age - 444) / 42))
  const right = rest.clone().lerp(aim, firing)
  const contact = target.clone().add(new Vector3(-0.06, 0.06, 0.02))
  right.lerp(contact, stock)
  right.addScaledVector(
    direction,
    -0.045 * Math.max(0, 1 - (age - THETA_TIMING.shot) / 12) * Number(age >= THETA_TIMING.shot),
  )
  const rightError = guardHand(hero, 'right', right)
  const hand = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const left = localToHead(hero, new Vector3(-0.2, -0.55, 0.25))
  const magazineGrip = hand.clone().add(new Vector3(0, -0.09 - ease(age / 54) * 0.1, 0))
  left.lerp(magazineGrip, 1 - ease((age - 84) / 24))
  left.lerp(hand.clone().add(new Vector3(-0.02, -0.04, -0.03)), firing)
  const leftError = guardHand(hero, 'left', left)
  const incoming = localToHead(victim, new Vector3(0.18, -0.4, 0.25))
  const attack = ease((age - 126) / 42) * (1 - ease((age - 180) / 42))
  const dodgeTarget = localToHead(hero, new Vector3(0.1, -0.2, -0.38))
  guardHand(victim, 'right', incoming.lerp(dodgeTarget, attack))
  guardHand(victim, 'left', localToHead(victim, new Vector3(-0.15, -0.45, 0.2)))
  victim.head.rotation.x = -0.22 * ease((age - THETA_TIMING.shot) / 6)
  const fall =
    age >= THETA_TIMING.fall
      ? nativeVictoryFall(context, {
          start: THETA_TIMING.fall,
          velocityY: 2.5,
          velocityX: 7,
        })
      : undefined
  return {
    hand,
    target,
    left,
    direction,
    magazineGrip,
    magazineOrigin,
    emission: aim,
    stock,
    firing,
    fall,
    handErrors: [rightError, leftError],
  }
}
export type ThetaVictoryPose = ReturnType<typeof thetaVictoryPose>
