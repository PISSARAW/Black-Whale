import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { groundVictoryActor } from './actors'
import { localToHead, reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { nativeVictoryFall } from './nativeFall'
import { visibleVictoryBounds } from './bodyBounds'
import { ease } from './resources'

export const BILL_BLOCKS = [30, 78] as const
export const BILL_HITS = [138, 186, 234, 282, 342] as const
export const BILL_IMPACT = 342
export const BILL_FALL = 343
export const BILL_GROWTH = 456
export const BILL_BLOOM = 480
const pulse = (age: number, peak: number, after = 18) =>
  ease((age - peak + 16) / 16) * (1 - ease((age - peak) / after))

export function billFinalePose(context: VictoryContext, anchorsOnly = false) {
  const { hero, victim, age } = context
  hero.root.position.x += ease(age / 24) * Math.max(0, context.gap - 0.7)
  hero.root.rotation.y *= 1 - ease((age - 402) / 42)
  const hit = Math.max(...BILL_HITS.map((peak) => pulse(age, peak)))
  const counter = Math.max(...BILL_HITS.map((peak) => pulse(age, peak, 12)))
  hero.head.rotation.x = counter * 0.08
  const heroChest = hero.root.getObjectByName('fight-chest')
  if (heroChest) heroChest.rotation.x = counter * 0.14
  const victimChest = victim.root.getObjectByName('fight-chest')
  if (victimChest) victimChest.rotation.x = -hit * 0.2
  victim.head.rotation.x = -hit * 0.28
  victim.root.position.x += ease((age - 138) / 204) * 0.12
  victim.root.updateWorldMatrix(true, true)
  const torso = visibleVictoryBounds(victim.root.getObjectByName('torso') ?? victim.head)
  const contact = torso.getCenter(new Vector3())
  contact.x = torso.min.x + 0.025
  contact.y -= 0.04
  if (age >= 310) {
    const jaw = visibleVictoryBounds(victim.head)
    contact.copy(jaw.getCenter(new Vector3()))
    contact.x = jaw.min.x + 0.025
    contact.y -= 0.07
  }
  billCombatStance(context, contact, 1 - ease((age - 354) / 48))
  const guard = contact.clone().add(new Vector3(-0.16, 0.18, 0.13))
  const incoming = billIncoming(context, guard)
  const restraint = ease((age - 90) / 18) * (1 - ease((age - 294) / 24))
  const right = localToHead(hero, new Vector3(0.19, -0.23, 0.28)).lerp(contact, counter)
  const left = localToHead(hero, new Vector3(-0.17, -0.25, 0.3)).lerp(
    incoming.hand,
    Math.max(incoming.block, restraint),
  )
  const glass = localToHead(hero, new Vector3(-0.08, -0.49, 0.35))
  const palms = [
    glass.clone().add(new Vector3(0.1, 0.23, 0)),
    glass.clone().add(new Vector3(-0.07, 0.11, 0)),
  ]
  const signature = ease((age - 420) / 30)
  right.lerp(palms[0], signature)
  left.lerp(palms[1], signature)
  const rightError = reachVictoryHand(context, { side: 'right', target: right })
  const leftError = reachVictoryHand(context, { side: 'left', target: left })
  const fist = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const blockHand = hero.root.getObjectByName('hand-left')!.getWorldPosition(new Vector3())
  const fall =
    age >= BILL_FALL && !anchorsOnly
      ? nativeVictoryFall(context, { start: BILL_FALL, velocityY: 28, velocityX: 42 })
      : undefined
  return {
    glass,
    glassFloor: glass,
    palms,
    hand: fist,
    fist,
    contact,
    rightError,
    leftError,
    blockError: blockHand.distanceTo(incoming.hand),
    fall,
  }
}

function billIncoming(context: VictoryContext, guard: Vector3) {
  const { victim, age } = context
  const block = Math.max(...BILL_BLOCKS.map((peak) => pulse(age, peak)))
  const side = age < 54 ? 'right' : 'left'
  const held = ease((age - 90) / 18) * (1 - ease((age - 294) / 24))
  for (const arm of ['left', 'right'] as const) {
    const target = localToHead(victim, new Vector3(arm === 'left' ? -0.17 : 0.17, -0.25, 0.28))
    if (arm === side) target.lerp(guard, Math.max(block, held))
    reachCinematicHand(victim.root, {
      side: arm,
      target,
      pole: localToHead(victim, new Vector3(arm === 'left' ? -0.5 : 0.5, -0.32, 0.22)),
    })
  }
  return {
    block,
    hand: victim.root.getObjectByName(`hand-${side}`)!.getWorldPosition(new Vector3()),
  }
}
function billKnees(context: VictoryContext, bend: number) {
  for (const side of ['left', 'right']) {
    context.hero.root.getObjectByName(`hip-${side}`)!.rotation.x = -bend / 2
    const knee = context.hero.root.getObjectByName(`knee-${side}`)!
    knee.rotation.x = bend
    knee.children[1].rotation.x = -bend / 2
  }
  groundVictoryActor(context.hero)
}
function billCombatStance(context: VictoryContext, contact: Vector3, progress: number) {
  const { hero } = context
  const shoulder = hero.root.getObjectByName('shoulder-right')!
  const elbow = hero.root.getObjectByName('elbow-right')!
  const hand = hero.root.getObjectByName('hand-right')!
  const origin = shoulder.getWorldPosition(new Vector3())
  const length =
    origin.distanceTo(elbow.getWorldPosition(new Vector3())) +
    elbow.getWorldPosition(new Vector3()).distanceTo(hand.getWorldPosition(new Vector3()))
  const drop = progress * Math.max(0, origin.y - contact.y - length * 0.3)
  let low = 0,
    high = 2.8
  for (let i = 0; i < 9; i++) {
    billKnees(context, (low + high) / 2)
    if (shoulder.getWorldPosition(new Vector3()).y > origin.y - drop) low = (low + high) / 2
    else high = (low + high) / 2
  }
  const lowered = shoulder.getWorldPosition(new Vector3())
  hero.root.position.x += progress * (contact.x - lowered.x - length * 0.79)
  hero.root.position.z += progress * (contact.z - lowered.z - length * 0.12)
  hero.root.updateWorldMatrix(true, true)
}
export type BillFinalePose = ReturnType<typeof billFinalePose>
