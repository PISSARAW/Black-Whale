import { Vector3 } from 'three'
import type { VictoryActor, VictoryContext } from './types'
import { groundVictoryActor } from './actors'
import { localToHead, reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { nativeVictoryFall } from './nativeFall'
import { ease } from './resources'

export const HANZO_CONTACT = 216
export const HANZO_DEATH = 360
export const HANZO_RELEASE = 384
export const HANZO_RETURN = 468

export function hanzoSleepingPose(context: VictoryContext) {
  const { hero, age } = context
  const asleep = ease(age / 48) * (1 - ease((age - HANZO_RETURN) / 48))
  hero.root.rotation.y *= 1 - ease((age - HANZO_RETURN) / 48)
  for (const side of ['left', 'right']) {
    hero.root.getObjectByName(`hip-${side}`)!.rotation.x = -asleep * 1.25
    const knee = hero.root.getObjectByName(`knee-${side}`)!
    knee.rotation.x = asleep * 2.5
    knee.children[1].rotation.x = -asleep * 1.25
    const eye = hero.head.getObjectByName(`face-eye-${side}`)
    if (eye) {
      context.save(eye)
      eye.scale.y *= 1 - asleep * 0.96
    }
  }
  hero.head.rotation.x = asleep * 0.18
  groundVictoryActor(hero)
  for (const side of ['left', 'right'] as const)
    reachVictoryHand(context, {
      side,
      target: localToHead(hero, new Vector3(side === 'right' ? 0.02 : -0.02, -0.53, 0.22)),
    })
  return { asleep, body: hero.root.position.clone() }
}
function crouchDouble(actor: VictoryActor, targetY: number) {
  const shoulder = actor.root.getObjectByName('shoulder-right')!
  let low = 0,
    high = 2.8
  for (let i = 0; i < 9; i++) {
    const bend = (low + high) / 2
    for (const side of ['left', 'right']) {
      actor.root.getObjectByName(`hip-${side}`)!.rotation.x = -bend / 2
      const knee = actor.root.getObjectByName(`knee-${side}`)!
      knee.rotation.x = bend
      knee.children[1].rotation.x = -bend / 2
    }
    groundVictoryActor(actor)
    if (shoulder.getWorldPosition(new Vector3()).y > targetY) low = bend
    else high = bend
  }
}
export function hanzoDoublePose(context: VictoryContext, double: VictoryActor, body: Vector3) {
  const { victim, age } = context
  const faint = ease((age - HANZO_DEATH + 12) / 12)
  if (age < HANZO_RELEASE)
    victim.head.rotation.x = -ease((age - HANZO_CONTACT) / 60) * 0.18 + faint * 0.28
  for (const side of ['left', 'right']) {
    const eye = victim.head.getObjectByName(`face-eye-${side}`)
    if (eye) {
      context.save(eye)
      eye.scale.y *= 1 - faint * 0.96
    }
  }
  victim.root.updateWorldMatrix(true, true)
  const neck = localToHead(victim, new Vector3(0, -0.12, 0.025))
  double.root.position.copy(victim.root.position).add(new Vector3(0.37, 0, -0.13))
  groundVictoryActor(double)
  crouchDouble(double, neck.y - 0.16)
  const shoulder = double.root.getObjectByName('shoulder-right')!.getWorldPosition(new Vector3())
  double.root.position.y += neck.y - 0.16 - shoulder.y
  const destination = double.root.position.clone()
  const travel = ease((age - 96) / 96)
  const returnToBody = ease((age - HANZO_RELEASE) / (HANZO_RETURN - HANZO_RELEASE))
  const emergence = body.clone().add(new Vector3(0, 0.12, 0))
  const position = emergence.clone().lerp(destination, travel).lerp(emergence, returnToBody)
  double.root.position.copy(position)
  double.root.rotation.y = -1.15 + (1 - travel) * 2.3
  double.root.updateWorldMatrix(true, true)
  const grip = ease((age - 192) / 24) * (1 - ease((age - HANZO_DEATH) / 24))
  const right = localToHead(victim, new Vector3(-0.055, -0.13, 0.1))
  const left = localToHead(victim, new Vector3(0.035, -0.09, -0.06))
  const errors = (['right', 'left'] as const).map((side, i) => {
    const hand = double.root.getObjectByName(`hand-${side}`)!
    const target = hand.getWorldPosition(new Vector3()).lerp(i ? left : right, grip)
    return reachCinematicHand(double.root, {
      side,
      target,
      pole: localToHead(victim, new Vector3(i ? 0.24 : -0.2, -0.15, 0.2)),
    })
  })
  if (age < HANZO_RELEASE) {
    for (const side of ['left', 'right'] as const) {
      const hand = victim.root.getObjectByName(`hand-${side}`)!
      reachCinematicHand(victim.root, {
        side,
        target: hand
          .getWorldPosition(new Vector3())
          .lerp(
            neck
              .clone()
              .add(
                new Vector3(
                  side === 'left' ? -0.06 : 0.06,
                  -0.16 + Math.sin(age * 0.2) * 0.008 * (1 - faint),
                  0.1,
                ),
              ),
            grip,
          ),
        pole: localToHead(victim, new Vector3(side === 'left' ? -0.4 : 0.4, -0.4, 0.15)),
      })
    }
  }
  const fall =
    age >= HANZO_RELEASE ? nativeVictoryFall(context, { start: HANZO_RELEASE }) : undefined
  return { neck, right, left, errors, grip, fall, destination, position, travel, returnToBody }
}
