import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { groundVictoryActor } from './actors'
import { visibleVictoryBounds } from './bodyBounds'
import { localToHead } from './pose'
import { reachCinematicHand } from './arm'
import { ease } from './resources'

export const ILLUMI_IMPLANT = 132
export const ILLUMI_NEEDLES = [282, 300] as const
export const ILLUMI_DEATH = 348
export const ILLUMI_RISE = 420
export function poseIllumiVictim(context: VictoryContext) {
  const { age, victim } = context
  victim.root.traverse((node) => {
    if (node.name !== 'illumi-physical-needle') return
    context.save(node)
    node.visible = false
  })
  const caught = ease((age - ILLUMI_IMPLANT) / 24)
  const kneel = ease((age - 216) / 48)
  const fall = ease((age - ILLUMI_DEATH) / 36) * (1 - ease((age - ILLUMI_RISE) / 48))
  const bow = ease((age - 468) / 42)
  const run = ease((age - 54) / 54) * (1 - caught)
  victim.root.position.x += ease((age - 54) / 54) * 0.5
  victim.root.rotation.y = (Math.PI / 2) * (1 - caught)
  victim.root.rotation.z = -fall * 1.42
  victim.head.rotation.x = caught * 0.1 + kneel * 0.15 + fall * 0.12 + bow * 0.4
  const chest = victim.root.getObjectByName('fight-chest')
  if (chest) chest.rotation.x = bow * 0.72
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    const stride = Math.sin(age * 0.3) * run
    victim.root.getObjectByName(`hip-${side}`)!.rotation.x = stride * sign * 0.45 - kneel * 0.08
    victim.root.getObjectByName(`knee-${side}`)!.rotation.x =
      Math.max(0, -stride * sign) * 0.7 + kneel * 1.65
    const ankle = victim.root.getObjectByName(`knee-${side}`)!.children[1]
    ankle.rotation.x = -kneel * 1.65
    victim.root.getObjectByName(`shoulder-${side}`)!.rotation.x = -stride * sign * 0.4
  }
  groundVictoryActor(victim)
  const command = Math.sin(ease((age - 156) / 60) * Math.PI) * caught
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    const hand = victim.root.getObjectByName(`hand-${side}`)!
    reachCinematicHand(victim.root, {
      side,
      target: hand
        .getWorldPosition(new Vector3())
        .lerp(localToHead(victim, new Vector3(sign * 0.32, -0.2, 0.28)), command),
      pole: localToHead(victim, new Vector3(sign * 0.5, -0.4, 0.15)),
    })
    const eye = victim.head.getObjectByName(`face-eye-${side}`)
    if (eye) {
      context.save(eye)
      eye.scale.y *= 1 - ease((age - 330) / 18) * (1 - ease((age - 444) / 18)) * 0.94
    }
  }
  if (age >= ILLUMI_DEATH) {
    victim.root.traverse((node) => {
      if (node.name !== 'contact-shadow') return
      context.save(node)
      node.visible = false
    })
    victim.root.updateWorldMatrix(true, true)
    victim.root.position.y -= visibleVictoryBounds(victim.root).min.y - 0.024
  }
  victim.root.updateWorldMatrix(true, true)
  return { caught, kneel, fall, bow, dead: age >= ILLUMI_DEATH }
}
