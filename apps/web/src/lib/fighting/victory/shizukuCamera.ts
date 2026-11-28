import { Vector3 } from 'three'
import { victoryShot } from './camera'
import { ease } from './resources'
import type { ShizukuVictoryPose } from './shizukuPose'
import {
  SHIZUKU_BLOOD,
  SHIZUKU_NOZZLE_CONTACT,
  SHIZUKU_RETURN,
  SHIZUKU_SHOULDER,
} from './shizukuTiming'
import type { VictoryContext } from './types'

interface ShizukuCameraSubjects {
  pose: ShizukuVictoryPose
  mouth: Vector3
  button: Vector3
}

function lens(
  context: VictoryContext,
  focalAngle: number,
  composition: Parameters<typeof victoryShot>[1],
) {
  const { camera } = context
  const original = camera.fov
  camera.fov = focalAngle
  camera.updateProjectionMatrix()
  victoryShot(context, composition)
  context.defer(() => {
    camera.fov = original
    camera.updateProjectionMatrix()
  })
  return composition.target
}

function opening(context: VictoryContext, { pose }: ShizukuCameraSubjects) {
  const { age, hero } = context
  const approach = ease(age / 58)
  const face = hero.head.getWorldPosition(new Vector3())
  const target = face.lerp(pose.grip, 0.46).add(new Vector3(0.04, 0.02, 0))
  return lens(context, 32, {
    target,
    offset: new Vector3(0.88 - approach * 0.25, 0.16 + approach * 0.14, 1.27),
    width: 1.62 - approach * 0.24,
    height: 1.17 - approach * 0.14,
  })
}

function choice(context: VictoryContext, { pose, button }: ShizukuCameraSubjects) {
  const { age } = context
  if (age < 94) {
    const lower = ease((age - 58) / 36)
    return lens(context, 32, {
      target: pose.upper.clone().lerp(pose.wound, 0.28 + 0.53 * lower),
      offset: new Vector3(-0.54, 0.18 - lower * 0.3, 1.01),
      width: 0.95,
      height: 0.67,
    })
  }
  const settle = ease((age - 94) / 26)
  return lens(context, 38, {
    target: button.clone().add(new Vector3(0.035, 0.045, 0)),
    offset: new Vector3(-0.37 + settle * 0.2, 0.19 - settle * 0.05, 0.63),
    width: 0.74,
    height: 0.45,
  })
}

function extraction(context: VictoryContext, { pose, mouth }: ShizukuCameraSubjects) {
  const { age, victim } = context
  const strain = ease((age - SHIZUKU_BLOOD) / (226 - SHIZUKU_BLOOD))
  const focus = pose.wound
    .clone()
    .lerp(victim.head.getWorldPosition(new Vector3()), 0.52 + 0.2 * strain)
  focus.lerp(mouth, 0.22 - 0.1 * strain)
  return lens(context, 39, {
    target: focus,
    offset: new Vector3(-0.93 + 1.27 * strain, -0.1 + 0.24 * strain, 1.28),
    width: 2.31 - 0.68 * strain,
    height: 1.35 - 0.24 * strain,
  })
}

function stageFloor(context: VictoryContext, { mouth }: ShizukuCameraSubjects) {
  const { age, hero, victim } = context
  const height = Math.max(hero.height, victim.height)
  const moving = context.comfort.camera !== 0
  const drop = moving ? ease((age - 232) / 64) : 0
  const follow = moving ? ease((age - 338) / (SHIZUKU_NOZZLE_CONTACT - 338)) : 0
  const recoil = moving
    ? ease((age - SHIZUKU_SHOULDER) / 3) * (1 - ease((age - SHIZUKU_SHOULDER) / 10))
    : 0
  const trackFall = moving ? ease((age - 253) / 32) * (1 - ease((age - 320) / 30)) : 0
  const target = new Vector3(
    context.centre + 0.86 + trackFall * 0.35,
    height * (0.54 - drop * 0.09) - trackFall * 0.07,
    0.15,
  )
  target.lerp(mouth.clone().add(new Vector3(0.6, -0.3, 0)), 0.55 * follow)
  target.y -= recoil * 0.06
  return lens(context, 40, {
    target,
    offset: new Vector3(0.69, 0.24, 2.45),
    width: (moving ? 4.23 : 4.9) + victim.width * 0.43 + 0.14 * trackFall - 1.04 * follow,
    height: height + (moving ? 0.36 : 0.65) + 0.12 * trackFall - 0.48 * follow,
  })
}

function finalPortrait(context: VictoryContext, { mouth, button }: ShizukuCameraSubjects) {
  const { age, hero } = context
  const rise = ease((age - SHIZUKU_RETURN) / 33)
  const eyes = hero.head.getWorldPosition(new Vector3())
  const hands = mouth.clone().lerp(button, rise)
  const target = eyes.lerp(hands, 0.52 - rise * 0.15)
  target.x -= 0.12
  return lens(context, 33, {
    target,
    offset: new Vector3(0.69, 0.24, 2.45).multiplyScalar(0.44),
    width: 1.4 - 0.27 * rise,
    height: 1.22 - 0.3 * rise,
  })
}

export function shizukuCamera(context: VictoryContext, subjects: ShizukuCameraSubjects) {
  if (context.comfort.camera === 0) return stageFloor(context, subjects)
  if (context.age < 58) return opening(context, subjects)
  if (context.age < SHIZUKU_BLOOD) return choice(context, subjects)
  if (context.age < 232) return extraction(context, subjects)
  if (context.age < SHIZUKU_RETURN) return stageFloor(context, subjects)
  return finalPortrait(context, subjects)
}
