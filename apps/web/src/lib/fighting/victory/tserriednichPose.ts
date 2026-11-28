import { Box3, Euler, Quaternion, Vector3 } from 'three'
import { groundVictoryActor } from './actors'
import { visibleVictoryBounds } from './bodyBounds'
import { victoryShot } from './camera'
import { turnVictoryChest } from './pose'
import { ease } from './resources'
import { guideFutureHand } from './tserriednichArms'
import {
  FUTURE_CLOSING_EYES,
  FUTURE_EYES_OPEN,
  FUTURE_FALL,
  FUTURE_LANDING,
  FUTURE_RECOGNITION,
  FUTURE_RECOGNITION_END,
  FUTURE_SHOT,
  FUTURE_VERDICT,
  FUTURE_VISION_HIT,
  FUTURE_VISION_START,
  FUTURE_ZETSU_END,
  tserriednichPortrait,
} from './tserriednichTiming'
import type { VictoryActor, VictoryContext } from './types'

const AXIS = -0.29
const TURN_START = 7.08

function joint(actor: VictoryActor, name: string) {
  return actor.root.getObjectByName(name)!
}

function face(actor: VictoryActor, target: Vector3, blend: number) {
  const delta = target.clone().sub(actor.head.getWorldPosition(new Vector3()))
  const parent = actor.head.parent
  if (parent) delta.applyQuaternion(parent.getWorldQuaternion(new Quaternion()).invert())
  const yaw = Math.atan2(delta.x, delta.z)
  const pitch = -Math.atan2(delta.y, Math.hypot(delta.x, delta.z))
  actor.head.quaternion.setFromEuler(
    new Euler(
      Math.max(-0.4, Math.min(0.64, pitch)) * blend,
      Math.max(-0.83, Math.min(0.83, yaw)) * blend,
      0,
      'YXZ',
    ),
  )
}

function walk(actor: VictoryActor, progress: number, cycles: number) {
  const weight = Math.sin(Math.PI * progress) ** 0.47
  for (const [side, sign] of [
    ['left', 1],
    ['right', -1],
  ] as const) {
    const swing = Math.sin(progress * Math.PI * 2 * cycles) * weight * sign
    joint(actor, `hip-${side}`).rotation.x = swing * 0.55
    joint(actor, `knee-${side}`).rotation.x = Math.max(0, -swing) * 0.72
    joint(actor, `shoulder-${side}`).rotation.x = -swing * 0.4
  }
}

function collapse(
  context: VictoryContext,
  actor: VictoryActor,
  progress: number,
  direction: number,
) {
  if (!progress) return
  const roll = progress ** 1.58
  const buckle = Math.sin(progress * Math.PI) ** 1.2
  joint(actor, 'hip-left').rotation.x -= 0.47 * buckle
  joint(actor, 'hip-right').rotation.x -= 0.57 * buckle
  joint(actor, 'knee-left').rotation.x += 0.65 * buckle + 0.2 * progress
  joint(actor, 'knee-right').rotation.x += 0.77 * buckle + 0.13 * progress
  joint(actor, 'shoulder-left').rotation.x -= 0.45 * buckle
  joint(actor, 'shoulder-right').rotation.z -= 0.3 * buckle
  joint(actor, 'elbow-right').rotation.x -= 0.52 * buckle + 0.26 * progress
  actor.root.rotation.z = direction * roll * Math.PI * 0.49
  actor.root.position.x -= direction * roll * 0.27
  const shadow = actor.root.getObjectByName('contact-shadow')
  if (shadow) {
    context.save(shadow)
    shadow.visible = false
  }
  actor.root.position.y -= visibleVictoryBounds(actor.root).min.y - 0.012
}

