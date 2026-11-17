import { Mesh, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { visibleVictoryBounds } from './bodyBounds'
import { localToHead, reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { ease } from './resources'

export const SHIZUKU_HIT = 84
export const SHIZUKU_BLOOD = 138
export const SHIZUKU_DEATH = 282
export const SHIZUKU_CLEAN = 342
export const SHIZUKU_CONSUMED = 402
export const SHIZUKU_BUTTON = 444
export const SHIZUKU_RETURN = 474
function shizukuSpeech(context: VictoryContext) {
  const { age, hero } = context
  const speaking = [
    [9, 60],
    [99, 144],
    [300, 402],
    [450, 498],
    [552, 588],
  ].some(([start, end]) => age >= start && age < end)
  const mouth = hero.head.getObjectByName('face-mouth')
  if (!(mouth instanceof Mesh) || !mouth.morphTargetInfluences) return
  const weights = mouth.morphTargetInfluences.slice()
  mouth.morphTargetInfluences[0] = speaking ? 0.2 + Math.abs(Math.sin(age * 0.37)) * 0.45 : 0
  context.defer(() =>
    weights.forEach((weight, i) => {
      mouth.morphTargetInfluences![i] = weight
    }),
  )
}
export function shizukuVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const approach = ease((age - 24) / 48)
  hero.root.position.x += approach * Math.max(0, context.gap - 1.05)
  hero.root.rotation.y *= 1 - ease((age - 486) / 48)
  const drain = ease((age - SHIZUKU_BLOOD) / (SHIZUKU_DEATH - SHIZUKU_BLOOD))
  const fall = ease((age - SHIZUKU_DEATH) / 48)
  victim.root.rotation.y *= 1 - ease((age - SHIZUKU_HIT) / 24) * 0.5
  victim.head.rotation.x = drain * 0.23
  victim.root.updateWorldMatrix(true, true)
  const torso = victim.root.getObjectByName('torso') ?? victim.head
  const chest = visibleVictoryBounds(torso),
    wound = chest.getCenter(new Vector3())
  wound.x = chest.min.x + (chest.max.x - chest.min.x) * 0.23
  wound.y = chest.min.y + (chest.max.y - chest.min.y) * 0.4
  wound.z = chest.max.z + 0.008
  const cover = ease((age - 174) / 30) * (1 - fall)
  for (const side of ['left', 'right'] as const) {
    const hand = victim.root.getObjectByName(`hand-${side}`)!
    reachCinematicHand(victim.root, {
      side,
      target: hand
        .getWorldPosition(new Vector3())
        .lerp(wound.clone().add(new Vector3(side === 'left' ? -0.04 : 0.04, -0.02, 0.04)), cover),
      pole: localToHead(victim, new Vector3(side === 'left' ? -0.45 : 0.45, -0.4, 0.05)),
    })
    const eye = victim.head.getObjectByName(`face-eye-${side}`)
    if (eye) {
      context.save(eye)
      eye.scale.y *= 1 - drain * 0.95
    }
  }
  if (age >= SHIZUKU_DEATH)
    victim.root.traverse((node) => {
      if (node.name !== 'contact-shadow') return
      context.save(node)
      node.visible = false
    })
  victim.root.rotation.z = (-fall * Math.PI) / 2
  victim.root.updateWorldMatrix(true, true)
  victim.root.position.y -= visibleVictoryBounds(victim.root).min.y - 0.025
  victim.root.updateWorldMatrix(true, true)
  const body = visibleVictoryBounds(victim.root)
  const collapse = body.getCenter(new Vector3())
  const windup = Math.sin(ease((age - 12) / 60) * Math.PI)
  const grip = localToHead(
    hero,
    new Vector3(
      0.16,
      -0.55 + windup * 0.28,
      0.32 + Math.sin(ease((age - 66) / 30) * Math.PI) * 0.12,
    ),
  )
  grip.lerp(localToHead(hero, new Vector3(0.25, -0.62, 0.05)), ease((age - 498) / 36))
  const target = age >= SHIZUKU_CLEAN ? collapse : wound
  const pocket = ease((age - 504) / 18) * (1 - ease((age - 522) / 12))
  const adjust = ease((age - 528) / 18) * (1 - ease((age - 576) / 18))
  if (age >= 474)
    reachVictoryHand(context, {
      side: 'left',
      target: localToHead(
        hero,
        new Vector3(
          -0.16 + adjust * 0.14,
          -0.4 - pocket * 0.34 + adjust * 0.4,
          0.23 - adjust * 0.05,
        ),
      ),
    })
  shizukuSpeech(context)
  return { wound, body, collapse, grip, target, drain, fall, adjust }
}
export type ShizukuVictoryPose = ReturnType<typeof shizukuVictoryPose>
