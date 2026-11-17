import { Box3, Quaternion, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { localToHead, reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { nativeVictoryFall } from './nativeFall'
import { ease } from './resources'

export const HINRIGH_LOCKS = [174, 222] as const
export const HINRIGH_SHOT = 360
export const HINRIGH_FALL = 372

export function hinrighVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const origin = localToHead(hero, new Vector3(0.08, -0.56, 0.42))
  hero.root.rotation.y *= 1 - ease((age - 432) / 48)
  hero.head.rotation.x = 0.14 * (1 - ease((age - 84) / 36))
  hero.root.updateWorldMatrix(true, true)
  const left = localToHead(hero, new Vector3(-0.14, -0.68, 0.28))
  const touch = origin.clone().add(new Vector3(age < 42 ? -0.24 : age < 66 ? 0 : 0.25, 0.1, 0))
  const rest = localToHead(hero, new Vector3(0.22, -0.7, 0.15))
  const right = rest.clone().lerp(touch, ease(age / 18) * (1 - ease((age - 84) / 24)))
  const leftError = reachVictoryHand(context, { side: 'left', target: left })
  const bind = ease((age - 132) / 42)
  const scale = victim.height / 2
  victim.head.rotation.x = -0.12 * bind
  const fall =
    age >= HINRIGH_FALL
      ? nativeVictoryFall(context, { start: HINRIGH_FALL, velocityY: 5, velocityX: 12 })
      : undefined
  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1
    const target = localToHead(victim, new Vector3(sign * 0.21, -0.35, 0.28).multiplyScalar(scale))
    target.lerp(
      localToHead(victim, new Vector3(sign * 0.095, -0.66, 0.29).multiplyScalar(scale)),
      bind,
    )
    reachCinematicHand(victim.root, {
      side,
      target,
      pole: localToHead(victim, new Vector3(sign * 0.52, -0.48, 0.25).multiplyScalar(scale)),
    })
  }
  const wrists = ['left', 'right'].map((side) =>
    victim.root.getObjectByName(`hand-${side}`)!.getWorldPosition(new Vector3()),
  )
  const ankles = ['left', 'right'].map((side) => {
    const foot = victim.root.getObjectByName(`knee-${side}`)!.children[1]
    return new Box3()
      .setFromObject(foot)
      .getCenter(new Vector3())
      .add(new Vector3(0, 0.065, 0))
  })
  const torso = new Box3().setFromObject(victim.root.getObjectByName('torso')!)
  const target = torso.getCenter(new Vector3())
  target.z = torso.max.z - 0.015
  const palm = hero.root.getObjectByName('hand-left')!.getWorldPosition(new Vector3())
  const cat = origin
    .clone()
    .add(new Vector3(-0.24, 0.07, 0))
    .lerp(palm.clone().add(new Vector3(0, 0.035, 0)), ease((age - 432) / 42))
  const pet = cat.clone().add(new Vector3(0, 0.29, 0.14))
  const rightError = reachVictoryHand(context, {
    side: 'right',
    target: right,
    pole: localToHead(hero, new Vector3(0.45, -0.6, 0.22)),
  })
  return {
    origin,
    touch,
    target,
    wrists,
    ankles,
    cat,
    pet,
    palm,
    fall,
    hand: hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3()),
    grips: [leftError, rightError],
    catFacing: new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -0.35),
  }
}
export type HinrighVictoryPose = ReturnType<typeof hinrighVictoryPose>
