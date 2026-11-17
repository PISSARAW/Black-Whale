import { Quaternion, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { localToHead, reachVictoryHand } from './pose'
import { groundVictoryActor } from './actors'
import { visibleVictoryBounds } from './bodyBounds'
import { ease } from './resources'

export const TROUPE_PUNCHES = [
  { frame: 84, side: 'left', zone: 'torso' },
  { frame: 114, side: 'right', zone: 'head' },
  { frame: 144, side: 'left', zone: 'torso' },
  { frame: 174, side: 'right', zone: 'head' },
  { frame: 204, side: 'left', zone: 'torso' },
  { frame: 234, side: 'right', zone: 'head' },
  { frame: 300, side: 'left', zone: 'torso' },
] as const
function crouch(context: VictoryContext, drop: number) {
  if (drop <= 0) return
  const shoulder = context.hero.root.getObjectByName('shoulder-right')!
  const goal = shoulder.getWorldPosition(new Vector3()).y - drop
  let low = 0,
    high = 2.6
  for (let i = 0; i < 9; i++) {
    const angle = (low + high) * 0.5
    for (const side of ['left', 'right']) {
      context.hero.root.getObjectByName(`hip-${side}`)!.rotation.x = -angle * 0.5
      context.hero.root.getObjectByName(`knee-${side}`)!.rotation.x = angle
      context.hero.root.getObjectByName(`knee-${side}`)!.children[1].rotation.x = -angle * 0.5
    }
    groundVictoryActor(context.hero)
    if (shoulder.getWorldPosition(new Vector3()).y > goal) low = angle
    else high = angle
  }
}
function contactPoint(context: VictoryContext, zone: 'head' | 'torso') {
  const node = zone === 'head' ? context.victim.head : context.victim.root.getObjectByName('torso')!
  const box = visibleVictoryBounds(node)
  const point = box.getCenter(new Vector3())
  if (zone === 'head') {
    const eye = context.victim.head.getObjectByName('face-eye-left')
    if (eye) point.y = eye.getWorldPosition(new Vector3()).y - 0.04
  }
  point.x = box.min.x + 0.035
  point.z = box.max.z - 0.02
  return point
}
export function kurapikaTroupePunch(context: VictoryContext) {
  const { age, hero } = context
  const punch = TROUPE_PUNCHES.find((move) => age < move.frame + 20) ?? TROUPE_PUNCHES[6]
  const extension = ease((age - punch.frame + 4) / 4) * (1 - ease((age - punch.frame) / 12))
  const wind = ease((age - punch.frame + 20) / 16) * (1 - ease((age - punch.frame) / 20))
  const contact = contactPoint(context, punch.zone)
  hero.root.updateWorldMatrix(true, true)
  const shoulder = hero.root.getObjectByName(`shoulder-${punch.side}`)!,
    elbow = hero.root.getObjectByName(`elbow-${punch.side}`)!,
    hand = hero.root.getObjectByName(`hand-${punch.side}`)!
  const length =
    shoulder.getWorldPosition(new Vector3()).distanceTo(elbow.getWorldPosition(new Vector3())) +
    elbow.getWorldPosition(new Vector3()).distanceTo(hand.getWorldPosition(new Vector3()))
  const origin = shoulder.getWorldPosition(new Vector3())
  crouch(
    context,
    Math.max(0, origin.y - contact.y - length * 0.28) * Math.max(extension, wind * 0.8),
  )
  const lowered = shoulder.getWorldPosition(new Vector3())
  hero.root.position.x += extension * (contact.x - lowered.x - length * 0.77)
  hero.root.position.z += extension * (contact.z - lowered.z - length * 0.12)
  hero.root.updateWorldMatrix(true, true)
  const scale = hand.getWorldScale(new Vector3()).y
  const wristGoal = contact.clone().add(new Vector3(-0.065 * scale, 0, 0))
  for (const side of ['left', 'right'] as const) {
    const rest = localToHead(hero, new Vector3(side === 'left' ? -0.2 : 0.2, -0.38, 0.22))
    if (side === punch.side)
      rest
        .lerp(localToHead(hero, new Vector3(side === 'left' ? -0.24 : 0.24, -0.32, -0.08)), wind)
        .lerp(wristGoal, extension)
    reachVictoryHand(context, { side, target: rest })
  }
  const direction = new Vector3(1, 0, 0).applyQuaternion(
    hand.parent!.getWorldQuaternion(new Quaternion()).invert(),
  )
  hand.quaternion.slerp(
    new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), direction),
    extension,
  )
  hero.root.updateWorldMatrix(true, true)
  const fist = hand.localToWorld(new Vector3(0, -0.065, 0))
  return { punch, extension, contact, fist, contactError: fist.distanceTo(contact) }
}
