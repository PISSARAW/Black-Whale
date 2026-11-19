import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'
import { groundVictoryActor } from './actors'
import { localToHead, reachVictoryHand } from './pose'

export const LEORIO_HITS = [114, 150, 186, 222, 258, 294] as const
export const LEORIO_LAUNCH = 348
export const LEORIO_CEILING = 420
export function leorioRoofHeight(context: VictoryContext) {
  return Math.max(4.9, context.hero.height * 2.3, context.victim.height * 2.5)
}
function strikeAmount(age: number) {
  const contacts = [...LEORIO_HITS.map((frame) => frame - 12), LEORIO_LAUNCH - 18]
  return Math.max(...contacts.map((frame) => Math.max(0, 1 - Math.abs(age - frame) / 18)))
}
function floorStrike(context: VictoryContext) {
  const { hero, age } = context
  const power = strikeAmount(age),
    stance = ease((age - 66) / 24) * (1 - ease((age - 356) / 45))
  const fold = stance * (0.25 + power * 1.35)
  for (const side of ['left', 'right']) {
    hero.root.getObjectByName(`hip-${side}`)!.rotation.x = -stance * (0.25 + power * 1.3)
    hero.root.getObjectByName(`knee-${side}`)!.rotation.x = stance * (0.45 + power * 2)
  }
  const chest = hero.root.getObjectByName('fight-chest')
  if (chest) {
    const waist = hero.root.getObjectByName('hip-left')!.position.y + 0.08
    chest.rotation.x = fold
    chest.position.set(0, waist, 0).applyEuler(chest.rotation).multiplyScalar(-1)
    chest.position.y += waist
  }
  hero.head.rotation.x = -fold * 0.3
  groundVictoryActor(hero)
  const shoulder = hero.root.getObjectByName('shoulder-right')!.getWorldPosition(new Vector3())
  const floor = shoulder.clone().add(new Vector3(0, 0, hero.height * 0.16).applyQuaternion(hero.root.quaternion)).setY(0.08)
  const rest = hero.root
    .getObjectByName('shoulder-right')!
    .getWorldPosition(new Vector3())
    .add(new Vector3(0.01, -0.58, 0.02))
  reachVictoryHand(context, { side: 'right', target: rest.lerp(floor, ease(power)) })
  const glasses = ease((age - 496) / 15) * (1 - ease((age - 532) / 20))
  reachVictoryHand(context, {
    side: 'left',
    target: localToHead(
      hero,
      new Vector3(-0.2, -0.8, 0.06).lerp(new Vector3(-0.17, 0.035, 0.2), glasses),
    ),
  })
  const hand = hero.root.getObjectByName('hand-right')!
  return { floor, hand: hand.getWorldPosition(new Vector3()), power }
}
export function leorioVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  hero.root.rotation.y *= 1 - ease((age - 460) / 30)
  const source = floorStrike(context)
  const origin = victim.root.position.clone(),
    height = leorioRoofHeight(context)
  const progress = Math.min(
    1,
    Math.max(0, (age - LEORIO_LAUNCH) / (LEORIO_CEILING - LEORIO_LAUNCH)),
  )
  const lift = 1 - Math.pow(1 - progress, 1.5)
  const bounce = LEORIO_HITS.reduce((sum, frame) => {
    const t = (age - frame) / 24
    return sum + (t >= 0 && t < 1 ? Math.sin(t * Math.PI) * 0.1 : 0)
  }, 0)
  victim.root.position.y += bounce + lift * (height - victim.height + 0.11)
  victim.root.position.x += Math.sin(progress * Math.PI) * 0.18
  victim.root.rotation.z = -bounce * 2.6 + Math.sin(progress * Math.PI) * 0.3
  victim.head.rotation.x = bounce * 2.8 + ease((age - LEORIO_CEILING) / 8) * 0.23
  for (const side of ['left', 'right']) {
    victim.root.getObjectByName(`shoulder-${side}`)!.rotation.z =
      (side === 'right' ? 1 : -1) * lift * 0.35
    victim.root.getObjectByName(`knee-${side}`)!.rotation.x = lift * 0.3
  }
  victim.root.updateWorldMatrix(true, true)
  const target = origin.clone().add(new Vector3(0, victim.height * 0.64, 0.1))
  return {
    ...source,
    origin,
    target,
    height,
    progress,
    head: victim.head.getWorldPosition(new Vector3()),
  }
}
