import { Quaternion, Raycaster, Vector3 } from 'three'
import type { VictoryContext } from './types'
import type { FurykovCounterPlan } from './furykovCounterPlan'
import { FURYKOV_COUNTER_HITS, FURYKOV_COUNTER_PARRY } from './furykovCounterPlan'
import { visibleVictoryBounds } from './bodyBounds'
import { guardHand, guardIncoming, lowerGuardForProp } from './personalGuardStaging'
import { localToHead } from './pose'
import { nativeVictoryFall } from './nativeFall'
import { ease } from './resources'

const pulse = (age: number, peak: number) =>
  ease((age - peak + 24) / 24) * (1 - ease((age - peak) / 24))

function contact(context: VictoryContext) {
  const trunk = context.victim.root.getObjectByName('torso')!
  const box = visibleVictoryBounds(trunk),
    p = box.getCenter(new Vector3())
  const ray = new Raycaster(new Vector3(box.min.x - 1, p.y, p.z), new Vector3(1, 0, 0))
  return ray.intersectObject(trunk, true)[0]?.point.clone() ?? p
}
function stance(context: VictoryContext, target: Vector3, length: number) {
  const { hero } = context
  lowerGuardForProp(hero, target.y)
  const at = (name: string) => hero.root.getObjectByName(name)!.getWorldPosition(new Vector3())
  const shoulder = at('shoulder-right'),
    elbow = at('elbow-right'),
    hand = at('hand-right')
  const arm = shoulder.distanceTo(elbow) + elbow.distanceTo(hand)
  hero.root.position.x += target.x - length - arm * 0.5 - shoulder.x
  hero.root.position.z += target.z - shoulder.z - arm * 0.12
  hero.root.updateWorldMatrix(true, true)
}
export function furykovCounterPose(context: VictoryContext, plan: FurykovCounterPlan) {
  const { hero, victim, age } = context
  const strike = Math.max(...FURYKOV_COUNTER_HITS.map((peak) => pulse(age, peak)))
  if (age < 415) {
    const chest = victim.root.getObjectByName('fight-chest') ?? victim.root.getObjectByName('torso')!
    context.save(chest)
    chest.rotation.x = -strike * 0.12
    victim.head.rotation.x = -strike * 0.25
  }
  const target = contact(context)
  hero.root.rotation.y *= 1 - ease((age - 450) / 54)
  stance(context, target, plan.length)
  const direction = new Vector3(
    Math.sin(0.32 + strike * (Math.PI / 2 - 0.32)),
    Math.cos(0.32 + strike * (Math.PI / 2 - 0.32)),
    0,
  )
  const ready = localToHead(hero, new Vector3(0.16, -0.42, 0.32))
  const desired = target.clone().addScaledVector(direction, -plan.length)
  const grip = ready.clone().lerp(desired, strike)
  const stored = localToHead(hero, new Vector3(0.2, -0.58, -0.02))
  const draw = ease((age - 126) / 54)
  const handle = stored.clone().lerp(grip, draw)
  const handErrors: number[] = []
  if (age >= 114) handErrors.push(guardHand(hero, 'right', handle))
  const parry = pulse(age, FURYKOV_COUNTER_PARRY)
  const orientation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction)
  const tip = handle.clone().addScaledVector(direction, plan.length)
  if (age >= 180 && age < 252)
    guardIncoming(context, tip.clone().add(new Vector3(-0.04, -0.12, 0)), 192)
  if (age >= 144) guardHand(hero, 'left', localToHead(hero, new Vector3(-0.17, -0.28, 0.3)))
  const actualHand = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const weaponPosition = age >= 114 ? actualHand : stored
  const weaponTip = weaponPosition.clone().addScaledVector(direction, plan.length)
  const fall = age >= 415 ? nativeVictoryFall(context, { start: 415 }) : undefined
  hero.root.updateWorldMatrix(true, true)
  victim.root.updateWorldMatrix(true, true)
  return {
    target,
    direction,
    orientation,
    weaponPosition,
    weaponTip,
    draw,
    strike,
    parry,
    contactError: weaponTip.distanceTo(target),
    handErrors,
    fall,
    hits: FURYKOV_COUNTER_HITS.filter((peak) => age >= peak).length,
  }
}
