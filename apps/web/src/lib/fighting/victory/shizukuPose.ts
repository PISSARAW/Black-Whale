import { Euler, Quaternion, Vector3 } from 'three'
import type { VictoryActor, VictoryContext } from './types'
import { visibleVictoryBounds } from './bodyBounds'
import { localToHead } from './pose'
import { reachCinematicHand } from './arm'
import { ease } from './resources'
import {
  SHIZUKU_BLOOD,
  SHIZUKU_CLEAN,
  SHIZUKU_DEATH,
  SHIZUKU_FALL,
  SHIZUKU_PULL,
  SHIZUKU_RELEASE,
  SHIZUKU_CAUGHT,
  SHIZUKU_SHOULDER,
  SHIZUKU_NOZZLE_CONTACT,
} from './shizukuTiming'

export function shizukuSleeveButton(hero: VictoryActor) {
  const sleeve = hero.root.getObjectByName('elbow-right')?.getObjectByName('sleeve-cuff')
  return sleeve
    ? sleeve.localToWorld(new Vector3(0, -0.25, 0.043))
    : hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
}

function poseStumble({ age, victim }: VictoryContext) {
  const descent = Math.min(1, Math.max(0, (age - SHIZUKU_FALL) / (SHIZUKU_SHOULDER - SHIZUKU_FALL)))
  const impact = descent ** 1.55
  const roll = ease((age - SHIZUKU_SHOULDER) / (SHIZUKU_DEATH - SHIZUKU_SHOULDER))
  const buckle = ease((age - 215) / 31) * (1 - roll)
  const trail = ease((age - 259) / 24) * (1 - roll)
  victim.root.rotation.set(
    0.18 * impact * (1 - roll),
    -0.55 - 0.16 * roll,
    -1.44 * impact - 0.13 * roll,
  )
  victim.root.position.x -= 0.22 * impact + 0.08 * roll
  victim.root.position.z += 0.1 * impact + 0.08 * roll
  victim.root.getObjectByName('knee-right')!.rotation.x = 0.78 * buckle + 0.22 * roll
  victim.root.getObjectByName('hip-right')!.rotation.x = -0.37 * buckle - 0.1 * roll
  victim.root.getObjectByName('knee-left')!.rotation.x = 0.55 * trail + 0.09 * roll
  victim.root.getObjectByName('hip-left')!.rotation.x = 0.29 * trail
  return { impact, roll }
}

function braceHand(
  position: Vector3,
  shoulder: Vector3,
  options: { impact: number; first: boolean },
) {
  const { impact, first } = options
  const fold = ease((impact - 0.54) / 0.46)
  const reach = impact ** 0.65 * (1 - fold)
  const brace = shoulder.clone().add(new Vector3(first ? 0.03 : 0.19, -0.22, first ? 0.19 : -0.09))
  const tuck = shoulder.clone().add(new Vector3(-0.32, 0.13, first ? 0.21 : -0.17))
  return position.lerp(brace, reach).lerp(tuck, fold)
}

function poseVictimArms(
  context: VictoryContext,
  options: { upper: Vector3; lowerWound: Vector3; impact: number },
) {
  const { age, victim } = context
  const { upper, lowerWound, impact } = options
  const secondCover = ease((age - 182) / 52) * (1 - impact)
  const settle = ease((impact - 0.72) / 0.28)
  for (const side of ['left', 'right'] as const) {
    const isFirst = side === 'left'
    const spread = isFirst ? 1 : -1
    const hand = victim.root.getObjectByName(`hand-${side}`)!
    const target = (isFirst ? upper : lowerWound)
      .clone()
      .add(new Vector3(0, isFirst ? -0.035 : -0.08, 0.06))
    const position = hand
      .getWorldPosition(new Vector3())
      .lerp(target, isFirst ? 1 - impact : secondCover)
    const arm = victim.root.getObjectByName(`shoulder-${side}`)!
    const shoulder = arm.getWorldPosition(new Vector3())
    const pole = localToHead(victim, new Vector3(-spread * 0.45, -0.4, 0.05))
    pole.lerp(shoulder.clone().add(new Vector3(-0.14, 0.02, spread * 0.48)), impact)
    reachCinematicHand(victim.root, {
      side,
      target: braceHand(position, shoulder, { impact, first: isFirst }),
      pole,
    })
    const armRest = new Euler(isFirst ? -0.13 : 0.16, 0, isFirst ? -0.1 : 0.15)
    arm.quaternion.slerp(new Quaternion().setFromEuler(armRest), settle)
    const elbow = victim.root.getObjectByName(`elbow-${side}`)!
    const elbowRest = new Euler(isFirst ? -0.4 : -0.2, 0, 0)
    elbow.quaternion.slerp(new Quaternion().setFromEuler(elbowRest), settle)
  }
}