export function tserriednichVictoryPose(context: VictoryContext) {
  const { hero, victim, futurePerspective } = context
  const time = context.frame.elapsed
  const visionary = time >= FUTURE_VISION_START && time < FUTURE_EYES_OPEN
  const perceived = visionary || futurePerspective === 'perceived'
  const shared = time >= FUTURE_ZETSU_END
  const past = time < FUTURE_EYES_OPEN
  const replay = visionary ? (time - FUTURE_VISION_START) * 1.38 : time - FUTURE_EYES_OPEN
  const motion = past && !visionary ? 0 : Math.max(0, replay)
  const origin = new Vector3(hero.root.position.x - 0.14, 0, AXIS)
  const realStep = past ? 0 : ease((motion - 0.25) / 0.95)
  const step = perceived ? 0 : realStep
  const approach = ease(motion / 1.53)
  const opening = ease(time / FUTURE_VISION_START)
  const gap = Math.max(0.62, (hero.width + victim.width) * 0.43)
  const turn = shared ? ease((time - TURN_START) / 0.66) : 0
  const shot =
    context.state.finishReason === 'knockout' && context.state.finishingShot !== undefined
  const knockedDown =
    context.state.finishReason === 'knockout' || context.state.finishReason === 'technical-knockout'

  const realPosition = origin.clone().add(new Vector3(-realStep * 0.83, 0, realStep * 1.43))
  hero.root.position.copy(perceived ? origin : realPosition)
  hero.root.rotation.y = 0.55 + Math.sin(step * Math.PI) * -0.85
  hero.root.rotation.y += turn * 1.23
  walk(hero, step, 1)
  const close = ease((time - 0.13) / 0.25) * (1 - ease((time - FUTURE_EYES_OPEN) / 0.16))
  hero.head.rotation.x = close * 0.19

  victim.root.position.set(origin.x + gap + (1 - approach) * (1.65 - opening * 0.36), 0, AXIS)
  victim.root.rotation.y = -1.32 + turn * 0.64
  walk(victim, past && !visionary ? time / FUTURE_VISION_START : approach, 1.55)
  groundVictoryActor(hero)
  groundVictoryActor(victim)

  const attack = ease((motion - 1.25) / 0.33) * (1 - ease((motion - 1.62) / 0.34))
  const inspect = ease((motion - 1.62) / 0.55)
  const lean = 0.22 * inspect * (1 - turn)
  const shotAge = time - FUTURE_SHOT
  const stagger = shot && shotAge >= 0 ? 1 - ease(shotAge / 0.26) : 0
  if (lean || stagger) turnVictoryChest(context, victim, [lean - 0.19 * stagger, 0, -0.1 * stagger])
  const contact = origin.clone().setY(hero.height * 0.79)
  if (attack > 0) guideFutureHand(victim, 'right', { target: contact, amount: attack })
  const victimLook = origin.clone().setY(hero.height * 0.97)
  victimLook.lerp(origin.clone().add(new Vector3(-1.26, 0.12, 0.12)), inspect)
  victimLook.lerp(hero.head.getWorldPosition(new Vector3()), turn)
  face(victim, victimLook, 0.85)
  if (perceived) collapse(context, hero, Math.min(1, Math.max(0, (motion - 1.57) / 0.43)), 1)

  const aim = victim.root.position.clone().add(new Vector3(0, victim.height * 0.72, 0))
  const wrist = joint(hero, 'hand-right')
  const raise = ease((time - 7.47) / 0.58) * (1 - ease((time - 8.83) / 0.48))
  if (shared && shot) {
    const shoulder = joint(hero, 'shoulder-right').getWorldPosition(new Vector3())
    const reach = aim
      .clone()
      .sub(shoulder)
      .normalize()
      .multiplyScalar(hero.height * 0.34)
    const recoil = 0.13 * stagger
    reach.multiplyScalar(1 - recoil).add(new Vector3(0, recoil * 0.63, 0))
    guideFutureHand(hero, 'right', { target: shoulder.add(reach), amount: raise })
  }
  if (shared && knockedDown) {
    collapse(
      context,
      victim,
      Math.min(1, Math.max(0, (time - FUTURE_FALL) / (FUTURE_LANDING - FUTURE_FALL))),
      -1,
    )
  }
  const release = ease((time - FUTURE_VERDICT) / 0.52)
  if (release > 0) turnVictoryChest(context, hero, [release * 0.09, -release * 0.06, 0])
  const witness = ease((time - 4.05) / 0.75) * 0.42
  if (!perceived && witness > 0) {
    const look = victim.head.getWorldPosition(new Vector3())
    const checkMark = ease((time - FUTURE_VERDICT) / 0.31) * (1 - ease((time - 10.02) / 0.47))
    look.lerp(origin.clone().setY(0.06), checkMark)
    face(hero, look, witness + (1 - witness) * ease((time - FUTURE_ZETSU_END) / 0.34))
  }

  return {
    origin,
    realPosition,
    perceived,
    phase: visionary
      ? 'vision'
      : past
        ? 'zetsu'
        : !shared
          ? 'divergence'
          : time < FUTURE_VERDICT
            ? 'reality'
            : 'verdict',
    aim,
    wrist,
    raise,
    shot: shared && shot,
    knockedDown,
    shotAge,
  }
}

