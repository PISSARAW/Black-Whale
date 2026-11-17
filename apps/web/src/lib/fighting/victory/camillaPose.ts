import { Quaternion, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { visibleVictoryBounds } from './bodyBounds'
import { ease } from './resources'
import { victoryShot } from './camera'

export const CAMILLA_PORTRAIT = 510
export const CAMILLA_EYES_OPEN = 554
export const CAMILLA_INHALE = 558
export function camillaVictoryPose(context: VictoryContext) {
  const { hero, victim, age } = context
  // Keep one reclining pose through the resurrection and the entire final portrait.
  hero.root.rotation.set(0, 0, -Math.PI / 2)
  hero.root.getObjectByName('shoulder-left')!.rotation.x = -0.45
  hero.root.getObjectByName('elbow-left')!.rotation.x = -0.8
  hero.root.updateWorldMatrix(true, true)
  hero.root.position.y -= visibleVictoryBounds(hero.root).min.y - 0.025
  hero.root.updateWorldMatrix(true, true)
  const closed = 1 - ease((age - CAMILLA_EYES_OPEN) / 4)
  for (const side of ['left', 'right']) {
    const eye = hero.head.getObjectByName(`face-eye-${side}`)
    if (!eye) continue
    context.save(eye)
    eye.scale.y *= 1 - closed * 0.955
  }
  const ratio = Math.max(2.8, victim.height * 1.45) / 2.8
  const compression = ease((age / 4.25 - 46) / 18),
    absorption = ease((age / 4.25 - 72) / 12)
  victim.root.visible = age < 357
  victim.root.scale
    .multiply(new Vector3(1 - compression * 0.72, 1 - compression * 0.3, 1 - compression * 0.45))
    .multiplyScalar(1 - absorption * 0.96)
  victim.root.updateWorldMatrix(true, true)
  const torso = victim.root.getObjectByName('torso') ?? victim.head
  const body = visibleVictoryBounds(torso)
  const centre = body.getCenter(new Vector3())
  const held = new Vector3(victim.root.position.x, 1.14 * ratio, 0.72 * ratio)
  const approach = ease((age / 4.25 - 24) / 12)
  victim.root.position.add(held.clone().sub(centre).multiplyScalar(approach))
  victim.root.updateWorldMatrix(true, true)
  return {
    ratio,
    compression,
    absorption,
    approach,
    held,
    body: visibleVictoryBounds(torso),
    destination: visibleVictoryBounds(hero.root.getObjectByName('torso') ?? hero.head).getCenter(
      new Vector3(),
    ),
  }
}
export function camillaVictoryPortrait(context: VictoryContext) {
  const { hero, camera } = context
  const origin = hero.head.getWorldPosition(new Vector3()),
    rotation = hero.head.getWorldQuaternion(new Quaternion())
  const target = origin.clone().add(new Vector3(0, -0.025, 0.07).applyQuaternion(rotation))
  victoryShot(context, {
    target,
    offset: new Vector3(0.025, 0.015, 0.92).applyQuaternion(rotation),
    width: 0.47,
    height: 0.44,
  })
  camera.up.set(0, 1, 0).applyQuaternion(rotation)
  camera.lookAt(target)
  camera.updateMatrixWorld(true)
}
