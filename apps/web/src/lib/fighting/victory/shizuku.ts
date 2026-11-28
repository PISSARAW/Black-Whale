import type { VictoryDriver } from './types'
import { shizukuVictoryPose } from './shizukuPose'
import { createVictoryBlinky } from './shizukuBlinky'
import { createShizukuAbsorption } from './shizukuAbsorb'
import { createShizukuEffects } from './shizukuEffects'
import { shizukuCamera } from './shizukuCamera'
import { createShizukuLighting } from './shizukuLighting'
import { poseShizukuFaces } from './shizukuFaces'
export function createShizukuVictory(): VictoryDriver {
  const blinky = createVictoryBlinky(),
    absorption = createShizukuAbsorption(),
    effects = createShizukuEffects(),
    lighting = createShizukuLighting()
  return {
    update(context) {
      const pose = shizukuVictoryPose(context)
      poseShizukuFaces(context, pose.drain)
      const vacuum = blinky.sync(context, pose)
      const consumed = absorption.sync(context, pose, vacuum.mouth)
      const last = effects.sync(context, pose, vacuum.mouth)
      const focus = shizukuCamera(context, { pose, mouth: vacuum.mouth, button: last.position })
      lighting.apply(context, { focus, blinky: blinky.root })
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
      lighting.dispose()
    },
  }
}
