import { Box3, Vector3 } from 'three'
import type { VictoryActor, VictoryContext } from './types'
import { luiniHandle, luiniLayout, luiniTrack, LUINI_TIMING } from './luiniTrack'
import { localToHead } from './pose'
import { guardHand, lowerGuardForProp } from './personalGuardStaging'
import { groundVictoryActor } from './actors'
import { ease } from './resources'
import { nativeVictoryFall } from './nativeFall'

function arms(actor: VictoryActor) {
  return (['left', 'right'] as const).map((side) =>
    guardHand(actor, side, restingHand(actor, side)),
  )
}

function restingHand(actor: VictoryActor, side: 'left' | 'right'): Vector3 {
  const scale = Math.min(1, actor.height / 1.5)
  const offset = new Vector3(side === 'left' ? -0.15 : 0.15, -0.5, 0.24)
  return localToHead(actor, offset.multiplyScalar(scale))
}
function stride(actor: VictoryActor, age: number, moving: number) {
  for (const [i, side] of ['left', 'right'].entries()) {
    const bend = Math.sin(age * 0.2 + i * Math.PI) * moving * 0.35
    actor.root.getObjectByName(`hip-${side}`)!.rotation.x = bend
    actor.root.getObjectByName(`knee-${side}`)!.rotation.x = Math.max(0, -bend)
  }
  groundVictoryActor(actor)
}
export function luiniPose(context: VictoryContext) {
  const { age, hero, victim } = context
  const layout = luiniLayout(context),
    track = luiniTrack(age, layout)
  hero.root.position.set(track.x, 0, 0)
  hero.root.rotation.y = age >= 120 && age < 234 ? -Math.PI / 2 : Math.PI / 2
  hero.root.rotation.y *= 1 - ease((age - 450) / 36)
  hero.root.visible = !track.hidden
  victim.root.position.set(track.victimX, 0, 0)
  victim.root.rotation.y = track.victimFacing
  const handle = luiniHandle(layout, track.angle)
  const swing = ease((age - 342) / 24) * (1 - ease((age - 366) / 24))
  victim.root.position.x += (handle.x - 0.26 - victim.root.position.x) * swing
  victim.root.position.z = (handle.z - victim.width * 0.25) * swing
  stride(
    hero,
    age,
    Math.sin(Math.PI * ease((age - 72) / 36)) + Math.sin(Math.PI * ease((age - 120) / 66)),
  )
  stride(victim, age, Math.sin(Math.PI * ease((age - 270) / 60)))
  if (victim.height > hero.height * 1.3 && age >= 330) lowerGuardForProp(victim, hero.height * 0.8)
  const bounds = new Box3().setFromObject(victim.root.getObjectByName('torso')!)
  const target = bounds.getCenter(new Vector3())
  target.x = bounds.min.x - 0.015
  if (hero.height > victim.height * 1.15 && age >= 330) lowerGuardForProp(hero, target.y + 0.1)
  const errors = [...arms(hero), ...arms(victim)]
  const opening = ease((age - 318) / 18) * (1 - ease((age - 366) / 18))
  const rest = restingHand(victim, 'right')
  if (age < 408) errors[3] = guardHand(victim, 'right', rest.lerp(handle, opening))
  const shoulder = hero.root.getObjectByName('shoulder-right')!.getWorldPosition(new Vector3())
  const direction = target.clone().sub(shoulder).normalize()
  const stab = ease((age - 372) / 24) * (1 - ease((age - 396) / 30))
  const grip = localToHead(hero, new Vector3(0.16, -0.5, 0.25))
  grip.lerp(localToHead(hero, new Vector3(0.17, -0.18, 0.2)), ease((age - 450) / 36))
  grip.lerp(target.clone().addScaledVector(direction, -0.45), stab)
  errors[1] = guardHand(hero, 'right', grip)
  const hand = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const fall =
    age >= LUINI_TIMING.fall
      ? nativeVictoryFall(context, { start: LUINI_TIMING.fall, velocityY: 12, velocityX: 10 })
      : undefined
  return { layout, track, target, hand, direction, stab, handle, handErrors: errors, fall }
}
export type LuiniPose = ReturnType<typeof luiniPose>
