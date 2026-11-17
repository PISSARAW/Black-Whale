import { Raycaster, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { reachCinematicHand } from './arm'
import { localToHead } from './pose'
import { nativeVictoryFall } from './nativeFall'
import { visibleVictoryBounds } from './bodyBounds'
import { groundVictoryActor } from './actors'
import { ease } from './resources'

export const SAIYU_CONTACTS = [90, 162, 234] as const
export const SAIYU_IMPACT = 360

function victimReaction(context: VictoryContext) {
  const { victim, age } = context
  if (age >= SAIYU_IMPACT)
    return nativeVictoryFall(context, { start: SAIYU_IMPACT, velocityY: 24, velocityX: 44 })
  const panic = ease((age - 90) / 12) * (1 - ease((age - 300) / 36))
  victim.head.rotation.y = Math.sin(age * 0.12) * panic * 0.16
  victim.head.rotation.z = Math.sin(age * 0.09) * panic * 0.08
  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1
    const rest = localToHead(victim, new Vector3(sign * 0.24, -0.5, 0.18))
    const destination = victim.head.localToWorld(
      age < 138
        ? new Vector3(sign * 0.055, 0.015, 0.19)
        : age < 162
          ? new Vector3(sign * 0.2, -0.1, 0.32)
          : age < 234
            ? new Vector3(sign * 0.145, -0.015, 0.15)
            : new Vector3(sign * 0.09, side === 'left' ? -0.19 : -0.36, 0.22),
    )
    reachCinematicHand(victim.root, {
      side,
      target: rest.lerp(destination, panic),
      pole: localToHead(victim, new Vector3(sign * 0.45, -0.3, 0.28)),
    })
  }
  return undefined
}
export function saiyuVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  hero.root.rotation.y *= 1 - ease((age - 438) / 42)
  const brace = ease((age - 282) / 42) * (1 - ease((age - 396) / 42))
  for (const side of ['left', 'right']) {
    hero.root.getObjectByName(`hip-${side}`)!.rotation.x = -brace * 0.26
    hero.root.getObjectByName(`knee-${side}`)!.rotation.x = brace * 0.52
    hero.root.getObjectByName(`knee-${side}`)!.children[1].rotation.x = -brace * 0.26
  }
  groundVictoryActor(hero)
  const fall = victimReaction(context)
  const body = victim.root.getObjectByName('torso') ?? victim.head
  const contact = visibleVictoryBounds(body).getCenter(new Vector3())
  const origin = hero.head.getWorldPosition(new Vector3()).add(new Vector3(0.18, -0.48, 0.33))
  const surface = new Raycaster(origin, contact.clone().sub(origin).normalize()).intersectObject(
    body,
    true,
  )[0]
  if (surface) contact.copy(surface.point)
  const targets = [
    victim.head.localToWorld(new Vector3(0, 0.015, 0.13)),
    victim.head.localToWorld(new Vector3(0.13, 0, 0.035)),
    victim.head.localToWorld(new Vector3(0, -0.07, 0.13)),
  ]
  return { contact, targets, fall, brace }
}
export type SaiyuVictoryPose = ReturnType<typeof saiyuVictoryPose>
