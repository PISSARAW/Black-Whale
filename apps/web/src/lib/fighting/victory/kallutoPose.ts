import { Quaternion, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { visibleVictoryBounds } from './bodyBounds'
import { localToHead, reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { ease } from './resources'

export const KALLUTO_ATTACH = 84
export const KALLUTO_STORM = 282
export const KALLUTO_SHRED = 318
export const KALLUTO_END = 450
export function kallutoVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  victim.root.traverse((node) => {
    if (!node.name.startsWith('kalluto-paper:')) return
    context.save(node)
    node.visible = false
  })
  hero.root.rotation.y *= 1 - ease((age - 480) / 45)
  hero.root.updateWorldMatrix(true, true)
  const open = ease((age - 162) / 60) * (1 - ease((age - 450) / 48))
  const flick = Math.sin(ease((age - 18) / 36) * Math.PI)
  reachVictoryHand(context, {
    side: 'right',
    target: localToHead(
      hero,
      new Vector3(0.18 + open * 0.2 + flick * 0.12, -0.32 + open * 0.12, 0.3),
    ),
  })
  reachVictoryHand(context, {
    side: 'left',
    target: localToHead(hero, new Vector3(-0.2 - open * 0.23, -0.48 + open * 0.2, 0.19)),
  })
  const fan = hero.root.getObjectByName('kalluto-paper-fan')
  if (fan) {
    context.save(fan)
    fan.visible = true
    fan.scale.x *= 0.15 + open * 0.85
    const orientation = hero.head.getWorldQuaternion(new Quaternion())
    orientation.multiply(
      new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -0.2 + open * 0.35),
    )
    fan.quaternion.copy(
      fan.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(orientation),
    )
  }
  const laugh = ease((age - 96) / 12) * (1 - ease((age - 150) / 18))
  victim.head.rotation.x = -laugh * (0.12 + Math.sin(age * 0.23) * 0.025)
  victim.root.position.y += laugh * Math.sin(age * 0.23) * 0.008
  const panic = ease((age - 282) / 30)
  if (panic > 0) {
    victim.head.rotation.x = panic * 0.1
    victim.root.updateWorldMatrix(true, true)
    for (const [side, sign] of [
      ['left', -1],
      ['right', 1],
    ] as const) {
      const hand = victim.root.getObjectByName(`hand-${side}`)!
      reachCinematicHand(victim.root, {
        side,
        target: hand
          .getWorldPosition(new Vector3())
          .lerp(localToHead(victim, new Vector3(sign * 0.22, -0.16, 0.3)), panic),
        pole: localToHead(victim, new Vector3(sign * 0.42, -0.4, 0.05)),
      })
    }
  }
  victim.root.updateWorldMatrix(true, true)
  const shoulder = victim.root.getObjectByName('torso') ?? victim.head
  const bounds = visibleVictoryBounds(shoulder),
    size = bounds.getSize(new Vector3())
  const mark = bounds.getCenter(new Vector3())
  mark.y = bounds.max.y - size.y * 0.22
  mark.z = bounds.max.z + 0.012
  const origin = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const body = visibleVictoryBounds(victim.root)
  const target = body.getCenter(new Vector3())
  return { mark, origin, target, body, laugh, open }
}
