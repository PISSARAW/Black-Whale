import * as THREE from 'three'
import type { VictoryContext } from './types'
import { chainFinger } from '../kurapikaChainAnchors'
import { groundVictoryActor } from './actors'
import { nativeVictoryFall } from './nativeFall'
import { visibleVictoryBounds } from './bodyBounds'
import { ease } from './resources'
import { kurapikaTroupePunch, TROUPE_PUNCHES } from './kurapikaTroupePunch'

export const TROUPE_JAIL_START = 33
export const TROUPE_JAIL_LOCK = 63
export const TROUPE_RELEASE = 368
export const TROUPE_RELEASED = 410
export const TROUPE_BREACH = 300
function hideConstructs(context: VictoryContext) {
  context.hero.root.traverse((node) => {
    if (!node.name.startsWith('signature-chain')) return
    context.save(node)
    node.visible = false
  })
  if (context.age < TROUPE_JAIL_LOCK) return
  context.victim.root.traverse((node) => {
    if (!node.userData.visitModel && !node.name.startsWith('bonolenov-prologue')) return
    context.save(node)
    node.visible = false
  })
}
function victimPose(context: VictoryContext) {
  const { age, victim } = context
  victim.root.rotation.y = -0.35
  if (age >= TROUPE_BREACH)
    return nativeVictoryFall(context, { start: TROUPE_BREACH, velocityY: 32, velocityX: 42 })
  const kneel = ease((age - 63) / 24) * (1 - ease((age - 246) / 36))
  const reaction = TROUPE_PUNCHES.reduce(
    (sum, move) =>
      sum +
      Math.sin(ease((age - move.frame) / 14) * Math.PI) * (1 - ease((age - move.frame - 14) / 14)),
    0,
  )
  victim.head.rotation.z = reaction * 0.15
  victim.head.rotation.x = reaction * 0.12
  const chest = victim.root.getObjectByName('fight-chest')
  if (chest) chest.rotation.z = -reaction * 0.08
  for (const side of ['left', 'right']) {
    victim.root.getObjectByName(`hip-${side}`)!.rotation.x = -kneel * 0.08
    const knee = victim.root.getObjectByName(`knee-${side}`)!
    knee.rotation.x = kneel * 1.65
    knee.children[1].rotation.x = -kneel * 1.65
  }
  groundVictoryActor(victim)
  return undefined
}
export function kurapikaTroupePose(context: VictoryContext) {
  const { hero, victim, age } = context
  hideConstructs(context)
  const jail = ease((age - TROUPE_JAIL_START) / 30) * (1 - ease((age - TROUPE_RELEASE) / 42))
  hero.root.position.x += ease((age - 54) / 30) * Math.max(0, context.gap - 0.82)
  hero.root.rotation.y *= 1 - ease((age - 420) / 36)
  hero.head.rotation.x = 0.07
  const fall = victimPose(context)
  const punch = kurapikaTroupePunch(context)
  const middle = chainFinger(
    {
      THREE,
      scene: context.scene,
      worldX: (x) => x,
      worldY: (y) => y,
      figureOf: (side) => (side === context.frame.winner ? hero.root : victim.root),
    },
    { state: context.state, side: context.frame.winner, stage: 2 },
  )
  const torso = victim.root.getObjectByName('torso') ?? victim.head
  const body = visibleVictoryBounds(torso)
  return { jail, middle, body, torso, fall, ...punch }
}
export type KurapikaTroupePose = ReturnType<typeof kurapikaTroupePose>