export function shizukuVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  const { impact, roll } = poseStumble(context)
  const drain = ease((age - SHIZUKU_BLOOD) / (SHIZUKU_RELEASE - SHIZUKU_BLOOD))
  const inspect = ease((age - SHIZUKU_CAUGHT) / 33)
  const scan = ease((age - 48) / 37)
  const lower = ease((age - 73) / (SHIZUKU_BLOOD - 73))

  hero.root.position.x += Math.max(0, context.gap - 1.45) * (0.65 + 0.35 * lower)
  hero.root.rotation.y -= 0.6 * inspect
  hero.head.rotation.x = 0.12 + 0.23 * scan + 0.29 * inspect
  hero.head.rotation.y = 0.22 - 0.28 * scan - 0.28 * inspect
  victim.head.rotation.x = drain * 0.23 - 0.22 * impact * (1 - roll)
  victim.head.rotation.z = 0.14 * impact * (1 - roll)

  // Keep the two openings on the chest as the actor goes from standing to prone.
  const torso = victim.root.getObjectByName('torso') ?? victim.head
  const chest = visibleVictoryBounds(torso)
  const opening = (x: number, y: number) =>
    new Vector3(
      chest.min.x + (chest.max.x - chest.min.x) * x,
      chest.min.y + (chest.max.y - chest.min.y) * y,
      chest.max.z + 0.008,
    )
  const upper = opening(0.66, 0.68)
  const lowerWound = opening(0.3, 0.34)
  poseVictimArms(context, { upper, lowerWound, impact })
  if (age >= SHIZUKU_FALL)
    victim.root.traverse((node) => {
      if (node.name !== 'contact-shadow') return
      context.save(node)
      node.visible = false
    })
  const groundDelta = 0.025 - visibleVictoryBounds(victim.root).min.y
  victim.root.position.y += groundDelta
  upper.y += groundDelta
  lowerWound.y += groundDelta
  const collapse = visibleVictoryBounds(victim.root).getCenter(new Vector3())
  const shoe = (side: string) =>
    victim.root.getObjectByName(`knee-${side}`)!.children[1].getWorldPosition(new Vector3())
  const feet = shoe('left').lerp(shoe('right'), 0.5)
  feet.x -= 0.045

  const regrip = Math.sin(ease((age - 58) / 43) * Math.PI)
  const release = ease((age - SHIZUKU_RELEASE) / 12) * (1 - ease((age - SHIZUKU_CLEAN) / 15))
  const grip = localToHead(hero, new Vector3(0.16, -0.56, 0.29))
  grip.y += 0.07 * regrip - 0.12 * lower - 0.045 * release
  const tug =
    ease((age - SHIZUKU_NOZZLE_CONTACT + 2) / 6) *
    (1 - ease((age - SHIZUKU_NOZZLE_CONTACT - 5) / 9))
  grip.x -= 0.025 * tug
  grip.y += 0.035 * tug
  grip.lerp(localToHead(hero, new Vector3(0.22, -0.66, 0.22)), inspect)
  const handTarget = localToHead(hero, new Vector3(-0.19, -0.56, 0.3))
  const target = upper.clone().lerp(lowerWound, lower)
  const incoming = collapse.clone().lerp(feet, 0.7)
  incoming.y += 0.32
  target.lerp(incoming, ease((age - SHIZUKU_RELEASE) / (SHIZUKU_PULL - SHIZUKU_RELEASE)))
  target.lerp(grip.clone().add(new Vector3(0.85, -1.05, -0.3)), inspect)
  return {
    upper,
    wound: lowerWound,
    feet,
    grip,
    target,
    handTarget,
    drain,
    inspect,
    release,
    regrip,
  }
}
export type ShizukuVictoryPose = ReturnType<typeof shizukuVictoryPose>
