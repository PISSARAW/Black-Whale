import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import type { ShizukuVictoryPose } from './shizukuPose'
import { shizukuVictoryPose, SHIZUKU_CLEAN, SHIZUKU_RETURN } from './shizukuPose'
import { createVictoryBlinky } from './shizukuBlinky'
import { createShizukuAbsorption } from './shizukuAbsorb'
import { createShizukuEffects } from './shizukuEffects'
import { victoryPortrait, victoryShot } from './camera'

function shizukuWide(context: VictoryContext) {
  const height = Math.max(context.hero.height, context.victim.height)
  victoryShot(context, {
    target: new Vector3(context.centre + 0.35, height * 0.5, 0.1),
    offset: new Vector3(0.2, 0.25, 6),
    width: context.gap + 3,
    height: height + 0.8,
  })
}
function shizukuCamera(context: VictoryContext, pose: ShizukuVictoryPose, mouth: Vector3) {
  const { age } = context
  if (context.comfort.camera === 0 || (age >= SHIZUKU_CLEAN && age < SHIZUKU_RETURN)) {
    shizukuWide(context)
    return
  }
  if (age >= 534) {
    victoryPortrait(context)
    return
  }
  if (age < 60 || age >= SHIZUKU_RETURN) {
    const target =
      age < 60
        ? mouth
        : context.hero.root.getObjectByName('hand-left')!.getWorldPosition(new Vector3())
    victoryShot(context, { target, offset: new Vector3(0.15, 0.08, 2), width: 1, height: 0.9 })
    return
  }
  const target = pose.collapse.clone().lerp(mouth, 0.4)
  victoryShot(context, {
    target,
    offset: new Vector3(0.15, 0.1, 5),
    width: Math.max(2.2, context.gap + 0.6),
    height: Math.max(context.hero.height, context.victim.height) + 0.7,
  })
}
export function createShizukuVictory(): VictoryDriver {
  const blinky = createVictoryBlinky(),
    absorption = createShizukuAbsorption(),
    effects = createShizukuEffects()
  return {
    update(context) {
      const pose = shizukuVictoryPose(context)
      const vacuum = blinky.sync(context, pose)
      const consumed = absorption.sync(context, pose, vacuum.mouth)
      const last = effects.sync(context, pose, vacuum.mouth)
      shizukuCamera(context, pose, vacuum.mouth)
      context.add(blinky.root)
      context.add(effects.root)
      context.scene.userData.shizukuVictory = {
        mouth: vacuum.mouth.toArray(),
        gripErrors: [vacuum.right, vacuum.left],
        sucking: vacuum.sucking,
        absorption: consumed,
        bloodVisible: last.bloodVisible,
        buttonVisible: last.visible,
        returned: last.returned,
        lastSwallowedFrame: last.lastSwallowedFrame,
      }
      context.defer(() => {
        delete context.scene.userData.shizukuVictory
      })
    },
    dispose() {
      blinky.dispose()
      absorption.dispose()
      effects.dispose()
    },
  }
}
