import { Box3, Quaternion, Raycaster, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { localToHead, reachVictoryHand } from './pose'
import { reachCinematicHand } from './arm'
import { nativeVictoryFall } from './nativeFall'
import { ease } from './resources'
import { groundVictoryActor } from './actors'

export const SWEET_HOME_BEATS = [120, 240, 360] as const
export const TEREBELLUM_FALL = 384
const blend = (age: number, start: number, end: number) => ease((age - start) / (end - start))
const point = (root: import('three').Object3D, name: string) =>
  root.getObjectByName(name)!.getWorldPosition(new Vector3())

function torsoContact(root: import('three').Object3D, face: 'left' | 'right') {
  const box = new Box3().setFromObject(root.getObjectByName('torso')!)
  const target = box.getCenter(new Vector3())
  target.x = face === 'left' ? box.min.x : box.max.x
  target.z = box.max.z - 0.035
  return target
}
function attackArm(context: VictoryContext, options: { side: 'left' | 'right'; target: Vector3 }) {
  return reachCinematicHand(context.victim.root, {
    ...options,
    pole: localToHead(context.victim, new Vector3(options.side === 'left' ? -0.5 : 0.5, -0.5, 0.2)),
  })
}
function lowerForOpponent(context: VictoryContext, progress: number) {
  const hero = context.hero.height >= context.victim.height ? context.hero : context.victim
  const victim = hero === context.hero ? context.victim : context.hero
  const initial = hero.head.getWorldPosition(new Vector3()).y
  const drop =
    Math.max(0, initial - victim.head.getWorldPosition(new Vector3()).y - 0.12) * progress
  let low = 0,
    high = 2.5
  for (let i = 0; i < 12; i++) {
    const bend = (low + high) / 2
    for (const side of ['left', 'right']) {
      hero.root.getObjectByName(`hip-${side}`)!.rotation.x = -bend / 2
      const knee = hero.root.getObjectByName(`knee-${side}`)!
      knee.rotation.x = bend
      knee.children[1].rotation.x = -bend / 2
    }
    groundVictoryActor(hero)
    if (hero.head.getWorldPosition(new Vector3()).y > initial - drop) low = bend
    else high = bend
  }
}
export function terebellumVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const stand = new Vector3(hero.root.position.x - 0.3, hero.height * 0.43, 0.5)
  lowerForOpponent(context, blend(age, 36, 84) * (1 - blend(age, 390, 438)))
  hero.root.rotation.y *= 1 - blend(age, 438, 486)
  hero.root.updateWorldMatrix(true, true)
  const heroBox = new Box3().setFromObject(hero.root.getObjectByName('torso')!)
  const victimBox = new Box3().setFromObject(victim.root.getObjectByName('torso')!)
  victim.root.position.x -=
    Math.max(0, victimBox.min.x - heroBox.max.x - 0.045) * blend(age, 36, 84)
  victim.root.updateWorldMatrix(true, true)
  const heroHead = localToHead(hero, new Vector3(0, 0.025, 0.13))
  const recipient = torsoContact(victim.root, 'left')
  const recipientLocal = victim.root.getObjectByName('torso')!.worldToLocal(recipient.clone())
  const left = localToHead(hero, new Vector3(-0.12, -0.56, 0.32))
  const present = new Vector3(
    (hero.root.position.x + victim.root.position.x) / 2,
    Math.min(
      hero.head.getWorldPosition(new Vector3()).y,
      victim.head.getWorldPosition(new Vector3()).y,
    ) - 0.59,
    0.18,
  )
  left.lerp(present, blend(age, 132, 156))
  left.lerp(stand.clone().add(new Vector3(0, -0.09, 0)), blend(age, 204, 222))
  left.lerp(recipient, blend(age, 222, 234))
  left.lerp(localToHead(hero, new Vector3(-0.2, -0.73, 0.14)), blend(age, 366, 384))
  const leftError = reachVictoryHand(context, { side: 'left', target: left })
  const leftHand = point(hero.root, 'hand-left')
  const can = age < 222 ? leftHand.clone().add(new Vector3(0, 0.09, 0)) : stand.clone()
  const q = hero.head.getWorldQuaternion(new Quaternion())
  const sip = blend(age, 474, 492) * (1 - blend(age, 534, 570))
  const canRotation = q
    .clone()
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), sip * 0.55))
  const mouth =
    hero.root.getObjectByName('face-mouth')?.getWorldPosition(new Vector3()) ??
    localToHead(hero, new Vector3(0, -0.04, 0.13))
  const drink = mouth.clone().sub(new Vector3(0, 0.1, -0.065).applyQuaternion(canRotation))
  drink.y -= (1 - sip) * 0.22
  const grip = drink.clone().add(new Vector3(0.07, -0.025, 0).applyQuaternion(q))
  const right = localToHead(hero, new Vector3(0.2, -0.65, 0.2))
  right.lerp(stand.clone().add(new Vector3(0.07, -0.025, 0)), blend(age, 408, 432))
  right.lerp(grip, blend(age, 432, 474))
  const rightError = reachVictoryHand(context, {
    side: 'right',
    target: right,
    pole: localToHead(hero, new Vector3(0.45, -0.55, 0.2)),
  })
  const rightHand = point(hero.root, 'hand-right')
  if (age >= 432) can.copy(rightHand).sub(new Vector3(0.07, -0.025, 0).applyQuaternion(q))
  const canTip = can.clone().add(new Vector3(0, 0.04, 0.03))
  const canDirection = new Vector3(0, -1, -0.25).normalize()
  const canHandle = canTip.clone().addScaledVector(canDirection, -0.29)
  const attackDirection = heroHead.clone().sub(point(victim.root, 'shoulder-right')).normalize()
  const aimedHand = heroHead.clone().addScaledVector(attackDirection, -0.29)
  const knifeHand = localToHead(victim, new Vector3(0.19, -0.63, 0.25))
  knifeHand.lerp(aimedHand, blend(age, 60, 114) * (1 - blend(age, 120, 150)))
  knifeHand.lerp(canHandle, blend(age, 156, 192) * (1 - blend(age, 204, 228)))
  knifeHand.lerp(aimedHand, blend(age, 300, 360))
  const punch = localToHead(victim, new Vector3(-0.2, -0.35, 0.28))
  const heroMesh = hero.root.getObjectByName('torso')!
  const heroCentre = new Box3().setFromObject(heroMesh).getCenter(new Vector3())
  const from = point(victim.root, 'shoulder-left')
  const heroTorso =
    new Raycaster(from, heroCentre.clone().sub(from).normalize()).intersectObject(heroMesh, true)[0]
      ?.point ?? heroCentre
  punch.lerp(heroTorso, blend(age, 210, 240) * (1 - blend(age, 240, 264)))
  if (age < TEREBELLUM_FALL) {
    attackArm(context, { side: 'right', target: knifeHand })
    attackArm(context, { side: 'left', target: punch })
    victim.head.rotation.x = -0.17 * blend(age, 240, 246) * (1 - blend(age, 264, 288))
  }
  const fall =
    age >= TEREBELLUM_FALL
      ? nativeVictoryFall(context, { start: TEREBELLUM_FALL, velocityY: 0, velocityX: 0 })
      : undefined
  const attackerHand = point(victim.root, 'hand-right')
  const attackerTip = attackerHand.clone().addScaledVector(attackDirection, 0.29)
  const victimHead = localToHead(victim, new Vector3(0, 0.025, 0.13))
  const victimDirection = new Vector3(0, 0, -1).applyQuaternion(
    victim.head.getWorldQuaternion(new Quaternion()),
  )
  return {
    stand,
    can,
    canRotation,
    canTip,
    canDirection,
    canHandle,
    heroHead,
    heroTorso,
    attackerHand,
    attackerTip,
    attackDirection,
    victimHead,
    victimDirection,
    recipient,
    recipientLocal,
    leftHand,
    rightHand,
    leftError,
    rightError,
    fall,
    mouth,
    retrievalError: attackerHand.distanceTo(canHandle),
    punchError: point(victim.root, 'hand-left').distanceTo(heroTorso),
  }
}
export type TerebellumVictoryPose = ReturnType<typeof terebellumVictoryPose>
