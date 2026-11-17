import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { localToHead, reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { nativeVictoryFall } from './nativeFall'
import { visibleVictoryBounds } from './bodyBounds'
import { ease } from './resources'

export const JUDGMENT_IMPLANT = 150
export const JUDGMENT_BREACH = 348

export function kurapikaJudgmentPose(context: VictoryContext) {
  const { hero, victim, age } = context
  hero.root.rotation.y *= 1 - ease((age - 420) / 60)
  const extension = ease((age - 54) / 60) * (1 - ease((age - 180) / 60))
  reachVictoryHand(context, {
    side: 'right',
    target: localToHead(hero, new Vector3(0.15, -0.5 + extension * 0.22, 0.2 + extension * 0.16)),
  })
  reachVictoryHand(context, {
    side: 'left',
    target: localToHead(hero, new Vector3(-0.2, -0.52, 0.08)),
  })
  const hand = hero.root.getObjectByName('hand-right')!
  const origin = hand.localToWorld(new Vector3(-0.027, -0.055, 0))
  let fall
  if (age >= JUDGMENT_BREACH) fall = nativeVictoryFall(context, { start: JUDGMENT_BREACH })
  else {
    const recoil = Math.sin(ease((age - 138) / 36) * Math.PI) * 0.12
    victim.head.rotation.x = -recoil
    victim.root.position.x += recoil * 0.2
    victim.root.updateWorldMatrix(true, true)
    const chest = visibleVictoryBounds(
      victim.root.getObjectByName('torso') ?? victim.head,
    ).getCenter(new Vector3())
    const cover = ease((age - JUDGMENT_IMPLANT) / 30)
    reachCinematicHand(victim.root, {
      side: 'right',
      target: victim.root
        .getObjectByName('hand-right')!
        .getWorldPosition(new Vector3())
        .lerp(chest.clone().add(new Vector3(0, 0.02, 0.18)), cover),
      pole: localToHead(victim, new Vector3(0.4, -0.4, 0.12)),
    })
  }
  const torso = victim.root.getObjectByName('torso') ?? victim.head
  const body = visibleVictoryBounds(torso)
  const heart = body.getCenter(new Vector3())
  heart.y += (body.max.y - body.min.y) * 0.1
  heart.z = body.max.z + 0.012
  return { origin, heart, fall, torso }
}
export type KurapikaJudgmentPose = ReturnType<typeof kurapikaJudgmentPose>