export function tserriednichVictoryCamera(
  context: VictoryContext,
  { origin, realPosition, shot, knockedDown }: ReturnType<typeof tserriednichVictoryPose>,
) {
  const height = Math.max(context.hero.height, context.victim.height)
  const time = context.frame.elapsed
  const split = context.futurePerspective !== undefined
  const motion = context.comfort.camera ?? 1
  const resolution = shot ? FUTURE_SHOT : knockedDown ? FUTURE_FALL : FUTURE_VERDICT
  const target = new Vector3(origin.x + (split ? 0.22 : 0.43), height * 0.45, 0.3)
  const offset = new Vector3(1.7, 1.4, 4.25)
  const closeUp = motion > 0 && !split && tserriednichPortrait(time)
  if (closeUp) {
    const actor = context[closeUp]
    const orientation = actor.head.getWorldQuaternion(new Quaternion())
    const start = closeUp === 'hero' ? FUTURE_CLOSING_EYES : FUTURE_RECOGNITION
    const end = closeUp === 'hero' ? FUTURE_VISION_START : FUTURE_RECOGNITION_END
    const drift = ease((time - start) / (end - start))
    const head = actor.head.getWorldPosition(new Vector3())
    head.add(new Vector3(0.02, -0.025, 0.1).applyQuaternion(orientation))
    victoryShot(context, {
      target: head,
      offset: new Vector3(0.3 - drift * 0.22, 0.07, 1.29 - drift * 0.22).applyQuaternion(
        orientation,
      ),
      width: 0.48,
      height: 0.62,
    })
    return
  }
  if (split) {
    const slide = ease((time - FUTURE_EYES_OPEN) / (FUTURE_ZETSU_END - FUTURE_EYES_OPEN)) * motion
    offset.x += slide * 0.52
    offset.y -= slide * 0.3
    target.x -= slide * 0.1
  }
  let width = split ? 3.92 : 4.5
  if (!split && motion > 0) {
    if (time < FUTURE_VISION_START) {
      // Low approach, with the seam and both sets of feet already in frame.
      const advance = ease(time / FUTURE_VISION_START)
      target.lerp(new Vector3(origin.x + 1.05 - advance * 0.14, height * 0.49, -0.08), motion)
      offset.lerp(new Vector3(-1.65, 0.56, 4.1 - advance * 0.25), motion)
      width -= 0.7 * motion
    } else if (time < FUTURE_VISION_HIT) {
      // The forecast explains the line of attack from above before cutting on contact.
      const approach = ease(
        (time - FUTURE_VISION_START) / (FUTURE_VISION_HIT - FUTURE_VISION_START),
      )
      target.lerp(new Vector3(origin.x + 0.83 - approach * 0.47, height * 0.43, -0.08), motion)
      offset.lerp(new Vector3(2.45 - approach * 1.28, 2.4 - approach * 0.68, 3.84), motion)
      width -= 0.65 * motion
    } else if (time < FUTURE_EYES_OPEN) {
      target.lerp(new Vector3(origin.x - 0.15, height * 0.39, 0.03), motion)
      offset.lerp(new Vector3(0.25, 0.86, 4.15), motion)
      width -= 0.55 * motion
    } else if (time < resolution) {
      // Foreground prince. The rival's turn is visible before any resolution.
      const turn = ease((time - FUTURE_ZETSU_END) / (resolution - FUTURE_ZETSU_END))
      target.lerp(new Vector3(origin.x + 0.16, height * 0.46, 0.46), motion)
      offset.lerp(new Vector3(-1.29 + turn * 1.04, 0.35 + turn * 0.22, 4.35 - turn * 0.57), motion)
      width -= 0.65 * motion
    } else if (time < FUTURE_VERDICT) {
      target.lerp(new Vector3(origin.x + 0.61, height * 0.42, 0.39), motion)
      offset.lerp(new Vector3(1.55, 0.66, 4.15), motion)
      width -= 0.3 * motion
    } else {
      // Hold the two endpoints of the floor joint for the final glance.
      const settle = ease((time - FUTURE_VERDICT) / 1.5)
      target.lerp(new Vector3(origin.x + 0.52 + settle * 0.12, height * 0.39, 0.36), motion)
      offset.lerp(
        new Vector3(1.4 + settle * 1.12, 1.92 - settle * 0.96, 4.65 - settle * 0.56),
        motion,
      )
    }
  }
  victoryShot(context, {
    target,
    offset,
    width: width + context.victim.width * 0.55,
    height: height + 0.28,
  })
  const bounds = [visibleVictoryBounds(context.victim.root)]
  if (split) {
    // Fit both possible bodies in both panels so the ground joint occupies the same pixels.
    const half = context.hero.width * 0.75
    for (const base of [origin, realPosition]) {
      bounds.push(
        new Box3(
          base.clone().add(new Vector3(-half, 0, -half)),
          base.clone().add(new Vector3(half, context.hero.height + 0.15, half)),
        ),
      )
    }
    bounds.push(
      new Box3(
        origin.clone().add(new Vector3(-context.hero.height - 0.24, 0, -half)),
        origin.clone().add(new Vector3(half, 0.58, context.hero.height * 0.53 + half)),
      ),
    )
  } else {
    bounds.push(visibleVictoryBounds(context.hero.root))
  }
  fitFutureBodies(context, target, bounds, split ? 0.69 : 0.79)
}

function fitFutureBodies(
  { camera }: VictoryContext,
  target: Vector3,
  bounds: Box3[],
  verticalMargin: number,
) {
  const view = camera.quaternion.clone().invert()
  const tanY = Math.tan((camera.fov * Math.PI) / 360)
  const height = tanY * verticalMargin
  const width = tanY * camera.aspect * 0.9
  const ray = camera.position.clone().sub(target)
  let distance = ray.length()
  for (const { min, max } of bounds) {
    for (const x of [min.x, max.x])
      for (const y of [min.y, max.y])
        for (const z of [min.z, max.z]) {
          const corner = new Vector3(x, y, z).sub(target).applyQuaternion(view)
          distance = Math.max(
            distance,
            corner.z + Math.max(Math.abs(corner.x) / width, Math.abs(corner.y) / height),
          )
        }
  }
  camera.position.copy(target).addScaledVector(ray.normalize(), distance)
  camera.updateMatrixWorld(true)
}
